"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  FileText,
  Globe,
  Briefcase,
  Activity,
  Terminal,
  Code2,
  Shield,
  ChevronDown,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════════ */
interface DashboardHeroProps {
  scrollProgress: number;
  stageScale?: number;
  spatial?: boolean;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   DESIGN TOKENS
   ═══════════════════════════════════════════════════════════════════════════════ */
const C = {
  crimson: "#ff1744",
  crimsonBright: "#ff3355",
  crimsonDark: "#800010",
  cyan: "#00f0ff",
  white: "#ffffff",
  void: "#0a0002",
  emerald: "#34d399",
  amber: "#fbbf24",
} as const;

const BADGES = [
  {
    icon: Activity,
    title: "HEALTHGPT",
    subtitle: "ML Healthcare Diagnostics",
    delay: 0.0,
    dir: -1,
    color: C.crimson,
    glow: "rgba(255, 23, 68, 0.35)",
  },
  {
    icon: Terminal,
    title: "CAMPUS PORTAL",
    subtitle: "React 18 + Flask Ecosystem",
    delay: 0.08,
    dir: 1,
    color: C.crimsonBright,
    glow: "rgba(255, 51, 85, 0.35)",
  },
  {
    icon: Code2,
    title: "DSA MASTERY",
    subtitle: "110+ Solved • LeetCode / GFG",
    delay: 0.16,
    dir: -1,
    color: C.amber,
    glow: "rgba(251, 191, 36, 0.25)",
  },
  {
    icon: Shield,
    title: "CYBERSECURITY",
    subtitle: "TryHackMe Voyager Rank",
    delay: 0.24,
    dir: 1,
    color: C.emerald,
    glow: "rgba(52, 211, 153, 0.25)",
  },
] as const;

const SOCIALS = [
  {
    icon: Globe,
    href: "https://github.com/POSHANMS",
    label: "GitHub",
    color: C.crimson,
  },
  {
    icon: Briefcase,
    href: "https://linkedin.com/in/poshanms/",
    label: "LinkedIn",
    color: C.crimsonBright,
  },
  {
    icon: FileText,
    href: "mailto:siddeshwaraprasanna5@gmail.com",
    label: "Email",
    color: C.white,
  },
] as const;

/* ═══════════════════════════════════════════════════════════════════════════════
   MATH UTILITIES
   ═══════════════════════════════════════════════════════════════════════════════ */
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const easeInOutQuart = (t: number) =>
  t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;

/* ═══════════════════════════════════════════════════════════════════════════════
   CINEMATIC KEYFRAMES — Injected via <style> for self-containment
   ═══════════════════════════════════════════════════════════════════════════════ */
const CinematicStyles = React.memo(function CinematicStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
      @keyframes corner-draw {
        0% { stroke-dashoffset: 80; opacity: 0; filter: drop-shadow(0 0 0px rgba(255,23,68,0)); }
        60% { opacity: 1; }
        100% { stroke-dashoffset: 0; opacity: 1; filter: drop-shadow(0 0 8px rgba(255,23,68,0.9)); }
      }
      @keyframes scanline-drift {
        0% { transform: translateY(0); }
        100% { transform: translateY(4px); }
      }
      @keyframes grain-shift {
        0%,100%{transform:translate(0,0)} 10%{transform:translate(-2%,-1%)} 20%{transform:translate(1%,2%)}
        30%{transform:translate(-1%,1%)} 40%{transform:translate(2%,-1%)} 50%{transform:translate(-2%,0%)}
        60%{transform:translate(1%,0%)} 70%{transform:translate(0%,2%)} 80%{transform:translate(0%,-1%)}
        90%{transform:translate(2%,1%)}
      }
      @keyframes border-breathe {
        0%,100%{ box-shadow: inset 0 1px 1px rgba(255,255,255,0.12), inset 0 0 40px rgba(255,23,68,0.06), 0 0 55px rgba(255,23,68,0.16), 0 0 110px rgba(255,23,68,0.06), 0 40px 100px rgba(0,0,0,0.85); }
        50%{ box-shadow: inset 0 1px 1px rgba(255,255,255,0.16), inset 0 0 55px rgba(255,23,68,0.10), 0 0 80px rgba(255,23,68,0.24), 0 0 130px rgba(255,23,68,0.10), 0 40px 100px rgba(0,0,0,0.85); }
      }
      @keyframes hologram-flicker {
        0%,100%{opacity:0.98} 5%{opacity:0.95} 10%{opacity:0.99} 15%{opacity:0.94} 20%{opacity:1}
        50%{opacity:0.96} 52%{opacity:1} 55%{opacity:0.95} 80%{opacity:0.98} 85%{opacity:0.94} 90%{opacity:0.97}
      }
      @keyframes float-orb-1 {
        0%,100%{transform:translateY(0px) rotate(0deg)} 50%{transform:translateY(-12px) rotate(1deg)}
      }
      @keyframes float-orb-2 {
        0%,100%{transform:translateY(0px) rotate(12deg)} 50%{transform:translateY(-16px) rotate(14deg)}
      }
      @keyframes status-blink {
        0%,100%{opacity:1} 50%{opacity:0.25}
      }
      @keyframes data-stream {
        0%{background-position:0% 0%} 100%{background-position:0% 100%}
      }
      @keyframes waveform-pulse {
        from { transform: scaleY(0.3); opacity: 0.4; }
        to { transform: scaleY(1); opacity: 1; }
      }
      @keyframes dust-float {
        0% { transform: translate(0, 0); opacity: 0.25; }
        100% { transform: translate(6px, -10px); opacity: 0.6; }
      }
      @keyframes rotate-slow {
        from { transform: rotate(0deg); } to { transform: rotate(360deg); }
      }
      @keyframes rotate-slow-reverse {
        from { transform: rotate(360deg); } to { transform: rotate(0deg); }
      }
      .dashboard-glass {
        animation: border-breathe 4s ease-in-out infinite, hologram-flicker 5s infinite;
      }
      .corner-bracket-anim {
        animation: corner-draw 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        animation-delay: var(--delay, 0s);
      }
      .orb-float-1 { animation: float-orb-1 5.5s ease-in-out infinite; }
      .orb-float-2 { animation: float-orb-2 6.5s ease-in-out infinite; }
      .status-dot { animation: status-blink 2s ease-in-out infinite; }
      .scanline-layer {
        background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,23,68,0.025) 2px, rgba(255,23,68,0.025) 4px);
        animation: scanline-drift 0.5s linear infinite;
      }
      .grain-layer {
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
        background-size: 200px 200px;
        animation: grain-shift 0.5s steps(1) infinite;
      }
    `,
      }}
    />
  );
});


/* ═══════════════════════════════════════════════════════════════════════════════
   VISUAL SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════════ */

/** Animated SVG corner bracket with stroke-draw effect */
function CornerBracket({
  position,
  delay = 0,
  size = 32,
  strokeWidth = 1.5,
}: {
  position: "tl" | "tr" | "bl" | "br";
  delay?: number;
  size?: number;
  strokeWidth?: number;
}) {
  const paths = {
    tl: `M${size} 2H2V${size}`,
    tr: `M0 2H${size - 2}V${size}`,
    bl: `M${size} ${size - 2}H2V0`,
    br: `M0 ${size - 2}H${size - 2}V0`,
  };

  const posStyle: React.CSSProperties = {
    position: "absolute",
    top: position === "tl" || position === "tr" ? 20 : undefined,
    bottom: position === "bl" || position === "br" ? 20 : undefined,
    left: position === "tl" || position === "bl" ? 20 : undefined,
    right: position === "tr" || position === "br" ? 20 : undefined,
    width: size,
    height: size,
    zIndex: 20,
    pointerEvents: "none",
  };

  return (
    <div style={posStyle}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        style={{ overflow: "visible" }}
      >
        <path
          d={paths[position]}
          stroke={C.crimson}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="corner-bracket-anim"
          style={{
            strokeDasharray: 80,
            strokeDashoffset: 80,
            filter: `drop-shadow(0 0 6px ${C.crimson})`,
            ["--delay" as string]: `${delay}s`,
          }}
        />
      </svg>
    </div>
  );
}

/** Status indicator with dual-ring ping animation */
function StatusPulse({
  color = C.emerald,
  delay = 0,
  size = 2.5,
}: {
  color?: string;
  delay?: number;
  size?: number;
}) {
  const s = size;
  return (
    <span className="relative inline-flex" style={{ width: s * 4, height: s * 4 }}>
      <span
        className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
        style={{ backgroundColor: color, animationDelay: `${delay}s` }}
      />
      <span
        className="relative inline-flex rounded-full status-dot"
        style={{
          width: s * 4,
          height: s * 4,
          backgroundColor: color,
          boxShadow: `0 0 ${s * 6}px ${color}`,
          animationDelay: `${delay}s`,
        }}
      />
    </span>
  );
}

/** High-fidelity scanline overlay */
function ScanlineOverlay({ opacity = 0.35 }: { opacity?: number }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none scanline-layer mix-blend-overlay"
      style={{ opacity, zIndex: 10 }}
    />
  );
}

/** Film grain noise overlay */
function GrainOverlay({ opacity = 0.035 }: { opacity?: number }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none grain-layer mix-blend-overlay"
      style={{ opacity, zIndex: 11 }}
    />
  );
}

/** Cinematic vignette — darkens edges for focus */
function VignetteOverlay({ opacity = 0.15 }: { opacity?: number }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: `radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,${opacity}) 100%)`,
        mixBlendMode: "multiply",
        zIndex: 15,
      }}
    />
  );
}

/** Specular edge highlight — gives glass physical presence */
function SpecularHighlight({ radius = 28 }: { radius?: number }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        borderRadius: radius,
        background: `linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 25%, transparent 75%, rgba(255,23,68,0.25) 100%)`,
        maskImage: `linear-gradient(to bottom, black 0%, transparent 5%, transparent 95%, black 100%), linear-gradient(to right, black 0%, transparent 5%, transparent 95%, black 100%)`,
        WebkitMaskImage: `linear-gradient(to bottom, black 0%, transparent 5%, transparent 95%, black 100%), linear-gradient(to right, black 0%, transparent 5%, transparent 95%, black 100%)`,
        mixBlendMode: "overlay",
        opacity: 0.8,
        zIndex: 12,
      }}
    />
  );
}

/** Inner holographic grid — subtle structural lines */
function Hologrid({ opacity = 0.035, size = 40 }: { opacity?: number; size?: number }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `linear-gradient(rgba(255,23,68,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,23,68,0.3) 1px, transparent 1px)`,
        backgroundSize: `${size}px ${size}px`,
        opacity,
        zIndex: 8,
      }}
    />
  );
}

/** Animated top glow line — scans across top edge */
function TopGlowLine({ t }: { t: number }) {
  return (
    <div
      className="absolute inset-x-0 top-0 h-px pointer-events-none"
      style={{
        background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.7), rgba(255,34,68,0.85), transparent)`,
        opacity: 0.75 + Math.sin(t * 3.2) * 0.15,
        zIndex: 16,
      }}
    />
  );
}

