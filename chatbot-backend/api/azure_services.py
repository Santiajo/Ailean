import os
import io
import tempfile
from dotenv import load_dotenv

load_dotenv()

AZURE_SPEECH_KEY = os.getenv("AZURE_SPEECH_KEY")
AZURE_SPEECH_REGION = os.getenv("AZURE_SPEECH_REGION")


def convert_webm_to_wav(audio_file):
    """Convierte WebM a WAV 16kHz mono"""
    try:
        from pydub import AudioSegment
        
        audio_file.seek(0)
        audio = AudioSegment.from_file(io.BytesIO(audio_file.read()))
        audio = audio.set_frame_rate(16000).set_channels(1).set_sample_width(2)
        
        wav_io = io.BytesIO()
        audio.export(wav_io, format="wav")
        wav_io.seek(0)
        
        print(f"Audio converted: WebM → WAV (16kHz mono)")
        return wav_io
        
    except Exception as e:
        print(f" Audio conversion failed: {e}")
        audio_file.seek(0)
        return audio_file


def pronunciation_assessment(audio_file, reference_text, language='en'):
    """
    Usa Azure Speech SDK para pronunciation assessment.
    Retorna scores y palabras mal pronunciadas.
    language: 'en' or 'es' (Whisper language code)
    """
    
    if not AZURE_SPEECH_KEY or not AZURE_SPEECH_REGION:
        print("Azure Speech not configured")
        return None
    
    try:
        import azure.cognitiveservices.speech as speechsdk
        
        # Convertir audio a WAV
        wav_audio = convert_webm_to_wav(audio_file)
        
        # Guardar temporalmente (SDK necesita archivo)
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
            temp_file.write(wav_audio.read())
            temp_path = temp_file.name
        
        # Configurar Azure Speech
        speech_config = speechsdk.SpeechConfig(
            subscription=AZURE_SPEECH_KEY, 
            region=AZURE_SPEECH_REGION
        )
        audio_config = speechsdk.audio.AudioConfig(filename=temp_path)
        
        # Configurar Pronunciation Assessment
        pronunciation_config = speechsdk.PronunciationAssessmentConfig(
            reference_text=reference_text,
            grading_system=speechsdk.PronunciationAssessmentGradingSystem.HundredMark,
            granularity=speechsdk.PronunciationAssessmentGranularity.Phoneme,
            enable_miscue=True
        )
        
        # Map Whisper language to Azure locale
        # Whisper (verbose_json) returns full language name like "spanish" or "english"
        azure_locale = "en-US"
        lang_lower = str(language).lower()
        
        if lang_lower in ['es', 'spanish', 'español']:
            azure_locale = "es-ES"
            
        print(f"Azure Speech Language: {azure_locale} (detected: {language})")
        
        # Crear recognizer
        recognizer = speechsdk.SpeechRecognizer(
            speech_config=speech_config, 
            language=azure_locale,
            audio_config=audio_config
        )
        
        # Aplicar pronunciation assessment
        pronunciation_config.apply_to(recognizer)
        
        # Reconocer
        result = recognizer.recognize_once()
        
        # Limpiar archivo temporal
        import os as os_module
        try:
            os_module.unlink(temp_path)
        except:
            pass
        
        # Verificar resultado
        if result.reason == speechsdk.ResultReason.RecognizedSpeech:
            pronunciation_result = speechsdk.PronunciationAssessmentResult(result)
            
            # Extraer palabras mal pronunciadas
            mispronounced_words = []
            words_details = []
            
            for word in pronunciation_result.words:
                word_detail = {
                    'word': word.word,
                    'accuracy': word.accuracy_score,
                    'error_type': word.error_type
                }
                words_details.append(word_detail)
                
                if word.accuracy_score < 60 or word.error_type != 'None':
                    mispronounced_words.append({
                        'word': word.word,
                        'accuracy': word.accuracy_score,
                        'error_type': word.error_type
                    })
            
            assessment_result = {
                'accuracy_score': pronunciation_result.accuracy_score,
                'fluency_score': pronunciation_result.fluency_score,
                'completeness_score': pronunciation_result.completeness_score,
                'pronunciation_score': pronunciation_result.pronunciation_score,
                'mispronounced_words': mispronounced_words,
                'words_details': words_details,
                'recognized_text': result.text
            }
            
            print(f"✓ Pronunciation Assessment - Score: {assessment_result['pronunciation_score']}, "
                  f"Accuracy: {assessment_result['accuracy_score']}, "
                  f"Fluency: {assessment_result['fluency_score']}, "
                  f"Mispronounced: {len(mispronounced_words)} words")
            
            return assessment_result
            
        else:
            print(f"Speech recognition failed: {result.reason}")
            return None
            
    except ImportError:
        print(" Azure Speech SDK not installed")
        print("  Install with: pip install azure-cognitiveservices-speech")
        return None
    except Exception as e:
        print(f"Error in pronunciation assessment: {e}")
        import traceback
        traceback.print_exc()
        return None


def format_pronunciation_feedback(assessment_data):
    """Formatea datos de pronunciación para GPT"""
    if not assessment_data:
        return ""
    
    feedback_parts = []
    
    feedback_parts.append(f"Pronunciation Scores:")
    feedback_parts.append(f"- Overall: {assessment_data['pronunciation_score']}/100")
    feedback_parts.append(f"- Accuracy: {assessment_data['accuracy_score']}/100")
    feedback_parts.append(f"- Fluency: {assessment_data['fluency_score']}/100")
    feedback_parts.append(f"- Completeness: {assessment_data['completeness_score']}/100")
    
    if assessment_data['mispronounced_words']:
        feedback_parts.append(f"\nMispronounced words ({len(assessment_data['mispronounced_words'])}):")
        for word_info in assessment_data['mispronounced_words']:
            word = word_info['word']
            accuracy = word_info['accuracy']
            error_type = word_info['error_type']
            feedback_parts.append(f"- '{word}' (accuracy: {accuracy}/100, error: {error_type})")
    else:
        feedback_parts.append("\nNo significant pronunciation errors detected.")
    
    return "\n".join(feedback_parts)