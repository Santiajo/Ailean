"use client";
import styles from "../styles/statsCards.module.css";

interface Stat {
  label: string;
  value: string;
  color: string;
}

interface StatsCardsProps {
  stats: Stat[];
}

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className={styles.statsGrid}>
      {stats.map((stat, idx) => (
        <div key={idx} className={styles.statCard} style={{ animationDelay: `${idx * 0.1}s` }}>
          <div className={styles.statContent}>
            <div className={styles.statValue} style={{ color: stat.color }}>
              {stat.value}
            </div>
            <div className={styles.statLabel}>{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
