"use client";

import { motion } from "motion/react";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      <motion.div
        className={styles.animatedBox}
        initial={{ scale: 0, rotate: 0 }}
        animate={{ scale: 1, rotate: 360 }}
        transition={{ duration: 2, ease: "easeInOut" }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <h1>Motion Works! 🎉</h1>
        <p>Hover or click me!</p>
      </motion.div>
    </div>
  );
}
