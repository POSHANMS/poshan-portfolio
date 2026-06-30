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
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setValue(text.slice(0, index));
      if (index >= text.length) window.clearInterval(timer);
    }, 65);

    return () => window.clearInterval(timer);
  }, [text]);

  return value;
}

function useLiveClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      setTime(
        new Intl.DateTimeFormat("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "Asia/Kolkata",
        }).format(new Date())
      );
    };

    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return time;
}

function useStageScale() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => {
      const widthScale = (window.innerWidth - 28) / 1760;
      const heightScale = (window.innerHeight - 112) / 850;
      setScale(Math.min(1, Math.max(0.58, Math.min(widthScale, heightScale))));
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return scale;
}

function GlassPanel({
  children,
  className = "",
  accent = "blue",
}: {
  children: React.ReactNode;
  className?: string;
  accent?: "blue" | "pink" | "violet" | "green";
}) {
  const accentClass = {
    blue: "dashboard-panel-blue",
    pink: "dashboard-panel-pink",
    violet: "dashboard-panel-violet",
    green: "dashboard-panel-green",
  }[accent];

  return <div className={`dashboard-panel ${accentClass} ${className}`}>{children}</div>;
}

function MiniHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`font-mono text-[10px] uppercase tracking-[0.22em] text-[#9df7ff]/68 ${className}`}>{children}</p>;
}

function SkillBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="grid grid-cols-[150px_1fr_36px] items-center gap-3 font-mono text-[11px] text-white/76">
      <span>{label}</span>
      <span className="h-[3px] overflow-hidden rounded-full bg-white/10">
        <span
          className="block h-full rounded-full bg-gradient-to-r from-cyan-300 via-violet-400 to-pink-500 shadow-[0_0_14px_rgba(255,45,120,0.7)]"
          style={{ width: `${value}%` }}
        />
      </span>
      <span className="text-right text-white/82">{value}%</span>
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

