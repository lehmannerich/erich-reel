"use client";

import { animate, hover } from "motion";
import { splitText } from "motion-plus";
import { useMotionValue } from "motion/react";
import Image from "next/image";
import { useEffect, useRef } from "react";
import styles from "./page.module.css";

// --- Layout Configuration Variables ---
const TWEET_SECTION_HEIGHT_VH = 80; // Height of each tweet section as percentage of viewport height

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
        headline="I didn't just send you my resume."
        bodyText="Instead, I vibe coded this site. I mean who does that?"
      />
      <TweetSection
        number=""
        headline="Oh, btw... this is me."
        bodyText="I'm the one on the left."
        imageUrl="/meandtheo.jpeg"
      />
      <TweetSection
        number="2"
        headline="I'm good at sales."
        bodyText="In 2023, I started a new company from nothing and closed over €400k of sales volume in just the first year. I mainly sold to startups and the average deal size was €20k."
      />
      <TweetSection
        number="3"
        headline="Like, really good at sales."
        bodyText="In 2020, I co-founded a company for virtual events and within 2 years I closed over €1M worth of sales volume. I was solely responsible for the sales pipeline and every deal we closed. These weren't easy deals, since we were selling to some of the most renowned research institutions in the world."
      />
      <TweetSection
        number="4"
        headline="Sales is not just sales."
        bodyText="Since I had to start from scratch every time, I'm apt adjusting and evolving the deal structure as we evolve our understanding of the market and customer needs."
      />
      <TweetSection
        number="5"
        headline="I'm a founder and a YC alumnus"
        bodyText="So I understand product, I understand the technical details and I can work in a high pressure, high stakes environment."
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
            hasScatteredRef.current = false;
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
    const handlePointerMove = (event: PointerEvent) => {
      const now = performance.now();
      if (now - lastMouseMoveTime.current < 16) return;
      lastMouseMoveTime.current = now;
      const timeSinceLastEvent = (now - prevEvent.current) / 1000;
      prevEvent.current = now;
      requestAnimationFrame(() => {
        velocityX.set(event.movementX / timeSinceLastEvent);
        velocityY.set(event.movementY / timeSinceLastEvent);
      });
      if (hasScatteredRef.current) {
        resetIdleState();
      }
    };
    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearTimeouts();
      } else {
        requestAnimationFrame(() => {
          if (hasScatteredRef.current) {
            resetIdleState();
          }
        });
      }
    };
    document.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    hover(chars, (element) => {
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
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearTimeouts();
    };
  }, []);

  return (
    <div className={styles.pageContainer} ref={containerRef}>
      <h1 className={styles.h1}>18 reasons I'd be great at OpenAI.</h1>
      <div className={styles.scrollIndicator}>
        <div className={styles.scrollChevron}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
          </svg>
        </div>
        <span className={styles.scrollText}>scroll</span>
      </div>
      <Stylesheet />
    </div>
  );
}

interface TweetSectionProps {
  number: string;
  headline: string;
  bodyText?: string;
  imageUrl?: string;
}

function TweetSection({ number, headline, bodyText, imageUrl }: TweetSectionProps) {
  return (
    <div
      className={styles.tweetSection}
      style={{ minHeight: `${TWEET_SECTION_HEIGHT_VH}vh` }}
    >
      <div className={styles.tweetCard}>
        <div className={styles.tweetBody}>
          <h2 className={styles.tweetHeadline}>
            {number && <span className={styles.tweetNumber}>{number}.</span>} {headline}
          </h2>
          {bodyText && <p className={styles.tweetLoremIpsum}>{bodyText}</p>}
          {imageUrl && (
            <div className={styles.tweetImageContainer}>
              <Image
                src={imageUrl}
                alt={headline}
                width={600}
                height={400}
                style={{ objectFit: "cover", borderRadius: "12px" }}
              />
            </div>
          )}
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
