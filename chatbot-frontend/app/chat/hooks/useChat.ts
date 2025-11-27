"use client";
import { useState } from "react";
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

  const playAudio = (base64Audio: string) => {
    const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
    audio.play().catch((e) => console.error("Error playing audio:", e));
  };

  const sendMessage = async (content: string | Blob, isAudio: boolean = false) => {
    const tempId = uuid();
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
    setMessages((prev) => [...prev, userMessage]);
    setIsBotTyping(true);

    try {
      const formData = new FormData();
      if (isAudio) {
        formData.append("audio", content as Blob, "recording.webm");
      } else {
        formData.append("message", content as string);
      }

      const token = localStorage.getItem("accessToken");
      // Note: Assuming token is needed, though RegisterView was AllowAny, ChatView might need auth? 
      // The prompt didn't specify auth for ChatView but the project has auth. 
      // I'll add header if token exists.

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
        throw new Error("Network response was not ok");
      }

      const data = await response.json();

      // Update user message if it was audio (with transcribed text)
      if (isAudio && data.user_message) {
        setMessages((prev) =>
          prev.map(msg => msg.id === tempId ? { ...msg, content: data.user_message } : msg)
        );
      }

      const botMessage: Message = {
        id: uuid(),
        role: "bot",
        content: data.bot_response,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, botMessage]);

      if (data.audio_base64) {
        playAudio(data.audio_base64);
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
