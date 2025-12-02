"use client";
import { useState, useEffect } from "react";
import { MessageSquare, Plus, Settings, LogOut, BarChart2, User, Award, Trash2, Edit2, X, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "../css/Sidebar.module.css";

interface SidebarProps {
  sessionId: number | null;
  loadSession: (id: number) => void;
  createNewChat: () => void;
}

export default function Sidebar({ sessionId, loadSession, createNewChat }: SidebarProps) {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    fetchSessions();
  }, [sessionId]);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const res = await fetch("http://localhost:8000/api/sessions/", {
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
    if (!confirm("Are you sure you want to delete this chat?")) return;

    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`http://localhost:8000/api/sessions/${id}/`, {
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
      const res = await fetch(`http://localhost:8000/api/sessions/${id}/`, {
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
    <div className={styles.sidebar}>
      {/* Top Section */}
      <div className={styles.sidebarTop}>
        <h1 className={styles.title}>AILEAN</h1>

        <button className={styles.newChat} onClick={() => {
          console.log("New Chat button clicked");
          createNewChat();
        }}>
          <Plus size={18} />
          New chat
        </button>

        <div className={styles.historyTitle}>History</div>
        <ul className={styles.historyList}>
          {sessions.map((session) => (
            <li
              key={session.id}
              onClick={() => loadSession(session.id)}
              style={{
                backgroundColor: sessionId === session.id ? '#1e293b' : 'transparent',
                color: sessionId === session.id ? '#3b82f6' : 'inherit',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingRight: '8px'
              }}
            >
              {editingId === session.id ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', width: '100%' }}>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      background: '#334155',
                      border: 'none',
                      color: 'white',
                      borderRadius: '4px',
                      padding: '2px 4px',
                      width: '100%'
                    }}
                  />
                  <Check size={14} className={styles.actionIcon} onClick={(e) => saveTitle(e, session.id)} />
                  <X size={14} className={styles.actionIcon} onClick={cancelEditing} />
                </div>
              ) : (
                <>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                    {session.title}
                  </span>
                  <div className={styles.actions} style={{ display: 'flex', gap: '5px' }}>
                    <Edit2 size={14} className={styles.actionIcon} onClick={(e) => startEditing(e, session)} />
                    <Trash2 size={14} className={styles.actionIcon} onClick={(e) => deleteSession(e, session.id)} />
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom Section */}
      <div className={styles.sidebarBottom}>
        <ul className={styles.menuList}>
          <li className={styles.menuItem} onClick={() => router.push("/progress")}>
            <BarChart2 size={18} />
            <span>Progress</span>
          </li>
          <li className={styles.menuItem}>
            <Award size={18} />
            <span>Gamification</span>
          </li>
          <li className={styles.menuItem}>
            <Settings size={18} />
            <span>Settings</span>
          </li>
          <li className={styles.menuItem}>
            <User size={18} />
            <span>Profile</span>
          </li>
          <li className={styles.menuItem} onClick={handleLogout}>
            <LogOut size={18} />
            <span>Log out</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