/** Data stream decoration — vertical flowing lines */
function DataStream({
  position,
  active,
}: {
  position: { left?: string; right?: string; top?: string };
  active: number;
}) {
  return (
    <div
      className="absolute pointer-events-none hidden lg:block"
      style={{
        ...position,
        width: 2,
        height: 120,
        opacity: active * 0.22,
        background: `linear-gradient(to bottom, transparent, ${C.crimson}, transparent)`,
        backgroundSize: "100% 200%",
        animation: "data-stream 2s linear infinite",
        filter: "blur(1px)",
        zIndex: 5,
      }}
    />
  );
}

/** Rotating decorative ring around panel */
function DecoRing({
  size,
  duration,
  reverse = false,
  opacity = 0.08,
}: {
  size: number;
  duration: number;
  reverse?: boolean;
  opacity?: number;
}) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        inset: -size / 2,
        border: `1px solid ${C.crimson}`,
        borderRadius: "50%",
        opacity,
        animation: `${reverse ? "rotate-slow-reverse" : "rotate-slow"} ${duration}s linear infinite`,
        zIndex: 3,
      }}
    />
  );
}


/* ═══════════════════════════════════════════════════════════════════════════════
   CINEMATIC HOOKS
   ═══════════════════════════════════════════════════════════════════════════════ */

