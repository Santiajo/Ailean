// Sidebar.tsx
"use client";
import { Plus, Settings, Award, User, BarChart2 } from "lucide-react";
import styles from "../css/Sidebar.module.css";

interface SidebarProps {
  children?: React.ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
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
          <li className={styles.menuItem}>
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
        </ul>
      </div>
    </div>
  );
}
