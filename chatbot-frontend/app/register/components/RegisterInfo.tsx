"use client";

import AvatarFollow from "../../login/components/AvatarFollow";
import styles from "../styles/registerInfo.module.css";

export default function RegisterInfo() {
  return (
    <div className={styles.infoSide}>
      <div className={styles.aileanText}>AILEAN</div>
      <h1 className={styles.welcomeText}>Crea tu cuenta</h1>
      <div className={styles.avatarWrapper}>
        <AvatarFollow />
      </div>
    </div>
  );
}