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
  const [audioQueue, setAudioQueue] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  
  // New state for pronunciation assessment
  const [pronunciationData, setPronunciationData] = useState<PronunciationData | null>(null);

  // Audio Queue Effect
  useEffect(() => {
    if (!isPlaying && audioQueue.length > 0) {
      const nextAudio = audioQueue[0];
      setIsPlaying(true);

      const audio = new Audio(`data:audio/mp3;base64,${nextAudio}`);

      const handleEnd = () => {
        setAudioQueue((prev) => prev.slice(1)); // Remove played item
        setIsPlaying(false); // Allow next item to play
      };

      audio.onended = handleEnd;
      audio.play().catch((e) => {
        console.error("Error playing audio:", e);
        handleEnd(); // Skip on error
      });
    }
  }, [audioQueue, isPlaying]);

  const playAudio = (base64Audio: string) => {
    setAudioQueue((prev) => [...prev, base64Audio]);
  };

  const loadSession = async (id: number) => {
    setSessionId(id);
    setMessages([]); // Clear current messages
    setPronunciationData(null); // Clear pronunciation data
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`http://localhost:8000/api/sessions/${id}/messages/`, {
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
    setAudioQueue([]);
    setIsPlaying(false);
    setPronunciationData(null);
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
      content: isAudio ? "🎤 Audio message..." : (content as string),
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

      const token = localStorage.getItem("accessToken");
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // 2. Send Request (SSE)
      const response = await fetch("http://localhost:8000/api/chat/", {
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
      let botContent = "";
      let isFirstChunk = true;
      let buffer = ""; // Buffer for handling split JSON chunks

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

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
                // NEW: Handle pronunciation assessment data
                const pronunciationInfo: PronunciationData = {
                  accuracy: data.accuracy,
                  fluency: data.fluency,
                  pronunciation_score: data.pronunciation_score,
                  completeness: data.completeness,
                  mispronounced_words: data.mispronounced_words || []
                };
                
                setPronunciationData(pronunciationInfo);
                
                // Log to console for debugging
                console.log("Pronunciation Assessment:", pronunciationInfo);
                
                // Optional: Show toast notification with score
                if (pronunciationInfo.pronunciation_score >= 80) {
                  console.log(`🎯 Excellent pronunciation! ${pronunciationInfo.pronunciation_score}/100`);
                } else if (pronunciationInfo.pronunciation_score >= 60) {
                  console.log(`👍 Good job! ${pronunciationInfo.pronunciation_score}/100`);
                } else {
                  console.log(`💪 Keep practicing! ${pronunciationInfo.pronunciation_score}/100`);
                }
              } else if (data.type === "text_chunk") {
                botContent += data.content;

                setMessages((prev) => {
                  const lastMsg = prev[prev.length - 1];
                  if (isFirstChunk || lastMsg.role !== "assistant" || lastMsg.id !== botMsgId) {
                    isFirstChunk = false;
                    return [...prev, { id: botMsgId, role: "assistant", content: botContent }];
                  } else {
                    return prev.map((m) =>
                      m.id === botMsgId ? { ...m, content: botContent } : m
                    );
                  }
                });
              } else if (data.type === "audio") {
                // Queue audio for playback
                playAudio(data.data);
              } else if (data.type === "error") {
                // NEW: Handle error events (e.g., "Audio generation not available")
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
    isPlaying, 
    sessionId, 
    loadSession, 
    createNewChat,
    pronunciationData // Export pronunciation data for use in components
  };
}