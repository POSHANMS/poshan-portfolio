"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

function useTypewriter(text: string, speed = 80, delay = 500) {
  const [displayText, setDisplayText] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    let charIndex = 0;

    const delayTimeout = setTimeout(() => {
      interval = setInterval(() => {
        if (charIndex < text.length) {
          setDisplayText(text.slice(0, charIndex + 1));
          charIndex += 1;
          return;
        }
        clearInterval(interval);
        setIsComplete(true);
      }, speed);
    }, delay);

    return () => {
      clearTimeout(delayTimeout);
      clearInterval(interval);
    };
  }, [text, speed, delay]);

  return { displayText, isComplete };
}

function MagneticButton({ children, className = "", href }: { children: React.ReactNode; className?: string; href: string }) {
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setOffset({
      x: (event.clientX - (rect.left + rect.width / 2)) * 0.3,
      y: (event.clientY - (rect.top + rect.height / 2)) * 0.3,
    });
  };

  const isResting = offset.x === 0 && offset.y === 0;

  return (
    <a
      ref={buttonRef}
      href={href}
      className={className}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        transition: isResting ? "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)" : "transform 0.1s ease-out",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
    >
      {children}
    </a>
  );
}

export default function Hero() {
  const { displayText, isComplete } = useTypewriter("< Hello, I'm />", 100, 800);

  return (
    <div className="pointer-events-none relative z-10 flex min-h-screen w-full items-center">
      <div className="max-w-[43rem] pl-6 pr-6 pt-10 md:pl-16 md:pr-0 lg:pl-24">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }} className="mb-4">
          <span className="font-mono text-lg tracking-wide text-[var(--electric-blue)] text-glow-blue md:text-xl">
            {displayText}
            <span className={`ml-1 inline-block h-[1.1em] w-[2px] align-middle bg-[var(--electric-blue)] ${isComplete ? "animate-pulse" : ""}`} />
          </span>
        </motion.div>

        <div className="h-48 md:h-[23rem]" />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="mb-5 font-mono text-sm font-semibold tracking-[0.15em] text-[var(--electric-blue)] text-glow-blue md:text-lg"
        >
          {"< Full Stack Engineer />"}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.5 }}
          className="mb-10 font-mono text-sm leading-relaxed text-white/88 md:text-base"
        >
          I build <span className="text-[var(--electric-blue)] text-glow-blue">scalable</span>
          {" • "}
          <span className="text-[var(--hot-pink)] text-glow-pink">performant</span>
          {" • "}
          <span className="text-[var(--pure-white)]">beautiful</span>
          {" solutions "}
          <span className="animate-pulse text-[var(--terminal-green)] text-glow-green">{">_"}</span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.8 }}
          className="pointer-events-auto flex flex-col gap-4 sm:flex-row"
        >
          <MagneticButton
            href="#projects"
            className="group rounded-md border border-[rgba(0,212,255,0.95)] bg-[rgba(0,212,255,0.06)] px-8 py-3.5 text-center text-xs font-bold uppercase tracking-[0.2em] text-[var(--electric-blue)] shadow-[0_0_22px_rgba(0,212,255,0.32)] transition-all duration-300 hover:bg-[var(--electric-blue)] hover:text-[#050508] hover:shadow-[0_0_38px_rgba(0,212,255,0.6)]"
          >
            View My Work <span className="inline-block transition-transform group-hover:translate-x-1">↗</span>
          </MagneticButton>

          <MagneticButton
            href="/resume.pdf"
            className="rounded-md border border-white/15 bg-[rgba(255,255,255,0.05)] px-8 py-3.5 text-center text-xs font-bold uppercase tracking-[0.2em] text-white/80 shadow-[0_0_18px_rgba(139,92,246,0.12)] transition-all duration-300 hover:border-white/30 hover:bg-[rgba(255,255,255,0.1)] hover:shadow-[0_0_26px_rgba(255,45,120,0.2)]"
          >
            Download CV <span className="ml-1 inline-block">↓</span>
          </MagneticButton>
        </motion.div>
      </div>
    </div>
  );
}