/** Real-time synchronized animation clock */
function useCinematicTime() {
  const timeRef = useRef(0);
  const rafRef = useRef(0);
  useEffect(() => {
    let last = performance.now();
    const tick = (now: number) => {
      timeRef.current += Math.min((now - last) / 1000, 0.05);
      last = now;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);
  return timeRef;
}

/** Smooth mouse parallax with exponential decay */
function useMouseParallax(smoothing = 0.08) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const smooth = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setMouse({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
  smooth.current.x += (mouse.x - smooth.current.x) * smoothing;
  smooth.current.y += (mouse.y - smooth.current.y) * smoothing;
  return smooth.current;
}

/** Live clock for status bar */
function useLiveClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => {
      const n = new Date();
      setTime(
        n.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }) +
        " UTC"
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

/** Typewriter effect for cinematic subtitle reveal */
function useTypewriter(text: string, speed = 45, delay = 600) {
  const [display, setDisplay] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    let i = 0;
    let timer: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      timer = setInterval(() => {
        i++;
        setDisplay(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(timer);
          setDone(true);
        }
      }, speed);
    }, delay);
    return () => {
      clearTimeout(start);
      clearInterval(timer);
    };
  }, [text, speed, delay]);
  return { display, done };
}

/* ═══════════════════════════════════════════════════════════════════════════════
   CONTENT SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════════ */

/** Animated sound-wave bars for status bar */
function SoundWave({ active = true, count = 5 }: { active?: boolean; count?: number }) {
  return (
    <span className="inline-flex items-end gap-[2px] h-3">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className="inline-block w-[2px] rounded-full bg-emerald-400/80"
          style={{
            height: active ? undefined : 3,
            animation: active ? `waveform-pulse 1.1s ease-in-out ${i * 0.12}s infinite alternate` : undefined,
            boxShadow: active ? "0 0 4px rgba(52,211,153,0.6)" : undefined,
          }}
        />
      ))}
    </span>
  );
}

