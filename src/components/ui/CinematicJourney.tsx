"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  GraduationCap,
  Mail,
  Network,
  Radio,
  TerminalSquare,
} from "lucide-react";
import { JOURNEY_MILESTONES, PROFILE, PROJECTS, RESUME_SUMMARY, SKILL_GROUPS, STATS } from "@/utils/constants";

type ChapterId = "hero" | "laptop" | "skills" | "projects" | "journey" | "contact";

const chapters: { id: ChapterId; act: string; label: string; range: [number, number] }[] = [
  { id: "hero", act: "ACT I", label: "Hero", range: [0.0, 0.17] },
  { id: "laptop", act: "ACT II", label: "About", range: [0.18, 0.54] },
  { id: "skills", act: "ACT III", label: "Skills", range: [0.55, 0.82] },
  { id: "projects", act: "ACT IV", label: "Projects", range: [0.84, 0.92] },
  { id: "journey", act: "ACT V", label: "Education", range: [0.93, 0.97] },
  { id: "contact", act: "ACT VI", label: "Contact", range: [0.975, 1.0] },
];

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function chapterPresence(progress: number, range: [number, number]) {
  const [start, end] = range;
  const fade = Math.min(0.065, (end - start) * 0.34);
  const enter = start <= 0 ? 1 : smoothstep(start, start + fade, progress);
  const exit = 1 - smoothstep(end - fade, end, progress);
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
}: {
  children: React.ReactNode;
  presence: number;
  side?: "left" | "right" | "center";
  className?: string;
}) {
  const x = side === "left" ? -34 : side === "right" ? 34 : 0;
  const baseX = side === "center" ? "-50%" : "0px";

  return (
    <div
      className={`pointer-events-auto absolute ${className}`}
      style={{
        opacity: presence,
        transform: `translate3d(calc(${baseX} + ${(1 - presence) * x * 0.7}px), ${(1 - presence) * 12}px, 0)`,
        filter: `blur(${(1 - presence) * 3.5}px)`,
        transition: "opacity 160ms linear, transform 160ms linear, filter 160ms linear",
      }}
    >
      {children}
    </div>
  );
}

function Kicker({ act, label }: { act: string; label: string }) {
  return (
    <div className="mb-4 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.28em] text-white/44">
      <span className="text-[#ff1744]">{act}</span>
      <span className="h-px w-10 bg-[#ff1744]/45" />
      <span>{label}</span>
    </div>
  );
}

