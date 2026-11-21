"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  Download,
  GraduationCap,
  Mail,
  Radio,
} from "lucide-react";
import { PROFILE, PROJECTS, RESUME_SUMMARY, SKILL_GROUPS, STATS } from "@/utils/constants";
import { sendContactMessage } from "@/lib/contactDelivery";
import HoldToWarp from "./HoldToWarp";
import type { ActFourPhase } from "@/types/actFour";
import { ACT_FIVE_TIMING } from "@/animations/actFiveChoreography";

type ChapterId = "hero" | "laptop" | "skills" | "projects" | "journey" | "contact";

const ACT_FOUR_PROJECT_ACCENTS = ["#66dcff", "#b69aff", "#ffc56e", "#68e3ad", "#ff718d"] as const;

const chapters: { id: ChapterId; act: string; label: string; range: [number, number]; holdUntilEnd?: boolean; persistAtEnd?: boolean }[] = [
  { id: "hero", act: "ACT I", label: "Hero", range: [0.0, 0.17] },
  { id: "laptop", act: "ACT II", label: "About", range: [0.18, 0.54] },
  { id: "skills", act: "ACT III", label: "Skills", range: [0.55, 0.82] },
  { id: "projects", act: "ACT IV", label: "Projects", range: [0.825, 0.9] },
  { id: "journey", act: "ACT V", label: "Education", range: [0.89, 0.99], holdUntilEnd: true },
  // Let the galaxy finish its camera-led reveal before Contact arrives, keeping
  // the form from covering the opening shot of the nebula.
  { id: "contact", act: "ACT VI", label: "Contact", range: [ACT_FIVE_TIMING.contactRevealStart, 1.0], persistAtEnd: true },
];

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function chapterPresence(progress: number, range: [number, number], holdUntilEnd = false, persistAtEnd = false) {
  const [start, end] = range;
  const fade = Math.min(0.065, (end - start) * 0.34);
  const enter = start <= 0 ? 1 : smoothstep(start, start + fade, progress);
  const exit = persistAtEnd ? 1 : holdUntilEnd ? (progress < end ? 1 : 0) : 1 - smoothstep(end - fade, end, progress);
  return clamp(enter * exit);
}

function localProgress(progress: number, range: [number, number]) {
  return clamp((progress - range[0]) / (range[1] - range[0]));
}

function Panel({
  children,
  presence,
  side = "left",
  className = "",
  verticallyCentered = false,
  interactive = true,
  transitionMs = 0,
  animation,
}: {
  children: React.ReactNode;
  presence: number;
  side?: "left" | "right" | "center";
  className?: string;
  verticallyCentered?: boolean;
  interactive?: boolean;
  transitionMs?: number;
  animation?: string;
}) {
  const x = side === "left" ? -34 : side === "right" ? 34 : 0;
  const baseX = side === "center" ? "-50%" : "0px";

  return (
    <div
      className={`${interactive ? "pointer-events-auto" : "pointer-events-none"} absolute ${className}`}
      inert={!interactive}
      style={{
        opacity: presence,
        transition: transitionMs > 0 ? `opacity ${transitionMs}ms ease, transform ${transitionMs}ms ease` : undefined,
        animation,
        transform: verticallyCentered
          ? `translate3d(calc(${baseX} + ${(1 - presence) * x * 0.7}px), calc(-50% - 12px + ${(1 - presence) * 12}px), 0)`
          : `translate3d(calc(${baseX} + ${(1 - presence) * x * 0.7}px), ${(1 - presence) * 12}px, 0)`,
        scale: verticallyCentered ? 0.94 : undefined,
        filter: "none",
        willChange: "opacity, transform, filter",
      }}
    >
      {children}
    </div>
  );
}

function Kicker({ act, label, className = "mb-4" }: { act: string; label: string; className?: string }) {
  return (
    <div className={`${className} flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.28em] text-white/44`}>
      <span className="text-[#ff1744]">{act}</span>
      <span className="h-px w-10 bg-[#ff1744]/45" />
      <span>{label}</span>
    </div>
  );
}

