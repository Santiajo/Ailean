"use client";
import Sidebar from "./components/Sidebar";
import { ChatBox } from "./components/ChatBox";
import FloatingAvatar from "./components/FloatingAvatar";
import AvatarCustomizer from "./components/AvatarCustomizer";
import styles from "./page.module.css";
import { useRef, useState } from "react";

export default function Page() {
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const [isTalking, setIsTalking] = useState(false);

  const [avatarColor, setAvatarColor] = useState("#589cf0ff"); // color inicial suave
  const [accessories, setAccessories] = useState({ hat: false, glasses: false });

  const toggleAccessory = (acc: "hat" | "glasses") => {
    setAccessories((prev) => ({ ...prev, [acc]: !prev[acc] }));
  };

  return (
    <div className={styles.page}>
      <Sidebar />
      <div className={styles.chatArea} ref={chatContainerRef} style={{ position: "relative" }}>
        <ChatBox setIsTalking={setIsTalking} />
        <FloatingAvatar
          containerRef={chatContainerRef}
          isTalking={isTalking}
          color={avatarColor}
          accessories={accessories}
        />

        {/* Panel de personalización */}
        <div style={{ position: "absolute", top: 10, right: 10, zIndex: 50 }}>
          <AvatarCustomizer setAvatarColor={setAvatarColor} toggleAccessory={toggleAccessory} />
        </div>
      </div>
    </div>
  );
}
