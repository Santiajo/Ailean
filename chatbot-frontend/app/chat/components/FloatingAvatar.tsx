// FloatingAvatar.tsx
"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import styles from "../css/FloatingAvatar.module.css";

interface FloatingAvatarProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isTalking?: boolean;
  analyser?: AnalyserNode | null;
  color?: string;
  accessories?: {
    hat?: boolean;
    glasses?: boolean;
  };
}

export default function FloatingAvatar({
  containerRef,
  isTalking = false,
  analyser = null,
  color = "#7ab6ff",
  accessories = {},
}: FloatingAvatarProps) {
  const [avatarSize, setAvatarSize] = useState(250);
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

  // Animación de boca (Audio Driven or Fallback)
  useEffect(() => {
    let animationFrameId: number;
    let intervalId: number;

    // Config for sensitivity
    const bufferLength = 256;
    const dataArray = new Uint8Array(bufferLength);

    const updateMouth = () => {
      if (!analyser) return;

      try {
        analyser.getByteFrequencyData(dataArray);

        // Calculate average volume
        let sum = 0;
        // Focus on lower frequencies for speech
        const speechRangeFn = Math.floor(bufferLength * 0.5);
        for (let i = 0; i < speechRangeFn; i++) {
          sum += dataArray[i];
        }
        const average = sum / speechRangeFn;

        // Map average volume (0-255) to mouth frames
        // Thresholds need tuning.
        if (average < 10) {
          setMouthIndex(2); // Neutral (Closed)
        } else if (average < 50) {
          setMouthIndex(0); // Open 1 (Small)
        } else {
          setMouthIndex(1); // Open 2 (Big)
        }

        animationFrameId = requestAnimationFrame(updateMouth);
      } catch (e) {
        // If analyser is disconnected/error
        // Fallback handled by isTalking logic below or cleanup
        console.warn("Analyser error", e);
      }
    };

    if (analyser) {
      updateMouth();
    } else if (isTalking) {
      // Fallback: Simple Loop
      intervalId = window.setInterval(() => {
        setMouthIndex((prev) => {
          if (prev === 2) return 0;
          if (prev === 0) return 1;
          return 2;
        });
      }, 150); // Faster than 250ms for snappier feel
    } else {
      setMouthIndex(2);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [isTalking, analyser]);

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
    const updateBoundsAndSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setBounds(rect);

        // Responsive Size
        const isMobile = window.innerWidth < 768;
        const newSize = isMobile ? 180 : 250;
        setAvatarSize(newSize);

        setPosition({
          x: rect.width / 2 - newSize / 2,
          y: MARGIN,
        });
      }
    };
    updateBoundsAndSize();
    window.addEventListener("resize", updateBoundsAndSize);
    return () => window.removeEventListener("resize", updateBoundsAndSize);
  }, [containerRef]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const minX = MARGIN;
      const minY = MARGIN;
      const maxX = bounds.width - avatarSize - MARGIN;
      const maxY = bounds.height - avatarSize - MARGIN;

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
  }, [isDragging, offset, bounds, avatarSize]);

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
      style={{ width: avatarSize, height: avatarSize }}
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
            width={avatarSize * 0.8}
            height={(avatarSize * 0.8) * (80 / 150)}
            className={styles.hat}
            draggable={false}
          />
        )}
        {accessories.glasses && (
          <Image
            src="/avatar/accesorios/lentes1.png"
            alt="Gafas"
            width={avatarSize}
            height={avatarSize}
            className={styles.accessory}
            draggable={false}
          />
        )}
      </div>
    </motion.div>
  );
}
