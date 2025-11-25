"use client";
import styles from "../styles/timeChart.module.css";

interface DailyData {
  day: string;
  time: number;
  color: string;
}

interface TimeChartProps {
  data: DailyData[];
}

export default function TimeChart({ data }: TimeChartProps) {
  const maxTime = Math.max(...data.map((d) => d.time));

  return (
    <div className={styles.chartSection}>
      <div className={styles.chartHeader}>
        <h2 className={styles.chartTitle}>Time by day</h2>
        <div className={styles.chartSubtitle}>Últimos 9 días de actividad</div>
      </div>
      <div className={styles.chartContainer}>
        <div className={styles.yAxisLabel}>Time</div>
        <div className={styles.yAxis}>
          <span>50m</span>
          <span>40m</span>
          <span>30m</span>
          <span>20m</span>
          <span>10m</span>
          <span>0</span>
        </div>
        <div className={styles.chart}>
          {data.map((item, idx) => (
            <div key={idx} className={styles.barWrapper}>
              <div
                className={styles.bar}
                style={{
                  height: `${(item.time / maxTime) * 100}%`,
                  background: `linear-gradient(180deg, ${item.color}, ${item.color}dd)`,
                  animationDelay: `${0.8 + idx * 0.05}s`,
                }}
                data-time={`${item.time}m`}
              />
              <span className={styles.barLabel}>{item.day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