function HeroChapter({ presence }: { presence: number }) {
  const [entered, setEntered] = useState(false);
  const [typedTitle, setTypedTitle] = useState("");
  const fullTitle = "FULL STACK DEVELOPER | AI DEVELOPER";

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    let index = 0;
    const interval = setInterval(() => {
      index++;
      setTypedTitle(fullTitle.slice(0, index));
      if (index >= fullTitle.length) {
        clearInterval(interval);
      }
    }, 45);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(interval);
    };
  }, []);

  return (
    <Panel presence={presence} side="left" className="left-6 top-[14vh] w-[min(38rem,calc(100vw-3rem))] md:left-16">
      <div
        style={{
          opacity: entered ? 1 : 0,
          transform: `translate3d(${entered ? 0 : -26}px, 0, 0)`,
          transition: "opacity 700ms cubic-bezier(0.16, 1, 0.3, 1), transform 700ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <Kicker act="ACT I" label="Hero Landing" />
      </div>
      <h1 className="max-w-xl overflow-hidden text-5xl font-black uppercase leading-[0.94] tracking-tight text-white drop-shadow-[0_0_24px_rgba(255,23,68,0.25)] md:text-7xl">
        <span
          className="block"
          style={{
            opacity: entered ? 1 : 0,
            transform: `translate3d(${entered ? 0 : -70}px, 0, 0) skewX(${entered ? 0 : -8}deg)`,
            filter: `blur(${entered ? 0 : 8}px)`,
            transition: "opacity 760ms cubic-bezier(0.16, 1, 0.3, 1) 90ms, transform 760ms cubic-bezier(0.16, 1, 0.3, 1) 90ms, filter 760ms cubic-bezier(0.16, 1, 0.3, 1) 90ms",
          }}
        >
          POSHAN <span className="text-[#ffe9ed]">MS</span>
        </span>
      </h1>
      <p
        className="mt-4 flex items-center font-mono text-xs uppercase tracking-[0.16em] text-[#ff6b7f]"
        style={{
          opacity: entered ? 1 : 0,
          transform: `translateY(${entered ? 0 : 14}px)`,
          transition: "opacity 560ms ease-out 530ms, transform 560ms cubic-bezier(0.16, 1, 0.3, 1) 530ms",
        }}
      >
        <span>{typedTitle}</span>
        <span className="ml-1 inline-block h-3.5 w-1.5 animate-pulse bg-[#ff1744]" />
      </p>
      <p
        className="mt-5 max-w-sm font-mono text-sm uppercase leading-7 tracking-[0.16em] text-white/62"
        style={{
          opacity: entered ? 1 : 0,
          transform: `translateY(${entered ? 0 : 14}px)`,
          transition: "opacity 560ms ease-out 670ms, transform 560ms cubic-bezier(0.16, 1, 0.3, 1) 670ms",
        }}
      >
        Scroll to enter the laptop and open the portfolio world.
      </p>
    </Panel>
  );
}

function EnterLaptopCue({ scrollProgress }: { scrollProgress: number }) {
  const presence = chapterPresence(scrollProgress, [0.12, 0.255]);
  const progress = localProgress(scrollProgress, [0.12, 0.255]);
  const ring = 54 + progress * 42;

  return (
    <Panel presence={presence} side="right" className="right-8 bottom-[18vh] w-[min(24rem,calc(100vw-3rem))] md:right-20">
      <div className="flex items-center gap-5">
        <div className="relative h-28 w-28 shrink-0">
          <div
            className="absolute left-1/2 top-1/2 rounded-full border border-[#ff1744]/65"
            style={{
              width: ring,
              height: ring,
              transform: "translate(-50%, -50%)",
              boxShadow: "0 0 34px rgba(255,23,68,0.34)",
            }}
          />
          <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 border border-white/40 bg-[#ff1744]/15 shadow-[0_0_22px_rgba(255,23,68,0.65)]" />
        </div>
        <div className="border-l border-[#ff1744]/45 pl-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#ff6b7f]">Hold The Scroll</p>
          <h2 className="mt-2 text-2xl font-black uppercase leading-none text-white">Enter The Laptop</h2>
          <p className="mt-3 text-xs leading-6 text-white/58">
            Act I is the portfolio surface. The screen is the door into the work.
          </p>
        </div>
      </div>
    </Panel>
  );
}

function ActTwoAboutWorld({ presence, progress }: { presence: number; progress: number }) {
  const shardProgress = (index: number) => smoothstep(index * 0.11, index * 0.11 + 0.28, progress);
  const exitPull = smoothstep(0.76, 1, progress);

  return (
    <div
      className="pointer-events-auto absolute inset-0 overflow-hidden"
      style={{
        opacity: presence,
        transform: `scale(${1 + exitPull * 0.06}) translateY(${-exitPull * 18}px)`,
        filter: `blur(${exitPull * 2.2}px)`,
        transition: "opacity 180ms linear",
      }}
    >
      <div className="absolute inset-0 bg-[#120002]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,23,68,0.58),rgba(120,0,16,0.72)_38%,rgba(0,0,0,0.96)_82%)]" />
      <div className="inside-laptop-liquid-field absolute inset-0" />
      <div className="inside-laptop-data-rain absolute inset-0" />
      <div className="inside-laptop-circuit-flow absolute inset-0" />
      <div className="absolute inset-0 opacity-45 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.12)_48%,transparent_54%)]" />
      <div className="absolute left-1/2 top-[44%] h-[78vh] w-px -translate-x-1/2 -translate-y-1/2 bg-white/35 shadow-[0_0_80px_rgba(255,255,255,0.72)]" />
      <div className="absolute left-1/2 top-[44%] h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 opacity-60 shadow-[0_0_80px_rgba(255,23,68,0.35)] inside-laptop-core-pulse" />

      <div className="absolute left-6 top-[11vh] max-w-[34rem] md:left-16">
        <Kicker act="ACT II" label="Inside The Laptop" />
        <h2 className="text-5xl font-black uppercase leading-[0.9] text-white md:text-7xl">About Poshan</h2>
        <p className="mt-5 max-w-xl text-base leading-8 text-white/72">
          {RESUME_SUMMARY}
        </p>
      </div>

      <div className="absolute bottom-[14vh] left-6 grid max-w-[46rem] gap-4 md:left-16 md:grid-cols-4">
        {STATS.map((stat, index) => {
          const reveal = shardProgress(index);
          return (
            <div
              key={stat.label}
              className="border border-white/25 bg-white/[0.08] px-5 py-4 shadow-[0_0_36px_rgba(255,23,68,0.18)] backdrop-blur-sm"
              style={{
                opacity: reveal,
                transform: `translateY(${(1 - reveal) * 30}px) rotate(${index % 2 === 0 ? -1.2 : 1.2}deg)`,
              }}
            >
              <div className="text-4xl font-black text-white">{stat.value}</div>
              <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white/62">{stat.label}</div>
            </div>
          );
        })}
      </div>

      <div className="absolute right-10 top-[16vh] hidden w-[22rem] border-l border-white/25 pl-6 md:block">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#ffb3bf]">Inside Profile</p>
        <p className="mt-4 text-sm leading-7 text-white/64">
          BE Computer Science graduate from Karnataka, building full-stack systems, AI tools, and practical campus software.
        </p>
      </div>
    </div>
  );
}

type CubeModuleId = "INTERFACE" | "RUNTIME" | "SYSTEMS" | "DATA";
type CubeHoverTarget = { role: CubeModuleId; x: number; y: number };

const CUBE_SKILL_MODULES: Record<CubeModuleId, {
  title: string;
  description: string;
  groups: { label: string; skills: readonly string[] }[];
}> = {
  INTERFACE: {
    title: "Interface Module",
    description: "The surfaces people see and use.",
    groups: [
      { label: SKILL_GROUPS[1][0], skills: SKILL_GROUPS[1][1] },
      { label: SKILL_GROUPS[6][0], skills: SKILL_GROUPS[6][1] },
    ],
  },
  RUNTIME: {
    title: "Runtime Module",
    description: "The services that make software respond in real time.",
    groups: [
      { label: SKILL_GROUPS[2][0], skills: SKILL_GROUPS[2][1] },
      { label: SKILL_GROUPS[4][0], skills: SKILL_GROUPS[4][1] },
    ],
  },
  SYSTEMS: {
    title: "Systems Module",
    description: "The logic, models, and foundations behind the build.",
    groups: [
      { label: SKILL_GROUPS[0][0], skills: SKILL_GROUPS[0][1] },
      { label: SKILL_GROUPS[5][0], skills: SKILL_GROUPS[5][1] },
      { label: SKILL_GROUPS[10][0], skills: SKILL_GROUPS[10][1] },
      { label: SKILL_GROUPS[11][0], skills: SKILL_GROUPS[11][1] },
    ],
  },
  DATA: {
    title: "Data Module",
    description: "Where information is stored, shipped, protected, and observed.",
    groups: [
      { label: SKILL_GROUPS[3][0], skills: SKILL_GROUPS[3][1] },
      { label: SKILL_GROUPS[7][0], skills: SKILL_GROUPS[7][1] },
      { label: SKILL_GROUPS[8][0], skills: SKILL_GROUPS[8][1] },
      { label: SKILL_GROUPS[9][0], skills: SKILL_GROUPS[9][1] },
    ],
  },
};

const SKILL_CONNECTIONS: Partial<Record<string, readonly string[]>> = {
  "React (18)": ["Next.js", "Framer Motion", "Tailwind CSS", "Leaflet.js"],
  "Next.js": ["React (18)", "TypeScript", "Vercel", "Tailwind CSS"],
  Python: ["Flask", "SQLAlchemy", "Scikit-learn", "Google ADK"],
  JavaScript: ["React (18)", "Node.js", "Express", "Socket.io"],
  TypeScript: ["Next.js", "React (18)", "Vite", "Framer Motion"],
  Java: ["Spring Boot", "OOP", "DSA", "REST APIs"],
  SQL: ["PostgreSQL", "MySQL", "SQLite3", "SQLAlchemy"],
  Flask: ["Python", "SQLAlchemy", "REST APIs", "Flask-based ML integration (HealthGPT)"],
  "Node.js": ["JavaScript", "Express", "Socket.io", "JWT"],
  PostgreSQL: ["SQL", "Redis", "Docker", "Vercel"],
  MongoDB: ["Express", "Node.js", "Cloudinary", "JWT"],
  Docker: ["Git", "GitHub", "Vercel", "Railway"],
  "Google ADK": ["Gemini", "Flask", "Python", "Model training & evaluation"],
};

function CubeHoverPanel({ module, onPanelHoverChange }: { module: CubeModuleId | null; onPanelHoverChange: (hovered: boolean) => void }) {
  const details = module ? CUBE_SKILL_MODULES[module] : null;
  const [focusedSkill, setFocusedSkill] = useState<string | null>(null);
  const relatedSkills = focusedSkill ? SKILL_CONNECTIONS[focusedSkill] ?? [] : [];

  useEffect(() => {
    setFocusedSkill(details?.groups[0]?.skills[0] ?? null);
  }, [details]);

  return (
    <aside
      className="absolute right-3 top-[8vh] z-30 w-[min(24rem,calc(100vw-1.5rem))] border border-[#ff6b7f]/65 bg-[#0a0104]/82 p-4 shadow-[0_0_56px_rgba(255,23,68,0.22)] backdrop-blur-xl md:right-8 md:top-[11vh] md:w-[min(28rem,36vw)] md:p-5"
      style={{
        opacity: details ? 1 : 0,
        pointerEvents: details ? "auto" : "none",
        transform: `translate3d(${details ? 0 : 22}px, ${details ? 0 : -8}px, 0)`,
        filter: `blur(${details ? 0 : 3}px)`,
        transition: "opacity 180ms ease, transform 240ms cubic-bezier(0.16, 1, 0.3, 1), filter 180ms ease",
      }}
      onMouseEnter={() => onPanelHoverChange(true)}
      onMouseLeave={() => onPanelHoverChange(false)}
      aria-hidden={!details}
    >
      {details && (
        <>
          <div className="mb-4 flex items-start justify-between border-b border-[#ff6b7f]/35 pb-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#ff8a98]">Skill artifact open</p>
              <h3 className="mt-2 text-2xl font-black uppercase leading-none text-white">{details.title}</h3>
            </div>
            <span className="mt-1 h-2.5 w-2.5 bg-white shadow-[0_0_18px_rgba(255,255,255,0.86)]" />
          </div>
          <p className="mb-4 text-sm leading-6 text-white/76">{details.description}</p>
          <div className="max-h-[38vh] space-y-3 overflow-y-auto pr-1">
            {details.groups.map((group) => (
              <section key={group.label}>
                <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[#ff7890]">{group.label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {group.skills.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onMouseEnter={() => setFocusedSkill(skill)}
                      onFocus={() => setFocusedSkill(skill)}
                      className={`border px-2 py-1 font-mono text-[10px] leading-4 transition ${focusedSkill === skill ? "border-[#ff7185] bg-[#ff1744]/22 text-white shadow-[0_0_16px_rgba(255,23,68,0.22)]" : "border-white/18 bg-white/[0.06] text-white/76 hover:border-[#ff7185]/70 hover:text-white"}`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <div className="mt-4 border-t border-white/12 pt-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#ff8a98]">{focusedSkill ?? "Skill context"}</p>
            <div className="mt-2 flex min-h-7 flex-wrap items-center gap-1.5">
              {relatedSkills.length > 0 ? relatedSkills.map((skill) => (
                <span key={skill} className="border border-[#ff6b7f]/35 bg-[#ff1744]/10 px-2 py-1 font-mono text-[9px] text-white/86">{skill}</span>
              )) : <span className="font-mono text-[10px] text-white/46">Part of the {details.title.toLowerCase()}.</span>}
            </div>
          </div>
        </>
      )}
    </aside>
  );
}

function SkillsChapter({
  presence,
  progress,
  hoveredCube,
  cubeTargets,
  onCubeHoverChange,
  onPanelHoverChange,
}: {
  presence: number;
  progress: number;
  hoveredCube: CubeModuleId | null;
  cubeTargets: Partial<Record<CubeModuleId, CubeHoverTarget>>;
  onCubeHoverChange: (module: CubeModuleId | null) => void;
  onPanelHoverChange: (hovered: boolean) => void;
}) {
  const reveal = smoothstep(0.02, 0.2, progress);
  const cubeHitAreas: CubeModuleId[] = ["INTERFACE", "RUNTIME", "SYSTEMS", "DATA"];

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      data-act-three-skills
      style={{
        opacity: presence,
        transform: `translateY(${(1 - presence) * 14}px)`,
        filter: `blur(${(1 - presence) * 3}px)`,
        transition: "opacity 160ms linear, transform 160ms linear, filter 160ms linear",
      }}
    >
      <div className="skill-vault-field absolute inset-0" />
      <div className="skill-vault-grain absolute inset-0" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,transparent_0%,rgba(2,0,1,0.24)_48%,rgba(0,0,0,0.82)_100%)]" />

      <div className="absolute left-6 top-[9vh] w-[min(27rem,calc(100vw-3rem))] md:left-16" style={{ opacity: reveal }}>
        <Kicker act="ACT III" label="Skill Vault" />
        <h2 className="max-w-md text-4xl font-black uppercase leading-[0.9] text-white md:text-6xl">Skills,<br />assembled.</h2>
        <p className="mt-4 max-w-xs text-sm leading-7 text-white/62">Four artifacts hold the tools behind the work. Hover one to inspect the stack.</p>
      </div>

      <div className="absolute bottom-[11vh] left-16 hidden font-mono text-[10px] uppercase tracking-[0.24em] text-[#ffb0ba] lg:block" style={{ opacity: 0.42 + (hoveredCube ? 0.58 : 0) }}>
        {hoveredCube ? "Artifact expanded" : "Hover an artifact to explore"}
      </div>

      {cubeHitAreas.map((module) => {
        const target = cubeTargets[module];
        return (
          <button
            key={module}
            type="button"
            aria-label={`Inspect ${CUBE_SKILL_MODULES[module].title}`}
            className="pointer-events-auto absolute z-10 h-[clamp(10rem,15vw,18rem)] w-[clamp(10rem,15vw,18rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-transparent outline-none"
            style={{
              left: target ? `${target.x}%` : "-30%",
              top: target ? `${target.y}%` : "-30%",
              pointerEvents: target ? "auto" : "none",
            }}
            onMouseEnter={() => onCubeHoverChange(module)}
            onMouseLeave={() => onCubeHoverChange(null)}
            onFocus={() => onCubeHoverChange(module)}
            onBlur={() => onCubeHoverChange(null)}
            onClick={() => onCubeHoverChange(module)}
          />
        );
      })}

      <CubeHoverPanel module={hoveredCube} onPanelHoverChange={onPanelHoverChange} />
    </div>
  );
}

function ProjectsChapter({
  presence,
  phase,
  projectIndex,
  onWarp,
  onExit,
  onCharge,
  onSelectProject,
  warpProgress,
}: {
  presence: number;
  phase: ActFourPhase;
  projectIndex: number;
  onWarp: () => void;
  onExit: () => void;
  onCharge: (progress: number) => void;
  onSelectProject: (index: number) => void;
  warpProgress: number;
}) {
  const [displayProjectIndex, setDisplayProjectIndex] = useState(projectIndex);
  const [copyPhase, setCopyPhase] = useState<"idle" | "exit" | "enter">("idle");
  const copyPhaseRef = useRef<"idle" | "exit" | "enter">("idle");
  const previousProjectIndex = useRef(projectIndex);
  const copyTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const project = PROJECTS[displayProjectIndex];
  const accent = ACT_FOUR_PROJECT_ACCENTS[displayProjectIndex] ?? ACT_FOUR_PROJECT_ACCENTS[0];

  const setCopyPhaseNow = useCallback((next: "idle" | "exit" | "enter") => {
    copyPhaseRef.current = next;
    setCopyPhase(next);
  }, []);

  useEffect(() => {
    const clearCopyTimers = () => {
      copyTimers.current.forEach(clearTimeout);
      copyTimers.current = [];
    };

    if (phase !== "act4_vault") {
      clearCopyTimers();
      previousProjectIndex.current = projectIndex;
      setDisplayProjectIndex(projectIndex);
      setCopyPhaseNow("idle");
      return clearCopyTimers;
    }
    if (previousProjectIndex.current === projectIndex) return clearCopyTimers;

    previousProjectIndex.current = projectIndex;
    const rapidRetarget = copyPhaseRef.current !== "idle";
    clearCopyTimers();

    if (rapidRetarget) {
      setDisplayProjectIndex(projectIndex);
      setCopyPhaseNow("enter");
      copyTimers.current.push(setTimeout(() => setCopyPhaseNow("idle"), 280));
      return clearCopyTimers;
    }

    setCopyPhaseNow("exit");
    copyTimers.current.push(setTimeout(() => {
      setDisplayProjectIndex(projectIndex);
      setCopyPhaseNow("enter");
      copyTimers.current.push(setTimeout(() => setCopyPhaseNow("idle"), 280));
    }, 180));
    return clearCopyTimers;
  }, [phase, projectIndex, setCopyPhaseNow]);

  const [gatePulse, setGatePulse] = useState(0);
  const [gateAlert, setGateAlert] = useState(false);
  const alertTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onGatePulse = () => {
      setGatePulse((value) => value + 1);
      setGateAlert(true);
      if (alertTimer.current) clearTimeout(alertTimer.current);
      if (pulseTimer.current) clearTimeout(pulseTimer.current);
      pulseTimer.current = setTimeout(() => setGatePulse(0), 370);
      alertTimer.current = setTimeout(() => setGateAlert(false), 2000);
    };
    window.addEventListener("act-four-gate-pulse", onGatePulse);
    return () => {
      window.removeEventListener("act-four-gate-pulse", onGatePulse);
      if (alertTimer.current) clearTimeout(alertTimer.current);
      if (pulseTimer.current) clearTimeout(pulseTimer.current);
    };
  }, []);

  if (phase === "act4_exterior") {
    return (
      <Panel presence={presence} side="left" className="left-6 top-[17vh] w-[min(27rem,calc(100vw-3rem))] md:left-16">
        <div
          className="relative grid gap-5 py-2 pr-5 [text-shadow:0_2px_16px_rgba(0,0,0,0.9)]"
          style={{ transform: "perspective(1400px) rotateY(5deg) rotateX(1deg)", transformOrigin: "left center" }}
        >
          <div>
            <Kicker act="ACT IV" label="Core Orbit" />
            <h2 className="max-w-[10ch] text-4xl font-black uppercase leading-[0.92] tracking-[-0.035em] text-white [text-shadow:0_0_24px_rgba(255,220,230,0.22)] md:text-5xl">Project Launch</h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/80 [text-shadow:0_0_12px_rgba(255,210,220,0.16)]">Hold to breach the crimson core and enter the project vault.</p>
          </div>
          <div className="flex items-center gap-5 pt-1">
            <div className="relative shrink-0 rounded-full border border-white/10 bg-[radial-gradient(circle,rgba(15,8,12,0.82),rgba(7,6,10,0.55))] p-1.5 shadow-[0_0_38px_rgba(255,100,90,0.12)] backdrop-blur-xl">
              {gatePulse > 0 && [0, 1, 2].map((wave) => <span key={`${gatePulse}-${wave}`} className="act-four-gate-wave" style={{ animationDelay: `${wave * 110}ms` }} />)}
              <HoldToWarp onComplete={onWarp} onProgress={onCharge} compact className={gatePulse > 0 ? "act-four-gate-button-pulse" : ""} />
            </div>
            <div className="max-w-[16rem]">
              <p className="font-mono text-[9px] uppercase leading-5 tracking-[0.16em] text-white/65">Charge the field, then cross into five project telemetry stations.</p>
              <p className={`mt-2 min-h-8 font-mono text-[8px] uppercase leading-4 tracking-[0.1em] text-[#ffd49b] transition duration-300 ${gateAlert ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"}`} role="status" aria-live="polite">Gravity lock active // Hold to warp to enter vault</p>
            </div>
          </div>
        </div>
      </Panel>
    );
  }

  if (phase === "act4_warp_in") {
    const signal = smoothstep(warpProgress, 0.12, 0.22) * (1 - smoothstep(warpProgress, 0.62, 0.68));
    return (
      <>
        <Panel presence={1} side="left" className="left-6 top-[17vh] w-[min(27rem,calc(100vw-3rem))] md:left-16" interactive={false} animation="act-four-launch-fade 200ms ease-out both">
          <div className="grid gap-4 py-2 pr-5 [text-shadow:0_2px_16px_rgba(0,0,0,0.9)]">
            <Kicker act="ACT IV" label="Core Orbit" />
            <h2 className="max-w-[10ch] text-4xl font-black uppercase leading-[0.92] tracking-[-0.035em] text-white md:text-5xl">Project Launch</h2>
            <p className="max-w-sm text-sm leading-6 text-white/80">Hold to breach the crimson core and enter the project vault.</p>
          </div>
        </Panel>
        <Panel presence={signal} side="center" className="left-1/2 top-[43vh]" interactive={false} transitionMs={180}>
          <div className="whitespace-nowrap text-center font-mono text-[9px] uppercase tracking-[0.34em] text-[#ffe4ea]/82 drop-shadow-[0_0_18px_rgba(255,228,234,0.55)]">Traversing event horizon</div>
        </Panel>
      </>
    );
  }

  if (phase === "act4_vault" || phase === "act4_warp_out") {
    const finalProject = displayProjectIndex === PROJECTS.length - 1;
    const copyMotion = copyPhase === "exit" ? "is-exiting" : copyPhase === "enter" ? "is-entering" : "";
    return (
      <>
      <Panel presence={phase === "act4_warp_out" ? 0 : presence} side="left" interactive={phase !== "act4_warp_out"} transitionMs={phase === "act4_warp_out" ? 200 : 0} animation={phase === "act4_vault" ? "act-four-hud-arrive 350ms ease-out both" : undefined} className="act-four-station-shell left-4 top-[clamp(1.25rem,7vh,4.5rem)] z-50 w-[min(31rem,42vw)] max-w-[500px] max-h-[calc(100dvh-3rem)] md:left-12 max-[800px]:left-4 max-[800px]:top-4 max-[800px]:w-[calc(100vw-2rem)] max-[800px]:max-h-[47vh] max-[800px]:overflow-y-auto">
        <section className={`act-four-station-panel act-four-station-panel--${copyMotion}`} aria-label={`${String(displayProjectIndex + 1).padStart(2, "0")} of ${String(PROJECTS.length).padStart(2, "0")}: ${project.name}`} aria-live="polite" aria-atomic="true" style={{ "--act-four-accent": accent } as React.CSSProperties}>
          <div className="act-four-station-content">
            <span aria-hidden="true" className="act-four-accent-edge" />
            <span aria-hidden="true" className="act-four-hairline-frame" />
            <header className="act-four-telemetry-header">
              <span className="act-four-telemetry-label"><i aria-hidden="true" />{String(displayProjectIndex + 1).padStart(2, "0")}{" // Station Telemetry"}</span>
              <span className="act-four-telemetry-index">{String(displayProjectIndex + 1).padStart(2, "0")} / {String(PROJECTS.length).padStart(2, "0")}</span>
            </header>
            <nav className="act-four-station-rail" aria-label="Project stations">
              {PROJECTS.map((item, index) => <button key={item.name} type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => onSelectProject(index)} aria-label={`Open station ${String(index + 1).padStart(2, "0")}: ${item.name}`} title={item.name} aria-current={index === displayProjectIndex ? "step" : undefined} className="act-four-station-step">{String(index + 1).padStart(2, "0")}</button>)}
            </nav>
            <div className={`act-four-station-copy ${copyMotion}`}>
              <h2 className="act-four-station-title">{project.name}</h2>
              <p className="act-four-station-subtitle">{project.subtitle}</p>
              <p className="act-four-station-description">{project.description}</p>
              <div className="act-four-tech-stack" aria-label="Technology stack">
                {project.stack.map((item) => <span key={item} className="act-four-tech-pill">{item}</span>)}
              </div>
              <div className="act-four-project-actions">
                <a href={PROFILE.github} target="_blank" rel="noopener noreferrer" onPointerDown={(event) => event.stopPropagation()} className="act-four-action act-four-action--secondary">GitHub <span aria-hidden="true">↗</span></a>
                {project.href && (
                  <a href={project.href} target="_blank" rel="noopener noreferrer" onPointerDown={(event) => event.stopPropagation()} className="act-four-action act-four-action--primary">Live Demo <span aria-hidden="true">↗</span></a>
                )}
              </div>
              <p className="act-four-corridor-hint">{finalProject ? "Scroll forward to launch toward Act V" : "Scroll to advance through the project corridor"}</p>
              {finalProject && (
                <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.preventDefault(); event.stopPropagation(); onExit(); }} className="act-four-launch-control" aria-label="Launch forward from the Act IV vault">
                  <span aria-hidden="true" className="act-four-launch-edge" />
                  <span aria-hidden="true" className="act-four-launch-sweep" />
                  <span className="act-four-launch-copy"><span className="act-four-launch-icon" aria-hidden="true">↗</span><span><span className="act-four-launch-kicker">Recall sequence</span><span className="act-four-launch-title">Launch / Exit Vault</span></span></span>
                  <span className="act-four-launch-verb">Launch</span>
                </button>
              )}
            </div>
          </div>
        </section>
      </Panel>
      <button
        type="button"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => { event.preventDefault(); event.stopPropagation(); onExit(); }}
        className="act-four-exit-control pointer-events-auto absolute right-6 top-6 z-[60]"
        aria-label="Exit the Act IV vault"
        style={{ "--act-four-accent": accent, transition: "opacity 200ms ease, transform 200ms ease", animation: phase === "act4_vault" ? "act-four-hud-arrive 350ms ease-out both" : undefined, opacity: phase === "act4_warp_out" ? 0 : 1, pointerEvents: phase === "act4_warp_out" ? "none" : "auto", transform: phase === "act4_warp_out" ? "translateY(-12px)" : undefined } as React.CSSProperties}
      >[ ESC // EXIT VAULT ]</button>
      </>
    );
  }

  return (
    <Panel presence={presence} side="center" className="left-1/2 top-[44vh]">
      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#ff9cab]">Core orbit returning</p>
    </Panel>
  );
}

