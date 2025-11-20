"use client";
import Sidebar from "./components/Sidebar";
import { ChatBox } from "./components/ChatBox";
import FloatingAvatar from "./components/FloatingAvatar";
import AvatarCustomizer from "./components/AvatarCustomizer";
import styles from "./page.module.css";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const [isTalking, setIsTalking] = useState(false);

  const [avatarColor, setAvatarColor] = useState("#589cf0ff");
  const [accessories, setAccessories] = useState({ hat: false, glasses: false });

  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  const toggleAccessory = (acc: "hat" | "glasses") => {
    setAccessories((prev) => ({ ...prev, [acc]: !prev[acc] }));
  };

  useEffect(() => {
    // Obtener token de local storage
    const token = localStorage.getItem("accessToken");
    if (!token) {
      // Si no hay token, mandamos al user al login
      router.push("/login");
    } else {
      // Si hay token, se permite ver contenido
      setIsAuthorized(true);
    }
  }, [router]);

  // Si no está autorizado aún, no se muestra nada del chat
  if (!isAuthorized) {
    return null; 
  }

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
