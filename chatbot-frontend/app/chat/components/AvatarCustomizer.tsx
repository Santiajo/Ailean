"use client";

import styles from "../css/AvatarCustomizer.module.css";

interface AvatarCustomizerProps {
  setAvatarColor: (color: string) => void;
  toggleAccessory: (accessory: "hat" | "glasses") => void;
}

const accessories = [
  { name: "Sombrero", key: "hat" as const },
  { name: "Gafas", key: "glasses" as const },
];

const colors = [
  "#6492caff",
  "#ffd0a3",
  "#a8e6cf",
  "#ffb6b9",
  "#f3eac2",
  "#c1c8e4",
];

export default function AvatarCustomizer({ setAvatarColor, toggleAccessory }: AvatarCustomizerProps) {
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Color del avatar</h3>
      <div className={styles.colorsGrid}>
        {colors.map((c) => (
          <div
            key={c}
            onClick={() => setAvatarColor(c)}
            className={styles.colorBtn}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <h3 className={styles.title}>Accesorios</h3>
      <div className={styles.accessoriesGrid}>
        {accessories.map((acc) => (
          <button
            key={acc.key}
            onClick={() => toggleAccessory(acc.key)}
            className={styles.accessoryBtn}
          >
            {acc.name}
          </button>
        ))}
      </div>
    </div>
  );
}
