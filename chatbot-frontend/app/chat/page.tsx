"app/chat/page.tsx"
"use client";
import Sidebar from "./components/Sidebar";
import { ChatBox } from "./components/ChatBox";
import FloatingAvatar from "./components/FloatingAvatar";
import AvatarCustomizer from "./components/AvatarCustomizer";
import styles from "./page.module.css";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";

import { useChat } from "./hooks/useChat";

export default function Page() {
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const [isTalking, setIsTalking] = useState(false);

  const [avatarColor, setAvatarColor] = useState("#589cf0ff");
  const [accessories, setAccessories] = useState({ hat: false, glasses: false });

  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [showCustomizer, setShowCustomizer] = useState(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Initialize theme state
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const initialDark = storedTheme === 'light' ? false : true;
    setIsDarkMode(initialDark);
  }, []);

  const toggleTheme = () => {
    const switchTheme = () => {
      setIsDarkMode((prev) => {
        const newMode = !prev; // Toggle

        // Update DOM
        if (newMode) {
          document.documentElement.classList.remove('light-mode');
          localStorage.setItem('theme', 'dark');
          console.log("Switched to Dark Mode");
        } else {
          document.documentElement.classList.add('light-mode');
          localStorage.setItem('theme', 'light');
          console.log("Switched to Light Mode");
        }

        return newMode;
      });
    };

    if (document.startViewTransition) {
      document.startViewTransition(switchTheme);
    } else {
      switchTheme();
    }
  };

  // Lifted Chat State
  const chat = useChat();

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

  // Handle deep linking from Progress page
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const urlSessionId = searchParams ? searchParams.get('sessionId') : null;

  useEffect(() => {
    if (urlSessionId && !chat.sessionId) {
      chat.loadSession(Number(urlSessionId));
      // Clean up URL
      window.history.replaceState({}, '', '/chat');
    }
  }, [urlSessionId, chat]);

  // Si no está autorizado aún, no se muestra nada del chat
  if (!isAuthorized) {
    return null;
  }

  return (
    <div className={styles.page}>
      <Sidebar
        sessionId={chat.sessionId}
        loadSession={chat.loadSession}
        createNewChat={chat.createNewChat}
        currentPersona={chat.currentPersona}
        setPersona={chat.setCurrentPersona}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className={styles.chatArea} ref={chatContainerRef} style={{ position: "relative" }}>
        {/* Mobile Menu Button - Controlled by CSS */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className={styles.mobileMenuBtn}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <FloatingAvatar
          containerRef={chatContainerRef}
          isTalking={chat.isPlaying}
          analyser={chat.currentAnalyser}
          color={avatarColor}
          accessories={accessories}
        />
        <ChatBox
          setIsTalking={setIsTalking} // Keeping for now if ChatBox needs it, but it likely won't affect Avatar anymore
          messages={chat.messages}
          sendMessage={chat.sendMessage}
          isLoading={chat.isLoading}
          isBotTyping={chat.isLoading}
        />

        {/* Floating Controls (Theme & Customizer) */}
        <div className={styles.controlsContainer}>
          {/* Botón Tema (Light/Dark) */}
          <button
            onClick={toggleTheme}
            className={styles.roundBtn}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? (
              // Sun Icon
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              // Moon Icon
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>

          {/* Botón para abrir/cerrar personalización */}
          <button
            onClick={() => setShowCustomizer(!showCustomizer)}
            className={styles.roundBtn}
          >
            <Settings size={20} />
          </button>
        </div>

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