function HeroChapter({ presence }: { presence: number }) {
  return (
    <Panel presence={presence} side="left" className="left-6 top-[14vh] w-[min(36rem,calc(100vw-3rem))] md:left-16">
      <Kicker act="ACT I" label="Hero Landing" />
      <p className="mb-3 max-w-sm font-mono text-xs uppercase tracking-[0.14em] text-[#ff6b7f]">{PROFILE.title}</p>
      <h1 className="max-w-xl text-6xl font-black uppercase leading-[0.86] tracking-normal text-white md:text-8xl">
        Poshan MS
      </h1>
      <p className="mt-5 max-w-sm font-mono text-sm uppercase leading-7 tracking-[0.16em] text-white/62">
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

function ProjectsChapter({ presence, progress }: { presence: number; progress: number }) {
  return (
    <Panel presence={presence} side="right" className="right-6 top-[8vh] w-[min(32rem,calc(100vw-3rem))] md:right-14">
      <Kicker act="ACT IV" label="Project Missions" />
      <h2 className="text-3xl font-black uppercase leading-none text-white md:text-5xl">Projects From The Floor</h2>
      <p className="mt-4 max-w-md text-xs leading-6 text-white/55">
        The project beacons rise from the grid as proof points from the resume.
      </p>
      <div className="mt-6 space-y-4">
        {PROJECTS.map((project, index) => {
          const reveal = smoothstep(index * 0.065, index * 0.065 + 0.24, progress);
          return (
            <article
              key={project.name}
              className="group border-l border-white/12 pl-4 transition duration-300 hover:border-[#ff1744]"
              style={{ opacity: reveal, transform: `translateX(${(1 - reveal) * 22}px)` }}
            >
              <div className="mb-1 flex items-center justify-between font-mono text-[10px] text-white/35">
                <span className="text-[#ff1744]">PROJECT 0{index + 1}</span>
                <span>{project.stack.slice(0, 2).join(" / ")}</span>
              </div>
              <h3 className="text-lg font-black uppercase text-white">{project.name}</h3>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-[#ff6b7f]">{project.subtitle}</p>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/54">{project.description}</p>
              {project.href ? (
                <a className="mt-3 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#ff6b7f]" href={project.href} target="_blank" rel="noreferrer">
                  Open live <ArrowUpRight className="h-3 w-3" />
                </a>
              ) : (
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">{project.liveLabel || "Resume project"}</p>
              )}
            </article>
          );
        })}
      </div>
    </Panel>
  );
}

function JourneyChapter({ presence, progress }: { presence: number; progress: number }) {
  return (
    <Panel presence={presence} side="left" className="left-6 top-[12vh] w-[min(42rem,calc(100vw-3rem))] md:left-16">
      <Kicker act="ACT V" label="Education And Practice" />
      <div className="flex items-center gap-4">
        <GraduationCap className="h-8 w-8 text-[#ff6b7f]" />
        <h2 className="text-4xl font-black uppercase leading-none text-white md:text-5xl">How The Work Was Built</h2>
      </div>
      <div className="mt-7 space-y-5">
        {JOURNEY_MILESTONES.map((item, index) => {
          const reveal = smoothstep(index * 0.14, index * 0.14 + 0.2, progress);
          return (
            <div key={item.title} className="grid grid-cols-[2rem_1fr] gap-4" style={{ opacity: reveal }}>
              <div className="relative flex justify-center">
                <div className="mt-1 h-3 w-3 border border-[#ff1744] bg-black shadow-[0_0_18px_rgba(255,23,68,0.8)]" />
                {index < JOURNEY_MILESTONES.length - 1 && <div className="absolute top-5 h-14 w-px bg-[#ff1744]/24" />}
              </div>
              <div style={{ transform: `translateX(${(1 - reveal) * 20}px)` }}>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#ff1744]">checkpoint 0{index + 1}</p>
                <h3 className="mt-1 text-xl font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/58">{item.body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function ContactChapter({ presence, progress }: { presence: number; progress: number }) {
  const pulse = 0.82 + Math.sin(progress * Math.PI * 4) * 0.18;

  return (
    <Panel presence={presence} side="center" className="left-1/2 top-[17vh] w-[min(42rem,calc(100vw-3rem))]">
      <div className="border-y border-[#ff1744]/35 py-7 text-center">
        <div className="mb-5 flex items-center justify-center gap-3">
          <Kicker act="ACT VI" label="Contact" />
          <Radio className="h-5 w-5 text-[#ff6b7f]" style={{ opacity: pulse }} />
        </div>
        <h2 className="text-4xl font-black uppercase leading-none text-white md:text-6xl">Contact Poshan</h2>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/64">
          Full Stack Developer and AI Developer from Karnataka, India.
        </p>
        <div className="mx-auto mt-7 grid max-w-xl gap-3 font-mono text-xs">
          <a href={`mailto:${PROFILE.email}`} className="group flex items-center justify-between border border-[#ff1744]/24 bg-black/20 px-4 py-3 text-white/72 transition hover:border-[#ff1744] hover:text-white">
            <span className="flex items-center gap-3"><Mail className="h-4 w-4 text-[#ff6b7f]" /> {PROFILE.email}</span>
            <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-1 group-hover:-translate-y-1" />
          </a>
          <a href={PROFILE.github} target="_blank" rel="noreferrer" className="group flex items-center justify-between border border-white/10 bg-black/15 px-4 py-3 text-white/62 transition hover:border-[#ff1744]/60 hover:text-white">
            <span className="flex items-center gap-3"><TerminalSquare className="h-4 w-4 text-[#ff6b7f]" /> github.com/POSHANMS</span>
            <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-1 group-hover:-translate-y-1" />
          </a>
          <a href={PROFILE.linkedin} target="_blank" rel="noreferrer" className="group flex items-center justify-between border border-white/10 bg-black/15 px-4 py-3 text-white/62 transition hover:border-[#ff1744]/60 hover:text-white">
            <span className="flex items-center gap-3"><Network className="h-4 w-4 text-[#ff6b7f]" /> linkedin.com/in/poshanms</span>
            <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-1 group-hover:-translate-y-1" />
          </a>
        </div>
      </div>
    </Panel>
  );
}

export default function CinematicJourney({ scrollProgress, visible }: { scrollProgress: number; visible: boolean }) {
  const [hoveredCube, setHoveredCube] = useState<CubeModuleId | null>(null);
  const [cubeTargets, setCubeTargets] = useState<Partial<Record<CubeModuleId, CubeHoverTarget>>>({});
  const cubeTargetsRef = useRef<Partial<Record<CubeModuleId, CubeHoverTarget>>>({});
  const cubeCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHoveringCubePanel = useRef(false);

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
            presence: visible ? chapterPresence(scrollProgress, chapter.range) : 0,
            progress: localProgress(scrollProgress, chapter.range),
          },
        ]),
      ) as Record<ChapterId, { presence: number; progress: number }>,
    [scrollProgress, visible],
  );
  const activeChapter = useMemo(
    () => {
      const bestVisible = chapters.reduce((best, chapter) => {
        const presence = chapterPresence(scrollProgress, chapter.range);
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

  return (
    <div className="fixed inset-0 z-[18] pointer-events-none" data-active-chapter={activeChapter}>
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
      <ProjectsChapter presence={states.projects.presence} progress={states.projects.progress} />
      <JourneyChapter presence={states.journey.presence} progress={states.journey.progress} />
      <ContactChapter presence={states.contact.presence} progress={states.contact.progress} />

      <div className="absolute right-8 top-24 hidden flex-col items-end gap-2 font-mono text-[9px] uppercase tracking-[0.26em] text-white/30 md:flex">
        {chapters.map((chapter) => {
          const active = chapterPresence(scrollProgress, chapter.range);
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
