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

        # 2. Get Response from LLM
        # For simplicity, we are not maintaining history in DB yet, but we can pass previous messages if frontend sends them.
        # Here we just send the current message.
        messages = [{"role": "user", "content": user_message}]
        bot_response_text = get_chat_response(messages)

        # 3. Generate Audio Response
        audio_content = generate_speech(bot_response_text)
        audio_base64 = None
        if audio_content:
            audio_base64 = base64.b64encode(audio_content).decode('utf-8')

        return Response({
            "user_message": user_message, # Return transcribed text if it was audio
            "bot_response": bot_response_text,
            "audio_base64": audio_base64
        })
