"use client";
import { useState } from "react";
import { Send } from "lucide-react";
import styles from "../css/ChatInput.module.css";

interface ChatInputProps {
  onSend: (message: string) => void;
}

export function ChatInput({ onSend }: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.container}>
      <input
        className={styles.input}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Escribe un mensaje..."
      />
      <button
        className={styles.button}
        onClick={handleSend}
        disabled={!input.trim()}
      >
        <Send size={20} />
      </button>
    </div>
  );
}

