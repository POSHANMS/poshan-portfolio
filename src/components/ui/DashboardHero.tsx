"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { FileText, ChevronDown, Activity, Terminal, Code2, Shield, Globe, Briefcase } from "lucide-react";

interface DashboardHeroProps {
  scrollProgress: number;
  stageScale: number;
  spatial?: boolean;
}

/* ═══════════════════════════════════════════════════════════════════════
   CINEMATIC HERO — Holographic Projection from Laptop
   
   Scroll Phases (0.0 → 1.0):
   ───────────────────────────
   0.00 - 0.18  EMERGENCE     : Panel projects out of laptop screen
   0.15 - 0.38  MATERIALIZE   : Content elements stagger in with blur
   0.35 - 0.68  STABILIZE     : Floating parallax, ambient glow pulse
   0.62 - 0.82  ASCENSION     : Panel lifts, tilts back, ready for exit
   0.78 - 1.00  DISSIPATION   : Fades into void for next section
   ═══════════════════════════════════════════════════════════════════════ */

const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const easeInOutQuart = (t: number) =>
  t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;

export default function DashboardHero({ scrollProgress, stageScale, spatial = false }: DashboardHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef(0);
  const rafRef = useRef(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const smoothMouse = useRef({ x: 0, y: 0 });

  /* ── Mouse tracking for parallax ── */
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePos({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  /* ── Time loop for floating animations (no Date.now() in render) ── */
  useEffect(() => {
    const tick = () => {
      timeRef.current += 0.016;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  /* ── Smooth mouse interpolation ── */
  smoothMouse.current.x += (mousePos.x - smoothMouse.current.x) * 0.08;
  smoothMouse.current.y += (mousePos.y - smoothMouse.current.y) * 0.08;
  const mx = smoothMouse.current.x;
  const my = smoothMouse.current.y;

  /* ── Scroll phase calculations ── */
  const p = scrollProgress;
  const phases = useMemo(() => ({
    emergence: Math.min(1, p / 0.18),           // 0-18%
    materialize: Math.min(1, Math.max(0, (p - 0.15) / 0.23)), // 15-38%
    stabilize: Math.min(1, Math.max(0, (p - 0.35) / 0.33)),   // 35-68%
    ascension: Math.min(1, Math.max(0, (p - 0.62) / 0.20)),   // 62-82%
    dissipation: Math.min(1, Math.max(0, (p - 0.78) / 0.22)), // 78-100%
  }), [p]);

  const t = timeRef.current;
  const emerge = easeOutExpo(phases.emergence);
  const ascend = easeInOutQuart(phases.ascension);
  const dissipate = phases.dissipation;

  /* ── Panel 3D projection transforms ── */
  const panelRotateX = 58 * (1 - emerge) - (18 * ascend);
  const panelRotateY = mx * 6 * phases.stabilize;
  const panelScale = (0.32 + 0.68 * easeOutBack(Math.min(1, emerge * 1.15))) * stageScale;
  const panelY = 220 * (1 - emerge) - (140 * ascend);
  const panelZ = -500 * (1 - emerge) + (180 * ascend);
  const panelOpacity = Math.min(1, emerge * 2.5) * (1 - Math.pow(dissipate, 1.8));

  /* ── Volumetric light beam ── */
  const beamOpacity = emerge * 0.75 * (1 - dissipate * 0.95);
  const beamScale = 0.25 + 0.75 * emerge;
  const beamPulse = 1 + Math.sin(t * 3) * 0.08 * phases.stabilize;

  /* ── Content stagger animation ── */
  const mat = phases.materialize;
  const contentOpacity = Math.min(1, mat * 2.2);
  const contentBlur = Math.max(0, 10 * (1 - mat));
  const contentLift = 30 * (1 - mat);

  /* ── Floating orbs physics ── */
  const floatActive = phases.stabilize * (1 - phases.ascension);
  const bob1 = Math.sin(t * 1.2) * 8 * floatActive;
  const bob2 = Math.cos(t * 0.9) * 10 * floatActive;

  const badges = [
    { icon: Activity, text: "HEALTHGPT: ML Healthcare System", delay: 0.00, dir: -1 },
    { icon: Terminal, text: "CAMPUS PORTAL: React 18 + Flask + Redis", delay: 0.07, dir: 1 },
    { icon: Code2, text: "DSA: 110+ Solved • LeetCode / GFG", delay: 0.14, dir: -1 },
    { icon: Shield, text: "CYBERSECURITY: TryHackMe Voyager Rank", delay: 0.21, dir: 1 },
  ];

  const socials = [
    { icon: Globe, href: "https://github.com/POSHANMS", label: "GitHub" },
    { icon: Briefcase, href: "https://linkedin.com/in/poshanms/", label: "LinkedIn" },
    { icon: FileText, href: "mailto:siddeshwaraprasanna5@gmail.com", label: "CV" },
  ];

  if (spatial) {
    const spatialLock = Math.min(1, Math.max(0, (p - 0.28) / 0.08));
    const dissolve = Math.min(1, Math.max(0, (p - 0.8) / 0.2));
    const stableGlow = 0.7 + Math.sin(t * 2.4) * 0.16 * spatialLock;

    return (
      <div
        ref={containerRef}
        id="home"
        className="pointer-events-auto relative w-[920px] max-w-[920px] select-none"
        style={{
          transformStyle: "preserve-3d",
          opacity: 1 - dissolve * 0.92,
        }}
      >
        <div
          className="absolute -inset-16 rounded-[36px] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 48%, rgba(255,34,68,0.22), rgba(255,34,68,0.08) 32%, transparent 68%), radial-gradient(circle at 22% 16%, rgba(255,180,190,0.12), transparent 42%)",
            filter: "blur(42px)",
            opacity: stableGlow,
          }}
        />

        <div
          className="relative overflow-hidden rounded-[28px] hero-glass-panel"
          style={{
            background:
              "linear-gradient(145deg, rgba(14,12,18,0.78), rgba(8,6,12,0.9) 52%, rgba(10,8,14,0.84))",
            backdropFilter: "blur(56px) saturate(185%)",
            WebkitBackdropFilter: "blur(56px) saturate(185%)",
            border: "1.5px solid rgba(255,34,68,0.36)",
            boxShadow:
              "inset 0 1px 1px rgba(255,255,255,0.16), inset 0 0 52px rgba(255,34,68,0.1), 0 0 72px rgba(255,34,68,0.24), 0 0 150px rgba(255,34,68,0.1), 0 48px 120px rgba(0,0,0,0.86)",
          }}
        >
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
              backgroundSize: "180px 180px",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,34,68,0.38) 1px, transparent 1px), linear-gradient(90deg, rgba(255,34,68,0.3) 1px, transparent 1px)",
              backgroundSize: "38px 38px",
            }}
          />
          <div
            className="absolute inset-x-0 top-0 h-px pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.72), rgba(255,34,68,0.72), transparent)",
              opacity: 0.78 + Math.sin(t * 3.2) * 0.16,
            }}
          />

          <div className="relative z-10 p-8 md:p-12">
            <div
              className="mb-10 flex items-center justify-between border-b border-white/[0.08] pb-5"
              style={{
                opacity: contentOpacity,
                filter: `blur(${contentBlur}px)`,
                transform: `translateY(${contentLift}px)`,
              }}
            >
              <div className="flex items-center gap-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span
                    className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400"
                    style={{ boxShadow: "0 0 10px rgba(52,211,153,0.9)" }}
                  />
                </span>
                <span className="font-mono text-[11px] font-bold tracking-[0.25em] text-emerald-400 uppercase">
                  Hologram Interface Online
                </span>
                <span className="hidden md:inline font-mono text-[10px] text-white/25 tracking-[0.2em]">
                  | SPATIAL PROJECTION v3.0
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                {socials.map((social, i) => {
                  const s = Math.min(1, Math.max(0, (mat - 0.2 - i * 0.06) * 5));
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={social.label}
                      className="group flex h-10 w-10 items-center justify-center rounded-xl border border-[#ff2244]/30 bg-black/35 text-white/65 transition-all duration-300 hover:scale-110 hover:border-[#ff2244]/80 hover:text-[#ff2244] hover:shadow-[0_0_22px_rgba(255,34,68,0.42)] hover:-translate-y-1"
                      style={{ opacity: s, transform: `translateY(${(1 - s) * 15}px)` }}
                    >
                      <social.icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                opacity: Math.min(1, mat * 2.4),
                filter: `blur(${Math.max(0, 7 * (1 - mat))}px)`,
                transform: `translateY(${Math.max(0, 24 * (1 - mat))}px)`,
              }}
            >
              <h1
                className="font-black uppercase"
                style={{
                  fontSize: "clamp(3.4rem, 6.8vw, 6.2rem)",
                  lineHeight: 1,
                  letterSpacing: "0",
                  background:
                    "linear-gradient(180deg, #ffffff 0%, #ffd7dc 24%, #ff2244 55%, #8c0014 84%, #430008 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  filter:
                    "drop-shadow(0 0 32px rgba(255,34,68,0.48)) drop-shadow(0 0 88px rgba(255,34,68,0.26))",
                }}
              >
                POSHAN M S
              </h1>

              <h2
                className="mb-8 mt-3 font-mono text-sm md:text-base font-semibold tracking-[0.18em] uppercase"
                style={{
                  color: "#ff2244",
                  textShadow: "0 0 20px rgba(255,34,68,0.74), 0 0 44px rgba(255,34,68,0.32)",
                }}
              >
                Full-Stack & AI Developer | Computer Science Engineer
              </h2>

              <p className="mb-10 max-w-2xl text-sm md:text-[15px] leading-[1.7] text-white/76">
                <span className="text-[#ff2244]/65">&ldquo;</span>
                Architecting scalable web platforms, intelligent ML diagnostics, and secure systems.
                <span className="text-[#ff2244]/65">&rdquo;</span>
              </p>
            </div>

            <div className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {badges.map((badge) => {
                const b = Math.min(1, Math.max(0, (mat - 0.42 - badge.delay) * 4));
                return (
                  <div
                    key={badge.text}
                    className="group flex items-center gap-3 rounded-xl border border-[#ff2244]/28 bg-[#ff2244]/[0.07] px-4 py-3.5 font-mono text-[11px] font-medium text-[#ff9aa6] shadow-[0_0_16px_rgba(255,34,68,0.1)] transition-all duration-300 hover:border-[#ff2244]/60 hover:bg-[#ff2244]/12 hover:shadow-[0_0_30px_rgba(255,34,68,0.2)] hover:-translate-y-0.5"
                    style={{
                      opacity: b,
                      transform: `translateX(${(1 - b) * badge.dir * 40}px) translateZ(18px)`,
                    }}
                  >
                    <badge.icon className="h-4 w-4 text-[#ff2244] transition-transform duration-300 group-hover:scale-110" />
                    <span>[ {badge.text} ]</span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between border-t border-white/[0.08] pt-5">
              <div className="flex items-center gap-4 font-mono text-[10px] text-white/42 tracking-[0.15em]">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  SYSTEM OPERATIONAL
                </span>
                <span className="text-white/20">|</span>
                <span>CORE: STABLE</span>
                <span className="text-white/20">|</span>
                <span>LATENCY: 12ms</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[10px] text-[#ff2244]/65 tracking-widest">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ff2244] animate-ping" />
                LIVE
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section
      ref={containerRef}
      id="home"
      className="pointer-events-none relative z-10 h-screen w-screen overflow-hidden"
      style={{ perspective: "1500px", perspectiveOrigin: "50% 65%" }}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          VOLUMETRIC LIGHT CONE — Projects from laptop screen upward
          ═══════════════════════════════════════════════════════════════════ */}
      <div
        className="absolute bottom-0 left-1/2 pointer-events-none"
        style={{
          width: "900px",
          height: "80vh",
          transform: "translateX(-50%) translateY(15%)",
          opacity: beamOpacity,
          transition: "opacity 0.05s linear",
        }}
      >
        {/* Primary conic beam */}
        <div
          className="absolute inset-0"
          style={{
            background: `conic-gradient(from 180deg at 50% 100%, transparent 0deg, rgba(255,23,68,0.12) 18deg, rgba(255,23,68,0.35) 35deg, rgba(255,80,60,0.28) 55deg, transparent 75deg, transparent 285deg, rgba(255,80,60,0.28) 305deg, rgba(255,23,68,0.35) 325deg, rgba(255,23,68,0.12) 342deg, transparent 360deg)`,
            filter: "blur(50px)",
            transform: `scaleY(${beamScale * beamPulse})`,
            transformOrigin: "bottom center",
          }}
        />
        {/* Radial core glow */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 40% 100% at 50% 100%, rgba(255,40,60,0.45) 0%, rgba(255,23,68,0.2) 30%, transparent 70%)",
            mixBlendMode: "screen",
            transform: `scaleY(${beamScale})`,
            transformOrigin: "bottom center",
          }}
        />
        {/* Scanline overlay on beam — parent owns scaleY, child owns animation */}
        <div
          className="absolute inset-0"
          style={{
            transform: `scaleY(${beamScale})`,
            transformOrigin: "bottom center",
          }}
        >
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: `repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(255,23,68,0.08) 8px, rgba(255,23,68,0.08) 9px)`,
              animation: "beam-scan 0.8s linear infinite",
            }}
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN HOLOGRAPHIC PANEL — Apple Vision Pro grade glassmorphism
          ═══════════════════════════════════════════════════════════════════ */}
      <div
        className="absolute inset-0 flex items-center justify-center px-4 md:px-8"
        style={{
          transform: `translate3d(${mx * 10 * phases.stabilize}px, ${panelY + my * 6 * phases.stabilize}px, ${panelZ}px) rotateX(${panelRotateX}deg) rotateY(${panelRotateY}deg) scale(${panelScale})`,
          opacity: panelOpacity,
          transformOrigin: "center 80%",
          transition: "none",
          willChange: "transform, opacity",
        }}
      >
        <div className="relative w-full max-w-[920px] pointer-events-auto">

          {/* Ambient Halo — pulsating glow behind panel */}
          <div
            className="absolute -inset-10 rounded-[40px] pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 50%, rgba(255,23,68,0.18) 0%, rgba(255,23,68,0.08) 30%, transparent 65%), radial-gradient(circle at 30% 20%, rgba(255,100,80,0.1) 0%, transparent 50%)`,
              filter: "blur(40px)",
              opacity: 0.8 + Math.sin(t * 2) * 0.2 * phases.stabilize,
            }}
          />

          {/* Main Glass Card */}
          <div
            className="relative overflow-hidden rounded-[28px] hero-glass-panel"
            style={{
              background: `linear-gradient(145deg, rgba(14, 12, 18, 0.78) 0%, rgba(8, 6, 12, 0.88) 50%, rgba(10, 8, 14, 0.82) 100%)`,
              backdropFilter: "blur(56px) saturate(180%)",
              WebkitBackdropFilter: "blur(56px) saturate(180%)",
              border: "1.5px solid rgba(255, 23, 68, 0.32)",
              boxShadow: `inset 0 1px 1px rgba(255,255,255,0.14), inset 0 0 50px rgba(255,23,68,0.08), 0 0 60px rgba(255,23,68,0.18), 0 0 120px rgba(255,23,68,0.08), 0 50px 120px rgba(0,0,0,0.85)`,
              animation: phases.stabilize > 0.1 ? "border-glow-pulse 4s ease-in-out infinite" : "none",
            }}
          >
            {/* Film grain noise overlay */}
            <div
              className="absolute inset-0 opacity-[0.035] pointer-events-none mix-blend-overlay"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                backgroundSize: "180px 180px",
              }}
            />

            {/* Specular edge highlight */}
            <div
              className="absolute inset-0 rounded-[28px] pointer-events-none"
              style={{
                background: `linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 25%, transparent 75%, rgba(255,23,68,0.25) 100%)`,
                maskImage: `linear-gradient(to bottom, black 0%, transparent 6%, transparent 94%, black 100%), linear-gradient(to right, black 0%, transparent 6%, transparent 94%, black 100%)`,
                WebkitMaskImage: `linear-gradient(to bottom, black 0%, transparent 6%, transparent 94%, black 100%), linear-gradient(to right, black 0%, transparent 6%, transparent 94%, black 100%)`,
                mixBlendMode: "overlay",
              }}
            />

            {/* Holographic grid overlay */}
            <div
              className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(rgba(255,23,68,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,23,68,0.3) 1px, transparent 1px)`,
                backgroundSize: "40px 40px",
              }}
            />

            {/* Glowing corner brackets */}
            <div className="absolute top-5 left-5 w-8 h-8">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#ff1744] to-transparent" style={{ boxShadow: "0 0 8px rgba(255,23,68,0.8)" }} />
              <div className="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-[#ff1744] to-transparent" style={{ boxShadow: "0 0 8px rgba(255,23,68,0.8)" }} />
            </div>
            <div className="absolute top-5 right-5 w-8 h-8">
              <div className="absolute top-0 right-0 w-full h-[2px] bg-gradient-to-l from-[#ff1744] to-transparent" style={{ boxShadow: "0 0 8px rgba(255,23,68,0.8)" }} />
              <div className="absolute top-0 right-0 w-[2px] h-full bg-gradient-to-b from-[#ff1744] to-transparent" style={{ boxShadow: "0 0 8px rgba(255,23,68,0.8)" }} />
            </div>
            <div className="absolute bottom-5 left-5 w-8 h-8">
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#ff1744] to-transparent" style={{ boxShadow: "0 0 8px rgba(255,23,68,0.8)" }} />
              <div className="absolute bottom-0 left-0 w-[2px] h-full bg-gradient-to-t from-[#ff1744] to-transparent" style={{ boxShadow: "0 0 8px rgba(255,23,68,0.8)" }} />
            </div>
            <div className="absolute bottom-5 right-5 w-8 h-8">
              <div className="absolute bottom-0 right-0 w-full h-[2px] bg-gradient-to-l from-[#ff1744] to-transparent" style={{ boxShadow: "0 0 8px rgba(255,23,68,0.8)" }} />
              <div className="absolute bottom-0 right-0 w-[2px] h-full bg-gradient-to-t from-[#ff1744] to-transparent" style={{ boxShadow: "0 0 8px rgba(255,23,68,0.8)" }} />
            </div>

            {/* ── CONTENT ── */}
            <div
              className="relative z-10 p-8 md:p-12"
              style={{
                opacity: contentOpacity,
                filter: `blur(${contentBlur}px)`,
                transform: `translateY(${contentLift}px)`,
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-10 border-b border-white/[0.08] pb-5">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 10px rgba(52,211,153,0.9)" }} />
                  </span>
                  <span className="font-mono text-[11px] font-bold tracking-[0.25em] text-emerald-400 uppercase">
                    Hologram Interface Online
                  </span>
                  <span className="hidden md:inline font-mono text-[10px] text-white/25 tracking-[0.2em]">
                    | SPATIAL PROJECTION v2.4
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  {socials.map((social, i) => {
                    const s = Math.min(1, Math.max(0, (mat - 0.25 - i * 0.06) * 5));
                    return (
                      <a
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={social.label}
                        className="group flex h-10 w-10 items-center justify-center rounded-xl border border-[#ff1744]/25 bg-black/30 text-white/60 transition-all duration-300 hover:scale-110 hover:border-[#ff1744]/70 hover:text-[#ff1744] hover:shadow-[0_0_20px_rgba(255,23,68,0.35)] hover:-translate-y-1"
                        style={{ opacity: s, transform: `translateY(${(1 - s) * 15}px)` }}
                      >
                        <social.icon className="h-4 w-4" />
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* Name — Massive gradient with bloom */}
              <div className="mb-3">
                <h1
                  className="font-black uppercase"
                  style={{
                    fontSize: "clamp(3rem, 7vw, 6rem)",
                    lineHeight: 1.0,
                    letterSpacing: "-0.03em",
                    background: "linear-gradient(180deg, #ffffff 0%, #ffcdd2 25%, #ff1744 55%, #800010 85%, #400008 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    filter: "drop-shadow(0 0 30px rgba(255,23,68,0.45)) drop-shadow(0 0 80px rgba(255,23,68,0.25))",
                  }}
                >
                  POSHAN M S
                </h1>
              </div>

              {/* Subtitle */}
              <div className="mb-8">
                <h2
                  className="font-mono text-sm md:text-base font-semibold tracking-[0.18em] uppercase"
                  style={{
                    color: "#ff1744",
                    textShadow: "0 0 20px rgba(255,23,68,0.7), 0 0 40px rgba(255,23,68,0.3)",
                    opacity: Math.min(1, (mat - 0.3) * 3),
                    transform: `translateX(${(1 - Math.min(1, (mat - 0.3) * 3)) * -20}px)`,
                  }}
                >
                  Full-Stack & AI Developer | Computer Science Engineer
                </h2>
              </div>

              {/* Quote */}
              <p
                className="text-sm md:text-[15px] text-white/75 max-w-2xl leading-[1.7] mb-10"
                style={{
                  opacity: Math.min(1, (mat - 0.4) * 2.5),
                  transform: `translateY(${(1 - Math.min(1, (mat - 0.4) * 2.5)) * 15}px)`,
                }}
              >
                <span className="text-[#ff1744]/60">&ldquo;</span>
                Architecting scalable web platforms, intelligent ML diagnostics, and secure systems.
                <span className="text-[#ff1744]/60">&rdquo;</span>
              </p>

              {/* Project Badges — staggered slide-in */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
                {badges.map((badge) => {
                  const b = Math.min(1, Math.max(0, (mat - 0.45 - badge.delay) * 4));
                  return (
                    <div
                      key={badge.text}
                      className="group flex items-center gap-3 rounded-xl border border-[#ff1744]/25 bg-[#ff1744]/[0.06] px-4 py-3.5 font-mono text-[11px] font-medium text-[#ff8a95] shadow-[0_0_14px_rgba(255,23,68,0.08)] transition-all duration-300 hover:border-[#ff1744]/55 hover:bg-[#ff1744]/12 hover:shadow-[0_0_28px_rgba(255,23,68,0.18)] hover:-translate-y-0.5 cursor-default"
                      style={{
                        opacity: b,
                        transform: `translateX(${(1 - b) * badge.dir * 40}px)`,
                      }}
                    >
                      <badge.icon className="h-4 w-4 text-[#ff1744] transition-transform duration-300 group-hover:scale-110" />
                      <span>[ {badge.text} ]</span>
                    </div>
                  );
                })}
              </div>

              {/* Footer Status Bar */}
              <div className="flex items-center justify-between border-t border-white/[0.08] pt-5">
                <div className="flex items-center gap-4 font-mono text-[10px] text-white/40 tracking-[0.15em]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    SYSTEM OPERATIONAL
                  </span>
                  <span className="text-white/20">|</span>
                  <span>CORE: STABLE</span>
                  <span className="text-white/20">|</span>
                  <span>LATENCY: 12ms</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px] text-[#ff1744]/60 tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff1744] animate-ping" />
                  LIVE
                </div>
              </div>
            </div>
          </div>

          {/* Floating Stat Orb — Right (Projects) */}
          <div
            className="absolute -right-20 top-1/4 hidden xl:flex flex-col items-center justify-center w-28 h-28 rounded-full border border-[#ff1744]/20 bg-[#ff1744]/[0.06] backdrop-blur-md pointer-events-none"
            style={{
              opacity: floatActive * 0.8,
              transform: `translateY(${bob1}px)`,
              boxShadow: "0 0 40px rgba(255,23,68,0.12), inset 0 0 20px rgba(255,23,68,0.05)",
              animation: floatActive > 0.1 ? "hero-float-1 4s ease-in-out infinite" : "none",
            }}
          >
            <div className="text-3xl font-black text-white/90">20+</div>
            <div className="text-[9px] font-mono text-white/50 tracking-[0.2em] mt-1">PROJECTS</div>
          </div>

          {/* Floating Stat Orb — Left (Years) */}
          <div
            className="absolute -left-16 bottom-1/4 hidden xl:flex flex-col items-center justify-center w-24 h-24 rounded-2xl border border-[#ff1744]/20 bg-[#ff1744]/[0.06] backdrop-blur-md rotate-12 pointer-events-none"
            style={{
              opacity: floatActive * 0.8,
              transform: `translateY(${bob2}px) rotate(12deg)`,
              boxShadow: "0 0 30px rgba(255,23,68,0.1)",
              animation: floatActive > 0.1 ? "hero-float-2 5s ease-in-out infinite" : "none",
            }}
          >
            <div className="text-2xl font-black text-white/90 -rotate-12">3+</div>
            <div className="text-[8px] font-mono text-white/50 tracking-[0.2em] mt-0.5 -rotate-12">YEARS EXP</div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          BOTTOM SCROLL CTA — Fades during ascension
          ═══════════════════════════════════════════════════════════════════ */}
      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
        style={{
          opacity: (1 - phases.ascension) * phases.stabilize,
          transform: `translateY(${phases.ascension * 50}px)`,
        }}
      >
        <span
          className="font-mono text-[10px] tracking-[0.4em] uppercase"
          style={{
            color: "rgba(255,23,68,0.7)",
            textShadow: "0 0 12px rgba(255,23,68,0.5)",
          }}
        >
          [ Scroll to Dive into Core System ]
        </span>
        <div className="flex flex-col items-center -space-y-1 animate-bounce">
          <ChevronDown className="h-4 w-4 text-[#ff1744]/60" />
          <ChevronDown className="h-4 w-4 text-[#ff1744]/35" />
        </div>
      </div>
    </section>
  );
}