function JourneyChapter({ presence, progress }: { presence: number; progress: number }) {
  // The parent Panel owns the chapter entrance. A second progress-based fade
  // made the HUD remain dim at the first checkpoint after the card was active.
  const intro = 1;
  // Match ActFiveWorld's active-card midpoint during each orbital transfer so
  // the HUD counter changes on the same frame as the glass checkpoint card.
  const checkpoint = progress < 0.145 ? 1 : progress < 0.315 ? 2 : progress < 0.485 ? 3 : 4;
  const inSwoop = (progress >= 0.12 && progress < 0.17)
    || (progress >= 0.29 && progress < 0.34)
    || (progress >= 0.46 && progress < 0.51)
    || (progress >= 0.8 && progress < 1);

  return (
    <Panel presence={presence} side="left" className="left-6 top-[6vh] z-[3] w-[min(30rem,calc(100vw-3rem))] md:left-16">
      <div aria-hidden="true" className="pointer-events-none absolute -inset-x-10 -inset-y-8 -z-10 bg-[radial-gradient(ellipse_at_18%_25%,rgba(0,0,0,0.74),rgba(0,0,0,0.32)_55%,transparent_82%)]" />
      <div className="relative rounded-[4px] border border-[#ff2446]/20 px-4 py-4 shadow-[0_18px_48px_rgba(0,0,0,0.48),inset_0_0_26px_rgba(255,20,55,0.04)] backdrop-blur-[2px]" style={{ background: "rgba(7, 2, 5, 0.64)" }}>
      <div className="flex items-center gap-2.5" style={{ opacity: intro, transform: `translateY(${(1 - intro) * 12}px)`, willChange: "opacity, transform" }}>
        <GraduationCap className="h-5 w-5 shrink-0 text-[#ff6b7f]" />
        <Kicker act="ACT V" label="Education And Practice" />
      </div>
      <div style={{ opacity: intro, transform: `translateX(${(1 - intro) * -22}px)`, willChange: "opacity, transform" }}>
        <h2 className="text-3xl font-black uppercase leading-none text-white md:text-4xl">How The Work Was Built</h2>
        <p className="mt-3 max-w-sm font-mono text-[10px] uppercase tracking-[0.18em] text-white/65">Four milestones orbit the reactor. Scroll to move through the work.</p>
      </div>
      <div className="mt-6 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[#ff9cab]" style={{ opacity: intro }}>
        <span>Checkpoint 0{checkpoint} / 04</span>
        <span className="h-px w-16 bg-[#ff1744]/55"><span className="block h-full bg-[#ff4c63] transition-[width] duration-300" style={{ width: `${checkpoint * 25}%` }} /></span>
        <span className={inSwoop ? "text-[#ff7189]" : "text-white/45"}>{inSwoop ? "Orbital transfer" : "Scroll to inspect"}</span>
      </div>
      </div>
    </Panel>
  );
}

