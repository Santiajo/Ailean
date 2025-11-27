import openai
import os
from django.conf import settings
from dotenv import load_dotenv

load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")

def transcribe_audio(audio_file):
    """
    Transcribes audio using OpenAI Whisper model.
    """
    try:
        transcript = openai.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file
        )
        return transcript.text
    except Exception as e:
        print(f"Error transcribing audio: {e}")
        return None

def get_chat_response(messages):
    """
    Gets a response from OpenAI GPT-4o-mini model.
    messages: list of dictionaries [{"role": "user", "content": "..."}]
    """
    try:
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error getting chat response: {e}")
        return "Lo siento, hubo un error al procesar tu solicitud."

def generate_speech(text):
    """
    Generates speech from text using OpenAI TTS.
    Returns the binary content of the audio file.
    """
    try:
        response = openai.audio.speech.create(
            model="tts-1",
            voice="alloy",
            input=text
        )
        return response.content
    except Exception as e:
        print(f"Error generating speech: {e}")
        return None
