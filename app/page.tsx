"use client";

import { motion } from "framer-motion";
import { splitText } from "motion-plus";
import { animate, AnimatePresence, hover, useMotionValue, wrap } from "motion/react";
import Image from "next/image";
import { forwardRef, useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

// --- Layout Configuration Variables ---
const TWEET_SECTION_HEIGHT_VH = 60; // Height of each tweet section as percentage of viewport height

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

// --- Highlight Configuration Variables ---
const HIGHLIGHT_INTERACTION_THRESHOLD = 0.75; // 75% of the element must be visible
const HIGHLIGHT_DELAY_MS = 1000; // 1 second delay

// --- Logo Carousel Configuration Variables ---
// Default (slower) timings
const LOGO_CAROUSEL_STAMP_APPEAR_DELAY_MS_DEFAULT = 700;
const LOGO_CAROUSEL_STAMP_VISIBLE_DURATION_MS_DEFAULT = 600;

// Faster timings for the second carousel
const LOGO_CAROUSEL_STAMP_APPEAR_DELAY_MS_FAST = 400; // Faster
const LOGO_CAROUSEL_STAMP_VISIBLE_DURATION_MS_FAST = 350; // Faster

// Desktop sizes (global for all carousels)
const LOGO_CAROUSEL_HEIGHT_DESKTOP_PX = 120;
const LOGO_MAX_WIDTH_DESKTOP_PERCENT = 70;
const LOGO_MAX_HEIGHT_DESKTOP_PERCENT = 70;
const STAMP_MAX_WIDTH_DESKTOP_PERCENT = 50;
const STAMP_MAX_HEIGHT_DESKTOP_PERCENT = 50;

// Mobile sizes (global for all carousels)
const LOGO_CAROUSEL_HEIGHT_MOBILE_PX = 100;
const LOGO_MAX_WIDTH_MOBILE_PERCENT = 85;
const LOGO_MAX_HEIGHT_MOBILE_PERCENT = 85;
const STAMP_MAX_WIDTH_MOBILE_PERCENT = 60;
const STAMP_MAX_HEIGHT_MOBILE_PERCENT = 60;
// --- End of Configuration Variables ---

export default function Home() {
  let visibleTweetCounter = 0;
  return (
    <>
      <ScatterText />
      {tweetData.map((tweet, index) => {
        let displayTweetNumber = "";
        if (tweet.number !== "") {
          visibleTweetCounter++;
          displayTweetNumber = visibleTweetCounter.toString();
        }
        const tweetWithAutoNumber = { ...tweet, number: displayTweetNumber };
        return <TweetSection key={index} {...tweetWithAutoNumber} />;
      })}
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
    console.log(
      "%cHa! I had a feeling you might check out the console. Great minds think alike ;)",
      "color: black; font-size: 1.8em; font-weight: bold; padding: 5px;"
    );
    console.log("");

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
      <h1 className={styles.h1}>15 reasons I'd be great at OpenAI.</h1>
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
  linkText?: string;
  linkUrl?: string;
  checklistItems?: string[];
  logoCarouselItems?: string[];
  carouselStampAppearDelayMs?: number;
  carouselStampVisibleDurationMs?: number;
  highlightPhraseInBody?: string;
}

function TweetSection({
  number,
  headline,
  bodyText,
  imageUrl,
  linkText,
  linkUrl,
  checklistItems,
  logoCarouselItems,
  carouselStampAppearDelayMs,
  carouselStampVisibleDurationMs,
  highlightPhraseInBody,
}: TweetSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isWordHighlighted, setIsWordHighlighted] = useState(false);
  const hasBeenHighlightedRef = useRef(false);

  useEffect(() => {
    if (headline !== "Like, *really* good at sales." || !sectionRef.current) {
      return;
    }
    const currentSectionRef = sectionRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          entry.isIntersecting &&
          entry.intersectionRatio >= HIGHLIGHT_INTERACTION_THRESHOLD
        ) {
          if (!hasBeenHighlightedRef.current && !timerRef.current) {
            timerRef.current = setTimeout(() => {
              if (!hasBeenHighlightedRef.current) {
                setIsWordHighlighted(true);
                hasBeenHighlightedRef.current = true;
                observer.unobserve(currentSectionRef);
              }
            }, HIGHLIGHT_DELAY_MS);
          }
        } else {
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
        }
      },
      { threshold: HIGHLIGHT_INTERACTION_THRESHOLD }
    );
    observer.observe(currentSectionRef);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      observer.disconnect();
    };
  }, [headline]);

  const renderHeadline = () => {
    if (headline.includes("*")) {
      const parts = headline.split("*");
      const wordToStyle = parts[1];

      if (headline === "Like, *really* good at sales.") {
        return (
          <>
            {parts[0]}
            <span className={styles.highlightContainer}>
              {wordToStyle}
              {isWordHighlighted && (
                <motion.span
                  className={styles.animatedMarker}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              )}
            </span>
            {parts[2]}
          </>
        );
      } else {
        return (
          <>
            {parts[0]}
            <span className={styles.underlineText}>{wordToStyle}</span>
            {parts[2]}
          </>
        );
      }
    }
    return headline;
  };

  const renderContactLink = (line: string) => {
    if (line.includes("@")) {
      return (
        <a href={`mailto:${line}`} className={styles.contactLinkItem}>
          {line}
        </a>
      );
    }
    if (line.startsWith("+") && /[0-9]/.test(line)) {
      return (
        <a href={`tel:${line.replace(/\s/g, "")}`} className={styles.contactLinkItem}>
          {line}
        </a>
      );
    }
    if (line.includes(".") && !line.startsWith("http")) {
      return (
        <a
          href={`https://${line}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.contactLinkItem}
        >
          {line}
        </a>
      );
    }
    if (line.startsWith("http")) {
      return (
        <a
          href={line}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.contactLinkItem}
        >
          {line}
        </a>
      );
    }
    return <span className={styles.contactTextItem}>{line}</span>;
  };

  const renderHighlightedBodyText = (text: string, phrase: string) => {
    if (!phrase || !text.includes(phrase)) {
      return text;
    }
    const parts = text.split(new RegExp(`(${phrase})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === phrase.toLowerCase() ? (
        <span key={index} className={styles.bodyTextHighlight}>
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div
      className={styles.tweetSection}
      ref={headline === "Like, *really* good at sales." ? sectionRef : null}
    >
      <div className={styles.tweetCard}>
        <div className={styles.tweetBody}>
          {number && <p className={styles.tweetNumber}>{number}.</p>}
          <h2 className={styles.tweetHeadline}>{renderHeadline()}</h2>

          {headline === "Get in Touch" && bodyText ? (
            <div className={styles.contactList}>
              {bodyText.split("\n").map((line, index) => (
                <p key={index} className={styles.contactListItem}>
                  {renderContactLink(line.trim())}
                </p>
              ))}
            </div>
          ) : bodyText ? (
            bodyText.split("\n\n").map((paragraph, index) => (
              <p key={index} className={styles.tweetBodyParagraph}>
                {highlightPhraseInBody
                  ? renderHighlightedBodyText(paragraph, highlightPhraseInBody)
                  : paragraph}
              </p>
            ))
          ) : null}

          {logoCarouselItems && logoCarouselItems.length > 0 && (
            <div className={styles.logoCarouselOuterContainer}>
              <LogoCarousel
                imagePaths={logoCarouselItems}
                stampAppearDelayMs={carouselStampAppearDelayMs}
                stampVisibleDurationMs={carouselStampVisibleDurationMs}
              />
            </div>
          )}

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
          {linkText && (
            <a href={linkUrl} className={styles.tweetLink}>
              {linkText}
            </a>
          )}
          {checklistItems && (
            <div className={styles.tweetChecklist}>
              {checklistItems.map((item, index) => (
                <div key={index} className={styles.tweetChecklistItem}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                  {item}
                </div>
              ))}
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

// --- LogoCarousel Component ---
const LogoSlide = forwardRef(function LogoSlide(
  {
    imagePath,
    direction,
    isStamped,
  }: {
    imagePath: string;
    direction: number;
    isStamped: boolean;
  },
  ref: React.Ref<HTMLDivElement>
) {
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: direction * 50 }}
      animate={{
        opacity: 1,
        x: 0,
        transition: {
          delay: 0.2,
          type: "spring",
          stiffness: 200,
          damping: 25,
        },
      }}
      exit={{
        opacity: 0,
        x: direction * -50,
        transition: { duration: 0.15 },
      }}
      className={styles.logoCarouselSlide}
    >
      <Image
        src={imagePath}
        alt={imagePath.split("/").pop()?.split(".")[0] || "logo"}
        fill
        style={{ objectFit: "contain" }}
      />
      <AnimatePresence>
        {isStamped && (
          <motion.div
            className={styles.stampOverlay}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: 1,
              scale: 1,
              transition: { type: "spring", stiffness: 300, damping: 20, delay: 0.1 },
            }}
            exit={{
              opacity: 0,
              scale: 0.5,
              transition: { duration: 0.2 },
            }}
          >
            <Image
              src="/closed.png"
              alt="Closed Stamp"
              width={100}
              height={100}
              style={{ objectFit: "contain" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

interface LogoCarouselProps {
  imagePaths: string[];
  stampAppearDelayMs?: number;
  stampVisibleDurationMs?: number;
}

function LogoCarousel({
  imagePaths,
  stampAppearDelayMs,
  stampVisibleDurationMs,
}: LogoCarouselProps) {
  if (!imagePaths || imagePaths.length === 0) return null;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isStamped, setIsStamped] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const actualStampAppearDelay =
    stampAppearDelayMs ?? LOGO_CAROUSEL_STAMP_APPEAR_DELAY_MS_DEFAULT;
  const actualStampVisibleDuration =
    stampVisibleDurationMs ?? LOGO_CAROUSEL_STAMP_VISIBLE_DURATION_MS_DEFAULT;

  const advanceSlide = () => {
    setIsStamped(false);
    setDirection(1);
    setCurrentIndex((prevIndex) => wrap(0, imagePaths.length, prevIndex + 1));
  };

  useEffect(() => {
    const manageStampAndTransition = () => {
      timeoutRef.current = setTimeout(() => {
        setIsStamped(true);
        timeoutRef.current = setTimeout(() => {
          advanceSlide();
        }, actualStampVisibleDuration);
      }, actualStampAppearDelay);
    };

    manageStampAndTransition();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentIndex, imagePaths, actualStampAppearDelay, actualStampVisibleDuration]);

  // Inject CSS variables for sizing
  const carouselStyles = {
    "--logo-carousel-height-desktop": `${LOGO_CAROUSEL_HEIGHT_DESKTOP_PX}px`,
    "--logo-max-width-desktop-percent": `${LOGO_MAX_WIDTH_DESKTOP_PERCENT}%`,
    "--logo-max-height-desktop-percent": `${LOGO_MAX_HEIGHT_DESKTOP_PERCENT}%`,
    "--stamp-max-width-desktop-percent": `${STAMP_MAX_WIDTH_DESKTOP_PERCENT}%`,
    "--stamp-max-height-desktop-percent": `${STAMP_MAX_HEIGHT_DESKTOP_PERCENT}%`,
    "--logo-carousel-height-mobile": `${LOGO_CAROUSEL_HEIGHT_MOBILE_PX}px`,
    "--logo-max-width-mobile-percent": `${LOGO_MAX_WIDTH_MOBILE_PERCENT}%`,
    "--logo-max-height-mobile-percent": `${LOGO_MAX_HEIGHT_MOBILE_PERCENT}%`,
    "--stamp-max-width-mobile-percent": `${STAMP_MAX_WIDTH_MOBILE_PERCENT}%`,
    "--stamp-max-height-mobile-percent": `${STAMP_MAX_HEIGHT_MOBILE_PERCENT}%`,
  } as React.CSSProperties;

  return (
    <div className={styles.logoCarouselContainer} style={carouselStyles}>
      <AnimatePresence custom={direction} initial={false} mode="popLayout">
        <LogoSlide
          key={currentIndex}
          imagePath={imagePaths[currentIndex]}
          direction={direction}
          isStamped={isStamped}
        />
      </AnimatePresence>
    </div>
  );
}

// --- Home Component (data mapping) ---
const tweetData = [
  {
    number: "1",
    headline: "I didn't just send you my resume.",
    bodyText: "I also vibe coded this site. I mean who does that?",
  },
  {
    number: "",
    headline: "Btw... this is me.",
    bodyText: "I'm the one on the left.",
    imageUrl: "/meandtheo.jpeg",
  },
  {
    number: "2",
    headline: "I'm good at sales.",
    bodyText:
      "In 2023, I started a new company from nothing and closed over €400k of sales volume in the first year. I mainly sold to startups and the average deal size was €20k.",
    logoCarouselItems: [
      "/startupsales/kitekraft.png",
      "/startupsales/aisupervision.png",
      "/startupsales/voize.png",
      "/startupsales/gitpod.png",
    ],
    highlightPhraseInBody: "closed over €400k of sales volume in the first year",
  },
  {
    number: "3",
    headline: "Like, really good at sales.",
    bodyText:
      "In 2020, I co-founded a company for virtual events and within 2 years I closed over €1M worth of sales volume. I was solely responsible for the sales pipeline and every deal we closed. These weren't easy deals, since we were selling to some of the most renowned research institutions in the world. Here are a few examples:",
    logoCarouselItems: [
      "/enterprisesales/1.png",
      "/enterprisesales/2.png",
      "/enterprisesales/3.png",
      "/enterprisesales/4.png",
      "/enterprisesales/5.png",
      "/enterprisesales/6.png",
    ],
    carouselStampAppearDelayMs: LOGO_CAROUSEL_STAMP_APPEAR_DELAY_MS_FAST,
    carouselStampVisibleDurationMs: LOGO_CAROUSEL_STAMP_VISIBLE_DURATION_MS_FAST,
    highlightPhraseInBody: "within 2 years I closed over €1M worth of sales volume",
  },
  {
    number: "4",
    headline: "Like, doing it for a decade good at sales.",
    bodyText:
      "I started out my career at Deloitte Digital and even though I didn't do sales myself there, I was closely involved in the process - working together with some really experienced closers. I can't tell you the names of the companies, since I was under NDA, but these were some of the biggest companies in Germany.",
  },
  {
    number: "4",
    headline: "I started experimenting with OpenAI even before the hype.",
    bodyText:
      "I looked up the first time I hooked up to your API. This was in late 2022. This was before ChatGPT. I was like, 'this is the future.' And I've been wanting to be a part of that future ever since.",
    imageUrl: "/init.png",
  },
  {
    number: "5",
    headline: "I'm a builder.",
    bodyText:
      "Not the greates tech wiz in the world, but I know my way around. I've been prototyping with AI constantly.",
    imageUrl: "/commits.png",
  },
  {
    number: "6",
    headline: "I met Sam.",
    bodyText:
      "Briefly. Once. In the bluebottle coffee in Palo Alto. We shook hands and talked about YC. Not meaning to imply we know each other well - It's just that he might remember me. Although he probably doesn't - this was 5 years ago after all ¯\\_(ツ)_/¯",
  },
  {
    number: "7",
    headline: "I'm a founder and a YC alumnus.",
    bodyText:
      "So I understand product, I understand the technical details and I can work in a high pressure, high stakes environment. I can setup a sales process and I can build a sales team.",
    imageUrl: "/yc.png",
  },
  {
    number: "8",
    headline: "I speak both German and English fluently.",
    bodyText: "Check out my voice memos here.",
  },
  {
    number: "9",
    headline: "I get both vibes.",
    bodyText:
      "Born in Moldova, raised in Germany, and shaped by Silicon Valley. I'm in the valley at least once a year. I love the energy and the vision. At the same time, I know how German businesses think. I know what they fear and what makes them say yes.",
    imageUrl: "/culture.png",
  },

  {
    number: "10",
    headline: "I check all the boxes.",
    checklistItems: [
      "Decade of experience in SaaS sales",
      "Expert fluency in German and English",
      "Great at designing deal strategies",
      "Two time successful founder (YC W21)",
      "Communicating technical concepts to customers",
      "Passion for AI (even before the hype)",
      "Based in Munich",
      "Builder and Strategist",
      "Excited by new challenges",
    ],
  },
  {
    number: "11",
    headline: "I love the future OpenAI is building.",
    bodyText:
      "I can see the impact firsthand. My mom uses ChatGPT. My sister, who's not technical at all, uses it daily. Watching AI transform the lives of people I care about... that's when you know this is something wonderful. And it's just the beginning.",
  },
  {
    number: "12",
    headline: "I write well.",
    bodyText:
      "Not great yet, but good. And improving. Clear human communication is essential in sales and even more valuable now.",
  },
  {
    number: "13",
    headline: "I'm already in the trenches.",
    bodyText:
      "ChatGPT Pro subscriber since early days. Tried Claude,Perplexity, Gemini,  T3 Chat, and more. I know what developers need because I've been in their shoes.",
  },
  {
    number: "14",
    headline: "I'm still here.",
    bodyText: `I only learned about the open position only two days ago and now the job post is gone. Doesn\'t matter. I won\'t let this slide on a technicality.

It\'s like Sam says - sometimes you have to get on a plane to close the deal. I'm willing to do that and go the extra mile.`,
  },
  {
    number: "",
    headline: "Get in Touch",
    bodyText: `Erich Lehmann
    +49 176 209 566 86
    erichjohannlehmann@gmail.com
    linkedin.com/in/erichlehmann
    x.com/LehmannErich
    github.com/lehmannerich`,
  },
];
