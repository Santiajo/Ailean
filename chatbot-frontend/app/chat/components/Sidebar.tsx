// Sidebar.tsx
"use client";
import { Plus, Settings, Award, User, BarChart2, LogOut } from "lucide-react";
import styles from "../css/Sidebar.module.css";
import { useRouter } from "next/navigation";

interface SidebarProps {
  children?: React.ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
  const router = useRouter();

  const handleLogout = () => {
    // Eliminar tokens de localStorage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    // Redirigir al login
    router.push("/login");
  };

  return (
    <div className={styles.sidebar}>
      {/* Parte superior */}
      <div className={styles.sidebarTop}>
        <h1 className={styles.title}>AILEAN</h1>

        <button className={styles.newChat}>
          <Plus size={18} />
          Nuevo chat
        </button>

        <div className={styles.historyTitle}>Historial</div>
        <ul className={styles.historyList}>
          <li>Chat 1</li>
          <li>Chat 2</li>
        </ul>
      </div>

      
      {children}

      {/* Parte inferior */}
      <div className={styles.sidebarBottom}>
        <ul className={styles.menuList}>
          <li className={styles.menuItem} onClick={() => router.push("/progress")}>
            <BarChart2 size={18} />
            <span>Progreso</span>
          </li>
          <li className={styles.menuItem}>
            <Award size={18} />
            <span>Gamificación</span>
          </li>
          <li className={styles.menuItem}>
            <Settings size={18} />
            <span>Configuración</span>
          </li>
          <li className={styles.menuItem}>
            <User size={18} />
            <span>Perfil</span>
          </li>
          <li className={`${styles.menuItem} ${styles.logoutItem}`} onClick={handleLogout}>
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
