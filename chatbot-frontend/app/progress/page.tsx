"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Sidebar from "../chat/components/Sidebar";
import StatsCards from "./components/StatsCards";
import ProgressCircles from "./components/ProgressCircles";
import TimeChart from "./components/TimeChart";
import styles from "./styles/progress.module.css";

export default function ProgressPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [statsData, setStatsData] = useState({
    level: 1,
    xp: 0,
    streak: 0,
    total_time_minutes: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
    } else {
      setIsAuthorized(true);
      fetchProgress(token);
    }
  }, [router]);

  const fetchProgress = async (token: string) => {
    try {
      const res = await fetch("http://localhost:8000/api/progress/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStatsData(data);
      }
    } catch (error) {
      console.error("Error fetching progress:", error);
    }
  };

  if (!isAuthorized) {
    return null;
  }

  // Datos de ejemplo para el gráfico de barras (Placeholder set to 0)
  const dailyData = [
    { day: "Lun", time: 0, color: "#22d3ee" },
    { day: "Mar", time: 0, color: "#fb923c" },
    { day: "Mié", time: 0, color: "#fbbf24" },
    { day: "Jue", time: 0, color: "#60a5fa" },
    { day: "Vie", time: 0, color: "#a78bfa" },
    { day: "Sáb", time: 0, color: "#ec4899" },
    { day: "Dom", time: 0, color: "#f87171" },
  ];

  // Stats reales
  const stats = [
    { label: "Racha Actual", value: `${statsData.streak} días`, color: "#f97316" },
    { label: "Tiempo Total", value: `${Math.round(statsData.total_time_minutes)} min`, color: "#3b82f6" },
    { label: "Nivel Actual", value: `Nivel ${statsData.level}`, color: "#fbbf24" },
  ];

  // Datos de progreso circular (Derived from XP for now)
  const xpPercentage = statsData.xp % 100;

  const progressItems = [
    { label: "XP Progress\n(Next Level)", value: xpPercentage, color: "#22d3ee", gradient: "linear-gradient(135deg, #22d3ee, #3b82f6)" },
    // Placeholders for other metrics until we track them (Set to 0)
    { label: "Oral\nFluency", value: 0, color: "#4ade80", gradient: "linear-gradient(135deg, #4ade80, #10b981)" },
    { label: "Vocabulary\nMastery", value: 0, color: "#a78bfa", gradient: "linear-gradient(135deg, #a78bfa, #8b5cf6)" },
  ];

  return (
    <div className={styles.page}>
      <Sidebar
        sessionId={null}
        createNewChat={() => router.push('/chat')}
        loadSession={(id) => router.push(`/chat?sessionId=${id}`)}
      />
      <div className={styles.mainContent}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <button className={styles.backButton} onClick={() => router.push("/chat")}>
              <ArrowLeft size={20} />
              <span>Volver al Chat</span>
            </button>
            <h1 className={styles.pageTitle}>Progreso y Gamificación</h1>
          </div>
        </div>

        {/* Contenedor de contenido con scroll */}
        <div className={styles.contentWrapper}>
          <StatsCards stats={stats} />
          <ProgressCircles items={progressItems} />
          <TimeChart data={dailyData} />
        </div>
      </div>
    </div>
  );
}
