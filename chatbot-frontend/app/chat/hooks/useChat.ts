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

  const sendMessage = (content: string) => {
    const userMessage: Message = {
      id: uuid(),
      role: "user",
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);

    setIsBotTyping(true);

    setTimeout(() => {
      const botMessage: Message = {
        id: uuid(),
        role: "bot",
        content: "Respuesta IA: " + content,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsBotTyping(false);
    }, 1000); 
  };

  return { messages, sendMessage, isBotTyping };
}