function ContactChapter({ presence, progress }: { presence: number; progress: number }) {
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [transmissionSent, setTransmissionSent] = useState(false);
  const [transmissionError, setTransmissionError] = useState<string | null>(null);
  const [emailCopied, setEmailCopied] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const transmitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transmitAbortRef = useRef<AbortController | null>(null);
  const pulse = 0.82 + Math.sin(progress * Math.PI * 4) * 0.18;
  const signal = smoothstep(0.015, 0.17, progress);
  const titleSignal = smoothstep(0.14, 0.34, progress);
  const detailsSignal = smoothstep(0.29, 0.49, progress);
  const formSignal = smoothstep(0.43, 0.68, progress);

  useEffect(() => () => {
    if (transmitTimeoutRef.current) clearTimeout(transmitTimeoutRef.current);
    transmitAbortRef.current?.abort();
  }, []);

  const handleMessageSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isTransmitting) return;
    const formBounds = event.currentTarget.getBoundingClientRect();
    const form = event.currentTarget;
    const values = new FormData(form);
    const controller = new AbortController();
    transmitAbortRef.current = controller;
    setTransmissionError(null);
    setIsTransmitting(true);
    window.dispatchEvent(new CustomEvent("act-six-submit-dissolve", {
      detail: { left: formBounds.left, top: formBounds.top, width: formBounds.width, height: formBounds.height },
    }));

    try {
      await sendContactMessage({
        firstName: String(values.get("firstName") ?? ""),
        lastName: String(values.get("lastName") ?? ""),
        email: String(values.get("email") ?? ""),
        subject: String(values.get("subject") ?? ""),
        message: String(values.get("message") ?? ""),
        website: String(values.get("website") ?? ""),
      }, controller.signal);
      await new Promise<void>((resolve) => {
        transmitTimeoutRef.current = setTimeout(() => {
          transmitTimeoutRef.current = null;
          resolve();
        }, 1450);
      });
      setTransmissionSent(true);
      form.reset();
      transmitTimeoutRef.current = setTimeout(() => {
        transmitTimeoutRef.current = null;
        setTransmissionSent(false);
      }, 3200);
    } catch (error) {
      if (controller.signal.aborted) return;
      setTransmissionError(error instanceof Error ? error.message : "The message could not be sent. Please try again.");
    } finally {
      if (!controller.signal.aborted) setIsTransmitting(false);
      transmitAbortRef.current = null;
    }
  };

  const handleStagePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch" || !formRef.current) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const normalizedX = (event.clientX - bounds.left) / Math.max(bounds.width, 1) * 2 - 1;
    const normalizedY = (event.clientY - bounds.top) / Math.max(bounds.height, 1) * 2 - 1;
    formRef.current.style.setProperty("--act-six-tilt-x", `${-normalizedY * 1.5}deg`);
    formRef.current.style.setProperty("--act-six-tilt-y", `${normalizedX * 1.5}deg`);
  };

  const resetStagePointer = () => {
    formRef.current?.style.setProperty("--act-six-tilt-x", "0deg");
    formRef.current?.style.setProperty("--act-six-tilt-y", "0deg");
  };

  return (
    <Panel presence={presence} side="left" className="act-six-contact-panel inset-0">
      <div className="act-six-contact-stage relative grid" onPointerMove={handleStagePointerMove} onPointerLeave={resetStagePointer}>
        <div className="act-six-scene-glow pointer-events-none absolute inset-0" aria-hidden="true" />

        <section
          className="act-six-contact-identity relative flex flex-col justify-center"
          style={{ opacity: signal, transform: `translate3d(${(1 - signal) * -18}px, ${(1 - signal) * 12}px, 0)`, willChange: "opacity, transform" }}
        >
          <div className="mb-5 flex items-center gap-3">
            <Kicker act="ACT VI" label="Open channel" className="mb-0" />
            <Radio className="h-4 w-4 text-[#ff5a66]" style={{ opacity: pulse }} />
          </div>
          <h2
            className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.055em] text-white sm:text-6xl"
            style={{ opacity: titleSignal, transform: `translate3d(0, ${(1 - titleSignal) * 28}px, 0) scale(${0.97 + titleSignal * 0.03})`, filter: `blur(${(1 - titleSignal) * 6}px)`, willChange: "opacity, transform, filter" }}
          >
            Contact<br /><span className="text-[#ff3554]">Poshan</span>
          </h2>
          <p className="mt-5 max-w-[34rem] text-sm leading-6 text-white/80 sm:text-base sm:leading-7" style={{ opacity: detailsSignal, transform: `translateY(${(1 - detailsSignal) * 15}px)`, willChange: "opacity, transform" }}>
            Full Stack and AI Developer · Karnataka, India. Open to roles, ideas, and questions.
          </p>
          <div className="act-six-contact-rail mt-6 grid gap-2" style={{ opacity: detailsSignal }} aria-label="Contact channels">
            <button type="button" onClick={() => { void navigator.clipboard.writeText(PROFILE.email).then(() => setEmailCopied(true)).catch(() => setEmailCopied(false)); }} aria-label="Copy Poshan’s email address" className="act-six-social-link act-six-email-link group">
              <span className="act-six-social-icon"><Mail aria-hidden="true" /></span>
              <span><span className="act-six-social-label">{emailCopied ? "Email copied" : "Email"}</span><span className="act-six-social-value">{PROFILE.email}</span></span>
              <ArrowUpRight className="act-six-social-arrow" aria-hidden="true" />
            </button>
            <a href={PROFILE.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub profile" className="act-six-social-link group">
              <span className="act-six-social-icon"><svg className="act-six-brand-mark" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.11.79-.25.79-.56v-2.17c-3.23.7-3.91-1.37-3.91-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.58-.29-5.3-1.29-5.3-5.74 0-1.27.45-2.3 1.19-3.11-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11.05 11.05 0 0 1 5.8 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.11 0 4.46-2.73 5.44-5.33 5.73.42.36.78 1.07.78 2.16v3.2c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" /></svg></span>
              <span><span className="act-six-social-label">GitHub</span><span className="act-six-social-value">github.com/POSHANMS</span></span>
              <ArrowUpRight className="act-six-social-arrow" aria-hidden="true" />
            </a>
            <a href={PROFILE.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn profile" className="act-six-social-link group">
              <span className="act-six-social-icon"><svg className="act-six-brand-mark" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.447-2.136 2.941v5.665H9.35V9h3.414v1.561h.049c.476-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124ZM7.119 20.452H3.555V9h3.564v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.204 0 22.225 0Z" /></svg></span>
              <span><span className="act-six-social-label">LinkedIn</span><span className="act-six-social-value">linkedin.com/in/poshanms</span></span>
              <ArrowUpRight className="act-six-social-arrow" aria-hidden="true" />
            </a>
          </div>
          <div className="act-six-resume-action" style={{ opacity: detailsSignal }}>
            <button type="button" className="act-six-resume-button" disabled aria-label="Resume">
              <Download aria-hidden="true" />
              <span>Resume</span>
            </button>
          </div>
          <div className="act-six-channel-status mt-5" style={{ opacity: detailsSignal }}><span className="act-six-channel-status-light" />Available for work <span className="act-six-status-divider">/</span> Open to conversation</div>
        </section>

        <form
          ref={formRef}
          onSubmit={handleMessageSubmit}
          aria-hidden={formSignal < 0.78}
          aria-busy={isTransmitting}
          className={`act-six-transmission-card act-six-contact-form relative p-0 ${isTransmitting ? "act-six-form-dissolving" : ""} ${transmissionSent ? "act-six-form-sent" : ""}`}
          style={{ opacity: formSignal, transform: `translate3d(0, ${(1 - formSignal) * 24}px, 0) perspective(1200px) rotateY(${(1 - formSignal) * -2.5}deg) rotateX(var(--act-six-tilt-x, 0deg)) rotateY(var(--act-six-tilt-y, 0deg))`, pointerEvents: formSignal > 0.78 ? "auto" : "none", willChange: "opacity, transform" }}
        >
          <div className="act-six-card-sheen pointer-events-none absolute inset-0" aria-hidden="true" />
          <div className="act-six-card-edge" aria-hidden="true"><span /></div>
          <div className="relative z-10 mb-6 border-b border-white/12 pb-5">
            <div className="mb-4 flex items-center justify-between gap-4 font-mono text-[9px] uppercase tracking-[0.2em] text-white/65">
              <span>TRANSMISSION DESK <span className="mx-2 text-[#ff3554]">/</span> ACT VI</span>
              <span className="inline-flex items-center gap-2 text-[#ff8d9d]" aria-live="polite">
                <span className={`h-1.5 w-1.5 rounded-full bg-[#ff3554] ${isTransmitting ? "act-six-signal-active" : "act-six-signal-idle"}`} />
                {transmissionSent ? "Transmission sent" : isTransmitting ? "Sending securely" : "Ready to connect"}
              </span>
            </div>
            <h3 className="act-six-compose-title">SEND A MESSAGE</h3>
          </div>
          <div className="relative z-10 grid gap-x-5 gap-y-3 sm:grid-cols-2">
            <label className="sr-only" aria-hidden="true">Leave this field blank<input name="website" tabIndex={-1} autoComplete="off" /></label>
            <label className="act-six-field-label">
              First name
              <input name="firstName" autoComplete="given-name" required maxLength={60} onFocus={() => window.dispatchEvent(new CustomEvent("act-six-input-focus"))} className="act-six-glass-input [user-select:text]" placeholder="First name" />
            </label>
            <label className="act-six-field-label">
              Last name
              <input name="lastName" autoComplete="family-name" required maxLength={60} onFocus={() => window.dispatchEvent(new CustomEvent("act-six-input-focus"))} className="act-six-glass-input [user-select:text]" placeholder="Last name" />
            </label>
            <label className="act-six-field-label sm:col-span-2">
              Your email
              <input name="email" type="email" autoComplete="email" required maxLength={254} onFocus={() => window.dispatchEvent(new CustomEvent("act-six-input-focus"))} className="act-six-glass-input [user-select:text]" placeholder="you@example.com" />
            </label>
            <label className="act-six-field-label sm:col-span-2">
              Subject
              <input name="subject" required maxLength={120} onFocus={() => window.dispatchEvent(new CustomEvent("act-six-input-focus"))} className="act-six-glass-input [user-select:text]" placeholder="What is this about?" />
            </label>
            <label className="act-six-field-label sm:col-span-2">
              Message
              <textarea name="message" required maxLength={2400} rows={2} onFocus={() => window.dispatchEvent(new CustomEvent("act-six-input-focus"))} className="act-six-glass-input min-h-20 [user-select:text] resize-y leading-6" placeholder="Tell me a little about it..." />
            </label>
          </div>
          <div className="relative z-10 mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-white/12 pt-5">
            <p className="max-w-[17rem] text-xs leading-5 text-white/65" aria-live="polite">
              {transmissionError ? <span className="text-[#ff9bab]" role="alert">{transmissionError}</span> : isTransmitting ? "Sending securely…" : "Your message is sent securely without opening an email app."}
            </p>
            <button type="submit" disabled={isTransmitting} className={`act-six-transmit-button group inline-flex items-center gap-3 border border-[#ff687e]/75 bg-gradient-to-br from-[#a10d28]/90 to-[#300812]/90 px-5 py-3.5 font-sans text-[12px] font-semibold tracking-[0.045em] text-white shadow-[0_10px_30px_rgba(110,5,24,0.28)] transition duration-300 hover:-translate-y-0.5 hover:border-[#ffbbc5] hover:shadow-[0_14px_34px_rgba(190,18,48,0.34)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ff7a8c] disabled:cursor-wait ${isTransmitting ? "act-six-transmitting" : ""}`}>
              {isTransmitting ? "Sending…" : "Transmit message"}
              <ArrowUpRight className={`h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${isTransmitting ? "act-six-send-icon" : ""}`} />
            </button>
          </div>
          {transmissionSent && (
            <div className="act-six-success-overlay" role="status" aria-live="polite">
              <div className="act-six-success-header">
                <span>TRANSMISSION DESK <span className="mx-2 text-[#ff526b]">/</span> ACT VI</span>
                <span className="act-six-success-delivered"><span />DELIVERED</span>
              </div>
              <div className="act-six-success-content act-six-success-arrive">
                <div className="act-six-success-emblem" aria-hidden="true">
                  <span className="act-six-success-ring act-six-success-ring-a" />
                  <span className="act-six-success-ring act-six-success-ring-b" />
                  <Radio className="h-8 w-8 text-[#ff7187] act-six-success-pulse" />
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/70">Act VI / Signal delivered</p>
                <h3 className="act-six-compose-title act-six-success-title">TRANSMISSION SENT.</h3>
                <p className="act-six-success-copy">Your message is on its way. The desk will reopen for another transmission in a moment.</p>
                <div className="act-six-success-footer"><span>CHANNEL STATUS</span><strong>READY FOR NEXT SIGNAL</strong></div>
              </div>
            </div>
          )}
        </form>
      </div>
    </Panel>
  );
}

