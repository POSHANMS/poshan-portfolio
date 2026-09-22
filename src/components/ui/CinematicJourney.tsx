"use client";

import React, { useMemo } from "react";
import {
  ArrowUpRight,
  BrainCircuit,
  Braces,
  Cpu,
  Database,
  GraduationCap,
  Mail,
  Network,
  Radio,
  Server,
  ShieldCheck,
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

const skillIcons = [Braces, Server, Database, Network, BrainCircuit, ShieldCheck];

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

function SkillsChapter({ presence, progress }: { presence: number; progress: number }) {
  const groups = SKILL_GROUPS.slice(0, 12);
  const coreGroups = groups.slice(0, 6);
  const supportGroups = groups.slice(6);
  const activeIndex = Math.min(groups.length - 1, Math.floor(progress * groups.length));

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
      <div className="skill-engine-field absolute inset-0" />
      <div className="skill-engine-grid absolute inset-0" />
      <div className="skill-engine-comet absolute left-[44%] top-[52%]" />
      <div className="absolute inset-y-0 left-0 w-[72vw] bg-gradient-to-r from-black/92 via-black/70 to-transparent" />
      <div className="absolute inset-y-0 right-0 hidden w-[44vw] bg-gradient-to-l from-black/82 via-black/34 to-transparent md:block" />

      <div className="absolute left-6 top-[8vh] w-[min(37rem,calc(100vw-3rem))] md:left-16">
        <Kicker act="ACT III" label="Skill Constellation" />
        <h2 className="max-w-lg text-4xl font-black uppercase leading-[0.9] text-white md:text-6xl">
          Stack Engine
        </h2>
        <p className="mt-5 max-w-lg text-sm leading-7 text-white/64">
          The laptop pulls back and the floating cubes become a map of the tools Poshan uses to build, ship, secure, and explain software.
        </p>
        <div className="mt-5 flex max-w-xl flex-wrap gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/70">
          {["Python", "React", "Flask", "SQL", "Google ADK", "Docker"].map((item, index) => (
            <span
              key={item}
              className="border border-[#ff1744]/35 bg-[#ff1744]/10 px-3 py-2 text-[#ffd7de]"
              style={{
                opacity: smoothstep(index * 0.035, index * 0.035 + 0.16, progress),
                transform: `translateY(${(1 - smoothstep(index * 0.035, index * 0.035 + 0.16, progress)) * 12}px)`,
              }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="skill-engine-core absolute left-1/2 top-[50%] hidden h-[23rem] w-[23rem] -translate-x-1/2 -translate-y-1/2 md:block">
        <div className="absolute inset-0 rounded-full border border-[#ff1744]/28" />
        <div className="absolute inset-[12%] rounded-full border border-white/16" />
        <div className="absolute inset-[28%] rounded-full border border-[#ff6b7f]/22" />
        <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 border border-white/45 bg-[#ff1744]/15 shadow-[0_0_70px_rgba(255,23,68,0.55)]" />
        {coreGroups.map(([group], index) => {
          const angle = (Math.PI * 2 * index) / coreGroups.length - Math.PI / 2;
          const reveal = smoothstep(0.08 + index * 0.045, 0.25 + index * 0.045, progress);
          const x = Math.cos(angle) * 10.1;
          const y = Math.sin(angle) * 10.1;
          const Icon = skillIcons[index] ?? Cpu;
          return (
            <div
              key={group}
              className="absolute flex h-24 w-32 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center border border-white/14 bg-black/35 text-center shadow-[0_0_34px_rgba(255,23,68,0.12)] backdrop-blur-sm"
              style={{
                left: `calc(50% + ${x}rem)`,
                top: `calc(50% + ${y}rem)`,
                opacity: reveal,
                transform: `translate(-50%, -50%) scale(${0.84 + reveal * 0.16})`,
              }}
            >
              <Icon className="mb-2 h-5 w-5 text-[#ff6b7f]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white">{group}</span>
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-[11vh] left-6 right-6 grid max-h-[40vh] gap-3 overflow-hidden md:left-16 md:right-16 md:grid-cols-3">
        {supportGroups.slice(0, 6).map(([group, skills], index) => {
          const laneIndex = index + 6;
          const reveal = smoothstep(0.22 + index * 0.04, 0.42 + index * 0.04, progress);
          const active = activeIndex === laneIndex || activeIndex === laneIndex - 1;
          return (
            <div
              key={group}
              className="skill-lane min-h-[5.4rem] border-l border-[#ff1744]/35 bg-black/55 px-4 py-3 backdrop-blur-[2px]"
              style={{
                opacity: reveal,
                transform: `translateY(${(1 - reveal) * 22}px)`,
                boxShadow: active ? "0 0 32px rgba(255,23,68,0.2)" : "none",
              }}
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#ff6b7f]">{group}</h3>
                <span className="font-mono text-[9px] text-white/28">0{laneIndex + 1}</span>
              </div>
              <p className="line-clamp-2 text-xs leading-5 text-white/72">{skills.slice(0, 5).join(" / ")}</p>
            </div>
          );
        })}
      </div>

      <div className="absolute right-6 top-[10vh] hidden w-[min(32rem,34vw)] bg-black/46 p-5 backdrop-blur-[2px] md:block">
        <div className="mb-4 flex items-center justify-between border-b border-[#ff1744]/28 pb-3 font-mono text-[10px] uppercase tracking-[0.18em]">
          <span className="text-[#ff6b7f]">Live Stack Readout</span>
          <span className="text-white/32">{Math.round(progress * 100).toString().padStart(2, "0")}%</span>
        </div>
        <div className="space-y-3">
          {coreGroups.map(([group, skills], index) => {
            const reveal = smoothstep(index * 0.055, index * 0.055 + 0.2, progress);
            return (
              <div key={group} className="grid grid-cols-[7rem_1fr] gap-4" style={{ opacity: reveal }}>
                <h3 className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#ff6b7f]">{group}</h3>
                <p className="text-xs leading-5 text-white/64">{skills.slice(0, 6).join(" / ")}</p>
              </div>
            );
          })}
        </div>
      </div>
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

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[18] pointer-events-none" data-active-chapter={activeChapter}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,transparent_0%,transparent_53%,rgba(0,0,0,0.28)_100%)]" />
      <HeroChapter presence={states.hero.presence} />
      <EnterLaptopCue scrollProgress={scrollProgress} />
      <ActTwoAboutWorld presence={states.laptop.presence} progress={states.laptop.progress} />
      <SkillsChapter presence={states.skills.presence} progress={states.skills.progress} />
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
