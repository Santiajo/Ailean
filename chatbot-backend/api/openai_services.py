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
            file=(audio_file.name, audio_file, "audio/webm"),
            temperature=0,
            response_format="verbose_json"
        )
        return transcript.text, transcript.language
    except Exception as e:
        print(f"Error transcribing audio: {e}")
        return None

def get_chat_response(messages, stream=False):
    """
    Gets a response from OpenAI GPT-4o-mini model.
    messages: list of dictionaries [{"role": "user", "content": "..."}]
    stream: boolean, if True returns a generator
    """
    try:
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            stream=stream
        )
        if stream:
            return response
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error getting chat response: {e}")
        if stream:
            # Return a generator that yields the error message
            def error_gen():
                yield "Lo siento, hubo un error al procesar tu solicitud."
            return error_gen()
        return "Lo siento, hubo un error al procesar tu solicitud."

def generate_speech(text):
    """
    Generates speech from text using OpenAI TTS.
    Returns the binary content of the audio file.
    """
    try:
        response = openai.audio.speech.create(
            model="tts-1",
            voice="nova",
            input=text
        )
        return response.content
    except Exception as e:
        print(f"Error generating speech: {e}")
        return None
