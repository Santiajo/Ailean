"app/chat/components/ChatBox.tsx"
"use client";

import { ChatInput } from "./ChatInput";
import { MessageBubble } from "./MessageBubble";
import { Message } from "../hooks/useChat";
import { useRef, useEffect } from "react";
import styles from "../css/ChatBox.module.css";

interface ChatBoxProps {
  setIsTalking: React.Dispatch<React.SetStateAction<boolean>>;
  messages: Message[];
  sendMessage: (content: string | Blob, isAudio?: boolean) => Promise<void>;
  isLoading: boolean;
  isBotTyping: boolean;
}

export function ChatBox({ setIsTalking, messages, sendMessage, isLoading, isBotTyping }: ChatBoxProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleSend = (content: string | Blob, isAudio: boolean = false) => {
    sendMessage(content, isAudio);
    setIsTalking(true);
  };

  useEffect(() => {
    if (!isBotTyping) setIsTalking(false);
  }, [isBotTyping]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages]);

  return (
    <div className={styles.container}>
      <div className={styles.messages} ref={containerRef}>
        {messages.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>Comienza una conversación</p>
            <p className={styles.emptySubtitle}>Elige una opción para empezar:</p>
            <div className={styles.starterChips}>
              <button onClick={() => handleSend("Quiero obtener retroalimentación")}>Obtener Retroalimentación</button>
              <button onClick={() => handleSend("Quiero aprender ingles basico")}>Inglés Básico (A1)</button>
              <button onClick={() => handleSend("Quiero aprender ingles elemental")}>Inglés Elemental (A2)</button>
              <button onClick={() => handleSend("Quiero aprender ingles Intermedio")}>Inglés Intermedio (B1/B2)</button>
            </div>
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
      </div>

      <div className={styles.input}>
        <div className={styles.inputInner}>
          <ChatInput onSend={handleSend} />
        </div>
      </div>
    </div>
  );
}
