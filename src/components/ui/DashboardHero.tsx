"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Cpu,
  MapPin,
  Music2,
  Pause,
  Play,
  Radio,
  Star,
  Trophy,
  Zap,
} from "lucide-react";
import { useAudio } from "@/hooks/useAudio";

const techStack = ["Next.js", "TypeScript", "Node.js", "MongoDB", "Tailwind CSS", "AWS"];
const heatmapCells = Array.from({ length: 96 }, (_, index) => index);

function useTypewriter(text: string) {
  const [value, setValue] = useState("");
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      setValue(text.slice(0, ++i));
      if (i >= text.length) clearInterval(id);
    }, 60);
    return () => clearInterval(id);
  }, [text]);
  return value;
}

function useLiveClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const fmt = () =>
      setTime(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
          timeZone: "Asia/Kolkata",
        })
      );
    fmt();
    const id = setInterval(fmt, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function GlassPanel({
  children,
  className = "",
  accent = "blue",
}: {
  children: React.ReactNode;
  className?: string;
  accent?: "blue" | "pink" | "violet";
}) {
  return (
    <div className={`dashboard-panel dashboard-panel-${accent} ${className}`}>
      {children}
    </div>
  );
}

function MiniHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`font-mono text-[10px] uppercase tracking-[0.22em] text-white/52 ${className}`}>
      {children}
    </p>
  );
}

function SkillBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between font-mono text-[11px]">
        <span className="text-white/72">{label}</span>
        <span className="text-white/82">{value}%</span>
      </div>
      <div className="h-[3px] overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#ff1744] to-[#800010]"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function GitHubMark() {
  return (
    <svg className="h-3.5 w-3.5 text-white/38" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 19c-4.5 1.4-4.5-2.4-6.4-2.9M15 22v-3.5c0-1 .1-1.4-.5-2 3-.3 6-1.5 6-6.6A5.1 5.1 0 0 0 19.2 6c.1-.4.6-2-.2-4 0 0-1.2-.4-4 1.5a13.4 13.4 0 0 0-6 0C6.2 1.6 5 2 5 2c-.8 2-.3 3.6-.2 4a5.1 5.1 0 0 0-1.3 3.9c0 5.1 3 6.3 6 6.6-.6.5-.9 1.2-.9 2.3V22"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DashboardHero({
  scrollProgress,
  stageScale,
}: {
  scrollProgress: number;
  stageScale: number;
}) {
  const hello = useTypewriter("< Hello, I'm />");
  const clock = useLiveClock();
  const { enabled: isMusicPlaying, toggle: toggleAmbientMusic } = useAudio(scrollProgress);

  const toggleMusic = async () => {
    try {
      await toggleAmbientMusic();
    } catch (error) {
      console.error("Ambient audio could not start", error);
    }
  };

  return (
    <section id="home" className="pointer-events-none relative z-10 h-screen">
      {/* Atmospheric overlays - ALL ENABLED */}
      <div className="dashboard-haze pointer-events-none absolute inset-0" />
      <div className="dashboard-scanlines pointer-events-none absolute inset-0" />
      <div className="dashboard-depth-lines pointer-events-none absolute inset-0" />
      <div className="dashboard-vignette pointer-events-none absolute inset-0" />
      <div className="dashboard-floor-glow pointer-events-none absolute inset-x-0 bottom-0" />
      <div className="dashboard-horizon-fade pointer-events-none absolute inset-x-0 bottom-0" />

      <div
        className="dashboard-stage"
        style={{ transform: `translate(-50%, -50%) scale(${stageScale})` }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="stage-left-copy"
        >
          <p className="mb-2 font-mono text-lg font-semibold tracking-[0.04em] text-[var(--electric-blue)] text-glow-blue">
            {hello}
            <span className="ml-1 inline-block h-5 w-[2px] translate-y-0.5 animate-pulse bg-[var(--electric-blue)]" />
          </p>

          <h1 className="sr-only">Poshan MS — Full Stack Engineer</h1>

          <p className="mt-3 font-mono text-lg font-bold uppercase tracking-[0.24em] text-[var(--electric-blue)] text-glow-blue">
            Full Stack Engineer <span className="animate-pulse">_</span>
          </p>

          <p className="mt-2 max-w-[28rem] font-mono text-[14px] leading-7 text-[#f5f0e8]/72">
            I build{" "}
            <span className="font-semibold text-[#ff1744]">scalable</span>{" "}
            <span className="text-white/30">·</span>{" "}
            <span className="font-semibold text-[#cc1133]">performant</span>{" "}
            <span className="text-white/30">·</span>{" "}
            beautiful digital experiences.
          </p>

          <div className="pointer-events-auto mt-5 flex gap-4">
            <a href="#projects" className="dashboard-button dashboard-button-primary">
              View My Work <ArrowUpRight className="h-4 w-4" />
            </a>
            <a href="/resume.pdf" className="dashboard-button dashboard-button-dark">
              Download CV <span className="text-base leading-none">↓</span>
            </a>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-4 font-mono text-[10px] uppercase tracking-[0.14em] text-white/55">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#ff1744] shadow-[0_0_10px_rgba(255,23,68,0.8)]" />
              Available for Collaboration
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="h-3 w-3 text-[var(--hot-pink)]" /> India
            </span>
            <span className="flex items-center gap-2" suppressHydrationWarning>
              <Clock3 className="h-3 w-3 text-white/45" /> {clock} IST
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}