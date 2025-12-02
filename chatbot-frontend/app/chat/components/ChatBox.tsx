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
            <p className={styles.emptySubtitle}>Escribe algo abajo para empezar</p>
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
