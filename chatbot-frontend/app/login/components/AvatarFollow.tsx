"use client";
import { useEffect, useRef, useState } from "react";
import styles from "../styles/avatarFollow.module.css";

export default function AvatarFollow() {
  const [eyePos, setEyePos] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);
  const [avatarAngle, setAvatarAngle] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  const [bubblePos] = useState({ top: 60, left: 80 });

  // SEGUIMIENTO OJOS
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!avatarRef.current) return;

      const rect = avatarRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;

      setEyePos({ x: dx * 0.03, y: dy * 0.03 });

      const angle = (dx / rect.width) * 2;
      setAvatarAngle(prevAngle => prevAngle + (angle - prevAngle) * 0.1);
    };

    const handleMouseOut = (e: MouseEvent) => {
      if (!e.relatedTarget) {
        setEyePos({ x: 0, y: 0 });
        setAvatarAngle(0);
        setIsHovered(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseout", handleMouseOut);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseout", handleMouseOut);
    };
  }, []);

  // PARPADEO AUTOMÁTICO
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const blink = () => {
      setIsBlinking(true);

      setTimeout(() => {
        setIsBlinking(false);

        timeoutId = setTimeout(blink, Math.random() * 3000 + 3500);
      }, 120);
    };

    timeoutId = setTimeout(blink, 4000);

    return () => clearTimeout(timeoutId);
  }, []);

  const shadowX = -eyePos.x * 0.1;
  const shadowY = -eyePos.y * 0.1;

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);


  return (
    <div
      className={styles.avatarContainer}
      ref={avatarRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Cuerpo fijo */}
      <div className={styles.avatarBodyContainer}>
        <img
          src="/avatar/base/solo-cuerpo.png"
          alt="Cuerpo del avatar"
          className={styles.avatarBody}
        />
      </div>

      {/* Cabeza (con inclinación) */}
      <div
        className={styles.avatarHead}
        style={{
          transform: `rotate(${avatarAngle}deg)`,
          transition: "transform 0.3s ease-out",
        }}
      >
        {/* Cabeza */}
        <img
          src="/avatar/base/solo-rostro.png"
          alt="Cabeza del avatar"
          className={styles.avatarHeadImage}
        />

        {/* Ojo Izquierdo */}
        <img
          src={
            isHovered
              ? "/avatar/expresion/ojos/ojo-izquierdo-feliz.png"
              : isBlinking
              ? "/avatar/expresion/ojos/ojo-izquierdo-cerrado-login.png"
              : "/avatar/expresion/ojos/ojo-izquierdo-abierto-login.png"
          }
          alt="Ojo izquierdo"
          className={styles.avatarEye}
          style={{
            transform: `translate(${eyePos.x}px, ${eyePos.y}px)`,
            filter: `drop-shadow(${shadowX}px ${shadowY}px 3px rgba(0,0,0,0.25))`,
            top: "195px",
            left: "110px",
          }}
        />

        {/* Ojo Derecho */}
        <img
          src={
            isHovered
              ? "/avatar/expresion/ojos/ojo-derecho-feliz.png"
              : isBlinking
              ? "/avatar/expresion/ojos/ojo-derecho-cerrado-login.png"
              : "/avatar/expresion/ojos/ojo-derecho-abierto-login.png"
          }
          alt="Ojo derecho"
          className={styles.avatarEye}
          style={{
            transform: `translate(${eyePos.x}px, ${eyePos.y}px)`,
            filter: `drop-shadow(${shadowX}px ${shadowY}px 3px rgba(0,0,0,0.25))`,
            top: "195px",
            left: "272px",
          }}
        />

      </div>

      {/* Burbuja de mensaje */}
      {isHovered && (
        <div
          className={styles.messageBubble}
          style={{
            top: `${bubblePos.top}px`, 
            left: `${bubblePos.left}px`,
          }}
        >
          ¡Practiquemos inglés juntos!
        </div>
      )}

    </div>
  );
}
