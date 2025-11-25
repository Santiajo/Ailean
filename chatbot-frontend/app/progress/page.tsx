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

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  if (!isAuthorized) {
    return null;
  }

  // Datos de ejemplo para el gráfico de barras 
  const dailyData = [
    { day: "Lun", time: 35, color: "#22d3ee" },
    { day: "Mar", time: 25, color: "#fb923c" },
    { day: "Mié", time: 38, color: "#fbbf24" },
    { day: "Jue", time: 20, color: "#60a5fa" },
    { day: "Vie", time: 15, color: "#a78bfa" },
    { day: "Sáb", time: 45, color: "#ec4899" },
    { day: "Dom", time: 50, color: "#f87171" },
    { day: "Lun", time: 55, color: "#4ade80" },
    { day: "Mar", time: 30, color: "#22d3ee" },
  ];

  const maxTime = Math.max(...dailyData.map((d) => d.time));

  // Stats rápidas
  const stats = [
    { label: "Racha Actual", value: "12 días", color: "#f97316" },
    { label: "Tiempo Total", value: "24.5 hrs", color: "#3b82f6" },
    { label: "Nivel Actual", value: "Intermedio", color: "#fbbf24" },
  ];

  // Datos de progreso circular
  const progressItems = [
    { label: "Grammatical\nProgression", value: 75, color: "#22d3ee", gradient: "linear-gradient(135deg, #22d3ee, #3b82f6)" },
    { label: "Oral\nProgression", value: 60, color: "#4ade80", gradient: "linear-gradient(135deg, #4ade80, #10b981)" },
    { label: "Comprehension\nand Expression\nProgression", value: 85, color: "#a78bfa", gradient: "linear-gradient(135deg, #a78bfa, #8b5cf6)" },
  ];

  return (
    <div className={styles.page}>
      <Sidebar />
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