/** Glass project badge with chromatic hover */
function BadgeCard({
  badge,
  reveal,
}: {
  badge: (typeof BADGES)[number];
  reveal: number;
}) {
  const b = clamp(reveal - badge.delay, 0, 1);
  const dir = badge.dir;
  return (
    <div
      style={{
        opacity: b,
        transform: `translateX(${(1 - b) * dir * 50}px) translateY(${(1 - b) * 12}px)`,
        transition: "opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      <div
        className="group relative flex items-center gap-3.5 rounded-xl border px-5 py-4 font-mono text-[11px] font-medium transition-all duration-300 hover:-translate-y-1 cursor-default overflow-hidden"
        style={{
          borderColor: `rgba(255, 23, 68, 0.28)`,
          background: `linear-gradient(135deg, rgba(255,23,68,0.06), rgba(255,23,68,0.02))`,
          boxShadow: `0 0 18px rgba(255,23,68,0.06), inset 0 1px 0 rgba(255,255,255,0.06)`,
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          el.style.borderColor = "rgba(255, 23, 68, 0.7)";
          el.style.boxShadow = `0 0 32px ${badge.glow}, inset 0 1px 0 rgba(255,255,255,0.12)`;
          el.style.background = `linear-gradient(135deg, ${badge.glow.replace("0.35", "0.14")}, rgba(255,23,68,0.04))`;
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.borderColor = "rgba(255, 23, 68, 0.28)";
          el.style.boxShadow = `0 0 18px rgba(255,23,68,0.06), inset 0 1px 0 rgba(255,255,255,0.06)`;
          el.style.background = `linear-gradient(135deg, rgba(255,23,68,0.06), rgba(255,23,68,0.02))`;
        }}
      >
        {/* Hover chromatic aberration overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `linear-gradient(90deg, transparent 30%, ${badge.glow.replace("0.35", "0.08")} 50%, transparent 70%)`,
            mixBlendMode: "screen",
          }}
        />
        <badge.icon className="relative z-10 h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ color: badge.color }} />
        <div className="relative z-10 flex flex-col gap-0.5">
          <span className="font-bold tracking-wider" style={{ color: badge.color }}>
            [ {badge.title} ]
          </span>
          <span className="text-white/65">{badge.subtitle}</span>
        </div>
      </div>
    </div>
  );
}

/** Social icon orb */
function SocialOrb({
  social,
  reveal,
  index,
}: {
  social: (typeof SOCIALS)[number];
  reveal: number;
  index: number;
}) {
  const s = clamp(reveal - 0.25 - index * 0.06, 0, 1);
  return (
    <a
      href={social.href}
      target="_blank"
      rel="noreferrer"
      aria-label={social.label}
      className="group relative flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-300 hover:scale-110 hover:-translate-y-1"
      style={{
        opacity: s,
        transform: `translateY(${(1 - s) * 18}px)`,
        borderColor: "rgba(255, 23, 68, 0.35)",
        background: "rgba(0,0,0,0.35)",
        boxShadow: "0 0 12px rgba(255,23,68,0.08)",
        backdropFilter: "blur(8px)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = social.color;
        e.currentTarget.style.color = social.color;
        e.currentTarget.style.boxShadow = `0 0 24px ${social.color}66`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255, 23, 68, 0.35)";
        e.currentTarget.style.color = "rgba(255,255,255,0.65)";
        e.currentTarget.style.boxShadow = "0 0 12px rgba(255,23,68,0.08)";
      }}
    >
      <social.icon className="h-4 w-4 text-white/65 transition-colors duration-300 group-hover:text-current" />
    </a>
  );
}

/** Floating stat orb */
function StatOrb({
  value,
  label,
  position,
  floatClass,
  reveal,
}: {
  value: string;
  label: string;
  position: React.CSSProperties;
  floatClass: string;
  reveal: number;
}) {
  const timeRef = useCinematicTime();
  const t = timeRef.current;
  const op = reveal * 0.85;
  return (
    <div
      className={`absolute hidden xl:flex flex-col items-center justify-center pointer-events-none ${floatClass}`}
      style={{
        ...position,
        opacity: op,
        width: 110,
        height: 110,
        borderRadius: "50%",
        border: "1px solid rgba(255, 23, 68, 0.22)",
        background: "linear-gradient(145deg, rgba(255,23,68,0.07), rgba(255,23,68,0.02))",
        backdropFilter: "blur(14px)",
        boxShadow: `0 0 35px rgba(255,23,68,0.1), inset 0 0 20px rgba(255,23,68,0.04)`,
      }}
    >
      <div className="text-3xl font-black text-white/90" style={{ textShadow: "0 0 16px rgba(255,23,68,0.5)" }}>
        {value}
      </div>
      <div className="text-[9px] font-mono text-white/50 tracking-[0.2em] mt-1">{label}</div>
      {/* Orbiting ring */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          border: "1px solid rgba(255, 23, 68, 0.15)",
          transform: `rotate(${t * 12}deg) scale(1.15)`,
        }}
      />
    </div>
  );
}

/** CSS Particle dust overlay */
function ParticleDust({ opacity = 0.4 }: { opacity?: number }) {
  const dust = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: 1 + Math.random() * 2,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 4,
    }));
  }, []);
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {dust.map((d, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: d.left,
            top: d.top,
            width: d.size,
            height: d.size,
            background: "rgba(255, 200, 200, 0.35)",
            boxShadow: `0 0 ${d.size * 3}px rgba(255,23,68,0.25)`,
            animation: `dust-float ${d.duration}s ease-in-out ${d.delay}s infinite alternate`,
            opacity: opacity,
          }}
        />
      ))}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD HERO COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════ */

