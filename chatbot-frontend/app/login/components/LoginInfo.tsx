"use client";
import AvatarFollow from "./AvatarFollow";
import styles from "../styles/loginInfo.module.css";

export default function LoginInfo() {
  return (
    <div className={styles.infoSide}>
      <div className={styles.aileanText}>AILEAN</div>

      <h1 className={styles.welcomeText}>¡Bienvenido, estudiante!</h1>
      <div className={styles.avatarWrapper}>
        <AvatarFollow />
      </div>
    </div>
  );
}
