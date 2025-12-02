from django.http import StreamingHttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework import status
from .openai_services import transcribe_audio, get_chat_response, generate_speech
from .models import UserProfile, ChatSession, ChatMessage
from django.utils import timezone
import datetime
import base64
import json
import re

class ChatView(APIView):
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def post(self, request, *args, **kwargs):
        user_message = ""
        audio_file = request.FILES.get('audio')
        
        # 1. Handle Input (Text or Audio)
        if audio_file:
            # Transcribe audio
            transcription = transcribe_audio(audio_file)
            if not transcription:
                return Response({"error": "Failed to transcribe audio"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            user_message = transcription
        else:
            # Try to get text from form data or json
            user_message = request.data.get('message')
            if not user_message:
                 return Response({"error": "No message or audio provided"}, status=status.HTTP_400_BAD_REQUEST)

        # --- Gamification Logic ---
        if request.user.is_authenticated:
            try:
                profile, created = UserProfile.objects.get_or_create(user=request.user)
                
                # Award XP (e.g., 10 XP per message)
                profile.xp += 10
                
                # Update Time (e.g., 0.5 minutes per interaction)
                profile.total_time_minutes += 0.5
                
                # Update Streak
                now = timezone.now()
                if profile.last_activity:
                    last_date = profile.last_activity.date()
                    today = now.date()
                    if last_date == today - datetime.timedelta(days=1):
                        profile.streak += 1
                    elif last_date < today - datetime.timedelta(days=1):
                        profile.streak = 1 # Reset streak if missed a day
                    elif last_date == today:
                        pass # Already active today
                else:
                    profile.streak = 1
                
                # Level Up Logic (Simple: 100 XP per level)
                new_level = 1 + (profile.xp // 100)
                if new_level > profile.level:
                    profile.level = new_level
                    # TODO: Notify frontend of level up via SSE if possible
                
                profile.save()
            except Exception as e:
                print(f"Error updating progress: {e}")
        # --------------------------

        # Generator function for StreamingHttpResponse
        is_audio = bool(audio_file)
        
        # 2. Get Response from LLM (Streaming)
        system_prompt = "You are an English Tutor AI. Your goal is to help students improve their English skills. Keep your responses CONCISE and SIMPLE (max 2-3 sentences usually). If the user asks for examples, provide 2-3 short, clear examples. Use bullet points for lists. Be helpful and direct. If the user speaks in Spanish, reply in Spanish but encourage English."
        
        # --- Persistence: Get or Create Session ---
        session_id = request.data.get('sessionId')
        chat_session = None
        
        if request.user.is_authenticated:
            if session_id and session_id != 'new' and session_id != 'null':
                try:
                    chat_session = ChatSession.objects.get(id=session_id, user=request.user)
                except ChatSession.DoesNotExist:
                    chat_session = ChatSession.objects.create(user=request.user, title=user_message[:30] + "...")
            else:
                chat_session = ChatSession.objects.create(user=request.user, title=user_message[:30] + "...")
            
            # Save User Message
            ChatMessage.objects.create(session=chat_session, role='user', content=user_message)
            
            # Load history from DB for context
            db_messages = chat_session.messages.order_by('created_at')
            messages = [{"role": "system", "content": system_prompt}]
            for msg in db_messages:
                messages.append({"role": msg.role, "content": msg.content})
        else:
            # Fallback for unauthenticated
            messages = [{"role": "system", "content": system_prompt}]
            history_str = request.data.get('history')
            if history_str:
                try:
                    history = json.loads(history_str)
                    for msg in history:
                        if msg.get('role') in ['user', 'assistant', 'bot'] and msg.get('content'):
                            role = 'assistant' if msg['role'] == 'bot' else msg['role']
                            messages.append({"role": role, "content": msg['content']})
                except json.JSONDecodeError:
                    pass
            messages.append({"role": "user", "content": user_message})
        # ------------------------------------------

        stream = get_chat_response(messages, stream=True)
        
        full_response_text = ""
        buffer = ""

        def event_stream():
            nonlocal full_response_text, buffer
            # Send session ID to frontend so it can update URL/state
            if chat_session:
                 yield f"data: {json.dumps({'type': 'session_id', 'id': chat_session.id})}\n\n"

            if is_audio:
                yield f"data: {json.dumps({'type': 'transcription', 'text': user_message})}\n\n"

            for chunk in stream:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    full_response_text += content
                    buffer += content
                    yield f"data: {json.dumps({'type': 'text_chunk', 'content': content})}\n\n"
                    
                    # Check for sentence completion
                    match = re.search(r'[.!?]\s', buffer)
                    if match:
                        sentence = buffer[:match.end()]
                        buffer = buffer[match.end():]
                        
                        # Generate audio for this sentence
                        audio_content = generate_speech(sentence)
                        if audio_content:
                            audio_base64 = base64.b64encode(audio_content).decode('utf-8')
                            yield f"data: {json.dumps({'type': 'audio', 'data': audio_base64})}\n\n"
            
            # Process remaining buffer
            if buffer.strip():
                 audio_content = generate_speech(buffer)
                 if audio_content:
                    audio_base64 = base64.b64encode(audio_content).decode('utf-8')
                    yield f"data: {json.dumps({'type': 'audio', 'data': audio_base64})}\n\n"
            
            # --- Persistence: Save Assistant Message ---
            if chat_session and full_response_text:
                ChatMessage.objects.create(session=chat_session, role='assistant', content=full_response_text)
            # -------------------------------------------

            yield "data: [DONE]\n\n"

        return StreamingHttpResponse(event_stream(), content_type='text/event-stream')
