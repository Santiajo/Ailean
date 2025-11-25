"use client";
import styles from "../styles/progressCircles.module.css";

interface ProgressItem {
  label: string;
  value: number;
  color: string;
  gradient: string;
}

interface ProgressCirclesProps {
  items: ProgressItem[];
}

export default function ProgressCircles({ items }: ProgressCirclesProps) {
  return (
    <div className={styles.progressCircles}>
      {items.map((item, idx) => (
        <div key={idx} className={styles.circleCard} style={{ animationDelay: `${0.3 + idx * 0.15}s` }}>
          <div className={styles.circleContainer}>
            <svg width="180" height="180" viewBox="0 0 180 180">
              <defs>
                <linearGradient id={`gradient-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={item.color} stopOpacity="0.8" />
                  <stop offset="100%" stopColor={item.color} stopOpacity="1" />
                </linearGradient>
              </defs>
              <circle
                cx="90"
                cy="90"
                r="75"
                fill="none"
                stroke="#1e293b"
                strokeWidth="14"
              />
              <circle
                cx="90"
                cy="90"
                r="75"
                fill="none"
                stroke={`url(#gradient-${idx})`}
                strokeWidth="14"
                strokeDasharray={`${2 * Math.PI * 75}`}
                strokeDashoffset={`${2 * Math.PI * 75 * (1 - item.value / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 90 90)"
                className={styles.progressCircle}
              />
            </svg>
            <div className={styles.circlePercentage}>
              <span className={styles.percentValue}>{item.value}</span>
              <span className={styles.percentSign}>%</span>
            </div>
          </div>
          <div className={styles.circleLabel}>
            {item.label.split("\n").map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