export default function DashboardHero({
  scrollProgress,
  stageScale = 1,
  spatial = false,
}: DashboardHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const timeRef = useCinematicTime();
  const mouse = useMouseParallax(0.08);
  const clock = useLiveClock();
  const t = timeRef.current;

  /* ── Scroll phase math ── */
  const p = scrollProgress;
  const phases = {
    emergence: Math.min(1, p / 0.18),
    materialize: Math.min(1, Math.max(0, (p - 0.15) / 0.23)),
    stabilize: Math.min(1, Math.max(0, (p - 0.35) / 0.33)),
    ascension: Math.min(1, Math.max(0, (p - 0.62) / 0.2)),
    dissipation: Math.min(1, Math.max(0, (p - 0.78) / 0.22)),
  };

  const emerge = easeOutExpo(phases.emergence);
  const mat = spatial ? 1 : phases.materialize;
  const stable = phases.stabilize;
  const ascend = easeInOutQuart(phases.ascension);
  const dissipate = phases.dissipation;

  /* ── Non-spatial 3D panel transforms ── */
  const panelRotateX = 58 * (1 - emerge) - 18 * ascend;
  const panelRotateY = mouse.x * 6 * stable;
  const panelScale = (0.32 + 0.68 * easeOutBack(Math.min(1, emerge * 1.15))) * stageScale;
  const panelY = 220 * (1 - emerge) - 140 * ascend;
  const panelZ = -500 * (1 - emerge) + 180 * ascend;
  const panelOpacity = Math.min(1, emerge * 2.5) * (1 - Math.pow(dissipate, 1.8));

  /* ── Non-spatial beam ── */
  const beamOpacity = emerge * 0.75 * (1 - dissipate * 0.95);
  const beamScale = 0.25 + 0.75 * emerge;
  const beamPulse = 1 + Math.sin(t * 3) * 0.08 * stable;

  /* ── Content stagger ── */
  const contentOpacity = Math.min(1, mat * 2.2);
  const contentBlur = Math.max(0, 10 * (1 - mat));
  const contentLift = 30 * (1 - mat);

  /* ── Floating orbs physics ── */
  const floatActive = stable * (1 - phases.ascension);

  /* ── Typewriter subtitle ── */
  const subtitleText = "Full-Stack & AI Developer | Computer Science Engineer";
  const { display: typedSubtitle, done: subtitleDone } = useTypewriter(
    subtitleText,
    40,
    spatial ? 400 : 800
  );

  /* ── Spatial size compensation ──
     Parent Html uses distanceFactor={0.27} which renders the panel
     too small. We compensate with an internal CSS scale so the
     hologram dominates the viewport as intended.                        */
  const SPATIAL_COMPENSATION = 2.8;

  /* ═══════════════════════════════════════════════════════════════════════
     SPATIAL RENDER — Inside R3F Html (Holographic Projection)
     ═══════════════════════════════════════════════════════════════════════ */
  if (spatial) {
    const spatialLock = Math.min(1, Math.max(0, (p - 0.28) / 0.08));
    const dissolve = Math.min(1, Math.max(0, (p - 0.8) / 0.2));
    const stableGlow = 0.7 + Math.sin(t * 2.4) * 0.16 * spatialLock;
    const reveal = Math.min(1, mat * 1.8);

    return (
      <div
        ref={containerRef}
        id="home"
        className="pointer-events-auto relative select-none"
        style={{
          width: "100%",
          background: "transparent",
          transform: `scale(${SPATIAL_COMPENSATION})`,
          transformOrigin: "center top",
          transformStyle: "preserve-3d",
          opacity: 1 - dissolve * 0.92,
        }}
      >
        <CinematicStyles />

        {/* Ambient halo behind panel */}
        <div
          className="absolute -inset-20 rounded-[40px] pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 48%, rgba(255,34,68,0.22), rgba(255,34,68,0.08) 32%, transparent 68%), radial-gradient(circle at 22% 16%, rgba(255,180,190,0.12), transparent 42%)`,
            filter: "blur(48px)",
            opacity: stableGlow,
          }}
        />

        {/* Decorative outer rings */}
        <DecoRing size={60} duration={28} opacity={0.06 * spatialLock} />
        <DecoRing size={90} duration={42} reverse opacity={0.04 * spatialLock} />

        {/* ═══ MAIN GLASS PANEL ═══ */}
        <div
          className="dashboard-glass relative overflow-hidden rounded-[28px]"
          style={{
            background: `linear-gradient(145deg, rgba(14,12,18,0.78), rgba(8,6,12,0.9) 52%, rgba(10,8,14,0.84))`,
            backdropFilter: "blur(56px) saturate(185%)",
            WebkitBackdropFilter: "blur(56px) saturate(185%)",
            border: "1px solid rgba(255, 23, 68, 0.35)",
            boxShadow: `inset 0 1px 1px rgba(255,255,255,0.16), inset 0 0 52px rgba(255,23,68,0.1), 0 0 72px rgba(255,23,68,0.24), 0 0 150px rgba(255,23,68,0.1), 0 48px 120px rgba(0,0,0,0.86)`,
          }}
        >
          {/* Layered glass effects */}
          <CornerBracket position="tl" delay={0.2} size={36} strokeWidth={1.5} />
          <CornerBracket position="tr" delay={0.35} size={36} strokeWidth={1.5} />
          <CornerBracket position="bl" delay={0.5} size={36} strokeWidth={1.5} />
          <CornerBracket position="br" delay={0.65} size={36} strokeWidth={1.5} />
          <ScanlineOverlay opacity={0.3} />
          <GrainOverlay opacity={0.04} />
          <VignetteOverlay opacity={0.18} />
          <SpecularHighlight radius={28} />
          <Hologrid opacity={0.04} size={36} />
          <TopGlowLine t={t} />
          <ParticleDust opacity={0.5} />

          {/* Data stream decorations */}
          <DataStream position={{ left: "8%", top: "20%" }} active={spatialLock} />
          <DataStream position={{ right: "8%", top: "35%" }} active={spatialLock} />

          {/* ═══ CONTENT ═══ */}
          <div
            className="relative z-10 p-8 md:p-10"
            style={{
              opacity: contentOpacity,
              filter: `blur(${contentBlur}px)`,
              transform: `translateY(${contentLift}px)`,
            }}
          >
            {/* ── Header: [● LIVE] + Socials ── */}
            <div className="flex items-center justify-between mb-8 border-b border-white/[0.08] pb-5">
              <div className="flex items-center gap-3">
                <StatusPulse color={C.emerald} delay={0} size={2.5} />
                <span
                  className="font-mono text-[11px] font-bold tracking-[0.25em] uppercase"
                  style={{ color: C.emerald, textShadow: `0 0 10px ${C.emerald}` }}
                >
                  Hologram Interface Online
                </span>
                <span className="hidden md:inline font-mono text-[10px] text-white/25 tracking-[0.2em]">
                  | SPATIAL PROJECTION v3.0
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                {SOCIALS.map((s, i) => (
                  <SocialOrb key={s.label} social={s} reveal={mat} index={i} />
                ))}
              </div>
            </div>

            {/* ── Name: Massive gradient + chromatic aberration ── */}
            <div className="mb-3">
              <h1
                className="font-black uppercase"
                style={{
                  fontSize: "clamp(4.5rem, 9vw, 8.5rem)",
                  lineHeight: 0.95,
                  letterSpacing: "-0.03em",
                  background: "linear-gradient(180deg, #ffffff 0%, #ffcdd2 25%, #ff1744 55%, #800010 85%, #400008 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  filter: "drop-shadow(0 0 30px rgba(255,23,68,0.45)) drop-shadow(0 0 80px rgba(255,23,68,0.25))",
                  textShadow: "-2px 0 0 rgba(255, 0, 51, 0.4), 2px 0 0 rgba(0, 240, 255, 0.3), 0 0 40px rgba(255, 23, 68, 0.5)",
                }}
              >
                POSHAN M S
              </h1>
            </div>

            {/* ── Subtitle: typewriter + glow ── */}
            <div className="mb-6 h-8">
              <h2
                className="font-mono font-semibold tracking-[0.18em] uppercase"
                style={{
                  fontSize: "clamp(1rem, 1.6vw, 1.5rem)",
                  color: C.crimson,
                  textShadow: "0 0 20px rgba(255,23,68,0.7), 0 0 40px rgba(255,23,68,0.3)",
                  opacity: Math.min(1, (mat - 0.2) * 3),
                }}
              >
                {typedSubtitle}
                {!subtitleDone && (
                  <span className="inline-block w-[2px] h-[1em] bg-[#ff1744] ml-1 align-middle animate-pulse" />
                )}
              </h2>
            </div>

            {/* ── Quote ── */}
            <p
              className="max-w-2xl mb-8"
              style={{
                fontSize: "15px",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.75)",
                opacity: Math.min(1, (mat - 0.35) * 2.5),
                transform: `translateY(${(1 - Math.min(1, (mat - 0.35) * 2.5)) * 12}px)`,
                transition: "opacity 0.8s ease, transform 0.8s ease",
              }}
            >
              <span style={{ color: "rgba(255,23,68,0.6)" }}>&ldquo;</span>
              Architecting scalable web platforms, intelligent ML diagnostics, and secure systems with precision engineering.
              <span style={{ color: "rgba(255,23,68,0.6)" }}>&rdquo;</span>
            </p>

            {/* ── Project Badges: 2x2 grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {BADGES.map((badge) => (
                <BadgeCard key={badge.title} badge={badge} reveal={mat} />
              ))}
            </div>

            {/* ── Footer Status Bar ── */}
            <div className="flex items-center justify-between border-t border-white/[0.08] pt-5">
              <div className="flex items-center gap-4 font-mono text-[10px] text-white/40 tracking-[0.15em]">
                <span className="flex items-center gap-1.5">
                  <SoundWave active />
                  SYSTEM OPERATIONAL
                </span>
                <span className="text-white/20">|</span>
                <span>CORE: STABLE</span>
                <span className="text-white/20">|</span>
                <span>LATENCY: 12ms</span>
                <span className="text-white/20">|</span>
                <span className="hidden md:inline text-white/30">{clock}</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest" style={{ color: "rgba(255,23,68,0.7)" }}>
                <StatusPulse color={C.crimson} delay={0.3} size={2} />
                LIVE
              </div>
            </div>
          </div>
        </div>

        {/* ── Floating Stat Orbs ── */}
        <StatOrb
          value="20+"
          label="PROJECTS"
          position={{ right: -28, top: "15%" }}
          floatClass="orb-float-1"
          reveal={floatActive}
        />
        <StatOrb
          value="3+"
          label="YEARS EXP"
          position={{ left: -20, bottom: "18%" }}
          floatClass="orb-float-2"
          reveal={floatActive}
        />
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════════════
     NON-SPATIAL RENDER — Regular DOM hero section
     ═══════════════════════════════════════════════════════════════════════ */
  return (
    <section
      ref={containerRef}
      id="home"
      className="pointer-events-none relative z-10 h-screen w-screen overflow-hidden"
      style={{ perspective: "1500px", perspectiveOrigin: "50% 65%" }}
    >
      <CinematicStyles />

      {/* Volumetric light cone */}
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
        <div
          className="absolute inset-0"
          style={{
            background: `conic-gradient(from 180deg at 50% 100%, transparent 0deg, rgba(255,23,68,0.12) 18deg, rgba(255,23,68,0.35) 35deg, rgba(255,80,60,0.28) 55deg, transparent 75deg, transparent 285deg, rgba(255,80,60,0.28) 305deg, rgba(255,23,68,0.35) 325deg, rgba(255,23,68,0.12) 342deg, transparent 360deg)`,
            filter: "blur(50px)",
            transform: `scaleY(${beamScale * beamPulse})`,
            transformOrigin: "bottom center",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 40% 100% at 50% 100%, rgba(255,40,60,0.45) 0%, rgba(255,23,68,0.2) 30%, transparent 70%)",
            mixBlendMode: "screen",
            transform: `scaleY(${beamScale})`,
            transformOrigin: "bottom center",
          }}
        />
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
              animation: "scanline-drift 0.8s linear infinite",
            }}
          />
        </div>
      </div>

      {/* Main holographic panel */}
      <div
        className="absolute inset-0 flex items-center justify-center px-4 md:px-8"
        style={{
          transform: `translate3d(${mouse.x * 10 * stable}px, ${panelY + mouse.y * 6 * stable}px, ${panelZ}px) rotateX(${panelRotateX}deg) rotateY(${panelRotateY}deg) scale(${panelScale})`,
          opacity: panelOpacity,
          transformOrigin: "center 80%",
          transition: "none",
          willChange: "transform, opacity",
        }}
      >
        <div className="relative w-full max-w-[920px] pointer-events-auto">
          {/* Ambient halo */}
          <div
            className="absolute -inset-10 rounded-[40px] pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 50%, rgba(255,23,68,0.18) 0%, rgba(255,23,68,0.08) 30%, transparent 65%), radial-gradient(circle at 30% 20%, rgba(255,100,80,0.1) 0%, transparent 50%)`,
              filter: "blur(40px)",
              opacity: 0.8 + Math.sin(t * 2) * 0.2 * stable,
            }}
          />

          {/* Glass card */}
          <div
            className="dashboard-glass relative overflow-hidden rounded-[28px]"
            style={{
              background: `linear-gradient(145deg, rgba(14,12,18,0.78) 0%, rgba(8,6,12,0.88) 50%, rgba(10,8,14,0.82) 100%)`,
              backdropFilter: "blur(56px) saturate(180%)",
              WebkitBackdropFilter: "blur(56px) saturate(180%)",
              border: "1.5px solid rgba(255, 23, 68, 0.32)",
              boxShadow: `inset 0 1px 1px rgba(255,255,255,0.14), inset 0 0 50px rgba(255,23,68,0.08), 0 0 60px rgba(255,23,68,0.18), 0 0 120px rgba(255,23,68,0.08), 0 50px 120px rgba(0,0,0,0.85)`,
              animation: stable > 0.1 ? "border-breathe 4s ease-in-out infinite" : "none",
            }}
          >
            <GrainOverlay opacity={0.035} />
            <SpecularHighlight radius={28} />
            <Hologrid opacity={0.035} size={40} />
            <TopGlowLine t={t} />
            <ParticleDust opacity={0.35} />

            <CornerBracket position="tl" delay={0.2} size={32} />
            <CornerBracket position="tr" delay={0.35} size={32} />
            <CornerBracket position="bl" delay={0.5} size={32} />
            <CornerBracket position="br" delay={0.65} size={32} />

            {/* Content */}
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
                  <StatusPulse color={C.emerald} delay={0} />
                  <span
                    className="font-mono text-[11px] font-bold tracking-[0.25em] uppercase"
                    style={{ color: C.emerald }}
                  >
                    Hologram Interface Online
                  </span>
                  <span className="hidden md:inline font-mono text-[10px] text-white/25 tracking-[0.2em]">
                    | SPATIAL PROJECTION v3.0
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  {SOCIALS.map((s, i) => (
                    <SocialOrb key={s.label} social={s} reveal={mat} index={i} />
                  ))}
                </div>
              </div>

              {/* Name */}
              <div className="mb-3">
                <h1
                  className="font-black uppercase"
                  style={{
                    fontSize: "clamp(3rem, 7vw, 6rem)",
                    lineHeight: 0.95,
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
              <div className="mb-8 h-7">
                <h2
                  className="font-mono text-sm md:text-base font-semibold tracking-[0.18em] uppercase"
                  style={{
                    color: C.crimson,
                    textShadow: "0 0 20px rgba(255,23,68,0.7), 0 0 40px rgba(255,23,68,0.3)",
                    opacity: Math.min(1, (mat - 0.25) * 3),
                  }}
                >
                  {typedSubtitle}
                  {!subtitleDone && (
                    <span className="inline-block w-[2px] h-[1em] bg-[#ff1744] ml-1 align-middle animate-pulse" />
                  )}
                </h2>
              </div>

              {/* Quote */}
              <p
                className="text-sm md:text-[15px] text-white/75 max-w-2xl leading-[1.7] mb-10"
                style={{
                  opacity: Math.min(1, (mat - 0.35) * 2.5),
                  transform: `translateY(${(1 - Math.min(1, (mat - 0.35) * 2.5)) * 12}px)`,
                  transition: "opacity 0.8s ease, transform 0.8s ease",
                }}
              >
                <span style={{ color: "rgba(255,23,68,0.6)" }}>&ldquo;</span>
                Architecting scalable web platforms, intelligent ML diagnostics, and secure systems with precision engineering.
                <span style={{ color: "rgba(255,23,68,0.6)" }}>&rdquo;</span>
              </p>

              {/* Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
                {BADGES.map((badge) => (
                  <BadgeCard key={badge.title} badge={badge} reveal={mat} />
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-white/[0.08] pt-5">
                <div className="flex items-center gap-4 font-mono text-[10px] text-white/40 tracking-[0.15em]">
                  <span className="flex items-center gap-1.5">
                    <SoundWave active />
                    SYSTEM OPERATIONAL
                  </span>
                  <span className="text-white/20">|</span>
                  <span>CORE: STABLE</span>
                  <span className="text-white/20">|</span>
                  <span>LATENCY: 12ms</span>
                  <span className="text-white/20">|</span>
                  <span className="hidden md:inline text-white/30">{clock}</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest" style={{ color: "rgba(255,23,68,0.7)" }}>
                  <StatusPulse color={C.crimson} delay={0.3} size={2} />
                  LIVE
                </div>
              </div>
            </div>
          </div>

          {/* Floating orbs */}
          <StatOrb
            value="20+"
            label="PROJECTS"
            position={{ right: -20, top: "15%" }}
            floatClass="orb-float-1"
            reveal={floatActive}
          />
          <StatOrb
            value="3+"
            label="YEARS EXP"
            position={{ left: -16, bottom: "18%" }}
            floatClass="orb-float-2"
            reveal={floatActive}
          />
        </div>
      </div>

      {/* Bottom scroll CTA */}
      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
        style={{
          opacity: (1 - phases.ascension) * stable,
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