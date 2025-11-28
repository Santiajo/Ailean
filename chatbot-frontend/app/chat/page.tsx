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

  const [showCustomizer, setShowCustomizer] = useState(false);

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
        <FloatingAvatar
          containerRef={chatContainerRef}
          isTalking={isTalking}
          color={avatarColor}
          accessories={accessories}
        />
        <ChatBox setIsTalking={setIsTalking} />

        {/* Botón para abrir/cerrar personalización */}
        <button
          onClick={() => setShowCustomizer(!showCustomizer)}
          style={{
            position: "absolute",
            bottom: 20,
            right: 20,
            zIndex: 60,
            background: "#334155",
            border: "none",
            borderRadius: "50%",
            width: 40,
            height: 40,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>

        {/* Panel de personalización */}
        {showCustomizer && (
          <div style={{ position: "absolute", bottom: 70, right: 20, zIndex: 50 }}>
            <AvatarCustomizer setAvatarColor={setAvatarColor} toggleAccessory={toggleAccessory} />
          </div>
        )}
      </div>
    </div>
  );
}
