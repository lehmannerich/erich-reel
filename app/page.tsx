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

export default function Home() {
  return (
    <>
      <ScatterText />
      <TweetSection
        number="1"
        content="I vibe coded this crazy reel. I mean who does that?"
      />
    </>
  );
}

function ScatterText() {
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

function TweetSection({ number, content }: { number: string; content: string }) {
  return (
    <div className={styles.tweetSection}>
      <div className={styles.tweetCard}>
        <div className={styles.tweetHeader}>
          <div className={styles.profilePicture}>
            <div className={styles.profilePicturePlaceholder}>E</div>
          </div>
          <div className={styles.tweetMeta}>
            <div className={styles.nameRow}>
              <span className={styles.displayName}>Erich Lehmann</span>
              <svg
                className={styles.verifiedBadge}
                viewBox="0 0 22 22"
                aria-label="Verified account"
              >
                <path
                  fill="#1d9bf0"
                  d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
                />
              </svg>
              <span className={styles.handle}>@erichlehmann</span>
              <span className={styles.dot}>·</span>
              <span className={styles.timestamp}>now</span>
            </div>
          </div>
          <div className={styles.moreButton}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <g>
                <path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"></path>
              </g>
            </svg>
          </div>
        </div>
        <div className={styles.tweetBody}>
          <p className={styles.tweetText}>
            <span className={styles.tweetNumber}>{number}.</span> {content}
          </p>
        </div>
        <div className={styles.tweetFooter}>
          <div className={styles.tweetAction}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <g>
                <path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"></path>
              </g>
            </svg>
            <span>42</span>
          </div>
          <div className={styles.tweetAction}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <g>
                <path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"></path>
              </g>
            </svg>
            <span>1.2K</span>
          </div>
          <div className={styles.tweetAction}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <g>
                <path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"></path>
              </g>
            </svg>
            <span>18.5K</span>
          </div>
          <div className={styles.tweetAction}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <g>
                <path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z"></path>
              </g>
            </svg>
            <span>28</span>
          </div>
          <div className={styles.tweetAction}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <g>
                <path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5c0 .28.22.5.5.5h12.98c.28 0 .5-.22.5-.5L19 15h2z"></path>
              </g>
            </svg>
          </div>
        </div>
      </div>
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
