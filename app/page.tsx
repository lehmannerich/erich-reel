"use client";

import { animate, hover } from "motion";
import { splitText } from "motion-plus";
import { useMotionValue } from "motion/react";
import { useEffect, useRef } from "react";
import styles from "./page.module.css";

// --- Animation Configuration Variables ---
const IDLE_TRIGGER_DURATION_MS = 100;
const IDLE_ROTATION_DEGREES = 8;
const IDLE_ANIMATION_STAGGER_MS = 40;
const IDLE_ANIMATION_SPRING_STIFFNESS = 200;
const IDLE_ANIMATION_SPRING_DAMPING = 20;

const RESET_TRIGGER_DURATION_MS = 600;
const RESET_ANIMATION_STAGGER_MS = 15;
const RESET_ANIMATION_SPRING_STIFFNESS = 150;
const RESET_ANIMATION_SPRING_DAMPING = 25;

const SCATTER_DISTANCE_FACTOR = 0.1;
const SCATTER_ANIMATION_SPRING_STIFFNESS = 100;
const SCATTER_ANIMATION_SPRING_DAMPING = 50;
// --- End of Configuration Variables ---

export default function ScatterText() {
  const containerRef = useRef<HTMLDivElement>(null);
  const velocityX = useMotionValue(0);
  const velocityY = useMotionValue(0);
  const prevEvent = useRef(0);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const charsRef = useRef<Element[]>([]);
  const isIdleAnimatingRef = useRef(false);
  const lastMouseMoveTime = useRef(0);
  const hasScatteredRef = useRef(false);

  const clearTimeouts = () => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
  };

  const startIdleDetection = () => {
    // Only start idle detection if a letter has been scattered
    if (!hasScatteredRef.current) return;

    clearTimeouts();

    idleTimeoutRef.current = setTimeout(() => {
      if (charsRef.current.length > 0) {
        isIdleAnimatingRef.current = true;
        charsRef.current.forEach((char, index) => {
          const randomRotation = (Math.random() - 0.5) * (IDLE_ROTATION_DEGREES * 2);
          const delay = index * IDLE_ANIMATION_STAGGER_MS;

          animate(
            char,
            { rotate: randomRotation },
            {
              type: "spring",
              stiffness: IDLE_ANIMATION_SPRING_STIFFNESS,
              damping: IDLE_ANIMATION_SPRING_DAMPING,
              delay: delay / 1000,
            }
          );
        });

        resetTimeoutRef.current = setTimeout(() => {
          if (isIdleAnimatingRef.current) {
            charsRef.current.forEach((char, index) => {
              const delay = index * RESET_ANIMATION_STAGGER_MS;
              animate(
                char,
                { x: 0, y: 0, rotate: 0 },
                {
                  type: "spring",
                  stiffness: RESET_ANIMATION_SPRING_STIFFNESS,
                  damping: RESET_ANIMATION_SPRING_DAMPING,
                  delay: delay / 1000,
                }
              );
            });
            isIdleAnimatingRef.current = false;
            hasScatteredRef.current = false; // Reset the flag after animation completes
          }
        }, RESET_TRIGGER_DURATION_MS);
      }
    }, IDLE_TRIGGER_DURATION_MS);
  };

  const resetIdleState = () => {
    clearTimeouts();
    isIdleAnimatingRef.current = false;
    startIdleDetection();
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const h1Element = containerRef.current.querySelector("h1");
    if (!h1Element) return;

    const { chars } = splitText(h1Element);
    charsRef.current = chars;

    // Throttled mouse move handler for better performance
    const handlePointerMove = (event: PointerEvent) => {
      const now = performance.now();

      // Throttle to ~60fps max
      if (now - lastMouseMoveTime.current < 16) return;
      lastMouseMoveTime.current = now;

      const timeSinceLastEvent = (now - prevEvent.current) / 1000;
      prevEvent.current = now;

      // Use requestAnimationFrame for smooth velocity updates
      requestAnimationFrame(() => {
        velocityX.set(event.movementX / timeSinceLastEvent);
        velocityY.set(event.movementY / timeSinceLastEvent);
      });

      // Only reset idle state if we've scattered before
      if (hasScatteredRef.current) {
        resetIdleState();
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearTimeouts();
      } else {
        // Use requestAnimationFrame to avoid blocking
        requestAnimationFrame(() => {
          // Only reset if we've scattered before
          if (hasScatteredRef.current) {
            resetIdleState();
          }
        });
      }
    };

    document.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    hover(chars, (element) => {
      // Mark that we've scattered at least once
      hasScatteredRef.current = true;
      resetIdleState();

      const speed = Math.sqrt(
        velocityX.get() * velocityX.get() + velocityY.get() * velocityY.get()
      );
      const angle = Math.atan2(velocityY.get(), velocityX.get());
      const distance = speed * SCATTER_DISTANCE_FACTOR;

      animate(
        element,
        {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
        },
        {
          type: "spring",
          stiffness: SCATTER_ANIMATION_SPRING_STIFFNESS,
          damping: SCATTER_ANIMATION_SPRING_DAMPING,
        }
      );
    });

    // Don't start idle detection immediately anymore
    // startIdleDetection();

    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearTimeouts();
    };
  }, []);

  return (
    <div className={styles.pageContainer} ref={containerRef}>
      <h1 className={styles.h1}>All the reasons I'd be great at OpenAI.</h1>
      <Stylesheet />
    </div>
  );
}

function Stylesheet() {
  return (
    <style>{`
            .split-char {
                will-change: transform, opacity;
                color: #000000;
                display: inline-block;
            }
        `}</style>
  );
}
