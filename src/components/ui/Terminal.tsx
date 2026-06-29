"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const terminalLines = [
  { prefix: "poshan@dev ~ $ ", text: "whoami", isCommand: true },
  { prefix: "", text: "Full Stack Engineer", isCommand: false },
  { prefix: "", text: "Problem Solver", isCommand: false },
  { prefix: "", text: "Code Enthusiast", isCommand: false },
  { prefix: "", text: "Building digital experiences", isCommand: false },
];

export default function Terminal() {
  const [visibleLines, setVisibleLines] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    if (visibleLines >= terminalLines.length) return;
    const timeout = setTimeout(() => setVisibleLines((prev) => prev + 1), visibleLines === 0 ? 1200 : 400);
    return () => clearTimeout(timeout);
  }, [visibleLines]);

  useEffect(() => {
    const interval = setInterval(() => setShowCursor((prev) => !prev), 530);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 2.2 }}
      className="fixed bottom-8 left-8 z-20 hidden pointer-events-auto md:block"
    >
      <div
        className="w-[320px] overflow-hidden rounded-lg font-mono text-xs leading-6"
        style={{
          background: "rgba(10, 10, 30, 0.6)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(0, 212, 255, 0.34)",
          boxShadow: "0 0 24px rgba(0, 212, 255, 0.16), inset 0 0 12px rgba(0, 212, 255, 0.08)",
        }}
      >
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
          <span className="ml-2 text-[10px] tracking-wide text-white/30">terminal</span>
        </div>

        <div className="px-4 py-3">
          {terminalLines.slice(0, visibleLines).map((line, index) => (
            <div key={`${line.text}-${index}`} className="flex">
              {line.prefix && <span className="text-[var(--electric-blue)] opacity-80">{line.prefix}</span>}
              <span className={line.isCommand ? "text-white/90" : "text-[var(--terminal-green)]"}>{line.text}</span>
            </div>
          ))}

          <span className="text-sm text-[var(--terminal-green)]" style={{ opacity: showCursor ? 1 : 0 }}>
            █
          </span>
        </div>
      </div>
    </motion.div>
  );
}
