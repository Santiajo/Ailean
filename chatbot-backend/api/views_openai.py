from django.http import StreamingHttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework import status
from .openai_services import transcribe_audio, get_chat_response, generate_speech
from .azure_services import pronunciation_assessment, format_pronunciation_feedback
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
        pronunciation_data = None
        
        # 1. Handle Input (Text or Audio)
        if audio_file:
            # Transcribe audio
            # Transcribe audio
            transcription_result = transcribe_audio(audio_file)
            if not transcription_result:
                return Response({"error": "Failed to transcribe audio"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            user_message, detected_lang = transcription_result
            
            # --- PRONUNCIATION ASSESSMENT ---
            # Assess pronunciation ONLY if language is English (skip for Spanish)
            is_spanish = str(detected_lang).lower() in ['es', 'spanish', 'español']
            
            if not is_spanish:
                print(f"Performing pronunciation assessment on: '{user_message}' (Lang: {detected_lang})")
                pronunciation_data = pronunciation_assessment(audio_file, user_message, language=detected_lang)
            else:
                print(f"Skipping pronunciation assessment for Spanish input (Lang: {detected_lang})")
            
            if pronunciation_data:
                print(f"✓ Pronunciation assessment completed")
            else:
                print("⚠ Pronunciation assessment not available (Azure not configured or failed)")
            # --------------------------------
            
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
                
                # Update Fluency Score if available from assessment
                if pronunciation_data:
                    current_session_score = float(pronunciation_data.get('fluency_score', 0))
                    
                    if profile.fluency_score == 0:
                        # First time: Set directly
                        profile.fluency_score = int(current_session_score)
                    else:
                        # Moving Average: 70% History, 30% New
                        # This prevents drastic jumps (e.g. from 100 to 26 in one go) and smooths progress
                        new_score = (float(profile.fluency_score) * 0.7) + (current_session_score * 0.3)
                        profile.fluency_score = int(new_score)
                        
                    # Optional: Use pronunciation/accuracy for other metrics if needed
                    # profile.vocabulary_score = int(pronunciation_data.get('accuracy_score', 0)) 
                
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
        
        # 2. Get Response from LLM (Streaming)
        
        # --- DEFINITIONS ---
        personas = {
            "friendly": {
                "voice": "en-US-AvaMultilingualNeural", # Multilingual (Fluent En/Es)
                "system_prompt": """You are a Friendly English Tutor AI.
Role: You are the teacher. TEACH directly. Do NOT recommend external apps/websites.
Goal: Help students improve English in a warm, supportive way.
Style: Cheerful, patient, and easy to understand.
Interact: Encourage the student often. Do NOT use emojis.
Language: If student speaks Spanish, reply in Spanish but gently guide to English.
Conciseness: Keep responses SHORT (2-4 sentences).
Context: If there is existing conversation history, CONTINUE it naturally. Do NOT ignore previous messages.""",
            },
            "strict": {
                "voice": "en-US-AndrewMultilingualNeural", # Multilingual (Fluent En/Es)
                "system_prompt": """You are a Strict English Professor AI.
Role: You are the professor. TEACH directly. Do NOT recommend external apps/websites.
Goal: Ensure grammatical accuracy and formal usage.
Style: Formal, direct, and serious. Do NOT use emojis.
Interact: Correct mistakes immediately. Do not tolerate slang unless asked.
Language: Use high-level English.
Conciseness: Precise and concise (2-4 sentences).
Context: If there is existing conversation history, CONTINUE it naturally. Do NOT ignore previous messages.""",
            },
            "encouraging": {
                "voice": "en-US-BrianMultilingualNeural", # Multilingual (Fluent En/Es)
                "system_prompt": """You are an Encouraging Coach AI.
Role: You are the coach. TRAIN the student directly. Do NOT recommend external apps/websites.
Goal: Motivate the student to speak without fear.
Style: High energy, positive, and motivational. Do NOT use emojis.
Interact: Celebrate mistakes as learning opportunities. "You got this!"
Language: Simple, punchy English.
Conciseness: Short and energetic (2-4 sentences).
Context: If there is existing conversation history, CONTINUE it naturally. Do NOT ignore previous messages.""",
            },
            "chill": {
                "voice": "en-US-EmmaMultilingualNeural", # Multilingual (Fluent En/Es)
                "system_prompt": """You are a Chill Study Buddy AI.
Role: You are a study partner. PRACTICE together. Do NOT recommend external apps/websites.
Goal: Chat comfortably like a friend.
Style: Relaxed, uses slang (like 'gonna', 'wanna'), casual. Do NOT use emojis.
Interact: Cool and laid back.
Language: Casual English.
Conciseness: Short and casual (2-4 sentences).
Context: If there is existing conversation history, CONTINUE it naturally. Do NOT ignore previous messages.""",
            },
             "professional": {
                "voice": "en-US-AndrewMultilingualNeural", # Sharing Andrew (Professional tone)
                "system_prompt": """You are a Professional English Tutor AI.
Role: You are the instructor. TEACH directly. Do NOT recommend external apps/websites.
Goal: Teach English with a focus on professional/business contexts, BUT help students of ALL levels (A1-C2).
Style: Professional, polite, and efficient. Do NOT use emojis.
Interact: Explain concepts clearly. If the user is a beginner, use simple professional language. NEVER refuse to help with basic English.
Language: Business-appropriate English.
Conciseness: Professional and brief (2-3 sentences).
Context: If there is existing conversation history, CONTINUE it naturally. Do NOT ignore previous messages.""",
            }
        }
        
        # Starter Prompts & Responses
        starter_responses = {
            "Quiero obtener retroalimentación": {
                "response": "¡Claro que sí! Estoy listo para ayudarte a mejorar. Por favor, envíame el texto o audio que quieres que revise, o simplemente empieza a hablar y yo te iré corrigiendo.",
                "mode": "feedback",
                "system_prompt": "Focus explicitly on giving feedback. Correct grammar and pronunciation errors politely but clearly. Explain WHY it was an error."
            },
             "Quiero aprender ingles basico": {
                "response": "¡Excellent! Empecemos con lo básico. ¿Qué tal si practicamos saludos y presentaciones? Repite después de mí: 'Hello, my name is...'. ¡Inténtalo!",
                "mode": "basic",
                "system_prompt": "TEACHING CONTEXT: The user is a BEGINNER (A1). RULE: Provide ALL instructions, feedback, and encouragement IN SPANISH. Only speak English when demonstrating the specific words or phrases the student must learn. Do not carry a conversation in English yet."
            },
             "Quiero aprender ingles elemental": {
                "response": "¡Great choice! Vamos a subir un pequeño escalón. Hablemos de tus rutinas diarias o hobbies. Tell me, what do you usually do in the mornings?",
                "mode": "elementary",
                "system_prompt": "TEACHING CONTEXT: The user is ELEMENTARY (A2). RULE: Use primarily SPANISH for complex explanations. Use simple English for questions and basic conversation. Ensure the user understands before moving on."
            },
             "Quiero aprender ingles Intermedio": {
                "response": "Awesome! Let's practice conversing more naturally. We could discuss travel, work, or opinions. What topic interests you today?",
                "mode": "intermediate",
                "system_prompt": "TEACHING CONTEXT: The user is INTERMEDIATE (B1/B2). Challenge them with opinions, future plans, and conditionals. Speak at a normal conversational speed."
            }
        }

        # Check if user message matches a starter prompt
        starter_data = starter_responses.get(user_message.strip())

        # --- SESSION RETRIEVAL ---
        chat_session = None
        if request.user.is_authenticated:
            if session_id := request.data.get('sessionId'):
                if session_id != 'new' and session_id != 'null':
                    try:
                        chat_session = ChatSession.objects.get(id=session_id, user=request.user)
                    except ChatSession.DoesNotExist:
                        chat_session = ChatSession.objects.create(user=request.user, title=user_message[:30] + "...")
                else:
                    chat_session = ChatSession.objects.create(user=request.user, title=user_message[:30] + "...")
            else:
                chat_session = ChatSession.objects.create(user=request.user, title=user_message[:30] + "...")
            
        # --- PERSONA CONFIGURATION ---
        persona = "friendly" # Default
        
        # 1. Check request for direct switch
        if request.data.get('persona'):
             persona = request.data.get('persona')
             if chat_session:
                 chat_session.metadata['persona'] = persona
                 chat_session.save()
        # 2. Check session metadata
        elif chat_session and chat_session.metadata.get('persona'):
             persona = chat_session.metadata.get('persona')
        # 3. If new session and no persona, save default
        elif chat_session:
             chat_session.metadata['persona'] = persona
             chat_session.save()

        current_persona_config = personas.get(persona, personas["friendly"])
        base_system_prompt = current_persona_config["system_prompt"]
        voice_name = current_persona_config["voice"]

        if chat_session:
            # Update metadata if starter prompt (mode overrides persona system prompt context later)
            if starter_data:
                chat_session.metadata['mode'] = starter_data['mode']
                chat_session.save()

            # Save User Message
            ChatMessage.objects.create(session=chat_session, role='user', content=user_message)

            
            # Load history from DB for context
            db_messages = chat_session.messages.order_by('created_at')
            
            # Determine System Prompt
            current_system_prompt = base_system_prompt # Default from PERSONA
            
            # If mode is set (Starter), it overrides Persona prompt
            # If mode is set (Starter), APPEND it to Persona prompt instead of replacing
            if chat_session.metadata.get('mode'):
                for key, val in starter_responses.items():
                    if val['mode'] == chat_session.metadata.get('mode'):
                        # MERGE: Keep the persona (Who I am) + Add context (What I'm teaching)
                        current_system_prompt += f"\n\n--- CURRENT LESSON CONTEXT ---\n{val['system_prompt']}"
                        break
            
            # --- ADD PRONUNCIATION CONTEXT TO SYSTEM PROMPT ---
            if pronunciation_data:
                pronunciation_context = format_pronunciation_feedback(pronunciation_data)
                current_system_prompt += f"\n\n--- PRONUNCIATION ASSESSMENT DATA ---\n{pronunciation_context}\n\nIntegrate relevant pronunciation tips naturally into your response (1-2 sentences max)."
            # --------------------------------------------------
            
            messages = [{"role": "system", "content": current_system_prompt}]
            for msg in db_messages:
                messages.append({"role": msg.role, "content": msg.content})
        else:
            # Fallback for unauthenticated
            current_system_prompt = base_system_prompt 
            
            # Add pronunciation context for unauthenticated users too
            if pronunciation_data:
                pronunciation_context = format_pronunciation_feedback(pronunciation_data)
                current_system_prompt += f"\n\n--- PRONUNCIATION ASSESSMENT DATA ---\n{pronunciation_context}\n\nIntegrate relevant pronunciation tips naturally into your response (1-2 sentences max)."
            
            messages = [{"role": "system", "content": current_system_prompt}]
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

        # Special handling for Starter Prompts: Stream sentence-by-sentence for speed
        if starter_data:
            def starter_stream():
                if chat_session:
                     yield f"data: {json.dumps({'type': 'session_id', 'id': chat_session.id})}\n\n"
                
                response_text = starter_data['response']
                
                # Split text into sentences/segments to stream audio progressively
                # Split by punctuation (. ! ?) followed by whitespace, keeping the delimiter
                raw_segments = re.split(r'([.!?\n]+(?:\s+|$))', response_text)
                
                chunks = []
                current_chunk = ""
                
                # Reassemble chunks (text + delimiter)
                # raw_segments result: ["Hola", "!\n", "Como estas", "?", ""]
                for i in range(0, len(raw_segments) - 1, 2):
                    chunks.append(raw_segments[i] + raw_segments[i+1])
                if len(raw_segments) % 2 != 0:
                    chunks.append(raw_segments[-1])
                    
                # Filter empty chunks
                chunks = [c for c in chunks if c.strip()]
                
                for i, chunk in enumerate(chunks):
                    # Generate audio for the chunk
                    cleaned_chunk = clean_text_for_speech(chunk)
                    audio_base64 = None
                    
                    if cleaned_chunk:
                        # USE AZURE TTS
                        from .azure_services import generate_speech as generate_speech_azure
                        audio_content = generate_speech_azure(cleaned_chunk, voice_name=voice_name)
                        
                        if audio_content:
                            audio_base64 = base64.b64encode(audio_content).decode('utf-8')
                        else:
                             # Don't error out, just send text
                             pass
                    
                    # Send synchronized segment
                    yield f"data: {json.dumps({'type': 'response_segment', 'text': chunk, 'audio': audio_base64})}\n\n"

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
            
            # --- SEND PRONUNCIATION DATA TO FRONTEND ---
            if pronunciation_data:
                pronunciation_payload = {
                    'type': 'pronunciation_data',
                    'accuracy': pronunciation_data['accuracy_score'],
                    'fluency': pronunciation_data['fluency_score'],
                    'pronunciation_score': pronunciation_data['pronunciation_score'],
                    'completeness': pronunciation_data['completeness_score'],
                    'mispronounced_words': [
                        {
                            'word': w['word'],
                            'accuracy': w['accuracy'],
                            'error_type': w['error_type']
                        } for w in pronunciation_data['mispronounced_words']
                    ]
                }
                yield f"data: {json.dumps(pronunciation_payload)}\n\n"
            # --------------------------------------------

            accumulated_raw_text = ""

            try:
                for chunk in stream:
                    if chunk.choices[0].delta.content:
                        content = chunk.choices[0].delta.content
                        full_response_text += content
                        buffer += content
                        # We still send text_chunk for "fast" display if frontend wants it, 
                        # but for sync mode we strictly use response_segment
                        # yield f"data: {json.dumps({'type': 'text_chunk', 'content': content})}\n\n"
                        
                        # Check for sentence completion
                        while True:
                            match = re.search(r'[.!?]\s', buffer)
                            if not match:
                                break
                                
                            sentence = buffer[:match.end()]
                            buffer = buffer[match.end():]
                            
                            accumulated_raw_text += sentence
                            
                            # Add to speech buffer
                            cleaned_sentence = clean_text_for_speech(sentence)
                            if cleaned_sentence:
                                speech_buffer += " " + cleaned_sentence
                            
                            # Only generate audio if buffer is long enough (e.g. > 50 chars) to reduce requests/choppiness
                            if len(speech_buffer) > 50:
                                # USE AZURE TTS
                                from .azure_services import generate_speech as generate_speech_azure
                                audio_content = generate_speech_azure(speech_buffer.strip(), voice_name=voice_name)
                                
                                audio_base64 = None
                                if audio_content:
                                    audio_base64 = base64.b64encode(audio_content).decode('utf-8')
                                else:
                                    print("⚠ Audio generation failed")
                                
                                # Send synchronized segment
                                yield f"data: {json.dumps({'type': 'response_segment', 'text': accumulated_raw_text, 'audio': audio_base64})}\n\n"
                                
                                # Reset buffers
                                speech_buffer = ""
                                accumulated_raw_text = ""

            except Exception as e:
                print(f"Stream error: {e}")
                yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"
            
            # Process remaining text buffer (incomplete sentence or end of stream)
            if buffer.strip():
                 sentence = buffer
                 accumulated_raw_text += sentence
                 cleaned_buffer = clean_text_for_speech(sentence)
                 if cleaned_buffer:
                     speech_buffer += " " + cleaned_buffer

            # Process remaining speech buffer / raw text
            if accumulated_raw_text.strip():
                if speech_buffer.strip():
                    # USE AZURE TTS
                    from .azure_services import generate_speech as generate_speech_azure
                    audio_content = generate_speech_azure(speech_buffer.strip(), voice_name=voice_name)
                    
                    audio_base64 = None
                    if audio_content:
                        audio_base64 = base64.b64encode(audio_content).decode('utf-8')
                    else:
                         print("⚠ Final audio generation failed")
                    
                    yield f"data: {json.dumps({'type': 'response_segment', 'text': accumulated_raw_text, 'audio': audio_base64})}\n\n"
                else:
                    # Text only (no speech content)
                    yield f"data: {json.dumps({'type': 'response_segment', 'text': accumulated_raw_text, 'audio': None})}\n\n"
            
            # --- Persistence: Save Assistant Message ---
            if chat_session and full_response_text:
                ChatMessage.objects.create(session=chat_session, role='assistant', content=full_response_text)
            # -------------------------------------------

            yield "data: [DONE]\n\n"

        return StreamingHttpResponse(event_stream(), content_type='text/event-stream')