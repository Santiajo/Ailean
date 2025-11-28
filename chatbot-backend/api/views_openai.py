from django.http import StreamingHttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework import status
from .openai_services import transcribe_audio, get_chat_response, generate_speech
import base64
import json

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

        # Generator function for StreamingHttpResponse
        def event_stream():
            # Send transcription event if audio was used
            if audio_file:
                yield f"data: {json.dumps({'type': 'transcription', 'text': user_message})}\n\n"

            # 2. Get Response from LLM (Streaming)
            # 2. Get Response from LLM (Streaming)
            system_prompt = "You are an English Tutor AI. Your goal is to help students improve their English skills. Keep your responses CONCISE and SIMPLE (max 2-3 sentences usually). If the user asks for examples, provide 2-3 short, clear examples. Use bullet points for lists. Be helpful and direct. If the user speaks in Spanish, reply in Spanish but encourage English."
            
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add history if available
            history_str = request.data.get('history')
            if history_str:
                try:
                    history = json.loads(history_str)
                    for msg in history:
                        # Ensure valid role and content
                        if msg.get('role') in ['user', 'assistant', 'bot'] and msg.get('content'):
                            role = 'assistant' if msg['role'] == 'bot' else msg['role']
                            messages.append({"role": role, "content": msg['content']})
                except json.JSONDecodeError:
                    pass

            messages.append({"role": "user", "content": user_message})
            stream = get_chat_response(messages, stream=True)
            
            full_response_text = ""
            
            import re
            buffer = ""
            
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    content_chunk = chunk.choices[0].delta.content
                    full_response_text += content_chunk
                    buffer += content_chunk
                    yield f"data: {json.dumps({'type': 'text_chunk', 'content': content_chunk})}\n\n"

                    # Check for sentence delimiters to stream audio
                    # Split by [.!?] followed by space or newline
                    if re.search(r'[.!?]\s', buffer):
                        sentences = re.split(r'(?<=[.!?])\s+', buffer)
                        if len(sentences) > 1:
                            # Speak all complete sentences
                            to_speak = " ".join(sentences[:-1])
                            buffer = sentences[-1] # Keep the incomplete part
                            
                            if to_speak.strip():
                                audio_content = generate_speech(to_speak)
                                if audio_content:
                                    audio_base64 = base64.b64encode(audio_content).decode('utf-8')
                                    yield f"data: {json.dumps({'type': 'audio', 'data': audio_base64})}\n\n"

            # Generate audio for remaining text
            if buffer.strip():
                audio_content = generate_speech(buffer)
                if audio_content:
                    audio_base64 = base64.b64encode(audio_content).decode('utf-8')
                    yield f"data: {json.dumps({'type': 'audio', 'data': audio_base64})}\n\n"
            
            yield "data: [DONE]\n\n"

        return StreamingHttpResponse(event_stream(), content_type='text/event-stream')
