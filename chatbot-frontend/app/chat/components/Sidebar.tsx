import { useState, useEffect } from "react";
import { MessageSquare, Plus, Settings, LogOut, BarChart2, User, Award, Trash2, Edit2, X, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "../css/Sidebar.module.css";
import SettingsModal from "./SettingsModal";

interface SidebarProps {
  sessionId: number | null;
  loadSession: (id: number) => void;
  createNewChat: () => void;
  currentPersona: string;
  setPersona: (p: string) => void;
  isOpen: boolean;        // Mobile state
  onClose: () => void;    // Mobile close trigger
}

export default function Sidebar({ sessionId, loadSession, createNewChat, currentPersona, setPersona, isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const savePersona = (persona: string) => {
    setPersona(persona);
    // Optionally save to local storage or user profile API if we had one
    localStorage.setItem("preferredPersona", persona);
  };

  useEffect(() => {
    fetchSessions();
  }, [sessionId]);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      const res = await fetch(`${apiUrl}/api/sessions/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (e) {
      console.error("Error fetching sessions:", e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    router.push("/login");
  };

  const deleteSession = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm("¿Estás seguro de que quieres eliminar este chat?")) return;

    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sessions/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== id));
        if (sessionId === id) createNewChat();
      }
    } catch (e) {
      console.error("Error deleting session:", e);
    }
  };

  const startEditing = (e: React.MouseEvent, session: any) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const saveTitle = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sessions/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title: editTitle })
      });
      if (res.ok) {
        setSessions(prev => prev.map(s => s.id === id ? { ...s, title: editTitle } : s));
        setEditingId(null);
      }
    } catch (e) {
      console.error("Error updating session:", e);
    }
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (

    <>
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ''}`}
        onClick={onClose}
      />

      <div className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarTop}>
          <div className={styles.headerRow}>
            <h1 className={styles.title}>AILEAN</h1>
            <button className={styles.closeButton} onClick={onClose}><X size={24} /></button>
          </div>

          <button className={styles.newChat} onClick={() => {
            createNewChat();
            if (typeof window !== 'undefined' && window.innerWidth < 1024) onClose();
          }}>
            <Plus size={18} />
            <span>Nuevo chat</span>
          </button>

          <div className={styles.historyContainer}>
            <div className={styles.historyTitle}>Historial</div>
            <ul className={styles.historyList}>
              {sessions.map((session) => (
                <li key={session.id} onClick={() => { loadSession(session.id); if (typeof window !== 'undefined' && window.innerWidth < 1024) onClose(); }}>
                  {editingId === session.id ? (
                    <div className={styles.editContainer} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className={styles.editInput}
                        autoFocus
                      />
                      <div className={styles.editActions}>
                        <Check size={16} className={styles.saveIcon} onClick={(e) => saveTitle(e, session.id)} />
                        <X size={16} className={styles.cancelIcon} onClick={cancelEditing} />
                      </div>
                    </div>
                  ) : (
                    <div className={styles.sessionItem}>
                      <span className={styles.sessionTitle}>
                        {session.id === sessionId ? <strong>{session.title || "Nuevo Chat"}</strong> : (session.title || "Nuevo Chat")}
                      </span>
                      <div className={styles.sessionActions}>
                        <Edit2 size={14} className={styles.actionIcon} onClick={(e) => { e.stopPropagation(); startEditing(e, session); }} />
                        <Trash2 size={14} className={styles.actionIcon} onClick={(e) => { e.stopPropagation(); deleteSession(e, session.id); }} />
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={styles.sidebarBottom}>
          <ul className={styles.menuList}>
            <li className={styles.menuItem} onClick={() => { router.push("/progress"); if (typeof window !== 'undefined' && window.innerWidth < 1024) onClose(); }}>
              <BarChart2 size={18} />
              <span>Progreso</span>
            </li>
            <li className={styles.menuItem}>
              <Award size={18} />
              <span>Gamificación</span>
            </li>
            <li className={styles.menuItem} onClick={() => setIsSettingsOpen(true)}>
              <Settings size={18} />
              <span>Configuración</span>
            </li>
            <li className={styles.menuItem}>
              <User size={18} />
              <span>Perfil</span>
            </li>
            <li className={styles.menuItem} onClick={handleLogout}>
              <LogOut size={18} />
              <span>Cerrar sesión</span>
            </li>
          </ul>
        </div>

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          currentPersona={currentPersona}
          onSave={savePersona}
        />
      </div>
    </>
  );
}
