"use client";
import { useState, useEffect } from "react";

export type Message = {
  id: string | number;
  role: "user" | "bot" | "assistant";
  content: string;
  timestamp?: number;
  isAudio?: boolean;
};

export type PronunciationData = {
  accuracy: number;
  fluency: number;
  pronunciation_score: number;
  completeness: number;
  mispronounced_words: Array<{
    word: string;
    accuracy: number;
    error_type: string;
  }>;
};

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Audio & Sync State
  // Queue stores segments: { text: string (to display), audio: string (base64) | null }
  const [segmentQueue, setSegmentQueue] = useState<Array<{ text: string, audio: string | null }>>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [currentAnalyser, setCurrentAnalyser] = useState<AnalyserNode | null>(null);

  const [sessionId, setSessionId] = useState<number | null>(null);

  // New state for pronunciation assessment
  const [pronunciationData, setPronunciationData] = useState<PronunciationData | null>(null);

  // Persona State
  const [currentPersona, setCurrentPersona] = useState("friendly");

  useEffect(() => {
    const saved = localStorage.getItem("preferredPersona");
    if (saved) setCurrentPersona(saved);
  }, []);

  // Process the segment queue
  useEffect(() => {
    const processQueue = async () => {
      if (isProcessingQueue || segmentQueue.length === 0) return;

      setIsProcessingQueue(true);
      const segment = segmentQueue[0];

      // Determine bot message ID (last message should be from assistant)
      // If the last message is NOT from assistant, we need to add one? 
      // Actually, we add the placeholder when request starts.

      const playAudio = (base64: string): Promise<void> => {
        return new Promise((resolve) => {
          const audio = new Audio(`data:audio/mp3;base64,${base64}`);

          // Audio Context for Lip Sync
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContext) {
            const audioCtx = new AudioContext();
            const source = audioCtx.createMediaElementSource(audio);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyser.connect(audioCtx.destination);
            setCurrentAnalyser(analyser);

            // Resume context if suspended (browser policy)
            if (audioCtx.state === 'suspended') {
              audioCtx.resume();
            }
          }

          audio.onended = () => {
            setCurrentAnalyser(null);
            resolve();
          };
          audio.onerror = () => {
            console.error("Audio playback error");
            setCurrentAnalyser(null);
            resolve();
          };
          audio.play().catch(e => {
            console.error("Play failed", e);
            resolve();
          });
        });
      };

      const typeText = async (text: string, durationEstimateMs: number) => {
        if (!text) return;

        // Split text into chunks for "typing" effect
        // We want to distribute typing over the duration. 
        // If duration is unknown (no audio), use default speed.
        const chars = text.split("");
        const totalChars = chars.length;

        // Default speed: 30ms per char
        const delay = durationEstimateMs > 0
          ? Math.min(Math.max(durationEstimateMs / totalChars, 10), 100)
          : 30;

        for (const char of chars) {
          setMessages((prev) => {
            const newMsgs = [...prev];
            const lastMsg = newMsgs[newMsgs.length - 1];
            if (lastMsg && lastMsg.role === "assistant") {
              // Append to existing
              return [
                ...newMsgs.slice(0, -1),
                { ...lastMsg, content: lastMsg.content + char }
              ];
            } else {
              // Create new if strictly necessary (shouldn't be if we initialized correctly)
              // But we rely on initialize logic below.
              // For safety, assume last message is the one we are editing.
              return newMsgs;
            }
          });
          await new Promise(r => setTimeout(r, delay));
        }
      };

      // Execute Sync
      if (segment.audio) {
        // Start audio and typing together
        // We don't know exact duration beforehand easily without pre-loading metadata.
        // But we can guess: average speaking rate is ~15 chars/sec?
        // Or just let them run independently but start together.

        // Actually, we can get duration if we wait for metadata.
        // But that delays playback.
        // Let's just type at a "natural" reading speed (e.g. 30-50ms/char) 
        // while audio plays.

        const audioPromise = playAudio(segment.audio);
        const typingPromise = typeText(segment.text, 0); // 0 = use default speed

        await Promise.all([audioPromise, typingPromise]);
      } else {
        // Text only
        await typeText(segment.text, 0);
      }

      setSegmentQueue((prev) => prev.slice(1));
      setIsProcessingQueue(false);
    };

    processQueue();
  }, [segmentQueue, isProcessingQueue]);

  const stopAudio = () => {
    // Helper to clear state if needed
    setSegmentQueue([]);
    setIsProcessingQueue(false);
    window.speechSynthesis.cancel(); // Safety
  };

  const loadSession = async (id: number) => {
    setSessionId(id);
    setMessages([]); // Clear current messages
    setPronunciationData(null); // Clear pronunciation data
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sessions/${id}/messages/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Map backend messages to frontend format
        const mappedMessages = data.map((msg: { id: number; role: string; content: string }) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          isAudio: false // History is text-only for now
        }));
        setMessages(mappedMessages);
      }
    } catch (e) {
      console.error("Error loading session:", e);
    }
  };

  const createNewChat = () => {
    console.log("createNewChat called");
    setSessionId(null);
    setMessages([]);
    setSegmentQueue([]);
    setIsProcessingQueue(false);
    setCurrentAnalyser(null);
    setPronunciationData(null);
    // Persist persona across chats (it's user pref)
  };

  const sendMessage = async (content: string | Blob, isAudio: boolean = false) => {
    if (!content) return;

    // Clear previous pronunciation data when sending new message
    if (isAudio) {
      setPronunciationData(null);
    }

    // 1. Optimistic Update
    const tempId = Date.now();
    const userMsg: Message = {
      id: tempId,
      role: "user",
      content: isAudio ? "Audio message..." : (content as string),
      isAudio,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const formData = new FormData();
      if (isAudio) {
        formData.append("audio", content as Blob, "recording.webm");
      } else {
        formData.append("message", content as string);
      }

      if (sessionId) {
        formData.append("sessionId", sessionId.toString());
      }

      // Send chat history for context (optional, but good for new chats)
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      formData.append("history", JSON.stringify(history));

      // Append Persona
      formData.append("persona", currentPersona);

      const token = localStorage.getItem("accessToken");
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // 2. Send Request (SSE)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat/`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (response.status === 401) {
        // Handle Unauthorized
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
        return;
      }

      if (!response.ok || !response.body) {
        throw new Error("Failed to send message");
      }

      // 3. Handle Stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botMsgId = Date.now() + 1;

      // Initialize assistant message (empty content initially)
      setMessages((prev) => [...prev, { id: botMsgId, role: "assistant", content: "" }]);

      let buffer = ""; // Buffer for handling split JSON chunks

      while (true) {
        const { done, value } = await reader.read();

        // End of stream handling
        if (done) {
          break;
        }

        const chunkValue = decoder.decode(value, { stream: true });
        buffer += chunkValue;

        // Split by double newline (SSE delimiter)
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || ""; // Keep the last part (potentially incomplete) in buffer

        for (const part of parts) {
          if (!part.trim()) continue;
          if (part.includes("[DONE]")) continue;

          if (part.startsWith("data: ")) {
            const jsonStr = part.replace("data: ", "");
            try {
              const data = JSON.parse(jsonStr);

              if (data.type === "session_id") {
                setSessionId(data.id);
              } else if (data.type === "transcription") {
                // Update optimistic user message with real text
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === tempId ? { ...m, content: data.text, isAudio: false } : m
                  )
                );
              } else if (data.type === "pronunciation_data") {
                const pronunciationInfo: PronunciationData = {
                  accuracy: data.accuracy,
                  fluency: data.fluency,
                  pronunciation_score: data.pronunciation_score,
                  completeness: data.completeness,
                  mispronounced_words: data.mispronounced_words || []
                };
                setPronunciationData(pronunciationInfo);
              } else if (data.type === "text_chunk") {
                // Legacy or debug: ignore for now as we use response_segment
                // botContent += data.content; 
              } else if (data.type === "response_segment") {
                // Push synchronized segment to queue
                setSegmentQueue(prev => [...prev, { text: data.text, audio: data.audio }]);
              } else if (data.type === "error") {
                console.warn("Backend error:", data.content);
              }
            } catch (e) {
              console.error("Error parsing SSE JSON:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), role: "assistant", content: "Error: Could not reach the server." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    sendMessage,
    isLoading,
    isPlaying: !!currentAnalyser,
    currentAnalyser,
    sessionId,
    loadSession,
    createNewChat,
    pronunciationData,
    currentPersona,
    setCurrentPersona
  };
}