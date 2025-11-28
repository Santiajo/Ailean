// FloatingAvatar.tsx
"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import styles from "../css/FloatingAvatar.module.css";

interface FloatingAvatarProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isTalking?: boolean;
  color?: string;
  accessories?: {
    hat?: boolean;
    glasses?: boolean;
  };
}

export default function FloatingAvatar({
  containerRef,
  isTalking = false,
  color = "#7ab6ff",
  accessories = {},
}: FloatingAvatarProps) {
  const AVATAR_SIZE = 250;
  const MARGIN = 12;

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [bounds, setBounds] = useState({ left: 0, top: 0, width: 0, height: 0 });

  // Expresiones
  const mouthFrames = [
    "/avatar/expresion/boca/boca-abierta1.png",
    "/avatar/expresion/boca/boca-abierta2.png",
    "/avatar/expresion/boca/boca-neutral.png",
  ];
  const eyeFrames = [
    "/avatar/expresion/ojos/ojos-abiertos.png",
    "/avatar/expresion/ojos/ojos-cerrados.png",
  ];

  const [mouthIndex, setMouthIndex] = useState(2); // boca neutral
  const [eyeIndex, setEyeIndex] = useState(0); // ojos abiertos

  // Animación de boca
  useEffect(() => {
    let interval: number;
    if (isTalking) {
      interval = window.setInterval(() => {
        setMouthIndex((prev) => (prev + 1) % mouthFrames.length);
      }, 250);
    } else {
      setMouthIndex(2);
    }
    return () => clearInterval(interval);
  }, [isTalking]);

  // Parpadeo
  useEffect(() => {
    let blinkTimeout: NodeJS.Timeout;

    const blink = () => {
      setEyeIndex(1);
      setTimeout(() => {
        setEyeIndex(0);
        scheduleBlink();
      }, 150);
    };

    const scheduleBlink = () => {
      const interval = 3000 + Math.random() * 2000;
      blinkTimeout = setTimeout(blink, interval);
    };

    scheduleBlink();
    return () => clearTimeout(blinkTimeout);
  }, []);

  useEffect(() => {
    const updateBounds = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setBounds(rect);
        setPosition({
          x: rect.width / 2 - AVATAR_SIZE / 2,
          y: MARGIN,
        });
      }
    };
    updateBounds();
    window.addEventListener("resize", updateBounds);
    return () => window.removeEventListener("resize", updateBounds);
  }, [containerRef]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const minX = MARGIN;
      const minY = MARGIN;
      const maxX = bounds.width - AVATAR_SIZE - MARGIN;
      const maxY = bounds.height - AVATAR_SIZE - MARGIN;

      let newX = e.clientX - offset.x - bounds.left;
      let newY = e.clientY - offset.y - bounds.top;
      newX = Math.min(Math.max(newX, minX), maxX);
      newY = Math.min(Math.max(newY, minY), maxY);

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, offset, bounds]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setOffset({
      x: e.clientX - position.x - bounds.left,
      y: e.clientY - position.y - bounds.top,
    });
  };

  return (
    <motion.div
      className={styles.floatingAvatar}
      onMouseDown={handleMouseDown}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
    >
      <div className={styles.avatarBody}>
        {/* Capa de color base */}
        <div className={styles.colorLayer} style={{ backgroundColor: color }}></div>

        <Image
          src="/avatar/base/body.png"
          alt="Avatar"
          fill
          className={styles.base}
          draggable={false}
        />

        {/* Ojos */}
        <Image
          src={eyeFrames[eyeIndex]}
          alt="Ojos"
          fill
          className={styles.expression}
          draggable={false}
        />

        {/* Boca */}
        <Image
          src={mouthFrames[mouthIndex]}
          alt="Boca"
          fill
          className={styles.expression}
          draggable={false}
        />

        {/* Accesorios */}
        {accessories.hat && (
          <Image
            src="/avatar/accesorios/sombrero1.png"
            alt="Sombrero"
            width={AVATAR_SIZE * 0.8}
            height={(AVATAR_SIZE * 0.8) * (80 / 150)}
            className={styles.hat}
            draggable={false}
          />
        )}
        {accessories.glasses && (
          <Image
            src="/avatar/accesorios/lentes1.png"
            alt="Gafas"
            width={250}
            height={250}
            className={styles.accessory}
            draggable={false}
          />
        )}
      </div>
    </motion.div>
  );
}