export default function DashboardHero({ scrollProgress }: { scrollProgress: number }) {
  const hello = useTypewriter("< Hello, I'm />");
  const clock = useLiveClock();
  const stageScale = useStageScale();
  const { enabled: isMusicPlaying, toggle: toggleAmbientMusic } = useAudio(scrollProgress);

  const toggleMusic = async () => {
    try {
      await toggleAmbientMusic();
    } catch (error) {
      console.error("Ambient audio could not start", error);
    }
  };

  return (
    <section id="home" className="pointer-events-none relative z-10 h-screen overflow-hidden">
      <div className="dashboard-haze pointer-events-none absolute inset-0" />
      <div className="dashboard-scanlines pointer-events-none absolute inset-0" />
      <div className="dashboard-front-particles pointer-events-none absolute inset-0" />
      <div className="dashboard-depth-lines pointer-events-none absolute inset-0" />
      <div className="dashboard-floor-glow pointer-events-none absolute inset-x-0 bottom-0" />

      <div className="dashboard-stage" style={{ transform: `translate(-50%, -50%) scale(${stageScale})` }}>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="stage-left-copy"
        >
          <p className="mb-3 font-mono text-xl font-semibold tracking-[0.02em] text-[var(--electric-blue)] text-glow-blue">
            {hello}
            <span className="ml-1 inline-block h-6 w-[2px] translate-y-1 animate-pulse bg-[var(--electric-blue)]" />
          </p>

          <h1 className="sr-only">Poshan MS</h1>
          <ExtrudedHeroTitle />

          <p className="mt-4 font-mono text-xl font-bold uppercase tracking-[0.28em] text-[var(--electric-blue)] text-glow-blue">
            Full Stack Engineer <span className="animate-pulse">_</span>
          </p>
          <p className="mt-3 max-w-[29rem] font-mono text-[15px] leading-7 text-[#d8faff]/78">
            I build <span className="text-[#00f5ff]">scalable</span> <span className="text-white/35">·</span> <span className="text-[#ff3ed1]">performant</span> <span className="text-white/35">·</span> beautiful digital experiences.
          </p>

          <div className="pointer-events-auto mt-6 flex gap-5">
            <a href="#projects" className="dashboard-button dashboard-button-primary">
              View My Work <ArrowUpRight className="h-4 w-4" />
            </a>
            <a href="/resume.pdf" className="dashboard-button dashboard-button-dark">
              Download CV <span className="text-lg leading-none">↓</span>
            </a>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-5 font-mono text-[10px] uppercase tracking-[0.14em] text-white/62">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#00ff88] shadow-[0_0_14px_rgba(0,255,136,0.85)]" />
              Available for Collaboration
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-[var(--hot-pink)]" />
              India
            </span>
            <span className="flex items-center gap-2">
              <Clock3 className="h-3.5 w-3.5 text-white/50" />
              {clock} IST
            </span>
          </div>
        </motion.div>

        <div className="stage-center-cards flex flex-col gap-6">
          <GlassPanel accent="pink" className="p-6">
            <MiniHeader>{"// Current Status"}</MiniHeader>
            <p className="mt-4 font-mono text-base leading-7 text-[var(--terminal-green)] text-glow-green">
              Available for
              <br />
              new projects
            </p>
            <button suppressHydrationWarning className="pointer-events-auto mt-4 flex items-center gap-3 rounded border border-white/18 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-white/74 transition hover:border-[var(--hot-pink)] hover:text-white">
              View Schedule <CalendarDays className="h-3.5 w-3.5 text-[var(--hot-pink)]" />
            </button>
          </GlassPanel>

          <GlassPanel accent="blue" className="p-6">
            <MiniHeader>{"// Tech Stack"}</MiniHeader>
            <div className="mt-4 space-y-3">
              {techStack.map((tech, index) => (
                <div key={tech} className="flex items-center gap-3 font-mono text-[12px] text-white/76">
                  <span className={`tech-badge tech-badge-${index}`}>{tech.slice(0, 2)}</span>
                  {tech}
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>

        <div className="stage-code-card flex items-end justify-center">
          <div className="pointer-events-auto laptop-code-card">
            <MiniHeader>{"// Welcome to my portfolio"}</MiniHeader>
            <pre className="mt-3 font-mono text-[12px] leading-6 text-cyan-100/80">
              <code>{`const developer = {
  name: "Poshan MS",
  role: "Full Stack Engineer",
  passion: "Building digital experiences",
  skills: ["React", "Node.js", "Next.js", "MongoDB"]
};`}</code>
            </pre>
            <a href="#projects" className="mt-4 inline-flex rounded border border-white/16 px-8 py-2.5 font-mono text-[10px] uppercase tracking-[0.16em] text-white/76 transition hover:border-[var(--hot-pink)] hover:text-[var(--hot-pink)]">
              Explore Projects →
            </a>
          </div>
        </div>

        <div className="stage-right-panels flex flex-col gap-6">
          <GlassPanel className="p-6" accent="blue">
            <div className="flex items-center justify-between">
              <MiniHeader>{"// GitHub Activity"}</MiniHeader>
              <GitHubMark />
            </div>
            <div className="mt-4 grid gap-1" style={{ gridTemplateColumns: "repeat(16, minmax(0, 1fr))" }}>
              {heatmapCells.map((cell) => (
                <span
                  key={cell}
                  className="h-2.5 w-2.5 rounded-[2px]"
                  style={{
                    background:
                      cell % 7 === 0
                        ? "rgba(0,255,136,0.95)"
                        : cell % 5 === 0
                          ? "rgba(0,255,136,0.68)"
                          : cell % 3 === 0
                            ? "rgba(0,255,136,0.42)"
                            : "rgba(0,255,136,0.2)",
                  }}
                />
              ))}
            </div>
            <p className="mt-4 font-mono text-[12px] text-white/76">1,247 Contributions this year</p>
          </GlassPanel>

          <GlassPanel className="p-6" accent="violet">
            <MiniHeader className="text-yellow-200/80">{"// Achievements"}</MiniHeader>
            <div className="mt-5 space-y-4 font-mono text-[12px] text-white/76">
              <p className="flex items-center gap-4">
                <Trophy className="h-4 w-4 text-yellow-300" /> Top 10% in Hackathon 2024
              </p>
              <p className="flex items-center gap-4">
                <Star className="h-4 w-4 text-yellow-300" /> 500+ GitHub Stars
              </p>
              <p className="flex items-center gap-4">
                <Zap className="h-4 w-4 text-[var(--electric-blue)]" /> Open Source Contributor
              </p>
            </div>
            <div className="mt-5 flex items-center justify-center gap-4 font-mono text-[var(--electric-blue)]">← <span className="text-white/20">● ● ●</span> →</div>
          </GlassPanel>

          <GlassPanel className="p-6" accent="blue">
            <MiniHeader>{"// Testimonial"}</MiniHeader>
            <p className="mt-4 font-mono text-[12px] leading-6 text-white/72">
              &quot;Poshan is an exceptional developer with a keen eye for detail and problem-solving skills that are truly next level.&quot;
            </p>
            <p className="mt-4 font-mono text-[11px] text-[var(--hot-pink)]">- Tech Project Collaborator</p>
            <div className="mt-3 text-center text-[var(--deep-violet)]">● ● ●</div>
          </GlassPanel>

          <GlassPanel className="p-6" accent="pink">
            <MiniHeader className="text-[var(--hot-pink)]">{"// Let's Build Together"}</MiniHeader>
            <p className="mt-4 font-mono text-[13px] leading-7 text-white/76">Have a project in mind? Let&apos;s create something amazing together!</p>
            <a href="mailto:siddeshwaraprasanna5@gmail.com" className="pointer-events-auto mt-5 inline-flex rounded border border-[var(--electric-blue)] px-6 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-white transition hover:border-[var(--hot-pink)] hover:text-[var(--hot-pink)]">
              Get In Touch →
            </a>
          </GlassPanel>
        </div>

        <GlassPanel className="stage-music p-5" accent="blue">
          <MiniHeader>Currently Listening</MiniHeader>
          <div className="mt-3 flex items-start gap-4">
            <button
              type="button"
              onClick={toggleMusic}
              suppressHydrationWarning
              className="music-art pointer-events-auto transition duration-300 hover:scale-[1.03] hover:shadow-[0_0_32px_rgba(0,212,255,0.32)]"
              aria-label={isMusicPlaying ? "Pause ambient music" : "Play ambient music"}
            >
              <Radio className="h-9 w-9 text-[var(--electric-blue)]" />
            </button>
            <div>
              <p className="font-mono text-sm text-white">Synthwave Radio</p>
              <p className="font-mono text-[11px] text-white/52">Ambient cyberpunk loop</p>
              <div className={`waveform mt-4 ${isMusicPlaying ? "" : "waveform-paused"}`}>{Array.from({ length: 32 }, (_, i) => <span key={i} style={{ height: `${8 + ((i * 7) % 28)}px` }} />)}</div>
              <div className="mt-4 flex items-center gap-4 text-white/64">
                <Music2 className="h-3.5 w-3.5" />
                <button
                  type="button"
                  onClick={toggleMusic}
                  suppressHydrationWarning
                  className="pointer-events-auto text-[var(--electric-blue)] transition hover:text-[var(--hot-pink)]"
                  aria-label={isMusicPlaying ? "Pause ambient music" : "Play ambient music"}
                >
                  {isMusicPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <Pause className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="stage-stats grid grid-cols-4 items-center p-5" accent="violet">
          {[
            ["2+", "Years Experience"],
            ["25+", "Projects Completed"],
            ["15+", "Technologies"],
            ["100%", "Client Satisfaction"],
          ].map(([number, label], index) => (
            <div key={label} className={`flex items-center gap-3 px-4 ${index > 0 ? "border-l border-white/10" : ""}`}>
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--electric-blue)]/35 bg-[var(--electric-blue)]/8 text-[var(--electric-blue)]">
                <Cpu className="h-4 w-4" />
              </span>
              <span>
                <strong className="block font-mono text-2xl text-white">{number}</strong>
                <small className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/52">{label}</small>
              </span>
            </div>
          ))}
        </GlassPanel>

        <GlassPanel className="stage-featured p-5" accent="pink">
          <MiniHeader>Featured Project</MiniHeader>
          <h3 className="mt-3 font-mono text-xl uppercase tracking-[0.16em] text-white">FindIt <span className="text-[var(--terminal-green)]">●</span></h3>
          <p className="mt-2 font-mono text-[12px] leading-5 text-white/62">Campus lost & found portal with real-time notifications, auth, image upload, and Dockerized backend.</p>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-white/55">React Flask PostgreSQL Redis Docker</p>
          <a href="#projects" className="pointer-events-auto mt-3 inline-flex rounded border border-[var(--electric-blue)]/45 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--electric-blue)]">Live Preview →</a>
        </GlassPanel>

        <GlassPanel className="stage-skills p-6" accent="blue">
          <MiniHeader>{"// Skills Overview"}</MiniHeader>
          <div className="mt-4 space-y-3">
            <SkillBar label="Frontend Development" value={95} />
            <SkillBar label="Backend Development" value={90} />
            <SkillBar label="UI / UX Design" value={85} />
            <SkillBar label="DevOps & Cloud" value={88} />
            <SkillBar label="Problem Solving" value={95} />
          </div>
        </GlassPanel>

      </div>
    </section>
  );
}
