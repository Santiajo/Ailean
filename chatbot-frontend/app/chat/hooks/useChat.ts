"use client";
import { useState, useEffect } from "react";
import { v4 as uuid } from "uuid";

export type Message = {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: number;
};

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [audioQueue, setAudioQueue] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

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

  const sendMessage = async (content: string | Blob, isAudio: boolean = false) => {
    const tempId = uuid();
    const botId = uuid();
    let userMessageContent = "";

    if (isAudio) {
      userMessageContent = "Audio sent...";
    } else {
      userMessageContent = content as string;
    }

    const userMessage: Message = {
      id: tempId,
      role: "user",
      content: userMessageContent,
      timestamp: Date.now(),
    };

    // Optimistically add user message
    setMessages((prev) => [...prev, userMessage]);
    setIsBotTyping(true);

    // Prepare bot message placeholder
    const botMessage: Message = {
      id: botId,
      role: "bot",
      content: "",
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, botMessage]);

    try {
      const formData = new FormData();
      if (isAudio) {
        formData.append("audio", content as Blob, "recording.webm");
      } else {
        formData.append("message", content as string);
      }

      // Send chat history for context
      // Filter out the optimistic message we just added (tempId) and the bot placeholder (botId)
      // Actually, we can just send the 'messages' state as it was BEFORE this update, 
      // but 'messages' in the closure is the old state.
      // However, we want to send the conversation so far.
      // Let's map the current 'messages' to the format expected by OpenAI (role, content).
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      formData.append("history", JSON.stringify(history));

      const token = localStorage.getItem("accessToken");
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("http://localhost:8000/api/chat/", {
        method: "POST",
        headers: headers,
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error("Token expired or unauthorized. Redirecting to login...");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          window.location.href = "/login";
          return;
        }
        throw new Error("Network response was not ok");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let buffer = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: true });
        buffer += chunkValue;

        // Process complete events in buffer
        const parts = buffer.split("\n\n");
        // The last part might be incomplete, so we keep it in the buffer
        buffer = parts.pop() || "";

        for (const part of parts) {
          if (part.startsWith("data: ")) {
            const jsonStr = part.replace("data: ", "").trim();
            if (jsonStr === "[DONE]") {
              done = true;
              break;
            }
            try {
              const data = JSON.parse(jsonStr);

              if (data.type === "transcription") {
                // Update user message with transcription
                setMessages((prev) =>
                  prev.map(msg => msg.id === tempId ? { ...msg, content: data.text } : msg)
                );
              } else if (data.type === "text_chunk") {
                // Append text to bot message
                setMessages((prev) =>
                  prev.map(msg => msg.id === botId ? { ...msg, content: msg.content + data.content } : msg)
                );
              } else if (data.type === "audio") {
                // Play audio
                playAudio(data.data);
              }
            } catch (e) {
              console.error("Error parsing SSE JSON", e);
            }
          }
        }
      }

    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: uuid(),
        role: "bot",
        content: "Lo siento, hubo un error al procesar tu mensaje.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsBotTyping(false);
    }
  };

  return { messages, sendMessage, isBotTyping };
}
