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

/* ── Typewriter hook ── */
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

/* ── Live clock hook ── */
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

/* ── Glass panel ── */
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

/* ── Section header ── */
function MiniHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`font-mono text-[10px] uppercase tracking-[0.22em] text-white/52 ${className}`}>
      {children}
    </p>
  );
}

/* ── Skill bar ── */
function SkillBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between font-mono text-[11px]">
        <span className="text-white/72">{label}</span>
        <span className="text-white/82">{value}%</span>
      </div>
      <div className="h-[3px] overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#00d4ff] to-[#8b5cf6]"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

/* ── GitHub icon ── */
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

/* ── CSS 3D Extruded Hero Name ──
   Uses 28 stacked layers + face to create depth effect matching reference image */
function ExtrudedHeroTitle() {
  const layers = Array.from({ length: 28 }, (_, index) => index);
  return (
    <div className="hero-title-stack" aria-hidden="true">
      {layers.map((layer) => (
        <div key={layer} className="hero-title-layer" style={{ ["--layer" as string]: layer }}>
          <span>POSHAN</span>
          <span className="hero-title-layer-ms">MS</span>
        </div>
      ))}
      <div className="hero-title-face">
        <span>POSHAN</span>
        <span className="hero-title-layer-ms">MS</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════ */
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
      {/* Atmospheric overlays */}
      <div className="dashboard-haze pointer-events-none absolute inset-0" />
      <div className="dashboard-scanlines pointer-events-none absolute inset-0" />
      <div className="dashboard-depth-lines pointer-events-none absolute inset-0" />
      <div className="dashboard-floor-glow pointer-events-none absolute inset-x-0 bottom-0" />

      {/* ── THE STAGE ── fixed-size container scaled to viewport */}
      <div
        className="dashboard-stage"
        style={{ transform: `translate(-50%, -50%) scale(${stageScale})` }}
      >

        {/* ═══════ LEFT HERO COLUMN (cols 1-4, row 1) ═══════ */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="stage-left-copy"
        >
          {/* Hello typewriter */}
          <p className="mb-2 font-mono text-lg font-semibold tracking-[0.04em] text-[var(--electric-blue)] text-glow-blue">
            {hello}
            <span className="ml-1 inline-block h-5 w-[2px] translate-y-0.5 animate-pulse bg-[var(--electric-blue)]" />
          </p>

          {/* 3D extruded CSS name */}
          <h1 className="sr-only">Poshan MS — Full Stack Engineer</h1>
          {/* <ExtrudedHeroTitle /> */}

          {/* Sub-title */}
          <p className="mt-3 font-mono text-lg font-bold uppercase tracking-[0.24em] text-[var(--electric-blue)] text-glow-blue">
            Full Stack Engineer <span className="animate-pulse">_</span>
          </p>

          {/* Tagline */}
          <p className="mt-2 max-w-[28rem] font-mono text-[14px] leading-7 text-[#d8faff]/72">
            I build{" "}
            <span className="font-semibold text-[#00f5ff]">scalable</span>{" "}
            <span className="text-white/30">·</span>{" "}
            <span className="font-semibold text-[#ff3ed1]">performant</span>{" "}
            <span className="text-white/30">·</span>{" "}
            beautiful digital experiences.
          </p>

          {/* CTA buttons */}
          <div className="pointer-events-auto mt-5 flex gap-4">
            <a href="#projects" className="dashboard-button dashboard-button-primary">
              View My Work <ArrowUpRight className="h-4 w-4" />
            </a>
            <a href="/resume.pdf" className="dashboard-button dashboard-button-dark">
              Download CV <span className="text-base leading-none">↓</span>
            </a>
          </div>

          {/* Status bar */}
          <div className="mt-5 flex flex-wrap items-center gap-4 font-mono text-[10px] uppercase tracking-[0.14em] text-white/55">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#00ff88] shadow-[0_0_10px_rgba(0,255,136,0.8)]" />
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

        {/* ═══════ CENTER-LEFT: Current Status + Tech Stack (cols 5-6, row 1) ═══════ */}
        {/* <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="stage-center-cards"
        >
          <GlassPanel accent="pink" className="p-5">
            <MiniHeader>{"// Current Status"}</MiniHeader>
            <p className="mt-3 font-mono text-base leading-7 text-[var(--terminal-green)] text-glow-green">
              Available for<br />new projects
            </p>
            <button
              suppressHydrationWarning
              className="pointer-events-auto mt-3 flex items-center gap-2 rounded border border-white/16 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/70 transition hover:border-[var(--hot-pink)] hover:text-white"
            >
              View Schedule <CalendarDays className="h-3 w-3 text-[var(--hot-pink)]" />
            </button>
          </GlassPanel>

          <GlassPanel accent="blue" className="p-5">
            <MiniHeader>{"// Tech Stack"}</MiniHeader>
            <div className="mt-3 space-y-2.5">
              {techStack.map((tech, index) => (
                <div key={tech} className="flex items-center gap-3 font-mono text-[12px] text-white/76">
                  <span className={`tech-badge tech-badge-${index}`}>{tech.slice(0, 2)}</span>
                  {tech}
                </div>
              ))}
            </div>
          </GlassPanel>
        </motion.div> */}

        {/* ═══════ CENTER: Welcome Code Card (cols 7-10, row 1) ═══════ */}
        {/* <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="stage-code-card"
        >
          <GlassPanel accent="blue" className="pointer-events-auto p-6">
            <MiniHeader>{"// Welcome to my portfolio"}</MiniHeader>
            <pre className="mt-3 font-mono text-[12px] leading-[1.8] text-cyan-100/80">
              <code>{`const developer = {
  name: "Poshan MS",
  role: "Full Stack Engineer",
  passion: "Building digital experiences",
  skills: ["React", "Node.js", "Next.js", "MongoDB"]
};

// Let's build something amazing!`}</code>
            </pre>
            <a
              href="#projects"
              className="mt-4 inline-flex items-center gap-2 rounded border border-white/16 px-6 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white/72 transition hover:border-[var(--hot-pink)] hover:text-[var(--hot-pink)]"
            >
              Explore Projects →
            </a>
          </GlassPanel>
        </motion.div> */}

        {/* ═══════ RIGHT PANELS (cols 11-12, rows 1-3) ═══════ */}
        {/* <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="stage-right-panels"
        >
          <GlassPanel className="p-5" accent="blue">
            <div className="flex items-center justify-between">
              <MiniHeader>{"// GitHub Activity"}</MiniHeader>
              <GitHubMark />
            </div>
            <div className="mt-3 grid gap-[3px]" style={{ gridTemplateColumns: "repeat(16, minmax(0, 1fr))" }}>
              {heatmapCells.map((cell) => (
                <span
                  key={cell}
                  className="h-2 w-2 rounded-[2px]"
                  style={{
                    background:
                      cell % 7 === 0
                        ? "rgba(0,255,136,0.95)"
                        : cell % 5 === 0
                          ? "rgba(0,255,136,0.68)"
                          : cell % 3 === 0
                            ? "rgba(0,255,136,0.42)"
                            : "rgba(0,255,136,0.18)",
                  }}
                />
              ))}
            </div>
            <p className="mt-3 font-mono text-[11px] text-white/72">1,247 Contributions this year</p>
          </GlassPanel>

          <GlassPanel className="p-5" accent="violet">
            <MiniHeader className="text-yellow-200/80">{"// Achievements"}</MiniHeader>
            <div className="mt-4 space-y-3 font-mono text-[12px] text-white/76">
              <p className="flex items-center gap-3">
                <Trophy className="h-4 w-4 text-yellow-300" /> Top 10% in Hackathon 2024
              </p>
              <p className="flex items-center gap-3">
                <Star className="h-4 w-4 text-yellow-300" /> 500+ GitHub Stars
              </p>
              <p className="flex items-center gap-3">
                <Zap className="h-4 w-4 text-[var(--electric-blue)]" /> Open Source Contributor
              </p>
            </div>
          </GlassPanel>

          <GlassPanel className="p-5" accent="blue">
            <MiniHeader>{"// Testimonial"}</MiniHeader>
            <p className="mt-3 font-mono text-[11px] leading-6 text-white/68">
              &ldquo;Poshan is an exceptional developer with a keen eye for detail and problem-solving skills that are truly next level.&rdquo;
            </p>
            <p className="mt-3 font-mono text-[10px] text-[var(--hot-pink)]">— Tech Project Collaborator</p>
          </GlassPanel>

          <GlassPanel className="p-5" accent="pink">
            <MiniHeader className="text-[var(--hot-pink)]">{"// Let's Build Together"}</MiniHeader>
            <p className="mt-3 font-mono text-[12px] leading-6 text-white/72">
              Have a project in mind?<br />Let&apos;s create something<br />amazing together!
            </p>
            <a
              href="mailto:siddeshwaraprasanna5@gmail.com"
              className="pointer-events-auto mt-4 inline-flex items-center gap-2 rounded border border-[var(--electric-blue)] px-5 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white transition hover:border-[var(--hot-pink)] hover:text-[var(--hot-pink)]"
            >
              Get In Touch →
            </a>
          </GlassPanel>
        </motion.div> */}

        {/* ═══════ STATS BAR (cols 1-10, row 2) ═══════ */}
        {/* <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
        >
          <GlassPanel className="stage-stats grid grid-cols-4 items-center p-4" accent="violet">
            {[
              ["2+", "Years Experience"],
              ["25+", "Projects Completed"],
              ["15+", "Technologies"],
              ["100%", "Client Satisfaction"],
            ].map(([number, label], index) => (
              <div key={label} className={`flex items-center gap-3 px-4 ${index > 0 ? "border-l border-white/10" : ""}`}>
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--electric-blue)]/35 bg-[var(--electric-blue)]/8 text-[var(--electric-blue)]">
                  <Cpu className="h-3.5 w-3.5" />
                </span>
                <span>
                  <strong className="block font-mono text-2xl font-bold text-white">{number}</strong>
                  <small className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/50">{label}</small>
                </span>
              </div>
            ))}
          </GlassPanel>
        </motion.div> */}

        {/* ═══════ MUSIC PLAYER (col 1-2, row 3) ═══════ */}
        {/* <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <GlassPanel className="stage-music p-4" accent="blue">
            <MiniHeader>Currently Listening</MiniHeader>
            <div className="mt-3 flex items-start gap-3">
              <button
                type="button"
                onClick={toggleMusic}
                suppressHydrationWarning
                className="music-art pointer-events-auto"
                aria-label={isMusicPlaying ? "Pause" : "Play"}
              >
                <Radio className="h-8 w-8 text-[var(--electric-blue)]" />
              </button>
              <div className="min-w-0">
                <p className="font-mono text-sm text-white">Synthwave Radio</p>
                <p className="font-mono text-[10px] text-white/48">Ambient cyberpunk loop</p>
                <div className={`waveform mt-3 ${isMusicPlaying ? "" : "waveform-paused"}`}>
                  {Array.from({ length: 24 }, (_, i) => (
                    <span key={i} style={{ height: `${6 + ((i * 7) % 22)}px` }} />
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-3 text-white/60">
                  <Music2 className="h-3 w-3" />
                  <button
                    type="button"
                    onClick={toggleMusic}
                    suppressHydrationWarning
                    className="pointer-events-auto text-[var(--electric-blue)] transition hover:text-[var(--hot-pink)]"
                    aria-label={isMusicPlaying ? "Pause" : "Play"}
                  >
                    {isMusicPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </GlassPanel>
        </motion.div> */}

        {/* ═══════ FEATURED PROJECT (cols 3-6, row 3) ═══════ */}
        {/* <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
        >
          <GlassPanel className="stage-featured p-5" accent="pink">
            <MiniHeader>Featured Project</MiniHeader>
            <h3 className="mt-2 font-mono text-xl font-bold uppercase tracking-[0.14em] text-white">
              FindIt <span className="text-[var(--terminal-green)]">●</span>
            </h3>
            <p className="mt-2 font-mono text-[12px] leading-5 text-white/62">
              Campus lost &amp; found portal with real-time notifications, auth, image upload, and Dockerized backend.
            </p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-white/50">
              React &nbsp;·&nbsp; Flask &nbsp;·&nbsp; PostgreSQL &nbsp;·&nbsp; Redis &nbsp;·&nbsp; Docker
            </p>
            <a
              href="#projects"
              className="pointer-events-auto mt-3 inline-flex items-center gap-1 rounded border border-[var(--electric-blue)]/40 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--electric-blue)] transition hover:border-[var(--hot-pink)] hover:text-[var(--hot-pink)]"
            >
              Live Preview →
            </a>
          </GlassPanel>
        </motion.div> */}

        {/* ═══════ SKILLS OVERVIEW (cols 7-10, row 3) ═══════ */}
        {/* <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <GlassPanel className="stage-skills p-5" accent="blue">
            <MiniHeader>{"// Skills Overview"}</MiniHeader>
            <div className="mt-4 space-y-3">
              <SkillBar label="Frontend Development" value={95} />
              <SkillBar label="Backend Development" value={90} />
              <SkillBar label="UI / UX Design" value={85} />
              <SkillBar label="DevOps & Cloud" value={88} />
              <SkillBar label="Problem Solving" value={95} />
            </div>
          </GlassPanel>
        </motion.div> */}

      </div>{/* end .dashboard-stage */}
    </section>
  );
}
