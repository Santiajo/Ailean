"use client";
import { motion } from "framer-motion";
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
      <motion.div
        className={`${styles.bubble} ${isUser ? styles.user : styles.bot}`}
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {message.content}
      </motion.div>
    </div>
  );
}
