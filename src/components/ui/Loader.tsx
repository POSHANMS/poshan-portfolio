"use client";

import React, { useEffect, useState } from "react";
import { useProgress } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";

// Simulated log lines based on loading percentage
const logLines = [
  { threshold: 5, text: ">> INITIALIZING SECURE CYBERNETIC CONNECTION..." },
  { threshold: 20, text: ">> RETRIEVING NEURAL SHADER MODULES..." },
  { threshold: 45, text: ">> LOADING 3D METALLIC CHASSIS MODEL (laptop.glb)..." },
  { threshold: 65, text: ">> INJECTING REFRACTION TECHNOLOGY (TechCubes)..." },
  { threshold: 85, text: ">> ESTABLISHING QUANTUM STARFIELD NETWORK..." },
  { threshold: 98, text: ">> PORTFOLIO ONLINE. DEPLOYING MATRIX..." },
];

export default function Loader() {
  const { progress } = useProgress();
  const [displayProgress, setDisplayProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [bootLogs, setBootLogs] = useState<string[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    // Smooth progress count-up
    const targetProgress = Math.max(progress, displayProgress);
    
    if (displayProgress < 100) {
      interval = setInterval(() => {
        setDisplayProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          // Increment faster if actual loading progress is ahead
          const increment = targetProgress > prev ? Math.max(2, Math.ceil((targetProgress - prev) * 0.2)) : 1;
          const next = prev + increment;
          return next > 100 ? 100 : next;
        });
      }, 30);
    } else {
      // Delay transition for half a second to let user see "100%"
      const timeout = setTimeout(() => {
        setIsDone(true);
      }, 800);
      return () => clearTimeout(timeout);
    }

    return () => clearInterval(interval);
  }, [progress, displayProgress]);

  // Update terminal logs based on progress
  useEffect(() => {
    const activeLogs = logLines
      .filter((line) => displayProgress >= line.threshold)
      .map((line) => line.text);
    setBootLogs(activeLogs);
  }, [displayProgress]);

  return (
    <AnimatePresence>
      {!isDone && (
        <motion.div
          key="loader"
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0, 
            y: "-100vh",
            transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } 
          }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#050508] font-mono text-xs select-none"
        >
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none opacity-40" />

          {/* Core Loader Box */}
          <div className="relative flex flex-col items-center max-w-md w-full px-8">
            
            {/* 3D Spinning Logo Intro */}
            <div className="relative w-24 h-24 mb-8 flex items-center justify-center">
              {/* Outer rotating neon glow ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                className="absolute inset-0 border border-t-[var(--electric-blue)] border-r-[var(--hot-pink)] border-b-transparent border-l-transparent rounded-full shadow-[0_0_15px_rgba(0,212,255,0.4)]"
              />
              
              {/* Secondary reverse rotating ring */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                className="absolute inset-2 border border-b-[var(--terminal-green)] border-l-[var(--deep-violet)] border-t-transparent border-r-transparent rounded-full opacity-60"
              />

              {/* Stylized P Logo */}
              <motion.div 
                animate={{ 
                  scale: [1, 1.05, 1],
                  filter: ["drop-shadow(0 0 5px #00d4ff)", "drop-shadow(0 0 12px #ff2d78)", "drop-shadow(0 0 5px #00d4ff)"]
                }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="relative z-10 flex items-center justify-center"
              >
                <svg
                  width="40"
                  height="45"
                  viewBox="0 0 40 45"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="filter drop-shadow-[0_0_8px_var(--electric-blue)]"
                >
                  <path
                    d="M5 5H22C28.6274 5 34 10.3726 34 17C34 23.6274 28.6274 29 22 29H13V40"
                    stroke="#00d4ff"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M13 17H22C23.6569 17 25 15.6569 25 14C25 12.3431 23.6569 11 22 11H13V17Z"
                    fill="#ff2d78"
                  />
                </svg>
              </motion.div>
            </div>

            {/* Terminal Feed Details */}
            <div className="w-full bg-[rgba(10,10,30,0.6)] border border-[rgba(0,212,255,0.2)] p-4 rounded mb-6 text-[10px] text-[var(--terminal-green)] leading-5 h-36 overflow-hidden flex flex-col justify-end">
              <div className="space-y-1">
                {bootLogs.map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="truncate text-[var(--terminal-green)] text-glow-green"
                  >
                    {log}
                  </motion.div>
                ))}
                {displayProgress < 100 && (
                  <span className="inline-block w-2 h-4 bg-[var(--terminal-green)] animate-[pulse_1s_infinite] ml-1 align-middle" />
                )}
              </div>
            </div>

            {/* Loader percentage and progress bar */}
            <div className="w-full flex items-center justify-between text-xs font-semibold mb-2">
              <span className="text-[var(--electric-blue)] uppercase tracking-widest text-glow-blue">
                Initializing System
              </span>
              <span className="text-[var(--hot-pink)] text-glow-pink">
                {displayProgress}%
              </span>
            </div>

            <div className="w-full h-1.5 bg-[#121225] rounded-full overflow-hidden border border-white/5 relative">
              <motion.div
                className="h-full bg-gradient-to-r from-[var(--electric-blue)] via-[var(--deep-violet)] to-[var(--hot-pink)] shadow-[0_0_10px_var(--electric-blue)]"
                style={{ width: `${displayProgress}%` }}
                layout
              />
            </div>
            
            <div className="mt-8 text-[9px] text-[#555577] text-center select-none">
              POSHAN MS PORTFOLIO v1.0.0 · NODE_ENV = PRODUCTION
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
