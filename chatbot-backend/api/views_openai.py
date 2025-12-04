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
        
        def clean_text_for_speech(text):
            # Remove content in parentheses (e.g., translations)
            return re.sub(r'\s*\(.*?\)', '', text).strip()

        # 2. Get Response from LLM (Streaming)
        system_prompt = "You are an English Tutor AI. Your goal is to help students improve their English skills. Keep your responses CONCISE and SIMPLE (max 2-3 sentences usually). If the user asks for examples, provide 2-3 short, clear examples. Use bullet points for lists. Be helpful and direct. If the user speaks in Spanish, reply in Spanish but encourage English."
        
        # --- Persistence: Get or Create Session ---
        session_id = request.data.get('sessionId')
        chat_session = None
        
        # Starter Prompts & Responses
        starter_responses = {
            "Quiero obtener retroalimentación": {
                "response": "¡Hola!\n¡Qué bueno tenerte por aquí! Antes de darte retroalimentación, necesito un poquito más de información para ayudarte de forma precisa y útil.\n\n¿Sobre qué necesitas retroalimentación?\nPuede ser:\n\nUn writing (puedes subir una foto si es manuscrito, recuerda que sea legible).\n\nListening.\n\nReading.\n\nSpeaking (puedes describirme lo que dijiste).\n\nGramática o vocabulario.\n\nAlguna actividad de tu curso (Starter, Elementary, etc.).\n\nAdemás, cuéntame:\n\n¿Qué nivel/“File” estás estudiando ahora?\n\n¿Cuál es tu objetivo para esta sesión de 30 minutos?\n\n¿Te falta ponerte al día con alguna unidad o clase?\n\n¡Ganbatte! (頑張って)",
                "mode": "feedback",
                "system_prompt": "You are an English Tutor AI helping with feedback. Focus on correcting mistakes and explaining grammar/vocabulary. Be encouraging."
            },
            "Quiero aprender ingles basico": {
                "response": "¡Hola!\n¡Qué alegría tenerte por aquí! ¿Cómo te sientes hoy?\n\nAntes de empezar, quiero organizar tu ruta de estudio para que aproveches esta sesión de 30 minutos al máximo.\n\nPara personalizar tu aprendizaje, necesito saber:\n\n¿Cuál es tu nivel actual?\n\nBásico 1 (Starter A)\n\nBásico 2 (Starter B)\n\nElementary\n(Si no sabes, ¡yo te ayudo!)\n\n¿Estás estudiando algún File específico?\nEj.: Starter File 1, File 2… (de American English File).\n\n¿Tienes alguna dificultad en particular?\n(vocabulario, gramática, listening, speaking…)\n\n¿Cuál es tu objetivo para esta sesión?\nEj.: aprender present simple, saludar en inglés, practicar conversación, etc.\n\nY también: ¿te estás poniendo al día con alguna unidad que te perdiste en clase?\n\n¡Ganbatte! がんばって",
                "mode": "basic",
                "system_prompt": "You are an English Tutor AI for Basic level students (A1). Use simple English, be very patient. Focus on basic vocabulary and grammar."
            },
            "Quiero aprender ingles elemental": {
                "response": "¡Hola!\n¡Bienvenido/a a Chill English Bot 2.0!\nMe alegra muchísimo verte con ganas de aprender inglés en nivel Elementary.\nAntes de empezar, cuéntame:\n\n¿Cómo te sientes hoy?\n\n(¡Tu estado emocional es importante para aprender bien!)\n\n¿Cuál es tu objetivo para esta sesión de 30 minutos?\n\nPor ejemplo:\n\nGramática (present simple, past simple, countable/uncountable…)\n\nVocabulario (comida, rutinas, lugares, trabajo…)\n\nSpeaking\n\nListening\n\nRepaso general\n\nY una pregunta clave:\n\n¿En qué File vas actualmente? (Del curso Elementary: Files 1, 2 o 3).\n¿O quieres empezar desde el File 1?\n\nSi te has atrasado alguna clase, también dime para ayudarte a ponerte al día. (がんばって!)",
                "mode": "elementary",
                "system_prompt": "You are an English Tutor AI for Elementary level students (A2). Encourage full sentences but keep explanations simple."
            },
            "Quiero aprender ingles Intermedio": {
                "response": "¡Hello, hello!\n¡Bienvenido/a a tu sesión con Chill English Bot 2.0!\n\nAntes de comenzar, cuéntame:\n\n1) ¿Cómo te sientes hoy?\n\n(Así ajustamos el ritmo de la clase)\n\n2) Objetivo de la sesión\n\n¿Qué quieres lograr en esta media hora?\n\n¿Refuerzo de gramática?\n\n¿Vocabulario específico?\n\n¿Speaking?\n\n¿Prepararte para una unidad del curso?\n\n3) Diagnóstico\n\nDices que quieres Inglés Intermedio.\nPara guiarte bien según la hoja de ruta, necesito saber:\n\n¿En qué File o unidad estás actualmente del nivel Intermediate?\n(File 7, 8, 9, 10, 11 o 12 — según el curso Regular/Intensivo)\n\n4) ¿Debes ponerte al día en alguna clase que faltaste?\n\n¡Listo para empezar cuando me digas! Ganbatte!",
                "mode": "intermediate",
                "system_prompt": "You are an English Tutor AI for Intermediate level students (B1/B2). You can use more complex grammar and vocabulary. Challenge the student slightly."
            }
        }

        # Check if user message matches a starter prompt
        starter_data = starter_responses.get(user_message.strip())

        if request.user.is_authenticated:
            if session_id and session_id != 'new' and session_id != 'null':
                try:
                    chat_session = ChatSession.objects.get(id=session_id, user=request.user)
                except ChatSession.DoesNotExist:
                    chat_session = ChatSession.objects.create(user=request.user, title=user_message[:30] + "...")
            else:
                chat_session = ChatSession.objects.create(user=request.user, title=user_message[:30] + "...")
            
            # Update metadata if starter prompt
            if starter_data:
                chat_session.metadata['mode'] = starter_data['mode']
                chat_session.save()

            # Save User Message
            ChatMessage.objects.create(session=chat_session, role='user', content=user_message)
            
            # Load history from DB for context
            db_messages = chat_session.messages.order_by('created_at')
            
            # Determine System Prompt
            current_system_prompt = system_prompt # Default
            if chat_session.metadata.get('mode'):
                # Find the system prompt for the mode
                for key, val in starter_responses.items():
                    if val['mode'] == chat_session.metadata.get('mode'):
                        current_system_prompt = val['system_prompt']
                        break
            
            messages = [{"role": "system", "content": current_system_prompt}]
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

        # Special handling for Starter Prompts: Return static response immediately (simulated stream)
        if starter_data:
            def starter_stream():
                if chat_session:
                     yield f"data: {json.dumps({'type': 'session_id', 'id': chat_session.id})}\n\n"
                
                response_text = starter_data['response']
                
                # Simulate chunking
                chunk_size = 20
                for i in range(0, len(response_text), chunk_size):
                    chunk = response_text[i:i+chunk_size]
                    yield f"data: {json.dumps({'type': 'text_chunk', 'content': chunk})}\n\n"
                
                # Generate audio for the FULL cleaned response
                cleaned_full_text = clean_text_for_speech(response_text)
                if cleaned_full_text:
                    audio_content = generate_speech(cleaned_full_text)
                    if audio_content:
                        audio_base64 = base64.b64encode(audio_content).decode('utf-8')
                        yield f"data: {json.dumps({'type': 'audio', 'data': audio_base64})}\n\n"

                if chat_session:
                    ChatMessage.objects.create(session=chat_session, role='assistant', content=response_text)
                
                yield "data: [DONE]\n\n"
            
            return StreamingHttpResponse(starter_stream(), content_type='text/event-stream')

        stream = get_chat_response(messages, stream=True)
        
        # Check if stream is actually a generator (success) or a string (error)
        if isinstance(stream, str) or not hasattr(stream, '__iter__'):
             # Handle error case where get_chat_response returned a string or non-iterable
             return Response({"error": "Failed to get response from AI service. Check API Key."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        full_response_text = ""
        buffer = ""
        speech_buffer = "" # Accumulate sentences for smoother speech

        def event_stream():
            nonlocal full_response_text, buffer, speech_buffer
            # Send session ID to frontend so it can update URL/state
            if chat_session:
                 yield f"data: {json.dumps({'type': 'session_id', 'id': chat_session.id})}\n\n"

            if is_audio:
                yield f"data: {json.dumps({'type': 'transcription', 'text': user_message})}\n\n"

            try:
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
                            
                            # Add to speech buffer
                            cleaned_sentence = clean_text_for_speech(sentence)
                            if cleaned_sentence:
                                speech_buffer += " " + cleaned_sentence
                            
                            # Only generate audio if buffer is long enough (e.g. > 50 chars) to reduce requests/choppiness
                            if len(speech_buffer) > 50:
                                audio_content = generate_speech(speech_buffer.strip())
                                if audio_content:
                                    audio_base64 = base64.b64encode(audio_content).decode('utf-8')
                                    yield f"data: {json.dumps({'type': 'audio', 'data': audio_base64})}\n\n"
                                speech_buffer = ""
            except Exception as e:
                print(f"Stream error: {e}")
                yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"
            
            # Process remaining text buffer
            if buffer.strip():
                 cleaned_buffer = clean_text_for_speech(buffer)
                 if cleaned_buffer:
                     speech_buffer += " " + cleaned_buffer

            # Process remaining speech buffer
            if speech_buffer.strip():
                audio_content = generate_speech(speech_buffer.strip())
                if audio_content:
                    audio_base64 = base64.b64encode(audio_content).decode('utf-8')
                    yield f"data: {json.dumps({'type': 'audio', 'data': audio_base64})}\n\n"
            
            # --- Persistence: Save Assistant Message ---
            if chat_session and full_response_text:
                ChatMessage.objects.create(session=chat_session, role='assistant', content=full_response_text)
            # -------------------------------------------

            yield "data: [DONE]\n\n"

        return StreamingHttpResponse(event_stream(), content_type='text/event-stream')
