"use client";

import { Message } from "../hooks/useChat";
import styles from "../css/MessageBubble.module.css";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`${styles.wrapper} ${isUser ? styles.userWrapper : styles.botWrapper}`}
    >
      <div
        className={`${styles.bubble} ${isUser ? styles.user : styles.bot}`}
      >
        {message.content}
      </div>
    </div>
  );
}
