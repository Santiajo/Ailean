"app/chat/components/ChatInput.tsx"
"use client";
import { useState, useRef } from "react";
import { Send, Mic, Square } from "lucide-react";
import styles from "../css/ChatInput.module.css";

interface ChatInputProps {
  onSend: (content: string | Blob, isAudio: boolean) => void;
}

export function ChatInput({ onSend }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input, false);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        onSend(blob, true);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("No se pudo acceder al micrófono.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
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
        placeholder={isRecording ? "Grabando audio..." : "Escribe un mensaje..."}
        disabled={isRecording}
      />

      {isRecording ? (
        <button className={`${styles.button} ${styles.recording}`} onClick={stopRecording}>
          <Square size={20} fill="currentColor" />
        </button>
      ) : (
        <>
          {input.trim() ? (
            <button className={styles.button} onClick={handleSend}>
              <Send size={20} />
            </button>
          ) : (
            <button className={styles.button} onClick={startRecording}>
              <Mic size={20} />
            </button>
          )}
        </>
      )}
    </div>
  );
}