export default function CinematicJourney({
  scrollProgress,
  visible,
  actFourPhase = "act3",
  actFourProjectIndex = 0,
  onActFourWarp,
  onActFourExit,
  onActFourChargeChange,
  onActFourSelectProject,
}: {
  scrollProgress: number;
  visible: boolean;
  actFourPhase?: ActFourPhase;
  actFourProjectIndex?: number;
  onActFourWarp: () => void;
  onActFourExit: () => void;
  onActFourChargeChange: (progress: number) => void;
  onActFourSelectProject: (index: number) => void;
}) {
  const [hoveredCube, setHoveredCube] = useState<CubeModuleId | null>(null);
  const [actFourWarpProgress, setActFourWarpProgress] = useState(0);
  const [actFourExitProgress, setActFourExitProgress] = useState(0);
  const [handoffBloom, setHandoffBloom] = useState(false);
  const [cubeTargets, setCubeTargets] = useState<Partial<Record<CubeModuleId, CubeHoverTarget>>>({});
  const cubeTargetsRef = useRef<Partial<Record<CubeModuleId, CubeHoverTarget>>>({});
  const cubeCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHoveringCubePanel = useRef(false);

  useEffect(() => {
    if (actFourPhase === "act4_vault") {
      setActFourWarpProgress(1);
      return;
    }
    if (actFourPhase === "act4_warp_out") {
      setActFourWarpProgress(0);
      setActFourExitProgress(0);
      setHandoffBloom(false);
      const startedAt = performance.now();
      const timer = setInterval(() => {
        const progress = Math.min(1, (performance.now() - startedAt) / 1100);
        setActFourExitProgress(progress);
        if (progress >= 1) setHandoffBloom(true);
      }, 24);
      return () => clearInterval(timer);
    }
    if (actFourPhase !== "act4_warp_in") {
      setActFourWarpProgress(0);
      setActFourExitProgress(0);
      return;
    }
    const startedAt = performance.now();
    const timer = setInterval(() => setActFourWarpProgress(Math.min(1, (performance.now() - startedAt) / 2200)), 40);
    return () => clearInterval(timer);
  }, [actFourPhase]);

  useEffect(() => {
    if ((actFourPhase !== "act4_vault" && actFourPhase !== "act5") || !handoffBloom) return;
    const timer = setTimeout(() => setHandoffBloom(false), 16);
    return () => clearTimeout(timer);
  }, [actFourPhase, handoffBloom]);

  const clearCubeCloseTimer = useCallback(() => {
    if (cubeCloseTimer.current) {
      clearTimeout(cubeCloseTimer.current);
      cubeCloseTimer.current = null;
    }
  }, []);

  const closeCubePanel = useCallback((delay = 650) => {
    clearCubeCloseTimer();
    cubeCloseTimer.current = setTimeout(() => setHoveredCube(null), delay);
  }, [clearCubeCloseTimer]);

  useEffect(() => {
    const onCubeRelayHover = (event: Event) => {
      const detail = (event as CustomEvent<{ role: CubeModuleId | null }>).detail;
      if (detail?.role) {
        clearCubeCloseTimer();
        setHoveredCube(detail.role);
        return;
      }

      closeCubePanel();
    };

    window.addEventListener("cube-relay-hover", onCubeRelayHover);
    return () => {
      clearCubeCloseTimer();
      window.removeEventListener("cube-relay-hover", onCubeRelayHover);
    };
  }, [clearCubeCloseTimer, closeCubePanel]);

  useEffect(() => {
    const onCubeVaultTargets = (event: Event) => {
      const targets = (event as CustomEvent<{ targets?: CubeHoverTarget[] }>).detail?.targets ?? [];
      const nextTargets = Object.fromEntries(targets.map((target) => [target.role, target])) as Partial<Record<CubeModuleId, CubeHoverTarget>>;
      cubeTargetsRef.current = nextTargets;
      setCubeTargets(nextTargets);
    };

    window.addEventListener("cube-vault-targets", onCubeVaultTargets);
    return () => window.removeEventListener("cube-vault-targets", onCubeVaultTargets);
  }, []);
  const states = useMemo(
    () =>
      Object.fromEntries(
        chapters.map((chapter) => [
          chapter.id,
          {
            presence: visible ? chapterPresence(scrollProgress, chapter.range, chapter.holdUntilEnd, chapter.persistAtEnd) : 0,
            progress: localProgress(scrollProgress, chapter.range),
          },
        ]),
      ) as Record<ChapterId, { presence: number; progress: number }>,
    [scrollProgress, visible],
  );
  const activeChapter = useMemo(
    () => {
      const bestVisible = chapters.reduce((best, chapter) => {
        const presence = chapterPresence(scrollProgress, chapter.range, chapter.holdUntilEnd, chapter.persistAtEnd);
        return presence > best.presence ? { id: chapter.id, presence } : best;
      }, { id: "hero" as ChapterId, presence: 0 });

      if (bestVisible.presence > 0.001) return bestVisible.id;

      return chapters.reduce((best, chapter) => {
        const center = (chapter.range[0] + chapter.range[1]) / 2;
        const distance = Math.abs(scrollProgress - center);
        return distance < best.distance ? { id: chapter.id, distance } : best;
      }, { id: "hero" as ChapterId, distance: Number.POSITIVE_INFINITY }).id;
    },
    [scrollProgress],
  );

  useEffect(() => {
    if (activeChapter !== "skills") {
      clearCubeCloseTimer();
      setHoveredCube(null);
    }
  }, [activeChapter, clearCubeCloseTimer]);

  useEffect(() => {
    if (!visible || activeChapter !== "skills") return;

    const hoverRadius = 16;
    const cubeRoles: CubeModuleId[] = ["INTERFACE", "RUNTIME", "SYSTEMS", "DATA"];

    const onViewportPointerMove = (event: PointerEvent) => {
      if (isHoveringCubePanel.current || window.innerWidth === 0 || window.innerHeight === 0) return;

      const pointer = {
        x: (event.clientX / window.innerWidth) * 100,
        y: (event.clientY / window.innerHeight) * 100,
      };

      const closest = cubeRoles.reduce<{ role: CubeModuleId; distance: number } | null>((best, role) => {
        const target = cubeTargetsRef.current[role];
        if (!target) return best;

        const distance = Math.hypot(pointer.x - target.x, pointer.y - target.y);
        return !best || distance < best.distance ? { role, distance } : best;
      }, null);

      if (closest && closest.distance <= hoverRadius) {
        clearCubeCloseTimer();
        setHoveredCube((current) => current === closest.role ? current : closest.role);
        document.body.style.cursor = "pointer";
        return;
      }

      document.body.style.cursor = "";
      closeCubePanel();
    };

    window.addEventListener("pointermove", onViewportPointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onViewportPointerMove);
      document.body.style.cursor = "";
    };
  }, [activeChapter, clearCubeCloseTimer, closeCubePanel, visible]);

  if (!visible) return null;

  const actFourInterior = actFourPhase === "act4_warp_in" || actFourPhase === "act4_vault" || actFourPhase === "act4_warp_out";
  const actFourReturning = actFourPhase === "act4_warp_out";
  const actFiveProgress = clamp((scrollProgress - ACT_FIVE_TIMING.cameraStart) / (ACT_FIVE_TIMING.sceneExit - ACT_FIVE_TIMING.cameraStart));
  const actFiveHudPresence = scrollProgress >= ACT_FIVE_TIMING.revealInStart && scrollProgress <= ACT_FIVE_TIMING.cameraExitStart
    ? 1
    : Math.max(states.journey.presence, smoothstep(0, 0.05, actFiveProgress))
      * (1 - smoothstep(ACT_FIVE_TIMING.cameraExitStart, ACT_FIVE_TIMING.sceneExit, scrollProgress));
  const exitBloomOpacity = actFourPhase === "act4_warp_out"
    ? 0.85 * smoothstep(actFourExitProgress, 0.72, 1)
    : handoffBloom ? 0.85 : 0;
  const entryIrisProgress = actFourWarpProgress;
  const entryBloomOpacity = actFourPhase === "act4_warp_in"
    ? 0.88 * (entryIrisProgress <= 0.85
      ? smoothstep(entryIrisProgress, 0.8, 0.85)
      : 1 - smoothstep(entryIrisProgress, 0.85, 0.9))
    : 0;

  return (
    <div className="fixed inset-0 z-[60] pointer-events-none" data-active-chapter={activeChapter} onDragStart={(event) => event.preventDefault()}>
      {(actFourPhase === "act4_warp_in" || actFourPhase === "act4_vault" || actFourPhase === "act4_warp_out" || handoffBloom) && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[100]"
          style={{
            opacity: actFourPhase === "act4_warp_in" ? entryBloomOpacity : handoffBloom ? 0.85 : exitBloomOpacity,
            transition: actFourPhase === "act4_vault" || actFourPhase === "act5" ? "opacity 300ms ease-out" : "opacity 80ms linear",
            background: "radial-gradient(ellipse at 50% 50%, rgba(255,205,145,0.92) 0%, rgba(255,103,57,0.78) 18%, rgba(126,10,35,0.82) 48%, rgba(27,1,11,0.96) 100%)",
            mixBlendMode: "screen",
          }}
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,transparent_0%,transparent_53%,rgba(0,0,0,0.28)_100%)]" />
      <HeroChapter presence={states.hero.presence} />
      <EnterLaptopCue scrollProgress={scrollProgress} />
      <ActTwoAboutWorld presence={states.laptop.presence} progress={states.laptop.progress} />
      <SkillsChapter
        presence={states.skills.presence}
        progress={states.skills.progress}
        hoveredCube={hoveredCube}
        cubeTargets={cubeTargets}
        onCubeHoverChange={(module) => {
          if (module) {
            clearCubeCloseTimer();
            setHoveredCube(module);
          } else {
            closeCubePanel();
          }
        }}
        onPanelHoverChange={(isHovered) => {
          isHoveringCubePanel.current = isHovered;
          if (isHovered) clearCubeCloseTimer();
          else closeCubePanel();
        }}
      />
      <ProjectsChapter
        presence={actFourPhase === "act4_exterior" || actFourInterior ? 1 : states.projects.presence}
        phase={actFourPhase}
        projectIndex={actFourProjectIndex}
        onWarp={onActFourWarp}
        onExit={onActFourExit}
        onCharge={onActFourChargeChange}
        onSelectProject={onActFourSelectProject}
        warpProgress={actFourWarpProgress}
      />
      <JourneyChapter
        presence={actFourInterior || actFourReturning ? 0 : actFiveHudPresence}
        progress={actFiveProgress}
      />
      <ContactChapter presence={actFourInterior || actFourReturning ? 0 : states.contact.presence} progress={states.contact.progress} />

      <div className="absolute right-8 top-24 hidden flex-col items-end gap-2 font-mono text-[9px] uppercase tracking-[0.26em] text-white/30 md:flex">
        {chapters.map((chapter) => {
          const active = chapterPresence(scrollProgress, chapter.range, chapter.holdUntilEnd, chapter.persistAtEnd);
          return (
            <div key={chapter.id} className="flex items-center gap-2" style={{ opacity: 0.24 + active * 0.76 }}>
              <span>{chapter.label}</span>
              <span className="h-px w-8 bg-[#ff1744]/50" style={{ transform: `scaleX(${0.2 + active * 0.8})`, transformOrigin: "right" }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
