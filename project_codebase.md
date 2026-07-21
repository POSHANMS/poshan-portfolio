# Project Codebase Backup

## File: `src/animations/gsap.ts`

```typescript
"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Safely register GSAP ScrollTrigger plugin only on the client-side
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
  
  // Set default animation configurations
  gsap.defaults({
    ease: "power2.out",
    duration: 0.5,
  });
  
  // Configure ScrollTrigger defaults
  ScrollTrigger.defaults({
    toggleActions: "play none none reverse",
    markers: false, // Set to true to debug triggers
  });
}

export { gsap, ScrollTrigger };
```

## File: `src/animations/scrollCamera.ts`

```typescript
"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import Lenis from "lenis";
import * as THREE from "three";

const sceneCoordinates = [
  {
    // Station 1 — Close/Low: intimate view near the laptop, slightly looking up at globe behind
    camera: new THREE.Vector3(0.5, 0.5, 8.0),
    lookAt: new THREE.Vector3(0.8, 0.0, -1.0),
    fov: 45,
  },
  {
    // Station 2 — Mid Swing: dynamic lateral swing to the left, mathematically positioned for full globe ring headroom
    camera: new THREE.Vector3(-3.5, 2.8, 9.0),
    lookAt: new THREE.Vector3(1.2, 1.3, -1.5),
    fov: 58,
  },
  {
    // Station 3 — Wide Establishing: centered high angle, pulled in slightly closer to keep group unified
    camera: new THREE.Vector3(0.0, 3.8, 12.5),
    lookAt: new THREE.Vector3(0.5, 0.2, -2.5),
    fov: 52,
  },
];

export function CinematicCamera({ scrollProgress }: { scrollProgress: number }) {
  const currentPos = useRef(new THREE.Vector3(0.5, 0.5, 8));
  const currentLookAt = useRef(new THREE.Vector3(0.8, 0, -1));
  const currentFov = useRef(45);

  useFrame((state) => {
    const segmentCount = sceneCoordinates.length - 1;
    const rawSegment = scrollProgress * segmentCount;
    const segmentIdx = Math.min(Math.floor(rawSegment), segmentCount - 1);
    const localT = rawSegment - segmentIdx;
    const easedT = localT * localT * (3.0 - 2.0 * localT);

    const from = sceneCoordinates[segmentIdx];
    const to = sceneCoordinates[Math.min(segmentIdx + 1, segmentCount)];

    currentPos.current.lerpVectors(from.camera, to.camera, easedT);
    currentLookAt.current.lerpVectors(from.lookAt, to.lookAt, easedT);
    currentFov.current = THREE.MathUtils.lerp(from.fov, to.fov, easedT);

    const camera = state.camera as THREE.PerspectiveCamera;
    camera.position.copy(currentPos.current);
    camera.lookAt(currentLookAt.current);
    camera.fov = currentFov.current;
    camera.updateProjectionMatrix();
  });

  return null;
}

export function initScrollCamera(onScrollUpdate: (progress: number) => void) {
  if (typeof window === "undefined") return null;

  let ticking = false;
  let animationFrame = 0;
  const getProgress = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    return docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
  };

  const handleScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        onScrollUpdate(getProgress());
        ticking = false;
      });
      ticking = true;
    }
  };

  let lenis: Lenis | null = null;

  try {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.88,
      touchMultiplier: 1.15,
    });

    const raf = (time: number) => {
      lenis?.raf(time);
      onScrollUpdate(getProgress());
      animationFrame = requestAnimationFrame(raf);
    };

    animationFrame = requestAnimationFrame(raf);
  } catch {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
  }

  return {
    destroy: () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      lenis?.destroy();
      window.removeEventListener("scroll", handleScroll);
    },
  };
}
```

## File: `src/animations/theatre.ts`

```typescript
"use client";

import { getProject } from "@theatre/core";

// Theatre.js project — studio disabled, no state required
// Camera is driven by scrollCamera.ts scroll interpolation instead
const project = getProject("Portfolio");
const sheet = project.sheet("Camera Timeline");

export { project, sheet };
```

## File: `src/animations/variants.ts`

```typescript
"use client";

import { Variants } from "framer-motion";

// Standard fade-in and slide-up transition
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (custom = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.6, 0.3, 1], // Cubic-bezier easing
      delay: custom,
    },
  }),
};

// Slide and fade in from the left
export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: (custom = 0) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.6, 0.3, 1],
      delay: custom,
    },
  }),
};

// Slide and fade in from the right
export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: (custom = 0) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.6, 0.3, 1],
      delay: custom,
    },
  }),
};

// Scale pop-in (e.g. for badges, buttons)
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: (custom = 0) => ({
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.34, 1.56, 0.64, 1], // Elastic feel
      delay: custom,
    },
  }),
};

// Stagger container for list items (e.g. terminals, nav links)
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};
```

## File: `src/app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #000000;
  --foreground: #f0f0f0;
  --font-inter: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-jetbrains-mono: "JetBrains Mono", "Cascadia Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  
  --void-black: #0a0002;
  --electric-blue: #ff1744;  /* Crimson/Red primary highlight */
  --deep-violet: #800010;   /* Muted burgundy */
  --hot-pink: #cc1133;      /* Saturated crimson red */
  --terminal-green: #ff3344; /* Warm pale red / crimson */
  --pure-white: #f5f0e8;    /* Warm pale white */
  --deep-navy: #0a0a0c;     /* Black chrome / gunmetal */
  --node-green: #aa1122;    /* Muted red */
  --nebula-purple: #3a0008;  /* Deep burgundy */
  --glass-dark: rgba(5, 5, 8, 0.88); /* Even darker black chrome background */
}

html,
body {
  color: var(--foreground);
  background: var(--background);
  overflow-x: hidden;
  min-height: 100vh;
  overscroll-behavior-y: none;
}

body {
  scrollbar-gutter: stable;
}

/* Hide default cursor on mouse-enabled devices */
@media (pointer: fine) {
  html, body, a, button, select, input, textarea, [role="button"] {
    cursor: none !important;
  }
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: var(--void-black);
}
::-webkit-scrollbar-thumb {
  background: var(--deep-navy);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--electric-blue);
}

/* Custom Cyberpunk Utilities */
@layer utilities {
  .text-glow-blue {
    text-shadow: 0 0 5px var(--electric-blue), 0 0 10px rgba(255, 23, 68, 0.5);
  }
  .text-glow-pink {
    text-shadow: 0 0 5px var(--hot-pink), 0 0 10px rgba(204, 17, 51, 0.5);
  }
  .text-glow-green {
    text-shadow: 0 0 5px var(--terminal-green), 0 0 10px rgba(255, 51, 68, 0.5);
  }
  .border-glow-blue {
    box-shadow: 0 0 10px rgba(255, 23, 68, 0.3), inset 0 0 5px rgba(255, 23, 68, 0.1);
  }
  .border-glow-pink {
    box-shadow: 0 0 10px rgba(204, 17, 51, 0.3), inset 0 0 5px rgba(204, 17, 51, 0.1);
  }
  .border-glow-green {
    box-shadow: 0 0 10px rgba(255, 51, 68, 0.3), inset 0 0 5px rgba(255, 51, 68, 0.1);
  }
}

.dashboard-haze {
  background:
    radial-gradient(circle at 70% 50%, rgba(255, 23, 68, 0.04), transparent 18rem),
    radial-gradient(circle at 76% 58%, rgba(128, 0, 16, 0.05), transparent 19rem),
    radial-gradient(circle at 30% 40%, rgba(204, 17, 51, 0.008), transparent 17rem),
    radial-gradient(circle at 82% 18%, rgba(128, 0, 16, 0.06), transparent 22rem),
    linear-gradient(180deg, rgba(2, 3, 13, 0.05), rgba(4, 4, 12, 0.01) 56%, rgba(4, 4, 12, 0.18));
  mix-blend-mode: screen;
}

.dashboard-scanlines {
  opacity: 0.12; /* Was 0.18 */
  background:
    linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 23, 68, 0.015) 1px, transparent 1px),
    radial-gradient(circle at 74% 18%, rgba(255, 23, 68, 0.06), transparent 12rem);
  background-size: 72px 72px, 72px 72px, 100% 100%;
  mask-image: linear-gradient(to bottom, transparent, black 18%, black 82%, transparent);
}

/* ═══════ STAGE GRID ═══════
   1760px × 920px absolute, scaled to viewport.
   3 rows:
     row 1 (460px): hero name + status cards + code card + right panels
     row 2 ( 90px): stats bar spanning cols 1-10
     row 3 (240px): music | featured project | skills | (right continues)
   12 equal columns.
═══════════════════════════════ */
.dashboard-stage {
  position: absolute;
  left: 50%;
  top: calc(50% + 4px);
  width: 1760px;
  height: 920px;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-template-rows: 458px 88px 248px;
  gap: 14px;
  padding: 0 12px;
  transform-origin: center center;
}

.dashboard-stage::before,
.dashboard-stage::after {
  content: "";
  position: absolute;
  pointer-events: none;
  z-index: 0;
}

.dashboard-stage::before {
  left: 140px;
  top: 170px;
  width: 520px;
  height: 320px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(255, 23, 68, 0.06), rgba(128, 0, 16, 0.02) 38%, transparent 72%);
  filter: blur(82px);
  opacity: 0.1;
  mix-blend-mode: screen;
}

.dashboard-stage::after {
  right: 236px;
  top: 196px;
  width: 650px;
  height: 410px;
  background:
    radial-gradient(circle at 55% 48%, rgba(255, 23, 68, 0.14), transparent 38%),
    radial-gradient(circle at 72% 62%, rgba(128, 0, 16, 0.09), transparent 44%),
    radial-gradient(circle at 48% 78%, rgba(204, 17, 51, 0.09), transparent 52%);
  filter: blur(74px);
  opacity: 0.45; /* Was 0.58 */
  mix-blend-mode: screen;
}

/* Left hero column: hello text + huge name + subtitle + buttons + status */
.stage-left-copy {
  position: relative;
  z-index: 30;
  grid-column: 1 / span 4;
  grid-row: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 40px 0 24px 56px;
}

/* Current Status + Tech Stack stacked cards */
.stage-center-cards {
  position: relative;
  z-index: 18;
  grid-column: 5 / span 2;
  grid-row: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 36px;
}

/* Welcome / code card — centre right */
.stage-code-card {
  position: relative;
  z-index: 16;
  grid-column: 7 / span 4;
  grid-row: 1;
  align-self: center;
}

/* Right panel column: GitHub / achievements / testimonial / let's build */
.stage-right-panels {
  position: relative;
  z-index: 18;
  grid-column: 11 / span 2;
  grid-row: 1 / span 3;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 8px;
  padding-bottom: 8px;
}

/* Stats bar full width (except right panel column) */
.stage-stats {
  position: relative;
  z-index: 22;
  grid-column: 1 / span 10;
  grid-row: 2;
}

/* Row 3 cards */
.stage-music {
  position: relative;
  z-index: 22;
  grid-column: 1 / span 2;
  grid-row: 3;
}

.stage-featured {
  position: relative;
  z-index: 22;
  grid-column: 3 / span 4;
  grid-row: 3;
}

.stage-skills {
  position: relative;
  z-index: 22;
  grid-column: 7 / span 4;
  grid-row: 3;
}


.dashboard-panel {
  position: relative;
  overflow: hidden;
  min-width: 0;
  border: 1px solid rgba(255, 23, 68, 0.22);
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgba(5, 5, 8, 0.88), rgba(0, 0, 0, 0.95)) padding-box,
    linear-gradient(135deg, rgba(255, 23, 68, 0.62), rgba(128, 0, 16, 0.28) 46%, rgba(204, 17, 51, 0.58)) border-box;
  backdrop-filter: blur(18px) saturate(145%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.14),
    inset 0 0 34px rgba(255, 23, 68, 0.045),
    0 0 24px rgba(255, 23, 68, 0.08),
    0 32px 80px rgba(0, 0, 0, 0.62);
  clip-path: polygon(0 16px, 16px 0, calc(100% - 16px) 0, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0 calc(100% - 16px));
  transition: transform 260ms ease, box-shadow 260ms ease, border-color 260ms ease;
}

.dashboard-panel:hover {
  transform: translateY(-4px) translateZ(16px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    inset 0 0 42px rgba(255, 23, 68, 0.08),
    0 0 34px rgba(255, 23, 68, 0.18),
    0 0 72px rgba(204, 17, 51, 0.12),
    0 36px 90px rgba(0, 0, 0, 0.72);
}

.dashboard-panel::before,
.dashboard-panel::after {
  content: "";
  position: absolute;
  pointer-events: none;
  inset: 0;
}

.dashboard-panel::before {
  border: 1px solid rgba(255, 233, 233, 0.12);
  clip-path: inherit;
  background:
    linear-gradient(115deg, rgba(255, 255, 255, 0.08), transparent 28%),
    radial-gradient(circle at 10% 0%, rgba(255, 255, 255, 0.08), transparent 24%);
  opacity: 0.9;
}

.dashboard-panel::after {
  background:
    linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.14), transparent) -60% 0 / 60% 1px no-repeat,
    linear-gradient(180deg, transparent, rgba(255, 23, 68, 0.14), transparent) 100% 0 / 1px 65% no-repeat,
    radial-gradient(circle at 100% 0%, rgba(255, 23, 68, 0.15), transparent 22%);
  opacity: 0.86;
  animation: glass-shimmer 5.8s ease-in-out infinite;
}

.dashboard-panel-blue {
  box-shadow: inset 0 0 28px rgba(255, 23, 68, 0.07), 0 0 28px rgba(255, 23, 68, 0.18), 0 30px 80px rgba(0, 0, 0, 0.58);
}

.dashboard-panel-pink {
  border-color: rgba(255, 23, 68, 0.38);
  box-shadow: inset 0 0 28px rgba(255, 23, 68, 0.08), 0 0 30px rgba(255, 23, 68, 0.18), 0 30px 80px rgba(0, 0, 0, 0.58);
}

.dashboard-panel-violet {
  box-shadow: inset 0 0 28px rgba(128, 0, 16, 0.08), 0 0 30px rgba(128, 0, 16, 0.16), 0 30px 80px rgba(0, 0, 0, 0.58);
}

.dashboard-panel-green {
  box-shadow: inset 0 0 24px rgba(255, 23, 68, 0.05), 0 0 24px rgba(255, 23, 68, 0.08);
}

.dashboard-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-width: 10rem;
  width: 100%;
  max-width: 14rem;
  border-radius: 0.45rem;
  padding: 0.8rem 1.2rem;
  font-family: var(--font-jetbrains-mono);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease, color 220ms ease;
}

.dashboard-button:hover {
  transform: translateY(-2px);
}

.dashboard-button-primary {
  border: 1px solid var(--electric-blue);
  color: var(--electric-blue);
  background: rgba(255, 23, 68, 0.06);
  box-shadow: 0 0 24px rgba(255, 23, 68, 0.42), inset 0 0 18px rgba(255, 23, 68, 0.12);
}

.dashboard-button-dark {
  border: 1px solid rgba(255, 23, 68, 0.6);
  color: rgba(216, 250, 255, 0.86);
  background: rgba(255, 255, 255, 0.045);
  box-shadow: 0 0 22px rgba(255, 23, 68, 0.26), inset 0 0 14px rgba(255, 23, 68, 0.08);
}

.hero-title-stack {
  position: relative;
  height: 248px;
  width: 600px;
  transform: perspective(1050px) rotateX(4deg) rotateY(-8deg) rotateZ(-2deg);
  transform-origin: left center;
  pointer-events: none;
  filter: drop-shadow(0 0 18px rgba(255, 23, 68, 0.48)) drop-shadow(0 0 44px rgba(128, 0, 16, 0.28));
}

.hero-title-stack::before,
.hero-title-stack::after {
  content: "";
  position: absolute;
  inset: -42px -82px -54px -46px;
  border-radius: 44%;
  pointer-events: none;
  mix-blend-mode: screen;
}

.hero-title-stack::before {
  background:
    radial-gradient(circle at 34% 38%, rgba(255, 23, 68, 0.38), transparent 54%),
    radial-gradient(circle at 20% 72%, rgba(255, 23, 68, 0.2), transparent 48%);
  filter: blur(42px);
  opacity: 0.5;
}

.hero-title-stack::after {
  background: radial-gradient(circle at 58% 70%, rgba(128, 0, 16, 0.22), transparent 55%);
  filter: blur(46px);
  opacity: 0.46;
}

.hero-title-layer,
.hero-title-face {
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  flex-direction: column;
  font-family: Impact, Haettenschweiler, "Arial Black", var(--font-inter);
  font-weight: 900;
  line-height: 0.78;
  letter-spacing: -0.058em;
  text-transform: uppercase;
  white-space: nowrap;
}

.hero-title-layer span,
.hero-title-face span {
  display: block;
  font-size: 132px;
}

.hero-title-layer .hero-title-layer-ms,
.hero-title-face .hero-title-layer-ms {
  margin-top: -0.18em;
  font-size: 160px;
}

.hero-title-layer {
  transform: translate3d(calc(var(--layer) * 1.15px), calc(var(--layer) * 0.9px), calc(var(--layer) * -1px));
  color: #300004;
  -webkit-text-stroke: 1px rgba(255, 23, 68, 0.14);
  text-shadow: 0 0 16px rgba(255, 23, 68, 0.12);
  opacity: calc(0.94 - (var(--layer) * 0.018));
}

.hero-title-layer:nth-child(n + 12) {
  color: #1a0002;
  -webkit-text-stroke-color: rgba(255, 23, 68, 0.2);
}

.hero-title-face {
  z-index: 40;
  color: transparent;
  -webkit-text-stroke: 2px rgba(255, 220, 220, 0.96);
  background:
    radial-gradient(circle at 18% 9%, rgba(255, 255, 255, 0.9) 0 3%, transparent 18%),
    repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.62) 0 1px, rgba(255, 23, 68, 0.12) 1px 5px),
    linear-gradient(180deg, #ffe9e9 0%, #ff1744 16%, #cc1133 44%, #800010 74%, #550006 100%);
  background-blend-mode: screen, overlay, normal;
  -webkit-background-clip: text;
  background-clip: text;
}

.hero-title-face::before,
.hero-title-face::after {
  content: "POSHAN\A MS";
  white-space: pre;
  position: absolute;
  inset: 0;
  font-size: 132px;
  line-height: 0.78;
  letter-spacing: -0.058em;
  pointer-events: none;
  color: transparent;
}

.hero-title-face::before {
  -webkit-text-stroke: 2px rgba(255, 23, 68, 0.42);
  transform: translate(-4px, -2px);
  filter: blur(0.4px);
}

.hero-title-face::after {
  -webkit-text-stroke: 2px rgba(128, 0, 16, 0.42);
  transform: translate(5px, 2px);
  filter: blur(0.5px);
}

.tech-badge {
  display: inline-flex;
  height: 1.25rem;
  width: 1.25rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
  border: 1px solid rgba(255, 255, 255, 0.18);
  font-size: 0.58rem;
  font-weight: 800;
  color: white;
}

.tech-badge-0 { background: rgba(255, 255, 255, 0.08); }
.tech-badge-1 { background: rgba(49, 120, 198, 0.8); }
.tech-badge-2 { background: rgba(104, 160, 99, 0.82); }
.tech-badge-3 { background: rgba(0, 237, 100, 0.42); }
.tech-badge-4 { background: rgba(0, 212, 255, 0.42); }
.tech-badge-5 { background: rgba(255, 255, 255, 0.12); }

.laptop-code-card {
  width: 100%;
  max-width: 31rem;
  transform: perspective(1100px) rotateX(6deg) rotateY(-18deg) rotateZ(0.8deg);
  border: 1px solid rgba(255, 23, 68, 0.24);
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgba(5, 5, 8, 0.88), rgba(0, 0, 0, 0.95)),
    radial-gradient(circle at 78% 28%, rgba(255, 23, 68, 0.16), transparent 34%);
  padding: 1.5rem 1.75rem;
  box-shadow: 0 0 62px rgba(255, 23, 68, 0.18), 0 0 80px rgba(128, 0, 16, 0.12), inset 0 0 44px rgba(255, 23, 68, 0.06);
  backdrop-filter: blur(6px) saturate(135%);
}

.music-art {
  display: flex;
  height: 7.2rem;
  width: 7.2rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.7rem;
  background:
    radial-gradient(circle at 60% 34%, rgba(255, 23, 68, 0.72), transparent 34%),
    radial-gradient(circle at 28% 78%, rgba(128, 0, 16, 0.68), transparent 36%),
    #050508;
  box-shadow: inset 0 0 34px rgba(255, 23, 68, 0.22), 0 0 34px rgba(255, 23, 68, 0.16);
}

.waveform {
  display: flex;
  height: 2.4rem;
  align-items: end;
  gap: 2px;
}

.waveform span {
  width: 3px;
  border-radius: 999px;
  background: linear-gradient(to top, var(--electric-blue), var(--hot-pink));
  box-shadow: 0 0 8px rgba(255, 45, 120, 0.65);
  animation: waveform-pulse 1.25s ease-in-out infinite alternate;
}

.waveform span:nth-child(3n) {
  animation-delay: 0.18s;
}

.waveform span:nth-child(4n) {
  animation-delay: 0.34s;
}

.waveform-paused span {
  animation-play-state: paused;
  opacity: 0.32;
}

@keyframes title-glitch-one {
  0%, 88%, 100% { transform: translate(-5px, -1px); opacity: 0.42; }
  90% { transform: translate(10px, 1px); opacity: 0.82; }
  92% { transform: translate(-12px, -2px); opacity: 0.48; }
}

@keyframes title-glitch-two {
  0%, 82%, 100% { transform: translate(5px, 2px); opacity: 0.42; }
  84% { transform: translate(-9px, 3px); opacity: 0.78; }
  86% { transform: translate(13px, -1px); opacity: 0.52; }
}

@keyframes waveform-pulse {
  from { transform: scaleY(0.45); opacity: 0.58; }
  to { transform: scaleY(1); opacity: 1; }
}

@keyframes hero-title-breathe {
  0%, 100% {
    filter: drop-shadow(0 0 16px rgba(0, 245, 255, 0.76));
  }
  50% {
    filter: drop-shadow(0 0 30px rgba(0, 245, 255, 0.98)) drop-shadow(0 0 48px rgba(138, 46, 255, 0.66));
  }
}

@keyframes glass-shimmer {
  0%, 100% {
    background-position: -60% 0, 100% 0, 100% 0;
    opacity: 0.68;
  }
  52% {
    background-position: 140% 0, 100% 0, 100% 0;
    opacity: 0.92;
  }
}

@keyframes neural-line-drift {
  from {
    transform: translate3d(-1.5%, -0.5%, 0) scale(1);
    opacity: 0.38;
  }
  to {
    transform: translate3d(1.5%, 0.8%, 0) scale(1.02);
    opacity: 0.62;
  }
}

@keyframes front-particles-drift {
  from {
    background-position: 4% 28%, 72% 42%, 48% 72%;
  }
  to {
    background-position: 8% 31%, 68% 39%, 52% 76%;
  }
}

/* Disable Theatre.js studio style overrides if we are in production */
.theatre-studio-hider {
  display: none !important;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.001ms !important;
  }
}

@media (max-width: 767px) {
  html,
  body {
    cursor: auto !important;
  }

  .hero-mobile-soften {
    opacity: 0.78;
  }
}

/* ─── Additional fixes for background/floor alignment with reference ─── */

/* Ensure the canvas container has correct background */
.fixed.inset-0.z-0 {
  background: #030001 !important;
}

/* Dashboard stage should blend better with 3D scene */
.dashboard-stage {
  /* Slightly adjust position to align with 3D floor perspective */
  top: calc(50% + 8px);
}

/* Reduce haze intensity for cleaner look */
.dashboard-haze {
  background:
    radial-gradient(circle at 70% 50%, rgba(255, 23, 68, 0.03), transparent 18rem),
    radial-gradient(circle at 76% 58%, rgba(128, 0, 16, 0.04), transparent 19rem),
    radial-gradient(circle at 30% 40%, rgba(204, 17, 51, 0.008), transparent 17rem),
    radial-gradient(circle at 82% 18%, rgba(128, 0, 16, 0.05), transparent 22rem),
    linear-gradient(180deg, rgba(2, 3, 13, 0.05), rgba(4, 4, 12, 0.01) 56%, rgba(4, 4, 12, 0.15));
}

/* Reduce scanlines for cleaner look */
.dashboard-scanlines {
  opacity: 0.1;
}

.fixed.inset-0.z-0 {
  background: #000000 !important;
}


/* ─── Additional fixes for background/floor alignment with reference ─── */

/* Ensure the canvas container has correct background */
.fixed.inset-0.z-0 {
  background: #030001 !important;
}

/* Dashboard stage should blend better with 3D scene */
.dashboard-stage {
  /* Slightly adjust position to align with 3D floor perspective */
  top: calc(50% + 8px);
}

/* Reduce haze intensity for cleaner look */
.dashboard-haze {
  background:
    radial-gradient(circle at 70% 50%, rgba(255, 23, 68, 0.03), transparent 18rem),
    radial-gradient(circle at 76% 58%, rgba(128, 0, 16, 0.04), transparent 19rem),
    radial-gradient(circle at 30% 40%, rgba(204, 17, 51, 0.008), transparent 17rem),
    radial-gradient(circle at 82% 18%, rgba(128, 0, 16, 0.05), transparent 22rem),
    linear-gradient(180deg, rgba(2, 3, 13, 0.05), rgba(4, 4, 12, 0.01) 56%, rgba(4, 4, 12, 0.15));
}

/* Reduce scanlines for cleaner look */
.dashboard-scanlines {
  opacity: 0.1;
}

.fixed.inset-0.z-0 {
  background: #000000 !important;
}

/* ═══════ ENHANCED ATMOSPHERIC EFFECTS ═══════ */

.dashboard-haze {
  background:
    radial-gradient(circle at 70% 50%, rgba(255, 23, 68, 0.06), transparent 20rem),
    radial-gradient(circle at 76% 58%, rgba(128, 0, 16, 0.08), transparent 21rem),
    radial-gradient(circle at 30% 40%, rgba(204, 17, 51, 0.012), transparent 18rem),
    radial-gradient(circle at 82% 18%, rgba(128, 0, 16, 0.08), transparent 24rem),
    radial-gradient(circle at 50% 85%, rgba(255, 23, 68, 0.04), transparent 30rem),
    linear-gradient(180deg, rgba(2, 3, 13, 0.08), rgba(4, 4, 12, 0.02) 50%, rgba(4, 4, 12, 0.22));
  mix-blend-mode: screen;
}

.dashboard-scanlines {
  opacity: 0.15;
  background:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 23, 68, 0.02) 1px, transparent 1px),
    radial-gradient(circle at 74% 18%, rgba(255, 23, 68, 0.08), transparent 14rem);
  background-size: 72px 72px, 72px 72px, 100% 100%;
  mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
}

.dashboard-floor-glow {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40vh;
  background:
    radial-gradient(ellipse at 50% 100%, rgba(255, 23, 68, 0.08), transparent 60%);
  pointer-events: none;
  mix-blend-mode: screen;
}

.dashboard-depth-lines {
  background:
    linear-gradient(90deg, transparent 0%, rgba(255, 23, 68, 0.015) 50%, transparent 100%);
  background-size: 100% 100%;
  mask-image: linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%);
  opacity: 0.5;
}

.fixed.inset-0.z-0 {
  background: #000000 !important;
}

.dashboard-stage {
  top: calc(50% + 6px);
}

/* ═══════ CRITICAL: DASHBOARD ATMOSPHERIC EFFECTS ═══════ */

.dashboard-haze {
  background:
    radial-gradient(circle at 70% 50%, rgba(255, 23, 68, 0.07), transparent 20rem),
    radial-gradient(circle at 76% 58%, rgba(128, 0, 16, 0.09), transparent 21rem),
    radial-gradient(circle at 30% 40%, rgba(204, 17, 51, 0.015), transparent 18rem),
    radial-gradient(circle at 82% 18%, rgba(128, 0, 16, 0.09), transparent 24rem),
    radial-gradient(circle at 50% 85%, rgba(255, 23, 68, 0.05), transparent 30rem),
    linear-gradient(180deg, rgba(2, 3, 13, 0.10), rgba(4, 4, 12, 0.03) 50%, rgba(4, 4, 12, 0.28));
  mix-blend-mode: screen;
}

.dashboard-scanlines {
  opacity: 0.18;
  background:
    linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 23, 68, 0.025) 1px, transparent 1px),
    radial-gradient(circle at 74% 18%, rgba(255, 23, 68, 0.10), transparent 14rem);
  background-size: 72px 72px, 72px 72px, 100% 100%;
  mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
}

.dashboard-floor-glow {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 45vh;
  background:
    radial-gradient(ellipse at 50% 100%, rgba(255, 23, 68, 0.10), transparent 55%),
    radial-gradient(ellipse at 60% 100%, rgba(128, 0, 16, 0.06), transparent 50%);
  pointer-events: none;
  mix-blend-mode: screen;
}

.dashboard-depth-lines {
  background:
    linear-gradient(90deg, transparent 0%, rgba(255, 23, 68, 0.02) 50%, transparent 100%);
  background-size: 100% 100%;
  mask-image: linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%);
  opacity: 0.6;
}

.fixed.inset-0.z-0 {
  background: #000000 !important;
}

.dashboard-stage {
  top: calc(50% + 6px);
}



/* ═══════ LOADER KEYFRAMES ═══════ */

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes spin-reverse {
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
}

@keyframes logo-pulse {
  0%, 100% { 
    filter: drop-shadow(0 0 15px rgba(255, 0, 51, 0.4));
    opacity: 0.9;
  }
  50% { 
    filter: drop-shadow(0 0 25px rgba(255, 0, 51, 0.7));
    opacity: 1;
  }
}

@keyframes scanline-flicker {
  0%, 100% { opacity: 0.02; }
  50% { opacity: 0.04; }
}

@keyframes glitch-shift {
  0%, 90%, 100% { transform: translate(0); }
  92% { transform: translate(-2px, 1px); }
  94% { transform: translate(2px, -1px); }
  96% { transform: translate(-1px, 2px); }
}

/* ═══════ LOADER UTILITY CLASSES ═══════ */

.loader-scanlines {
  position: relative;
}

.loader-scanlines::after {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(255, 0, 51, 0.015) 2px,
    rgba(255, 0, 51, 0.015) 4px
  );
  pointer-events: none;
  animation: scanline-flicker 4s ease-in-out infinite;
}

/* ═══════ DASHBOARD HERO FIXES ═══════ */

/* Ensure dashboard stage doesn't show during loading */
.dashboard-stage {
  opacity: 0;
  animation: stage-reveal 1.5s ease-out 0.3s forwards;
}

@keyframes stage-reveal {
  from { opacity: 0; transform: translate(-50%, -48%) scale(var(--stage-scale, 1)); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(var(--stage-scale, 1)); }
}

/* ═══════ SMOOTH SCROLL CAMERA ═══════ */

/* Prevent content jump during scroll */
html {
  scroll-behavior: smooth;
}

/* Ensure canvas doesn't flicker */
canvas {
  display: block;
}

/* ═══════ REDUCED MOTION ═══════ */

@media (prefers-reduced-motion: reduce) {
  .dashboard-stage {
    animation: none;
    opacity: 1;
  }

  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## File: `src/app/layout.tsx`

```typescript
import type { Metadata } from "next";
import "./globals.css";
import Cursor from "@/components/ui/Cursor";
import Navbar from "@/components/ui/Navbar";

export const metadata: Metadata = {
  title: "Poshan MS - Full Stack Engineer Portfolio",
  description:
    "Immersive cyberpunk portfolio of Poshan MS, Full Stack Engineer. Showcasing 3D WebGL experiences, responsive web engineering, and scalable backend solutions.",
  metadataBase: new URL("https://portfolio.poshanms.dev"),
  openGraph: {
    title: "Poshan MS - Full Stack Engineer Portfolio",
    description:
      "Immersive cyberpunk portfolio of Poshan MS, Full Stack Engineer. Showcasing 3D WebGL experiences, responsive web engineering, and scalable backend solutions.",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className="font-sans bg-[#050508] text-[#f0f0f0] antialiased min-h-screen selection:bg-[var(--electric-blue)]/30 selection:text-white" suppressHydrationWarning>
        <Cursor />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
```

## File: `src/app/page.tsx`

```typescript
"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { initScrollCamera } from "@/animations/scrollCamera";
import DashboardHero from "@/components/ui/DashboardHero";
import SocialSidebar from "@/components/ui/SocialSidebar";
import Loader from "@/components/ui/Loader";
import About from "@/components/sections/About";
import Skills from "@/components/sections/Skills";
import Projects from "@/components/sections/Projects";
import Experience from "@/components/sections/Experience";
import Contact from "@/components/sections/Contact";

const Scene = dynamic(() => import("@/components/canvas/Scene"), {
  ssr: false,
  loading: () => null,
});

const SHOW_DEV_RULER = false;

function useStageScale() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => {
      const widthScale = (window.innerWidth - 28) / 1760;
      const heightScale = (window.innerHeight - 112) / 920;
      setScale(Math.min(1, Math.max(0.58, Math.min(widthScale, heightScale))));
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return scale;
}

export default function Home() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [loaderComplete, setLoaderComplete] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const stageScale = useStageScale();

  // Initialize scroll camera
  useEffect(() => {
    const scrollControl = initScrollCamera((progress) => {
      setScrollProgress(progress);
    });

    return () => {
      if (scrollControl) scrollControl.destroy();
    };
  }, []);

  // Set scene ready state when loader finishes
  useEffect(() => {
    if (loaderComplete) {
      setSceneReady(true);
    }
  }, [loaderComplete]);

  return (
    <main className="relative min-h-[500vh] bg-[#030001]">
      {/* Preload Sequence Loader (z-index 99999) */}
      {!loaderComplete && (
        <Loader onComplete={() => setLoaderComplete(true)} />
      )}

      {/* 3D WebGL Scene — mounted continuously behind loader for zero pop-in */}
      <div
        className="fixed inset-0 z-0 h-full w-full"
        style={{
          opacity: sceneReady ? 1 : 0.9,
          transition: "opacity 1s ease-out",
        }}
      >
        <Scene scrollProgress={scrollProgress} />
      </div>

      {/* Social sidebar — appears after loader completes */}
      <div
        style={{
          opacity: loaderComplete ? 1 : 0,
          pointerEvents: loaderComplete ? "auto" : "none",
          transition: "opacity 1s ease-out 0.3s",
        }}
      >
        <SocialSidebar />
      </div>

      {/* Dashboard Hero — Station 1 UI overlay */}
      <div
        style={{
          opacity: loaderComplete ? 1 : 0,
          pointerEvents: loaderComplete ? "auto" : "none",
          transition: "opacity 1.2s ease-out 0.4s",
        }}
      >
        <DashboardHero scrollProgress={scrollProgress} stageScale={stageScale} />
      </div>

      {/* Content sections — fade in as user scrolls down */}
      <div
        className="relative z-10 -mt-px"
        style={{
          background:
            "linear-gradient(180deg, rgba(3,0,1,0.4) 0%, rgba(10,0,2,0.82) 18%, rgba(10,0,2,0.94) 100%)",
          opacity: loaderComplete ? 1 : 0,
          pointerEvents: loaderComplete ? "auto" : "none",
          transition: "opacity 1.5s ease-out",
        }}
      >
        <About />
        <Skills />
        <Projects />
        <Experience />
        <Contact />
      </div>

      {/* Dev ruler — hidden by default */}
      {SHOW_DEV_RULER && loaderComplete && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-black/85 border border-red-900/60 text-red-500 px-4 py-2.5 rounded-md font-mono shadow-2xl flex flex-col items-center gap-1.5 min-w-[280px]"
          style={{ backdropFilter: "blur(4px)" }}
        >
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider">
            <span>SCROLL PROGRESS:</span>
            <span className="text-white text-sm font-bold bg-red-950/60 px-1.5 py-0.5 rounded border border-red-800/40">
              {scrollProgress.toFixed(3)}
            </span>
          </div>
          <div className="relative w-full h-5 border-b border-red-950 flex justify-between mt-1">
            <div className="absolute left-0 bottom-0 w-px h-2.5 bg-red-800" />
            <div className="absolute left-1/4 bottom-0 w-px h-1.5 bg-red-950" />
            <div className="absolute left-1/2 bottom-0 w-px h-3.5 bg-red-500 -translate-x-1/2 animate-pulse" />
            <div className="absolute left-3/4 bottom-0 w-px h-1.5 bg-red-950" />
            <div className="absolute right-0 bottom-0 w-px h-2.5 bg-red-800" />
            <div
              className="absolute bottom-0 w-1.5 h-4 bg-red-500 -translate-x-1/2 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
              style={{ left: `${scrollProgress * 100}%` }}
            />
          </div>
          <div className="flex justify-between w-full text-[9px] text-red-800/80 font-bold px-0.5 mt-0.5">
            <span>0.00</span>
            <span>0.25</span>
            <span>0.50</span>
            <span>0.75</span>
            <span>1.00</span>
          </div>
        </div>
      )}
    </main>
  );
}
```

## File: `src/components/canvas/DeepSpaceGlobe.tsx`

```typescript
"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const globeVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const globeFragmentShader = `
  uniform float uTime;
  uniform float uSpeed;
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    // Hologram grid lines
    vec2 gridDensity = vec2(48.0, 24.0);
    vec2 gridUv = fract(vUv * gridDensity);
    vec2 gridLines = smoothstep(0.06, 0.0, abs(gridUv - 0.5));
    float gridPattern = max(gridLines.x, gridLines.y);

    // Sliding scanlines
    float scanline = sin(vUv.y * 110.0 - uTime * uSpeed * 6.0) * 0.5 + 0.5;

    // Fresnel rim glow
    float fresnel = pow(1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.5);

    vec3 col = uColor;
    if (gridPattern > 0.01) {
      col = mix(col, vec3(1.0, 0.5, 0.6), gridPattern * 0.5);
    }

    float alpha = uOpacity * (gridPattern * 0.6 + 0.15) * (0.7 + 0.3 * scanline);
    alpha += fresnel * 0.35 * (0.8 + 0.2 * scanline);

    gl_FragColor = vec4(col, alpha);
  }
`;

interface DeepSpaceGlobeProps {
  scrollProgress: number;
}

export default function DeepSpaceGlobe({ scrollProgress }: DeepSpaceGlobeProps) {
  const globeRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Group>(null);

  const mainShaderRef = useRef<THREE.ShaderMaterial>(null);
  const secondShaderRef = useRef<THREE.ShaderMaterial>(null);

  const mainUniforms = useMemo(
    () => ({
      uTime: { value: 0.0 },
      uSpeed: { value: 0.8 },
      uColor: { value: new THREE.Color("#ff1744") },
      uOpacity: { value: 0.45 },
    }),
    []
  );

  const secondUniforms = useMemo(
    () => ({
      uTime: { value: 0.0 },
      uSpeed: { value: 1.4 },
      uColor: { value: new THREE.Color("#ff4444") },
      uOpacity: { value: 0.28 },
    }),
    []
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (mainShaderRef.current) mainShaderRef.current.uniforms.uTime.value = t;
    if (secondShaderRef.current) secondShaderRef.current.uniforms.uTime.value = t;

    // Spin speeds up dynamically when scrolling
    if (globeRef.current) {
      globeRef.current.rotation.y = t * 0.08 + scrollProgress * 0.95;
      globeRef.current.rotation.x = Math.sin(t * 0.15) * 0.06;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.035 + scrollProgress * 0.45;
      ringRef.current.rotation.y = Math.sin(t * 0.1) * 0.1;
    }
  });

  return (
    <group position={[4.5, 2.5, -8]} scale={2.2} renderOrder={-8}>
      <pointLight position={[0, 0, 2.2]} color="#ff1744" intensity={2.0} distance={15} decay={2} />
      <pointLight position={[-2.2, 1.8, 0.5]} color="#ff8a80" intensity={0.5} distance={10} decay={2} />

      <group ref={globeRef}>
        {/* Main wireframe hologram sphere */}
        <mesh>
          <sphereGeometry args={[1.1, 64, 36]} />
          <shaderMaterial
            ref={mainShaderRef}
            vertexShader={globeVertexShader}
            fragmentShader={globeFragmentShader}
            uniforms={mainUniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Secondary inner hologram sphere */}
        <mesh scale={[1.015, 1.015, 1.015]}>
          <sphereGeometry args={[1.1, 32, 18]} />
          <shaderMaterial
            ref={secondShaderRef}
            vertexShader={globeVertexShader}
            fragmentShader={globeFragmentShader}
            uniforms={secondUniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Equator ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <sphereGeometry args={[1.105, 48, 16]} />
          <meshBasicMaterial color="#ff1744" wireframe transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>

        {/* Inner glow sphere */}
        <mesh>
          <sphereGeometry args={[1.02, 48, 24]} />
          <meshBasicMaterial color="#800010" transparent opacity={0.04} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      </group>

      {/* Orbital rings */}
      <group ref={ringRef} rotation={[0.95, 0.22, -0.28]}>
        {[1.32, 1.58, 1.86, 2.2].map((radius, index) => (
          <mesh key={radius}>
            <torusGeometry args={[radius, 0.008, 8, 160]} />
            <meshBasicMaterial
              color={index === 1 ? "#ff1744" : "#ff4444"}
              transparent
              opacity={index === 1 ? 0.22 : 0.12}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* Outer atmosphere glow */}
      <mesh scale={[1.75, 1.75, 1.75]}>
        <sphereGeometry args={[1.1, 42, 24]} />
        <meshBasicMaterial color="#ff1744" transparent opacity={0.03} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}
```

## File: `src/components/canvas/FloatingHexParticles.tsx`

```typescript
"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function FloatingHexParticles() {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, phases, sizes } = useMemo(() => {
    const count = 200;
    const pos = new Float32Array(count * 3);
    const ph = new Float32Array(count);
    const sz = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * 40;
      pos[i3 + 1] = Math.random() * 15 - 2;
      pos[i3 + 2] = (Math.random() - 0.5) * 30 - 5;
      ph[i] = Math.random() * Math.PI * 2;
      sz[i] = 0.05 + Math.random() * 0.1;
    }

    return { positions: pos, phases: ph, sizes: sz };
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const t = state.clock.getElapsedTime();
    const posAttr = pointsRef.current.geometry.attributes.position;
    const posArray = posAttr.array as Float32Array;

    for (let i = 0; i < 200; i++) {
      const i3 = i * 3;
      // Float upward
      posArray[i3 + 1] += 0.003;
      // Gentle drift
      posArray[i3] += Math.sin(t * 0.5 + phases[i]) * 0.001;
      
      // Reset if too high
      if (posArray[i3 + 1] > 15) {
        posArray[i3 + 1] = -2;
        posArray[i3] = (Math.random() - 0.5) * 40;
        posArray[i3 + 2] = (Math.random() - 0.5) * 30 - 5;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial
        uniforms={{ uTime: { value: 0 } }}
        vertexShader={`
          attribute float aSize;
          attribute float aPhase;
          varying float vAlpha;
          uniform float uTime;
          void main() {
            vAlpha = 0.4 + 0.3 * sin(uTime * 0.8 + aPhase);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = aSize * (40.0 / max(1.0, -mv.z));
          }
        `}
        fragmentShader={`
          varying float vAlpha;
          void main() {
            vec2 uv = gl_PointCoord - 0.5;
            float d = length(uv);
            // Hexagon shape
            float hex = abs(uv.x) * 0.866 + abs(uv.y) * 0.5;
            float shape = 1.0 - smoothstep(0.3, 0.5, hex);
            if (shape < 0.01) discard;
            gl_FragColor = vec4(1.0, 0.15, 0.25, shape * vAlpha * 0.6);
          }
        `}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
```

## File: `src/components/canvas/FloatingLaptop.tsx`

```typescript
"use client";

import React, { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useMousePosition } from "@/hooks/useMousePosition";

const SCREEN_MATERIAL_NAME = "Material.004";

export default function FloatingLaptop() {
  const { scene } = useGLTF("/models/laptop-baked.glb");

  const groupRef = useRef<THREE.Group>(null);
  const bobRef   = useRef<THREE.Group>(null);
  const kbLightRef = useRef<THREE.PointLight>(null);
  const mouse = useMousePosition(0.08);

  useMemo(() => {
    const darkBody = new THREE.MeshStandardMaterial({
      color:             "#09091a",
      metalness:          0.85,
      roughness:          0.15,
      emissive:          "#1a0a2a",
      emissiveIntensity:  0.25,
    });

    scene.updateMatrixWorld(true);

    scene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;

      mesh.castShadow    = true;
      mesh.receiveShadow = true;

      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat && mat.name === SCREEN_MATERIAL_NAME) {
        mat.toneMapped = false;
        mat.needsUpdate = true;
        return;
      }

      mesh.material = darkBody;
    });
  }, [scene]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (bobRef.current) {
      bobRef.current.position.y = Math.sin(t * 0.85) * 0.15;
    }

    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        -Math.PI / 2 - 0.15 + state.pointer.x * 0.045,
        0.045,
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        0.09 - state.pointer.y * 0.035,
        0.045,
      );
    }

    if (kbLightRef.current) {
      const dx = mouse.x - 0.25;
      const dy = mouse.y + 0.15;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const proximity = Math.exp(-dist * dist * 4.0); // 1.0 close, 0.0 far
      
      kbLightRef.current.intensity = 1.5 + proximity * 5.0; // Glows up to 6.5!
      kbLightRef.current.distance = 2.5 + proximity * 3.5;
    }
  });

  const { width } = useThree((state) => state.viewport);
  const laptopX   = Math.max(0.8, width * 0.08);

  return (
    <group
      ref={groupRef}
      position={[laptopX, -0.52, -1.34]}
      rotation={[0.09, -Math.PI / 2 - 0.15, -0.03]}
    >
      <group ref={bobRef}>
        <primitive object={scene} scale={1.15} />

        {/* Screen glow plane — commented out, was visually dissecting through the laptop */}
        {/*
        <mesh position={[0.2, 0.78, -0.72]} rotation={[0.05, 0, 0]}>
          <planeGeometry args={[2.2, 1.35]} />
          <meshBasicMaterial
            color="#ff1744"
            transparent
            opacity={0.07}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        */}

        {/* Keyboard glow plane — commented out, was dissecting the keyboard visually */}
        {/*
        <mesh position={[0.36, -0.28, 0.22]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.5, 1.0]} />
          <meshBasicMaterial
            color="#ff1744"
            transparent
            opacity={0.08}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        */}

        {/* 
        <mesh position={[0.32, -0.9, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[2.35, 72]} />
          <meshBasicMaterial
            color="#ff1744"
            transparent
            opacity={0.04}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        <mesh position={[0.0, -1.02, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.25, 2.75, 96]} />
          <meshBasicMaterial
            color="#ff1744"
            transparent
            opacity={0.03}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        */}

        {/* Key light — behind screen, illuminates top edge and screen halo */}
        <pointLight position={[0, 1.8, -1.2]}   intensity={7.5} distance={14} color="#ff1744" decay={2} />
        {/* Fill light — left side, illuminates hinge and left body */}
        <pointLight position={[-2.1, 0.65, 0.45]} intensity={4.5} distance={11} color="#ff1744" decay={2} />
        {/* Under-glow — bottom accent, pink tint */}
        <pointLight position={[0.8, -1.15, 0.95]} intensity={3.5} distance={10} color="#800010" decay={2} />
        {/* Front fill — viewer-facing, softens shadows */}
        <pointLight position={[0, 0.5, 1.5]}      intensity={3.2} distance={10} color="#ff1744" decay={2} />
        {/* General body illumination */}
        <pointLight position={[0, -0.5, 0]} intensity={4.0} distance={10} color="#ff1744" decay={2} />
        {/* Keyboard backlight — low, close to keyboard deck surface, subtle warm glow */}
        <pointLight ref={kbLightRef} position={[0.3, -0.15, 0.35]} intensity={3.5} distance={4} color="#ff6680" decay={2} />
        {/* Right-side rim light — catches the right edge of laptop body */}
        <pointLight position={[2.0, 0.3, 0.2]} intensity={2.8} distance={8} color="#ff3355" decay={2} />
      </group>
    </group>
  );
}

useGLTF.preload("/models/laptop-baked.glb");
```

## File: `src/components/canvas/FloorRings.tsx`

```typescript
"use client";

import React, { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useMousePosition } from "@/hooks/useMousePosition";

export default function FloorRings() {
  const ringsRef = useRef<THREE.Group>(null);
  const energyRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Group>(null);
  const secondaryRingsRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const mouse = useMousePosition(0.08);

  const ringGeometries = useMemo(() => {
    const rings: THREE.BufferGeometry[] = [];
    const radii = [0.4, 0.8, 1.3, 1.9, 2.6, 3.4, 4.3, 5.3, 6.4, 7.7];

    for (const radius of radii) {
      const points: THREE.Vector3[] = [];
      const segments = Math.max(80, Math.floor(radius * 40));
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius
        ));
      }
      rings.push(new THREE.BufferGeometry().setFromPoints(points));
    }
    return rings;
  }, []);

  const secondaryRingGeometries = useMemo(() => {
    const rings: THREE.BufferGeometry[] = [];
    const radii = [0.6, 1.05, 1.55, 2.2, 2.9, 3.8, 4.8, 5.8, 7.0];

    for (const radius of radii) {
      const points: THREE.Vector3[] = [];
      const segments = Math.max(64, Math.floor(radius * 32));
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius
        ));
      }
      rings.push(new THREE.BufferGeometry().setFromPoints(points));
    }
    return rings;
  }, []);

  const energyGeometries = useMemo(() => {
    const segments: THREE.BufferGeometry[] = [];
    const radii = [0.8, 1.5, 2.4, 3.5, 4.7, 6.1, 7.4];
    
    for (const radius of radii) {
      const points: THREE.Vector3[] = [];
      const arcLength = Math.PI * 0.5;
      const segments_count = 48;
      for (let i = 0; i <= segments_count; i++) {
        const angle = (i / segments_count) * arcLength;
        points.push(new THREE.Vector3(
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius
        ));
      }
      segments.push(new THREE.BufferGeometry().setFromPoints(points));
    }
    return segments;
  }, []);

  const rippleGeometries = useMemo(() => {
    const ripples: THREE.BufferGeometry[] = [];
    for (let r = 0; r < 6; r++) {
      const points: THREE.Vector3[] = [];
      const segments = 160;
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)));
      }
      ripples.push(new THREE.BufferGeometry().setFromPoints(points));
    }
    return ripples;
  }, []);

  const { viewport } = useThree();
  const laptopX = Math.max(0.8, viewport.width * 0.08);

  useFrame((state) => {
    const dt = state.clock.getDelta();
    
    // Proximity to laptop base on floor
    const dx = mouse.x - 0.25;
    const dy = mouse.y + 0.15;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const proximity = Math.exp(-dist * dist * 4.0); // 1.0 close, 0.0 far
    
    // Rings pulse up to 2.2x faster near mouse
    const speedFactor = 1.0 + proximity * 1.2;
    timeRef.current += dt * speedFactor;
    const t = timeRef.current;
    
    if (ringsRef.current) {
      ringsRef.current.children.forEach((child, i) => {
        const line = child as THREE.Line;
        if (line && line.scale) {
          const heartbeat = 1.0 + Math.sin(t * 0.85 + i * 0.45) * 0.035;
          line.scale.set(heartbeat, heartbeat, heartbeat);
        }
        if (line.material) {
          const mat = line.material as THREE.LineBasicMaterial;
          const baseOpacity = Math.max(0.04, 0.12 - i * 0.008);
          mat.opacity = baseOpacity + Math.sin(t * 0.55 + i * 0.65) * 0.04;
        }
      });
    }

    if (secondaryRingsRef.current) {
      secondaryRingsRef.current.children.forEach((child, i) => {
        const line = child as THREE.Line;
        if (line.material) {
          const mat = line.material as THREE.LineBasicMaterial;
          mat.opacity = 0.04 + Math.sin(t * 0.7 + i * 1.0) * 0.025;
        }
      });
    }

    if (energyRef.current) {
      energyRef.current.children.forEach((child, i) => {
        const line = child as THREE.Line;
        if (line) {
          const speed = 0.42 + i * 0.15;
          line.rotation.y = t * speed + i * 1.8;
        }
        if (line.material) {
          const mat = line.material as THREE.LineBasicMaterial;
          mat.opacity = 0.22 + Math.sin(t * 2.8 + i * 2.0) * 0.12;
        }
      });
    }

    if (glowRef.current) {
      glowRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshBasicMaterial;
          const pulse = Math.sin(t * 0.5 + i * 1.2) * 0.5 + 0.5;
          mat.opacity = 0.025 + pulse * 0.065;
          const scale = 1.0 + pulse * 0.7;
          mesh.scale.set(scale, scale, scale);
        }
      });
    }
  });

  return (
    <group position={[laptopX + 0.2, -2.14, -1.24]}>
      <group ref={ringsRef}>
        {ringGeometries.map((geometry, i) => (
          <primitive 
            key={`ring-${i}`}
            object={new THREE.Line(
              geometry, 
              new THREE.LineBasicMaterial({
                color: i % 4 === 0 ? "#ff1744" : i % 3 === 0 ? "#ff3355" : "#cc1133",
                transparent: true,
                opacity: Math.max(0.04, 0.12 - i * 0.008),
                blending: THREE.AdditiveBlending,
                depthWrite: false,
              })
            )} 
          />
        ))}
      </group>

      <group ref={secondaryRingsRef}>
        {secondaryRingGeometries.map((geometry, i) => (
          <primitive 
            key={`secondary-${i}`}
            object={new THREE.Line(
              geometry, 
              new THREE.LineBasicMaterial({
                color: "#880022",
                transparent: true,
                opacity: 0.04,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
              })
            )} 
          />
        ))}
      </group>

      <group ref={energyRef}>
        {energyGeometries.map((geometry, i) => (
          <primitive
            key={`energy-${i}`}
            object={new THREE.Line(
              geometry,
              new THREE.LineBasicMaterial({
                color: i % 2 === 0 ? "#ff1744" : "#ff6688",
                transparent: true,
                opacity: 0.22,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
              })
            )}
          />
        ))}
      </group>

      <group ref={glowRef}>
        {rippleGeometries.map((_, i) => (
          <mesh key={`ripple-${i}`} rotation={[-Math.PI / 2, 0, 0]} scale={[0.4 + i * 1.3, 0.4 + i * 1.3, 1]}>
            <ringGeometry args={[0.97, 1.0, 128]} />
            <meshBasicMaterial
              color="#ff1744"
              transparent
              opacity={0.025}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[3.5, 64]} />
        <meshBasicMaterial
          color="#ff1744"
          transparent
          opacity={0.05}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <circleGeometry args={[1.2, 48]} />
        <meshBasicMaterial
          color="#ff4466"
          transparent
          opacity={0.10}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <pointLight position={[0, 0.5, 0]} intensity={2.0} color="#ff1744" distance={10} decay={2} />

      {[
        [-1.5, 0.02, 1.0],
        [0.2, 0.02, 1.8],
        [1.6, 0.02, 0.6],
        [-0.8, 0.02, -0.5],
        [2.2, 0.02, 1.5],
        [-2.0, 0.02, 0.3],
        [1.0, 0.02, -1.0],
        [-1.2, 0.02, 2.0],
      ].map((pos, i) => (
        <mesh key={`node-${i}`} position={pos as [number, number, number]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.05 + (i % 3) * 0.01, 24]} />
          <meshBasicMaterial
            color={i % 2 === 0 ? "#ff1744" : "#ff4466"}
            transparent
            opacity={0.08}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
```

## File: `src/components/canvas/HeroName3D.tsx`

```typescript
"use client";

import React, { useRef } from "react";
import { Text3D } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const titleFont = "/fonts/cyber.typeface.json";

const textProps = {
  font: titleFont,
  height: 0.30,
  curveSegments: 5,
  bevelEnabled: true,
  bevelThickness: 0.035,
  bevelSize: 0.014,
  bevelOffset: 0,
  bevelSegments: 2,
};

// Single TitleLine — 2 meshes per word: deep shadow + glowing face
function TitleLine({
  text,
  size,
  y,
  isMagenta = false,
}: {
  text: string;
  size: number;
  y: number;
  isMagenta?: boolean;
}) {
  const faceColor = isMagenta ? "#cc1133" : "#ff1744";
  const emissive  = isMagenta ? "#800010" : "#cc0018";
  const shadowEm  = isMagenta ? "#280004" : "#200002";

  return (
    <group position={[0, y, 0]}>
      {/* Shadow depth layer */}
      <Text3D {...textProps} size={size} position={[0.05, -0.05, -0.28]}>
        {text}
        <meshStandardMaterial
          color="#04051a"
          emissive={shadowEm}
          emissiveIntensity={0.45}
          metalness={0.85}
          roughness={0.45}
        />
      </Text3D>

      {/* Neon front face */}
      <Text3D {...textProps} size={size} position={[0, 0, 0]} castShadow>
        {text}
        <meshStandardMaterial
          color={faceColor}
          emissive={emissive}
          emissiveIntensity={3.8}
          metalness={0.92}
          roughness={0.06}
        />
      </Text3D>
    </group>
  );
}

export default function HeroName3D({ stageScale = 1 }: { stageScale?: number }) {
  const groupRef = useRef<THREE.Group>(null);

  // Mirror the HTML stage-left-copy position in world space.
  // The HTML stage is 1760px wide centred at viewport centre.
  // Left column occupies cols 1-4 (~36% of 1760px → ~634px from left).
  // In 3D at camera fov=45, z=9.2: at scale=1 the left edge is roughly posX = -4.5
  const posX = -4.35 + (1 - stageScale) * 2.2;
  const posY =  2.05 * stageScale;

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      -0.10 + state.pointer.x * 0.055,
      0.05,
    );
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      0.07 - state.pointer.y * 0.055,
      0.05,
    );
    // Gentle bob
    groupRef.current.position.y = posY + Math.sin(t * 1.1) * 0.025;
  });

  const s = 0.62 * stageScale;

  return (
    <group
      ref={groupRef}
      position={[posX, posY, 1.5]}
      rotation={[0.07, -0.10, -0.018]}
      scale={[s, s, s]}
    >
      {/* Key lights to illuminate the neon letters */}
      <pointLight position={[-0.5, 1.2, 2.5]} intensity={2.8} distance={8} color="#ff1744" decay={2} />
      <pointLight position={[3.2, -0.8, 2.0]} intensity={1.8} distance={7} color="#800010" decay={2} />

      {/* Floor glow blob */}
      <mesh position={[2.1, -1.55, -0.5]} rotation={[-Math.PI / 2, 0, 0]} scale={[4.4, 1.2, 1]}>
        <circleGeometry args={[1, 48]} />
        <meshBasicMaterial color="#ff1744" transparent opacity={0.06} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      <TitleLine text="POSHAN" size={0.88} y={0} isMagenta={false} />
      <TitleLine text="MS"     size={1.18} y={-1.22} isMagenta />
    </group>
  );
}
```

## File: `src/components/canvas/MagneticParticles.tsx`

```typescript
"use client";

import React, { useMemo, useRef, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMousePosition } from "@/hooks/useMousePosition";

/*
 * CometTrail Particle System — "Overkill" Edition
 * 
 * Two layers working together:
 * 
 * 1. AMBIENT FIELD (1200 particles):
 *    Slowly drifting cosmic dust across the viewport.
 *    Gentle twinkle. Constant soft glow. Sets the atmosphere.
 *
 * 2. COMET TRAIL (400 particles, recycled ring buffer):
 *    As the user moves their mouse, particles spawn at the cursor
 *    position and drift away behind the cursor path like a glowing
 *    comet tail. Features:
 *    - Speed-sensitive: faster mouse = longer, brighter trail
 *    - Directional drift: particles eject opposite to mouse velocity
 *    - Color temperature shift: fresh sparks are bright white-hot,
 *      they cool down through red → dark crimson as they age
 *    - Size decay: large bright spark → shrinking dying ember
 *    - Gravity pull: old particles slowly drift downward
 *    - Turbulence: subtle random jitter so the trail feels organic
 *    - Afterglow: particles don't just disappear, they fade out with
 *      a soft bloom-friendly glow
 */

const AMBIENT_COUNT = 2500;
const TRAIL_COUNT = 1500;
const TOTAL = AMBIENT_COUNT + TRAIL_COUNT;

export default function ParticleNetwork() {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const mouse = useMousePosition(0.12);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const trailIndexRef = useRef(0);
  const velocityRef = useRef({ x: 0, y: 0 });

  const {
    positions, sizes, phases, lifetimes, maxLifetimes,
    trailVelocities, trailColors,
  } = useMemo(() => {
    const pos = new Float32Array(TOTAL * 3);
    const sz = new Float32Array(TOTAL);
    const ph = new Float32Array(TOTAL);
    const life = new Float32Array(TOTAL);
    const maxLife = new Float32Array(TOTAL);
    const tVel = new Float32Array(TRAIL_COUNT * 3);
    const tCol = new Float32Array(TOTAL); // 0=ambient, 0-1=trail age

    // --- Ambient particles ---
    for (let i = 0; i < AMBIENT_COUNT; i++) {
      const idx = i * 3;
      pos[idx]     = (Math.random() - 0.5) * 38;
      pos[idx + 1] = (Math.random() - 0.5) * 22;
      pos[idx + 2] = (Math.random() - 0.5) * 14;
      // Smaller, delicate background stars
      sz[i] = 0.2 + Math.random() * 0.6;
      ph[i] = Math.random() * Math.PI * 2;
      life[i] = -1; // -1 = ambient, always alive
      maxLife[i] = -1;
      tCol[i] = 0;
    }

    // --- Trail particles (all start dead) ---
    for (let i = AMBIENT_COUNT; i < TOTAL; i++) {
      const idx = i * 3;
      pos[idx] = 0;
      pos[idx + 1] = -999; // hidden offscreen
      pos[idx + 2] = 0;
      sz[i] = 0;
      ph[i] = Math.random() * Math.PI * 2;
      life[i] = 0;
      maxLife[i] = 0;
      tCol[i] = 1;
    }

    return {
      positions: pos,
      sizes: sz,
      phases: ph,
      lifetimes: life,
      maxLifetimes: maxLife,
      trailVelocities: tVel,
      trailColors: tCol,
    };
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color("#ff1744") },
    }),
    []
  );

  // Spawn trail particles at cursor position (rocket boost explosion effect)
  const spawnTrail = useCallback(
    (wx: number, wy: number, vx: number, vy: number, speed: number) => {
      // Denser trail: spawn 3-18 particles per frame depending on speed
      const count = Math.min(18, Math.max(3, Math.floor(speed * 25)));

      for (let s = 0; s < count; s++) {
        const i = AMBIENT_COUNT + trailIndexRef.current;
        trailIndexRef.current = (trailIndexRef.current + 1) % TRAIL_COUNT;

        const idx = i * 3;
        const tIdx = (i - AMBIENT_COUNT) * 3;

        // Expanded start scatter for a cloud-like explosion shape
        const scatter = 0.12 + speed * 0.35;
        positions[idx]     = wx + (Math.random() - 0.5) * scatter;
        positions[idx + 1] = wy + (Math.random() - 0.5) * scatter;
        positions[idx + 2] = (Math.random() - 0.5) * 1.0;

        // Eject in a massive 220-degree cone opposite to cursor velocity
        const angle = Math.atan2(-vy, -vx) + (Math.random() - 0.5) * 2.0;
        
        // High-velocity thrust ejection
        const ejectSpeed = (0.04 + speed * 0.14) * (0.6 + Math.random() * 1.2);
        trailVelocities[tIdx]     = Math.cos(angle) * ejectSpeed + (Math.random() - 0.5) * 0.02;
        trailVelocities[tIdx + 1] = Math.sin(angle) * ejectSpeed + (Math.random() - 0.5) * 0.02;
        trailVelocities[tIdx + 2] = (Math.random() - 0.5) * 0.01;

        // Varied small spark sizes
        sizes[i] = 0.3 + Math.random() * 0.9 + speed * 1.0;

        // Snappy spark lifetime: 0.6 to 1.5 seconds
        const baseLife = 0.6 + Math.random() * 0.9;
        maxLifetimes[i] = baseLife;
        lifetimes[i] = baseLife;
      }
    },
    [positions, sizes, lifetimes, maxLifetimes, trailVelocities]
  );

  useFrame((state) => {
    if (!pointsRef.current || !materialRef.current) return;

    const t = state.clock.getElapsedTime();
    const dt = Math.min(state.clock.getDelta(), 0.05); // cap delta
    materialRef.current.uniforms.uTime.value = t;

    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position;
    const posArray = posAttr.array as Float32Array;
    const sizeAttr = geo.attributes.aSize;
    const sizeArray = sizeAttr.array as Float32Array;
    const ageAttr = geo.attributes.aAge;
    const ageArray = ageAttr.array as Float32Array;

    // --- Exact Screen-to-World Translation using R3F state viewport ---
    const { viewport } = state;
    const mx = (mouse.x * viewport.width) / 2;
    const my = (mouse.y * viewport.height) / 2;
    
    const vx = mx - prevMouseRef.current.x;
    const vy = my - prevMouseRef.current.y;
    const speed = Math.sqrt(vx * vx + vy * vy);

    // Smooth velocity for ejection direction
    velocityRef.current.x = THREE.MathUtils.lerp(velocityRef.current.x, vx, 0.3);
    velocityRef.current.y = THREE.MathUtils.lerp(velocityRef.current.y, vy, 0.3);

    prevMouseRef.current.x = mx;
    prevMouseRef.current.y = my;

    // Spawn trail if mouse is moving
    if (speed > 0.01) {
      spawnTrail(mx, my, velocityRef.current.x, velocityRef.current.y, Math.min(speed, 2.0));
    }

    // --- Update ambient particles ---
    for (let i = 0; i < AMBIENT_COUNT; i++) {
      const idx = i * 3;
      // Gentle organic drift
      posArray[idx]     += Math.sin(t * 0.18 + phases[i]) * 0.003;
      posArray[idx + 1] += Math.cos(t * 0.12 + phases[i] * 1.7) * 0.003;
      posArray[idx + 2] += Math.sin(t * 0.1 + phases[i] * 0.5) * 0.001;

      // Twinkle size
      sizeArray[i] = sizes[i] * (0.6 + 0.4 * Math.sin(t * 1.2 + phases[i]));
      ageArray[i] = 0.0; // 0 = ambient (cool, steady glow)
    }

    // --- Update trail particles ---
    for (let i = AMBIENT_COUNT; i < TOTAL; i++) {
      if (lifetimes[i] <= 0) {
        // Dead particle — hide offscreen
        posArray[i * 3 + 1] = -999;
        sizeArray[i] = 0;
        ageArray[i] = 1.0;
        continue;
      }

      lifetimes[i] -= dt;
      const age = 1.0 - (lifetimes[i] / maxLifetimes[i]); // 0=fresh, 1=dying
      ageArray[i] = age;

      const idx = i * 3;
      const tIdx = (i - AMBIENT_COUNT) * 3;

      // Apply velocity
      posArray[idx]     += trailVelocities[tIdx]     * (1.0 - age * 0.7);
      posArray[idx + 1] += trailVelocities[tIdx + 1] * (1.0 - age * 0.7);
      posArray[idx + 2] += trailVelocities[tIdx + 2] * (1.0 - age * 0.5);

      // Gravity: old particles drift down slowly
      posArray[idx + 1] -= age * age * 0.008;

      // Turbulence: random jitter that increases with age for exhaust scattering
      const turb = age * 0.035;
      posArray[idx]     += (Math.random() - 0.5) * turb;
      posArray[idx + 1] += (Math.random() - 0.5) * turb;

      // Velocity drag (slow down over time)
      trailVelocities[tIdx]     *= 0.97;
      trailVelocities[tIdx + 1] *= 0.97;
      trailVelocities[tIdx + 2] *= 0.97;

      // Size: large spark → shrinking ember
      const sizeCurve = 1.0 - age * age; // quadratic decay
      sizeArray[i] = sizes[i] * sizeCurve * (0.3 + 0.7 * (1.0 - age));
    }

    posAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
    ageAttr.needsUpdate = true;
  });

  // --- Shader: vertex ---
  const vertexShader = `
    attribute float aSize;
    attribute float aPhase;
    attribute float aAge;
    uniform float uTime;
    varying float vAge;
    varying float vTwinkle;

    void main() {
      vAge = aAge;
      
      // Ambient particles twinkle; trail particles don't need it
      vTwinkle = aAge < 0.01 
        ? 0.5 + 0.5 * sin(uTime * 1.5 + aPhase) 
        : 1.0;
      
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Depth-based sizing
      gl_PointSize = aSize * vTwinkle * (28.0 / -mvPosition.z);
      
      // Clamp so trail sparks don't get absurdly large up close
      gl_PointSize = min(gl_PointSize, 48.0);
    }
  `;

  // --- Shader: fragment ---
  const fragmentShader = `
    uniform vec3 uColor;
    uniform float uTime;
    varying float vAge;
    varying float vTwinkle;

    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      
      // Soft circular mask
      if (dist > 0.5) discard;
      
      // Radial glow: dense hot core, soft halo edge
      float core = smoothstep(0.5, 0.0, dist);
      float halo = smoothstep(0.5, 0.15, dist) * 0.35;
      float brightness = core + halo;
      
      // === COLOR TEMPERATURE based on age ===
      // age 0.0 = ambient steady glow (cool red)
      // age 0.01-0.2 = FRESH trail spark (white-hot, blazing)
      // age 0.2-0.6 = COOLING (bright orange-red)
      // age 0.6-1.0 = DYING ember (deep dark crimson, fading)
      
      vec3 color;
      float alpha;
      
      if (vAge < 0.01) {
        // Ambient particle — steady crimson glow
        color = mix(uColor, vec3(1.0, 0.3, 0.4), smoothstep(0.1, 0.45, coord.x + 0.5));
        alpha = brightness * vTwinkle * 0.72;
      } else {
        // Trail particle — temperature-based coloring
        vec3 whiteHot = vec3(1.0, 0.95, 0.9);        // blazing white
        vec3 hotOrange = vec3(1.0, 0.4, 0.15);        // hot orange
        vec3 warmRed = vec3(0.9, 0.12, 0.08);         // warm red
        vec3 deadEmber = vec3(0.25, 0.02, 0.02);      // dying ember
        
        float age = vAge;
        
        if (age < 0.15) {
          // White-hot spark phase
          float t = age / 0.15;
          color = mix(whiteHot, hotOrange, t);
        } else if (age < 0.45) {
          // Cooling phase
          float t = (age - 0.15) / 0.30;
          color = mix(hotOrange, warmRed, t);
        } else {
          // Dying ember phase
          float t = (age - 0.45) / 0.55;
          color = mix(warmRed, deadEmber, t);
        }
        
        // Fresh sparks are brighter, dying embers are dimmer
        float ageFade = 1.0 - age * age; // quadratic fadeout
        alpha = brightness * ageFade * 1.2;
        
        // Extra core intensity for fresh sparks (the "POP")
        float sparkPop = (1.0 - smoothstep(0.0, 0.2, age)) * core * 0.8;
        alpha += sparkPop;
      }
      
      alpha = clamp(alpha, 0.0, 1.0);
      if (alpha < 0.005) discard;
      
      gl_FragColor = vec4(color, alpha);
    }
  `;

  // Age attribute for all particles
  const ageData = useMemo(() => new Float32Array(TOTAL), []);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        <bufferAttribute attach="attributes-aAge" args={[ageData, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
```

## File: `src/components/canvas/NebulaBackground.tsx`

```typescript
"use client";

import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const nebulaVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const nebulaFragmentShader = `
  uniform float uTime;
  uniform vec2 uResolution;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.2;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float t = uTime * 0.012;
    vec2 drift = vec2(t, -t * 0.5);

    float n1 = fbm(uv * 1.8 + drift);
    float n2 = fbm(uv * 3.2 - drift * 1.2 + vec2(5.2, 1.3));
    float n3 = fbm(uv * 5.5 + vec2(-t * 0.3, t * 0.4));
    float n4 = fbm(uv * 8.0 + vec2(t * 0.15, -t * 0.25));

    vec2 galaxyUv = uv - vec2(0.72, 0.68);
    float galaxyDist = length(galaxyUv);
    float galaxyAngle = atan(galaxyUv.y, galaxyUv.x);
    float spiral = cos(galaxyAngle * 4.0 + galaxyDist * 12.0 - uTime * 0.08);
    float galaxy = exp(-galaxyDist * galaxyDist * 25.0) * (0.5 + 0.5 * spiral);
    float galaxyArms = exp(-galaxyDist * galaxyDist * 8.0) * pow(spiral * 0.5 + 0.5, 2.0);

    float fog = pow(n1, 2.0) * 0.10 + pow(n2, 2.5) * 0.08 + pow(n3, 3.2) * 0.06 + pow(n4, 4.0) * 0.03;
    fog += galaxy * 0.06 + galaxyArms * 0.04;

    float topMask = smoothstep(0.0, 0.10, uv.y);
    float bottomFade = smoothstep(0.0, 0.50, uv.y);
    float sideFade = smoothstep(0.0, 0.08, uv.x) * smoothstep(1.0, 0.92, uv.x);
    fog *= topMask * bottomFade * sideFade;

    vec3 col1 = vec3(1.0, 0.06, 0.12) * pow(n1, 2.0) * 0.10;
    vec3 col2 = vec3(0.65, 0.02, 0.06) * pow(n2, 2.5) * 0.08;
    vec3 col3 = vec3(0.35, 0.0, 0.03) * pow(n3, 3.2) * 0.06;
    vec3 col4 = vec3(0.22, 0.0, 0.02) * pow(n4, 4.0) * 0.03;
    vec3 col5 = vec3(1.0, 0.10, 0.20) * galaxy * 0.06;
    vec3 col6 = vec3(0.85, 0.06, 0.14) * galaxyArms * 0.04;

    vec3 color = col1 + col2 + col3 + col4 + col5 + col6;

    float horizon = exp(-pow(uv.y - 0.20, 2.0) * 35.0);
    color += vec3(0.70, 0.03, 0.08) * horizon * 0.06;
    
    float upperGlow = exp(-pow(uv.y - 0.70, 2.0) * 12.0) * 0.4;
    color += vec3(0.45, 0.02, 0.05) * upperGlow * 0.04;

    float alpha = clamp(fog * 0.06 + galaxy * 0.03 + galaxyArms * 0.02 + horizon * 0.02, 0.0, 0.08);
    alpha *= smoothstep(0.0, 0.08, uv.y);

    gl_FragColor = vec4(color, alpha);
  }
`;

export default function NebulaBackground() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0.0 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
    }),
    [size]
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <mesh position={[0, 1, -45]} renderOrder={-100}>
      <planeGeometry args={[100, 60]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={nebulaVertexShader}
        fragmentShader={nebulaFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
```

## File: `src/components/canvas/NeonGrid.tsx`

```typescript
"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const gridVertexShader = `
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  varying float vDist;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    
    // Gravitational warp towards the laptop base position
    vec2 center = vec2(0.8, -1.24);
    vec2 toCenter = worldPosition.xz - center;
    float distToCenter = length(toCenter);
    
    // Smooth grid deformation
    float warp = exp(-distToCenter * distToCenter * 0.08) * 0.65;
    worldPosition.xz -= normalize(toCenter) * warp * min(distToCenter, 4.0);
    
    vWorldPosition = worldPosition.xyz;
    vUv = uv;
    vDist = length(worldPosition.xz);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const gridFragmentShader = `
  uniform float uTime;
  uniform vec3 uMouseFloor;
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  varying float vDist;

  void main() {
    vec2 worldXZ = vWorldPosition.xz;
    float dist = length(worldXZ);
    
    // Crisp grid cells, size = 2.0 units
    float cellSize = 2.0;
    vec2 gridCoord = worldXZ / cellSize;
    vec2 gridFract = fract(gridCoord);
    vec2 lineDist = abs(gridFract - 0.5) * 2.0;
    
    float perspectiveFade = 1.0 - smoothstep(12.0, 50.0, dist);
    
    // Visible but refined grid lines
    float lineWidth = 0.014 * perspectiveFade;
    float majorLineWidth = 0.028 * perspectiveFade;
    
    float lineX = 1.0 - smoothstep(lineWidth, lineWidth + 0.004, lineDist.x);
    float lineZ = 1.0 - smoothstep(lineWidth, lineWidth + 0.004, lineDist.y);
    float regularLine = max(lineX, lineZ);
    
    // Major lines every 5 cells
    float majorCellSize = cellSize * 5.0;
    vec2 majorCoord = worldXZ / majorCellSize;
    vec2 majorFract = fract(majorCoord);
    vec2 majorDist = abs(majorFract - 0.5) * 2.0;
    float majorX = 1.0 - smoothstep(majorLineWidth, majorLineWidth + 0.008, majorDist.x);
    float majorZ = 1.0 - smoothstep(majorLineWidth, majorLineWidth + 0.008, majorDist.y);
    float majorLine = max(majorX, majorZ);
    
    // Pulse animation lines
    float pulseSpeed = 1.5;
    float pulseX = sin(gridCoord.x * 6.283 + uTime * pulseSpeed) * 0.5 + 0.5;
    float pulseZ = sin(gridCoord.y * 6.283 + uTime * pulseSpeed * 0.7 + 1.0) * 0.5 + 0.5;
    float dataPulse = max(pulseX * lineX, pulseZ * lineZ) * 0.22;
    
    float gridPattern = max(regularLine * 0.25, majorLine * 0.50) * perspectiveFade;
    gridPattern += dataPulse * perspectiveFade;
    
    float nodeGlow = exp(-length(lineDist) * 9.0) * 0.06 * perspectiveFade;
    
    float horizonFade = 1.0 - smoothstep(5.0, 40.0, dist);
    float heightFade = smoothstep(-0.5, 0.0, vWorldPosition.y + 2.2);
    
    float centerGlow = exp(-dist * dist * 0.08) * 0.04;
    
    vec3 baseColor = vec3(0.35, 0.03, 0.08);
    vec3 pulseColor = vec3(0.80, 0.06, 0.15);
    vec3 majorColor = vec3(0.50, 0.04, 0.10);
    vec3 nodeColor = vec3(0.90, 0.08, 0.18);
    
    vec3 color = mix(baseColor, majorColor, majorLine) * gridPattern;
    color += pulseColor * dataPulse * 0.5;
    color += nodeColor * nodeGlow;
    color += vec3(0.60, 0.03, 0.08) * centerGlow;
    color += vec3(0.08, 0.005, 0.015) * horizonFade * 0.3;
    
    // Add mouse glow highlight to grid lines
    float distToMouseFloor = length(vWorldPosition - uMouseFloor);
    float mouseFloorGlow = exp(-distToMouseFloor * distToMouseFloor * 0.18) * 0.45;
    color += vec3(1.0, 0.18, 0.28) * mouseFloorGlow * (regularLine + majorLine * 1.5) * perspectiveFade;
    
    float alpha = (gridPattern + nodeGlow * 0.35 + centerGlow) * horizonFade * heightFade;
    alpha += mouseFloorGlow * 0.40 * perspectiveFade;
    alpha = clamp(alpha, 0.0, 0.65);
    
    gl_FragColor = vec4(color, alpha);
  }
`;

import { useMousePosition } from "@/hooks/useMousePosition";

export default function NeonGrid() {
  const gridMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const mouse = useMousePosition(0.08);

  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 2.14), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const mouseVec = useMemo(() => new THREE.Vector2(), []);
  const intersection = useMemo(() => new THREE.Vector3(), []);

  const gridUniforms = useMemo(
    () => ({
      uTime: { value: 0.0 },
      uMouseFloor: { value: new THREE.Vector3(0, 0, 0) },
    }),
    []
  );

  useFrame((state) => {
    if (gridMaterialRef.current) {
      gridMaterialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();

      // Raycast cursor onto floor plane to get world intersection coordinate
      mouseVec.set(mouse.x, mouse.y);
      raycaster.setFromCamera(mouseVec, state.camera);
      if (raycaster.ray.intersectPlane(plane, intersection)) {
        gridMaterialRef.current.uniforms.uMouseFloor.value.copy(intersection);
      }
    }
  });

  return (
    <group position={[0, -2.14, 0]}>
      {/* Primary Grid Mesh */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[200, 200, 1, 1]} />
        <shaderMaterial
          ref={gridMaterialRef}
          vertexShader={gridVertexShader}
          fragmentShader={gridFragmentShader}
          uniforms={gridUniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Dark background base floor plane to prevent lookthrough */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial
          color="#020001"
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </mesh>
      
      {/* Horizon Accent line */}
      <mesh position={[0, 0.01, -30]} rotation={[0, 0, 0]}>
        <planeGeometry args={[120, 0.2]} />
        <meshBasicMaterial
          color="#ff1744"
          transparent
          opacity={0.03}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
```

## File: `src/components/canvas/PostProcessing.tsx`

```typescript
"use client";

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import * as THREE from "three";

export default function PostProcessing() {
  const { gl, scene, camera, size } = useThree();

  const composer = useMemo(() => {
    const instance = new EffectComposer(gl);
    const renderPass = new RenderPass(scene, camera);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      0.32,
      0.35,
      0.40
    );

    const outputPass = new OutputPass();

    instance.addPass(renderPass);
    instance.addPass(bloomPass);
    instance.addPass(outputPass);

    return instance;
  }, [gl, scene, camera, size.width, size.height]);

  useEffect(() => {
    composer.setSize(size.width, size.height);
    composer.renderToScreen = true;
    return () => composer.dispose();
  }, [composer, size.width, size.height]);

  useFrame((_, delta) => {
    composer.render(delta);
  }, 1);

  return null;
}
```

## File: `src/components/canvas/Scene.tsx`

```typescript
"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { CinematicCamera } from "@/animations/scrollCamera";
import { useDeviceSize } from "@/hooks/useDeviceSize";
import NebulaBackground from "./NebulaBackground";
import StarField from "./StarField";
import ShootingStars from "./ShootingStars";
import DeepSpaceGlobe from "./DeepSpaceGlobe";
import VolumetricRays from "./VolumetricRays";
import MagneticParticles from "./MagneticParticles";
import FloatingHexParticles from "./FloatingHexParticles";
import TechCubes from "./TechCubes";
import FloatingLaptop from "./FloatingLaptop";
import NeonGrid from "./NeonGrid";
import FloorRings from "./FloorRings";
import PostProcessing from "./PostProcessing";

interface SceneProps {
  scrollProgress: number;
}

export default function Scene({ scrollProgress }: SceneProps) {
  const { deviceTier } = useDeviceSize();
  const isMobile = deviceTier === "mobile";

  return (
    <div className="fixed inset-0 z-0 h-full w-full" style={{ background: "#000000" }}>
      <Canvas
        shadows
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: isMobile ? "default" : "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
        camera={{
          position: [0.5, 0.5, 8],
          fov: 45,
          near: 0.1,
          far: 300,
        }}
      >
        <CinematicCamera scrollProgress={scrollProgress} />

        <color attach="background" args={["#000000"]} />
        
        <ambientLight intensity={0.03} color="#0a0002" />

        <pointLight position={[5, 4, 6]} intensity={2.2} color="#ff1744" distance={70} decay={2} />
        <pointLight position={[-5, 5, -4]} intensity={1.4} color="#ff4444" distance={55} decay={2} />
        <pointLight position={[0, -1, 10]} intensity={1.6} color="#800010" distance={45} decay={2} />
        <pointLight position={[14, 10, -22]} intensity={2.8} color="#ff1744" distance={90} decay={2} />
        <spotLight position={[4, 7, 5]} angle={0.5} penumbra={0.8} intensity={1.4} color="#ff1744" distance={55} />
        
        <pointLight position={[0.8, -1.0, 0]} intensity={2.2} color="#ff1744" distance={14} decay={2} />
        <pointLight position={[-2, -0.3, 2]} intensity={1.0} color="#cc1133" distance={10} decay={2} />
        <pointLight position={[0, -1.5, 5]} intensity={1.5} color="#660010" distance={20} decay={2} />
        
        <pointLight position={[2.5, 1.0, 0.5]} intensity={1.4} color="#ff1744" distance={12} decay={2} />
        <pointLight position={[-1, 1.5, 3]} intensity={0.7} color="#ff8a80" distance={10} decay={2} />
        
        <pointLight position={[0, 8, -30]} intensity={1.0} color="#ff1744" distance={60} decay={2} />
        <pointLight position={[-8, 3, 2]} intensity={0.4} color="#ff3355" distance={30} decay={2} />

        <Suspense fallback={null}>
          <NebulaBackground />
          <StarField />
          <ShootingStars />
          <DeepSpaceGlobe scrollProgress={scrollProgress} />
          <VolumetricRays />
          <MagneticParticles />
          <FloatingHexParticles />
          <TechCubes />
          <FloatingLaptop />
          <NeonGrid />
          <FloorRings />

          <PostProcessing />
        </Suspense>
      </Canvas>
    </div>
  );
}
```

## File: `src/components/canvas/ShootingStars.tsx`

```typescript
"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface StarData {
  pos: THREE.Vector3;
  dir: THREE.Vector3;
  speed: number;
  length: number;
  progress: number;
  delay: number;
  width: number;
}

export default function ShootingStars() {
  const lineRef = useRef<THREE.LineSegments>(null);
  const count = 3;

  // Pool of shooting star parameters
  const stars = useMemo(() => {
    const data: StarData[] = [];
    for (let i = 0; i < count; i++) {
      data.push({
        pos: new THREE.Vector3(),
        dir: new THREE.Vector3(-1.0, -0.4, 0).normalize(), // diagonal trajectory
        speed: 12.0 + Math.random() * 8.0,
        length: 2.0 + Math.random() * 3.0,
        progress: 0,
        delay: Math.random() * 8.0,
        width: 0.8 + Math.random() * 1.5
      });
    }
    return data;
  }, []);

  // Geometry attributes buffers
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 2 * 3); // 2 vertices per star, 3 coords
    const col = new Float32Array(count * 2 * 3); // RGB per vertex
    return [pos, col];
  }, []);

  const resetStar = (star: StarData) => {
    star.pos.set(
      15.0 + Math.random() * 20.0, // start top-right
      6.0 + Math.random() * 8.0,
      -20.0 - Math.random() * 15.0 // far background depth
    );
    star.progress = 0;
    star.delay = 4.0 + Math.random() * 12.0; // random wait time before next streak
    star.speed = 15.0 + Math.random() * 10.0;
    star.length = 3.0 + Math.random() * 4.0;
  };

  useFrame((_, delta) => {
    if (!lineRef.current) return;
    const geo = lineRef.current.geometry;
    const posAttr = geo.attributes.position;
    const colAttr = geo.attributes.color;
    const posArray = posAttr.array as Float32Array;
    const colArray = colAttr.array as Float32Array;

    stars.forEach((star, i) => {
      const idx = i * 6; // 6 values per line (2 vertices * 3 coords)

      if (star.delay > 0) {
        star.delay -= delta;
        // Keep star hidden offscreen when inactive
        posArray[idx] = 0; posArray[idx + 1] = -999; posArray[idx + 2] = 0;
        posArray[idx + 3] = 0; posArray[idx + 4] = -999; posArray[idx + 2] = 0;
        return;
      }

      // Animate streak progress
      star.progress += delta * star.speed;
      const head = star.pos.clone().addScaledVector(star.dir, star.progress);
      const tail = star.pos.clone().addScaledVector(star.dir, Math.max(0, star.progress - star.length));

      // Set line segment vertices
      posArray[idx]     = head.x;
      posArray[idx + 1] = head.y;
      posArray[idx + 2] = head.z;
      
      posArray[idx + 3] = tail.x;
      posArray[idx + 4] = tail.y;
      posArray[idx + 5] = tail.z;

      // Color gradient fade (head is bright white, tail is red-crimson)
      const opacity = Math.sin(Math.min(1.0, star.progress / 5.0) * Math.PI); // fade in/out curve
      
      // Head vertex: white-hot
      colArray[idx]     = 1.0 * opacity;
      colArray[idx + 1] = 0.95 * opacity;
      colArray[idx + 2] = 0.9 * opacity;

      // Tail vertex: fading red-pink
      colArray[idx + 3] = 0.9 * opacity;
      colArray[idx + 4] = 0.05 * opacity;
      colArray[idx + 5] = 0.12 * opacity;

      // Reset when completed
      if (star.progress > 30.0) {
        resetStar(star);
      }
    });

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  });

  return (
    <lineSegments ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <lineBasicMaterial vertexColors transparent opacity={0.65} blending={THREE.AdditiveBlending} depthWrite={false} linewidth={1.5} />
    </lineSegments>
  );
}
```

## File: `src/components/canvas/StarField.tsx`

```typescript
"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const clusters = [
  {
    nodes: [[-10, 9, -22], [-8, 11, -24], [-7, 8, -21], [-11, 7, -25], [-9, 10, -23]] as [number, number, number][],
    connections: [[0, 1], [1, 2], [2, 3], [3, 0], [1, 3], [0, 4], [4, 2]] as [number, number][]
  },
  {
    nodes: [[14, 10, -26], [16, 12, -28], [17, 9, -27], [13, 8, -29], [15, 11, -25]] as [number, number, number][],
    connections: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [4, 1]] as [number, number][]
  },
  {
    nodes: [[0, 8, -19], [2, 10, -21], [-1, 6, -20], [1, 9, -18]] as [number, number, number][],
    connections: [[0, 1], [1, 2], [2, 3], [3, 0]] as [number, number][]
  },
  {
    nodes: [[-6, 12, -28], [-4, 14, -30], [-7, 10, -27]] as [number, number, number][],
    connections: [[0, 1], [1, 2], [2, 0]] as [number, number][]
  },
  {
    nodes: [[10, 6, -23], [12, 8, -25], [9, 5, -24]] as [number, number, number][],
    connections: [[0, 1], [1, 2]] as [number, number][]
  },
  {
    nodes: [[-14, 8, -32], [-16, 10, -34], [-13, 6, -30]] as [number, number, number][],
    connections: [[0, 1], [1, 2]] as [number, number][]
  },
  {
    nodes: [[20, 9, -35], [22, 11, -37], [19, 7, -33]] as [number, number, number][],
    connections: [[0, 1], [1, 2]] as [number, number][]
  },
];

const allNodes = clusters.flatMap(c => c.nodes);
const interConnections: [number, number][] = [[3, 10], [5, 17], [9, 15]];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export default function StarField() {
  const starsRef = useRef<THREE.Points>(null);
  const heroStarsRef = useRef<THREE.Points>(null);

  const { positions, colors, sizes, phases } = useMemo(() => {
    const rand = seededRandom(42);
    const count = 5000;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const ph = new Float32Array(count);

    const palette = [
      new THREE.Color(1.0, 0.9, 0.9),
      new THREE.Color(1.0, 0.7, 0.7),
      new THREE.Color(1.0, 0.5, 0.5),
      new THREE.Color(1.0, 0.3, 0.3),
      new THREE.Color(1.0, 0.15, 0.2),
      new THREE.Color(0.9, 0.4, 0.45),
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] = (rand() - 0.5) * 100;
      pos[i3 + 1] = rand() * 20 - 2;
      pos[i3 + 2] = -8 - rand() * 60;

      const color = palette[Math.floor(rand() * palette.length)];
      col[i3] = color.r;
      col[i3 + 1] = color.g;
      col[i3 + 2] = color.b;

      const r = rand();
      if (r > 0.98) sz[i] = 18 + rand() * 12;
      else if (r > 0.9) sz[i] = 8 + rand() * 6;
      else if (r > 0.7) sz[i] = 3 + rand() * 3;
      else sz[i] = 1 + rand() * 2;

      ph[i] = rand() * Math.PI * 2;
    }

    return { positions: pos, colors: col, sizes: sz, phases: ph };
  }, []);

  const lineGeometry = useMemo(() => {
    const linePos: number[] = [];
    const lineColors: number[] = [];

    clusters.forEach(cluster => {
      cluster.connections.forEach(([a, b]) => {
        const p1 = cluster.nodes[a];
        const p2 = cluster.nodes[b];
        linePos.push(...p1, ...p2);
        lineColors.push(1.0, 0.15, 0.2, 1.0, 0.15, 0.2);
      });
    });

    interConnections.forEach(([a, b]) => {
      const p1 = allNodes[a];
      const p2 = allNodes[b];
      linePos.push(...p1, ...p2);
      lineColors.push(0.8, 0.1, 0.15, 0.8, 0.1, 0.15);
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(linePos, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(lineColors, 3));
    return geo;
  }, []);

  // NOTE: heroSizes toned down from the broken attempt (was 24 + rand*16 = up to 40).
  // Those were meant as gl_PointSize multipliers, not raw pixel sizes, and combined with
  // an unclamped distance term they were blowing out into giant flares.
  const { heroPositions, heroColors, heroSizes, heroPhases } = useMemo(() => {
    const pos = new Float32Array(allNodes.length * 3);
    const col = new Float32Array(allNodes.length * 3);
    const sz = new Float32Array(allNodes.length);
    const ph = new Float32Array(allNodes.length);

    allNodes.forEach((node, i) => {
      pos[i * 3] = node[0];
      pos[i * 3 + 1] = node[1];
      pos[i * 3 + 2] = node[2];
      col[i * 3] = 1.0;
      col[i * 3 + 1] = 0.5 + Math.random() * 0.3;
      col[i * 3 + 2] = 0.5 + Math.random() * 0.3;
      sz[i] = 6 + Math.random() * 4;
      ph[i] = Math.random() * Math.PI * 2;
    });

    return { heroPositions: pos, heroColors: col, heroSizes: sz, heroPhases: ph };
  }, []);

  // Main star field shader - circular (unchanged, this one already works correctly)
  const starMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        attribute float aSize;
        attribute float aPhase;
        varying float vAlpha;
        uniform float uTime;
        void main() {
          float twinkle = 0.5 + 0.5 * sin(uTime * 1.2 + aPhase);
          vAlpha = twinkle;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = aSize;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float d = length(uv);
          float core = smoothstep(0.5, 0.0, d);
          float glow = smoothstep(0.5, 0.2, d) * 0.4;
          if (core + glow < 0.01) discard;
          gl_FragColor = vec4(1.0, 0.75, 0.78, (core + glow) * vAlpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  // Hero star shader - circular with glow, distance scaled and SAFELY CLAMPED
  // so a star near the camera plane cannot make -mv.z shrink toward zero and
  // blow gl_PointSize up into a giant flare (that was the "3 bright lights" bug).
  const heroStarMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        attribute float aSize;
        attribute float aPhase;
        varying float vAlpha;
        uniform float uTime;
        void main() {
          float twinkle = 0.6 + 0.4 * sin(uTime * 0.8 + aPhase);
          vAlpha = twinkle;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          float safeDist = max(8.0, -mv.z);
          gl_PointSize = aSize * (60.0 / safeDist);
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float d = length(uv);
          float core = smoothstep(0.5, 0.0, d);
          float glow = smoothstep(0.5, 0.1, d) * 0.6;
          float ring = smoothstep(0.55, 0.45, d) * smoothstep(0.35, 0.45, d) * 0.3;
          if (core + glow + ring < 0.01) discard;
          vec3 color = mix(vec3(1.0, 0.9, 0.9), vec3(1.0, 0.5, 0.5), glow);
          gl_FragColor = vec4(color, (core + glow + ring) * vAlpha * 0.85);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    starMaterial.uniforms.uTime.value = t;
    heroStarMaterial.uniforms.uTime.value = t;
    if (starsRef.current) starsRef.current.rotation.y = t * 0.0005;
    if (heroStarsRef.current) heroStarsRef.current.rotation.y = t * 0.0005;
  });

  return (
    <group>
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
          <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        </bufferGeometry>
        <primitive object={starMaterial} attach="material" />
      </points>

      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.45}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      <points ref={heroStarsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[heroPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[heroColors, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[heroSizes, 1]} />
          <bufferAttribute attach="attributes-aPhase" args={[heroPhases, 1]} />
        </bufferGeometry>
        <primitive object={heroStarMaterial} attach="material" />
      </points>
    </group>
  );
}
```

## File: `src/components/canvas/TechCube.tsx`

```typescript
"use client";

import React, { useMemo, useRef, useState } from "react";
import { RoundedBox, MeshTransmissionMaterial, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface TechCubeProps {
  position: [number, number, number];
  scale?: number;
  color: string;
  glowColor: string;
  logoPath: string;
}

export default function TechCube({ position, scale = 1, color, glowColor, logoPath }: TechCubeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const [hovered, setHovered] = useState(false);
  const logoTex = useTexture(logoPath);
  logoTex.colorSpace = THREE.SRGBColorSpace;

  const glow = new THREE.Color(glowColor);
  const edgeGeometry = useMemo(() => new THREE.BoxGeometry(1.08, 1.08, 1.08), []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    groupRef.current.position.y = position[1] + Math.sin(t * 0.62 + position[0] * 0.5) * 0.13;
    groupRef.current.rotation.y += hovered ? 0.055 : 0.006;
    groupRef.current.rotation.x += hovered ? 0.028 : 0.0035;
    groupRef.current.rotation.z += hovered ? 0.016 : 0.002;

    if (lightRef.current) {
      const pulse = Math.sin(t * 2.2 + position[0]) * 0.5 + 0.5;
      lightRef.current.intensity = hovered ? 8.0 + pulse * 2.5 : 5.0 + pulse * 1.5;
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      scale={scale}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <pointLight ref={lightRef} color={glowColor} intensity={4.0} distance={5.6} decay={2} />

      <mesh scale={[1.1, 1.1, 1.1]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color={glowColor} transparent opacity={hovered ? 0.08 : 0.03} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      <lineSegments scale={[1.08, 1.08, 1.08]}>
        <edgesGeometry args={[edgeGeometry]} />
        <lineBasicMaterial color={glowColor} transparent opacity={hovered ? 0.35 : 0.18} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>

      <RoundedBox args={[1, 1, 1]} radius={0.075} smoothness={6} castShadow>
        <mesh>
          <boxGeometry args={[0.94, 0.94, 0.94]} />
          <meshBasicMaterial color={color} transparent opacity={0.1} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        <MeshTransmissionMaterial
          color={new THREE.Color(color).lerp(new THREE.Color("#fff0f0"), 0.72)}
          transmission={1}
          thickness={0.08}
          roughness={0.012}
          metalness={0}
          ior={1.24}
          chromaticAberration={0.011}
          anisotropicBlur={0}
          distortion={0}
          distortionScale={0}
          temporalDistortion={0}
          attenuationColor={new THREE.Color(color).lerp(new THREE.Color("#fff0f0"), 0.35)}
          attenuationDistance={0.95}
          emissive={glow}
          emissiveIntensity={hovered ? 0.35 : 0.18}
          envMapIntensity={2.35}
          side={THREE.FrontSide}
        />
      </RoundedBox>

      <lineSegments>
        <edgesGeometry args={[edgeGeometry]} />
        <lineBasicMaterial color="#ffd6dc" transparent opacity={hovered ? 0.4 : 0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>

      <mesh position={[0, 0, 0.535]}>
        <planeGeometry args={[0.68, 0.68]} />
        <meshBasicMaterial map={logoTex} transparent opacity={0.32} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      <mesh position={[0, 0, -0.535]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.68, 0.68]} />
        <meshBasicMaterial map={logoTex} transparent opacity={0.08} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      <mesh position={[0, 0.535, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.48, 0.515, 32]} />
        <meshBasicMaterial color={glowColor} toneMapped={false} transparent opacity={hovered ? 0.12 : 0.05} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      <mesh position={[0, -0.535, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.48, 0.515, 32]} />
        <meshBasicMaterial color={glowColor} toneMapped={false} transparent opacity={hovered ? 0.08 : 0.03} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      <mesh position={[0, -0.78, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.28, 1.28, 1]}>
        <circleGeometry args={[0.72, 48]} />
        <meshBasicMaterial color={glowColor} toneMapped={false} transparent opacity={hovered ? 0.1 : 0.05} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}
```

## File: `src/components/canvas/TechCubes.tsx`

```typescript
"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import TechCube from "./TechCube";

export default function TechCubes() {
  const lineRef = useRef<THREE.LineSegments>(null);

  const cubes = useMemo(
    () => [
      {
        id: "react",
        position: [-2.5, 1.2, -2.0] as [number, number, number],
        scale: 0.78,
        color: "#ffb0b0",
        glowColor: "#ff1744",
        logoPath: "/icons/react.svg",
      },
      {
        id: "node",
        position: [3.2, 0.8, -3.0] as [number, number, number],
        scale: 0.72,
        color: "#ffaaaa",
        glowColor: "#cc1133",
        logoPath: "/icons/node.svg",
      },
      {
        id: "typescript",
        position: [-1.5, -0.8, 1.5] as [number, number, number],
        scale: 0.52,
        color: "#e8a0a0",
        glowColor: "#800010",
        logoPath: "/icons/typescript.svg",
      },
      {
        id: "next",
        position: [2.8, 2.0, -1.5] as [number, number, number],
        scale: 0.42,
        color: "#f0d0d0",
        glowColor: "#660008",
        logoPath: "/icons/next.svg",
      },
    ],
    []
  );

  const lineGeometry = useMemo(() => {
    const pts = cubes.map((cube) => new THREE.Vector3(...cube.position));
    return new THREE.BufferGeometry().setFromPoints([
      pts[0],
      pts[1],
      pts[1],
      pts[2],
      pts[2],
      pts[3],
      pts[3],
      pts[0],
      pts[0],
      pts[2],
    ]);
  }, [cubes]);

  useFrame((state) => {
    if (!lineRef.current) return;
    const material = lineRef.current.material as THREE.LineBasicMaterial;
    material.opacity = 0.04 + Math.sin(state.clock.getElapsedTime() * 0.8) * 0.02;
  });

  return (
    <group>
      {cubes.map((cube) => (
        <TechCube key={cube.id} {...cube} />
      ))}

      <lineSegments ref={lineRef} geometry={lineGeometry}>
        <lineBasicMaterial color="#800010" transparent opacity={0.03} depthWrite={false} />
      </lineSegments>
    </group>
  );
}
```

## File: `src/components/canvas/VolumetricRays.tsx`

```typescript
"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;

    // Light source from upper right
    vec2 lightPos = vec2(0.75, 0.7);
    vec2 toLight = lightPos - uv;
    float dist = length(toLight);
    float angle = atan(toLight.y, toLight.x);

    // Ray beams - fewer, dimmer
    float rays = 0.0;
    for (int i = 0; i < 4; i++) {
      float fi = float(i);
      float rayAngle = angle + fi * 0.4 + uTime * 0.03;
      float ray = pow(sin(rayAngle * 6.0 + fi * 2.0) * 0.5 + 0.5, 10.0);
      float rayWidth = 0.015 + fi * 0.004;
      float rayMask = smoothstep(rayWidth, 0.0, abs(ray - 0.5) * 2.0);
      rays += rayMask * (1.0 - dist) * (0.25 - fi * 0.05);
    }

    // Fade with distance from light
    float fade = smoothstep(0.0, 0.8, 1.0 - dist);

    vec3 color = vec3(0.8, 0.05, 0.1) * rays * fade * 0.08;
    float alpha = rays * fade * 0.04;

    gl_FragColor = vec4(color, alpha);
  }
`;

export default function VolumetricRays() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = React.useMemo(
    () => ({
      uTime: { value: 0.0 },
    }),
    []
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <mesh position={[5, 5, -20]} renderOrder={-50}>
      <planeGeometry args={[40, 30]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
```

## File: `src/components/physics/PhysicsWorld.tsx`

```typescript
"use client";

import React from "react";
import { Physics } from "@react-three/rapier";
import { usePhysics } from "@/hooks/usePhysics";

export default function PhysicsWorld({ children }: { children: React.ReactNode }) {
  const { enabled } = usePhysics();

  if (!enabled) return <>{children}</>;

  return (
    <Physics gravity={[0, 0, 0]} timeStep="vary">
      {children}
    </Physics>
  );
}
```

## File: `src/components/physics/RigidCubes.tsx`

```typescript
"use client";

import React from "react";

export default function RigidCubes({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

## File: `src/components/sections/About.tsx`

```typescript
"use client";

import SectionShell from "./SectionShell";

export default function About() {
  return (
    <SectionShell id="about" eyebrow="// ABOUT" title="Engineer In The Neon Stack">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="border border-white/10 bg-[rgba(10,10,30,0.58)] p-7 shadow-[0_0_30px_rgba(0,212,255,0.08)] backdrop-blur-xl">
          <p className="text-lg leading-8 text-white/78">
            I am Poshan MS, a Full Stack Engineer from Karnataka, India. I build scalable, performant, and beautiful web systems across frontend, backend, databases, real-time communication, auth, deployment, and practical AI/ML integration.
          </p>
          <p className="mt-6 text-base leading-7 text-white/62">
            My work leans toward solo execution, fast shipping, and complete systems: React interfaces, Flask and Node APIs, relational and document databases, Dockerized services, Cloudinary media flows, and production hosting on Vercel, Railway, and Render.
          </p>
        </div>
        <div className="grid gap-4">
          {["Karnataka, India", "Available for work / freelance", "2+ Years Experience", "20+ Projects Completed"].map((item) => (
            <div key={item} className="border border-[rgba(0,212,255,0.22)] bg-[rgba(5,5,8,0.72)] px-5 py-4 font-mono text-sm text-white/80 shadow-[0_0_18px_rgba(0,212,255,0.08)]">
              <span className="text-[var(--terminal-green)]">&gt;</span> {item}
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
```

## File: `src/components/sections/Contact.tsx`

```typescript
"use client";

import SectionShell from "./SectionShell";
import { PROFILE } from "@/utils/constants";

export default function Contact() {
  return (
    <SectionShell id="contact" eyebrow="// CONTACT" title="Start A Signal">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="border border-[rgba(0,212,255,0.2)] bg-[rgba(10,10,30,0.62)] p-7 backdrop-blur-xl">
          <p className="text-lg leading-8 text-white/75">
            I am available for work and freelance projects. Reach out for full-stack web apps, API work, dashboards, real-time features, deployment, and polished interactive interfaces.
          </p>
          <div className="mt-8 space-y-3 font-mono text-sm">
            <a className="block text-[var(--electric-blue)]" href={`mailto:${PROFILE.email}`}>{PROFILE.email}</a>
            <a className="block text-white/70 hover:text-white" href={PROFILE.github} target="_blank" rel="noreferrer">github.com/POSHANMS</a>
            <a className="block text-white/70 hover:text-white" href={PROFILE.linkedin} target="_blank" rel="noreferrer">linkedin.com/in/poshanms/</a>
          </div>
        </div>
        <form className="grid gap-4 border border-white/10 bg-[rgba(5,5,8,0.72)] p-7 backdrop-blur-xl">
          <label className="grid gap-2 font-mono text-xs uppercase tracking-[0.22em] text-white/45">
            Name
            <input className="border border-white/10 bg-white/[0.035] px-4 py-3 font-sans text-sm normal-case tracking-normal text-white outline-none focus:border-[var(--electric-blue)]" aria-label="Name" />
          </label>
          <label className="grid gap-2 font-mono text-xs uppercase tracking-[0.22em] text-white/45">
            Email
            <input className="border border-white/10 bg-white/[0.035] px-4 py-3 font-sans text-sm normal-case tracking-normal text-white outline-none focus:border-[var(--electric-blue)]" aria-label="Email" type="email" />
          </label>
          <label className="grid gap-2 font-mono text-xs uppercase tracking-[0.22em] text-white/45">
            Message
            <textarea className="min-h-36 border border-white/10 bg-white/[0.035] px-4 py-3 font-sans text-sm normal-case tracking-normal text-white outline-none focus:border-[var(--electric-blue)]" aria-label="Message" />
          </label>
          <a href={`mailto:${PROFILE.email}`} className="inline-flex justify-center border border-[var(--electric-blue)] px-5 py-3 font-mono text-xs uppercase tracking-[0.22em] text-[var(--electric-blue)] transition hover:bg-[var(--electric-blue)] hover:text-[#050508]">
            Send Email ↗
          </a>
        </form>
      </div>
    </SectionShell>
  );
}
```

## File: `src/components/sections/Experience.tsx`

```typescript
"use client";

import SectionShell from "./SectionShell";

const timeline = [
  ["Full Stack Engineering", "2+ years building React, Next.js, Flask, Node.js, Express, SQL, NoSQL, auth, uploads, and deployment workflows."],
  ["Solo Product Builds", "FindIt was built solo in 2 weeks with real-time notifications, image upload, JWT auth, Docker, PostgreSQL, Redis, and Cloudinary."],
  ["Deployment Practice", "Projects shipped across Vercel, Railway, Render, Cloudinary, and MongoDB Atlas."],
  ["Security + Systems", "Hands-on fundamentals in log analysis, vulnerability assessment, ethical hacking basics, DSA, OOP, REST APIs, DBMS, operating systems, and networks."],
];

export default function Experience() {
  return (
    <SectionShell id="experience" eyebrow="// EXPERIENCE" title="Operating Timeline">
      <div className="relative border-l border-[rgba(0,212,255,0.35)] pl-8">
        {timeline.map(([title, body], index) => (
          <div key={title} className="relative mb-10 last:mb-0">
            <div className="absolute -left-[2.6rem] top-1 h-4 w-4 rounded-full border border-[var(--electric-blue)] bg-[#050508] shadow-[0_0_18px_var(--electric-blue)]" />
            <p className="font-mono text-xs text-[var(--hot-pink)]">0{index + 1}</p>
            <h3 className="mt-2 text-2xl font-bold text-white">{title}</h3>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/62">{body}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
```

## File: `src/components/sections/Projects.tsx`

```typescript
"use client";

import SectionShell from "./SectionShell";
import { PROJECTS } from "@/utils/constants";

export default function Projects() {
  return (
    <SectionShell id="projects" eyebrow="// PROJECTS" title="Built Systems">
      <div className="grid gap-6 lg:grid-cols-3">
        {PROJECTS.map((project, index) => (
          <article
            key={project.name}
            className="group min-h-[25rem] border border-white/10 bg-[linear-gradient(145deg,rgba(10,10,30,0.78),rgba(5,5,8,0.84))] p-6 backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-[var(--electric-blue)] hover:shadow-[0_0_35px_rgba(0,212,255,0.16)]"
          >
            <div className="mb-8 flex items-center justify-between font-mono text-xs text-white/35">
              <span>0{index + 1}</span>
              <span>{project.liveLabel || "REAL PROJECT"}</span>
            </div>
            <h3 className="text-3xl font-black text-white">{project.name}</h3>
            <p className="mt-2 font-mono text-sm text-[var(--electric-blue)]">{project.subtitle}</p>
            <p className="mt-5 text-sm leading-7 text-white/62">{project.description}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {project.stack.map((item) => (
                <span key={item} className="border border-white/10 px-2.5 py-1 text-[11px] text-white/58">
                  {item}
                </span>
              ))}
            </div>
            {project.href ? (
              <a className="mt-8 inline-block font-mono text-xs uppercase tracking-[0.22em] text-[var(--terminal-green)]" href={project.href} target="_blank" rel="noreferrer">
                Open live ↗
              </a>
            ) : (
              <p className="mt-8 font-mono text-xs uppercase tracking-[0.22em] text-white/35">Live link not provided</p>
            )}
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
```

## File: `src/components/sections/SectionShell.tsx`

```typescript
"use client";

import React from "react";
import { motion } from "framer-motion";

export default function SectionShell({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="relative z-10 min-h-screen px-6 py-28 md:px-16 lg:px-24">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-120px" }}
        transition={{ duration: 0.8, ease: [0.25, 0.6, 0.3, 1] }}
        className="mx-auto max-w-6xl"
      >
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.3em] text-[var(--electric-blue)] text-glow-blue">{eyebrow}</p>
        <h2 className="mb-10 text-3xl font-black uppercase tracking-[0.08em] text-white md:text-5xl">
          {title}
        </h2>
        {children}
      </motion.div>
    </section>
  );
}
```

## File: `src/components/sections/Skills.tsx`

```typescript
"use client";

import SectionShell from "./SectionShell";
import { SKILL_GROUPS } from "@/utils/constants";

export default function Skills() {
  return (
    <SectionShell id="skills" eyebrow="// SKILLS" title="Technical Arsenal">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {SKILL_GROUPS.map(([group, skills]) => (
          <div key={group} className="border border-white/10 bg-[rgba(10,10,30,0.56)] p-5 backdrop-blur-xl transition hover:border-[var(--electric-blue)] hover:shadow-[0_0_24px_rgba(0,212,255,0.16)]">
            <h3 className="mb-4 font-mono text-sm uppercase tracking-[0.22em] text-[var(--hot-pink)]">{group}</h3>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span key={skill} className="border border-white/10 bg-white/[0.035] px-3 py-1.5 text-xs text-white/72">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
```

## File: `src/components/ui/AudioToggle.tsx`

```typescript
"use client";

import React from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useAudio } from "@/hooks/useAudio";

export default function AudioToggle({ scrollProgress }: { scrollProgress: number }) {
  const { enabled, toggle } = useAudio(scrollProgress);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={enabled ? "Disable ambient audio" : "Enable ambient audio"}
      className="fixed right-8 top-24 z-30 hidden h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[rgba(10,10,30,0.6)] text-white/70 backdrop-blur-md transition hover:border-[var(--electric-blue)] hover:text-[var(--electric-blue)] hover:shadow-[0_0_18px_rgba(0,212,255,0.18)] md:flex"
    >
      {enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
    </button>
  );
}
```

## File: `src/components/ui/Cursor.tsx`

```typescript
"use client";

import React, { useEffect, useRef } from "react";

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ring1Ref = useRef<HTMLDivElement>(null);
  const ring2Ref = useRef<HTMLDivElement>(null);
  const ring3Ref = useRef<HTMLDivElement>(null);
  const coordsRef = useRef<HTMLDivElement>(null);
  
  const mouseRef = useRef({ x: 0, y: 0 });
  const pos1 = useRef({ x: 0, y: 0 });
  const pos2 = useRef({ x: 0, y: 0 });
  const pos3 = useRef({ x: 0, y: 0 });
  const isHoveredRef = useRef(false);

  useEffect(() => {
    // Check if device supports fine pointers (like a mouse/trackpad)
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (!isFinePointer) return;

    const dot = dotRef.current;
    const c1 = ring1Ref.current;
    const c2 = ring2Ref.current;
    const c3 = ring3Ref.current;
    const coords = coordsRef.current;
    if (!dot || !c1 || !c2 || !c3 || !coords) return;

    [dot, c1, c2, c3, coords].forEach((el) => {
      el.style.opacity = "0";
    });

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      [dot, c1, c2, c3, coords].forEach((el) => {
        el.style.opacity = "1";
      });
      
      // Dot and HUD coordinates follow instantly for zero latency feel
      dot.style.transform = `translate3d(${e.clientX - 2}px, ${e.clientY - 2}px, 0)`;
      coords.style.transform = `translate3d(${e.clientX + 16}px, ${e.clientY + 8}px, 0)`;
      coords.innerText = `[${String(e.clientX).padStart(3, "0")}, ${String(e.clientY).padStart(3, "0")}]`;
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const isInteractive = 
        target.tagName === "A" || 
        target.tagName === "BUTTON" || 
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        !!target.closest("a") || 
        !!target.closest("button") || 
        !!target.closest('[role="button"]') ||
        target.classList.contains("hover-target") ||
        target.getAttribute("data-magnetic") !== null;

      isHoveredRef.current = isInteractive;

      if (isInteractive) {
        c1.classList.add("cursor-expand");
        c2.classList.add("cursor-expand");
        c3.classList.add("cursor-expand");
        dot.classList.add("dot-expand");
        coords.classList.add("coords-hover");
      } else {
        c1.classList.remove("cursor-expand");
        c2.classList.remove("cursor-expand");
        c3.classList.remove("cursor-expand");
        dot.classList.remove("dot-expand");
        coords.classList.remove("coords-hover");
      }
    };

    const handleMouseDown = () => {
      [c1, c2, c3].forEach((c) => c.classList.add("cursor-click"));
      coords.classList.add("coords-click");
    };

    const handleMouseUp = () => {
      [c1, c2, c3].forEach((c) => c.classList.remove("cursor-click"));
      coords.classList.remove("coords-click");
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseover", handleMouseOver);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    let rafId: number;
    const lerp = (start: number, end: number, amt: number) => (1 - amt) * start + amt * end;

    const render = () => {
      const tx = mouseRef.current.x;
      const ty = mouseRef.current.y;

      // Parallax lag for rings using separate LERP factors
      pos1.current.x = lerp(pos1.current.x, tx, 0.18);
      pos1.current.y = lerp(pos1.current.y, ty, 0.18);
      c1.style.transform = `translate3d(${pos1.current.x - 8}px, ${pos1.current.y - 8}px, 0)`;

      pos2.current.x = lerp(pos2.current.x, tx, 0.11);
      pos2.current.y = lerp(pos2.current.y, ty, 0.11);
      c2.style.transform = `translate3d(${pos2.current.x - 16}px, ${pos2.current.y - 16}px, 0)`;

      pos3.current.x = lerp(pos3.current.x, tx, 0.06);
      pos3.current.y = lerp(pos3.current.y, ty, 0.06);
      c3.style.transform = `translate3d(${pos3.current.x - 24}px, ${pos3.current.y - 24}px, 0)`;

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      {/* Central Solid Crimson Dot */}
      <div ref={dotRef} className="pointer-events-none fixed top-0 left-0 z-[9999] hidden md:block will-change-transform">
        <div className="h-1 w-1 rounded-full bg-[#ff1744] shadow-[0_0_6px_#ff1744] transition-all duration-150 dot-core" />
      </div>
      
      {/* Middle Ring - Clockwise Rotation + Concentric Crosshairs */}
      <div ref={ring1Ref} className="pointer-events-none fixed top-0 left-0 z-[9998] hidden md:block will-change-transform">
        <div className="h-4 w-4 rounded-full border border-[#ff1744]/65 animate-[spin_5s_linear_infinite] cursor-ring relative">
          {/* HUD Crosshair ticks */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-0.5 bg-[#ff1744]/65" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-0.5 bg-[#ff1744]/65" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0.5 bg-[#ff1744]/65" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-0.5 bg-[#ff1744]/65" />
        </div>
      </div>
      
      {/* Outer Ring - Dashed, Counter-Clockwise Rotation + Heartbeat breathing */}
      <div ref={ring2Ref} className="pointer-events-none fixed top-0 left-0 z-[9998] hidden md:block will-change-transform animate-[pulse_2.2s_ease-in-out_infinite]">
        <div className="h-8 w-8 rounded-full border border-dashed border-[#ff1744]/40 animate-[spin-reverse_9s_linear_infinite] cursor-ring" />
      </div>
      
      {/* Outermost Ring */}
      <div ref={ring3Ref} className="pointer-events-none fixed top-0 left-0 z-[9997] hidden md:block will-change-transform">
        <div className="h-12 w-12 rounded-full border border-[#ff1744]/22 transition-all duration-300 cursor-ring" />
      </div>

      {/* Cyberpunk HUD Coordinates */}
      <div
        ref={coordsRef}
        className="pointer-events-none fixed top-0 left-0 z-[10000] hidden md:block text-[7px] text-[#ff1744]/60 font-mono tracking-wider select-none transition-colors duration-200"
        style={{ textShadow: "0 0 4px rgba(255, 23, 68, 0.4)" }}
      >
        [000, 000]
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { 
          from { transform: rotate(0deg); } 
          to { transform: rotate(360deg); } 
        }
        @keyframes spin-reverse { 
          from { transform: rotate(360deg); } 
          to { transform: rotate(0deg); } 
        }
        .cursor-expand .cursor-ring {
          border-color: #00d4ff !important;
          box-shadow: 0 0 12px #00d4ff !important;
        }
        .dot-expand .dot-core {
          background-color: #ff2d78 !important;
          box-shadow: 0 0 10px #ff2d78 !important;
          transform: scale(1.6);
        }
        .coords-hover {
          color: #00d4ff !important;
          text-shadow: 0 0 6px rgba(0, 212, 255, 0.6) !important;
        }
        .cursor-click .cursor-ring {
          border-color: #ff2d78 !important;
          box-shadow: 0 0 16px #ff2d78 !important;
          transform: scale(0.85);
        }
        .coords-click {
          color: #ff2d78 !important;
          text-shadow: 0 0 8px rgba(255, 45, 120, 0.8) !important;
        }
      ` }} />
    </>
  );
}
```

## File: `src/components/ui/DashboardHero.tsx`

```typescript
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
```

## File: `src/components/ui/Hero.tsx`

```typescript
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
```

## File: `src/components/ui/HolographicTerminal.tsx`

```typescript
"use client";

import React from "react";
import { motion } from "framer-motion";

export default function HolographicTerminal({ scrollProgress = 0 }: { scrollProgress?: number }) {
  const isHeroVisible = scrollProgress < 0.08;

  return (
    <motion.div
      initial={{ opacity: 0, x: 28, y: 8 }}
      animate={{
        opacity: isHeroVisible ? 0.86 : 0,
        x: isHeroVisible ? 0 : 24,
        y: isHeroVisible ? 0 : 10,
      }}
      transition={{ duration: 0.45, delay: isHeroVisible ? 1.15 : 0 }}
      className="pointer-events-none fixed right-[7vw] top-[35vh] z-20 hidden w-[330px] overflow-hidden rounded-md border border-cyan-400/35 bg-[#050817]/45 font-mono text-[11px] text-white/78 shadow-[0_0_32px_rgba(0,212,255,0.18)] backdrop-blur-xl xl:block"
    >
      <div className="flex items-center justify-between border-b border-cyan-400/20 bg-cyan-400/[0.06] px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-cyan-200">
        <span>dev console</span>
        <span className="text-pink-300/80">live</span>
      </div>

      <div className="grid grid-cols-[1.12fr_0.88fr]">
        <div className="space-y-1.5 border-r border-cyan-400/15 px-4 py-3">
          <p><span className="text-pink-300">const</span> profile = {"{"}</p>
          <p className="pl-3"><span className="text-cyan-300">name</span>: <span className="text-emerald-300">&quot;Poshan MS&quot;</span>,</p>
          <p className="pl-3"><span className="text-cyan-300">role</span>: <span className="text-emerald-300">&quot;Full Stack Engineer&quot;</span>,</p>
          <p className="pl-3"><span className="text-cyan-300">stack</span>: [<span className="text-violet-300">&quot;React&quot;</span>, <span className="text-violet-300">&quot;Node&quot;</span>]</p>
          <p>{"};"}</p>
          <p><span className="text-pink-300">export</span> <span className="text-cyan-300">default</span> build;</p>
        </div>

        <div className="space-y-1.5 px-4 py-3 text-emerald-300">
          <p><span className="text-cyan-300">$</span> npm run dev</p>
          <p className="text-white/58">Next.js ready</p>
          <p>Local: 3000</p>
          <p className="text-white/58">compiled</p>
          <p className="text-pink-300">portfolio online</p>
          <motion.span
            animate={{ opacity: [1, 0.25, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="inline-block h-3 w-2 bg-red-500 shadow-[0_0_14px_rgba(255,23,68,0.75)]"
          />
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-red-500/80 to-transparent" />
    </motion.div>
  );
}
```

## File: `src/components/ui/Loader.tsx`

```typescript
"use client";

import React, { useEffect, useRef, useState } from "react";

// ═══════════════════════════════════════════════════════════════════════
// OVERKILL CONFIGURATION — Tuned for 60fps on all devices
// ═══════════════════════════════════════════════════════════════════════
const CONFIG = {
  // Timing
  LOAD_DURATION: 10000,        // 10s load time
  CONVERGE_DURATION: 1500,      // 1.5s convergence

  // Rain — matches working prototype EXACTLY
  DROP_COUNTS: { back: 300, mid: 150, front: 50 },
  MOUSE_RADIUS: 220,
  MOUSE_INNER_RADIUS: 110,

  // Physics (units per frame at 60fps, scaled by dt)
  SPEEDS: { back: 0.4, mid: 0.9, front: 1.6 },

  // Visual
  CORE_RED: "#ff0033",
  VOID_BLACK: "#030001",
  CLEAR_ALPHA: 0.25,
};

const CHAR_POOL = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF░▒▓█◢◣◤◥▪▫◊○●◐◑∴∵∷∞∝∫∮∯∰∱∲∳";

const LOG_LINES = [
  { threshold: 5, text: ">> NEURAL LINK ESTABLISHED" },
  { threshold: 18, text: ">> QUANTUM ENTANGLEMENT DETECTED" },
  { threshold: 32, text: ">> DIMENSIONAL BARRIER: UNSTABLE" },
  { threshold: 48, text: ">> SPACETIME FABRIC: TEARING" },
  { threshold: 65, text: ">> BREACH IMMINENT — SEEK SHELTER" },
  { threshold: 82, text: ">> REALITY ANCHOR: LOST" },
  { threshold: 95, text: ">> ENTERING THE VOID..." },
];

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════
interface DropChar { char: string; switchTimer: number; }
interface MicroDrop {
  x: number; y: number; fontSize: number; baseSpeed: number;
  baseOpacity: number; chars: DropChar[];
  phase: number; layer: number;
}
interface DebrisParticle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; size: number;
  angle: number; spin: number;
}
interface LightningBranch {
  x: number; y: number;
  segments: { x: number; y: number }[];
  life: number; maxLife: number;
}
interface CrackPoint { x: number; y: number; angle: number; baseRadius: number; noise: number; }

// ═══════════════════════════════════════════════════════════════════════
// TEAR ENGINE — Self-contained, no React dependencies
// ═══════════════════════════════════════════════════════════════════════
class TearEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  active = false;
  phase: "forming" | "widening" | "collapsing" | "done" = "forming";
  time = 0;
  centerX = 0;
  centerY = 0;
  crackPoints: CrackPoint[] = [];
  debris: DebrisParticle[] = [];
  lightning: LightningBranch[] = [];
  onComplete?: () => void;
  W = 0; H = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2d context");
    this.ctx = ctx;
  }

  resize(w: number, h: number) {
    const dpr = Math.min(window.devicePixelRatio, 2);
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + "px";
    this.canvas.style.height = h + "px";
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.W = w; this.H = h;
    this.centerX = w / 2;
    this.centerY = h / 2;
  }

  generateCrack() {
    this.crackPoints = [];
    const segments = 80;
    const baseAngle = -Math.PI / 2;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = baseAngle + t * Math.PI * 2;
      const r1 = Math.sin(t * 13) * 15;
      const r2 = Math.sin(t * 7 + 1) * 10;
      const r3 = Math.sin(t * 23 + 2) * 5;
      const baseR = 2 + t * 3;
      const radius = baseR + r1 + r2 + r3;
      this.crackPoints.push({
        x: this.centerX + Math.cos(angle) * radius,
        y: this.centerY + Math.sin(angle) * radius,
        angle,
        baseRadius: radius,
        noise: Math.random(),
      });
    }

    this.debris = [];
    for (let i = 0; i < 200; i++) {
      const a = Math.random() * Math.PI * 2;
      const dist = Math.random() * 100;
      const speed = 2 + Math.random() * 4;
      this.debris.push({
        x: this.centerX + Math.cos(a) * dist,
        y: this.centerY + Math.sin(a) * dist,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        size: 1 + Math.random() * 3,
        life: 1,
        maxLife: 0.8 + Math.random() * 1.2,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.2,
      });
    }
  }

  start() {
    this.active = true;
    this.phase = "forming";
    this.time = 0;
    this.generateCrack();
  }

  update(dt: number) {
    if (!this.active) return;
    this.time += dt;

    if (this.phase === "forming" && this.time > 0.3) this.phase = "widening";
    if (this.phase === "widening" && this.time > 1.2) this.phase = "collapsing";
    if (this.phase === "collapsing" && this.time > 2.0) {
      this.phase = "done";
      this.active = false;
      this.onComplete?.();
      return;
    }

    for (const d of this.debris) {
      d.x += d.vx * dt * 60;
      d.y += d.vy * dt * 60;
      d.vx *= 0.98;
      d.vy *= 0.98;
      d.life -= dt / d.maxLife;
      d.angle += d.spin * dt * 60;
    }
    this.debris = this.debris.filter((d) => d.life > 0);

    if (this.phase === "forming" && Math.random() < 0.3) {
      const idx = Math.floor(Math.random() * this.crackPoints.length);
      const p = this.crackPoints[idx];
      const lAngle = p.angle + (Math.random() - 0.5) * 1;
      const segs: { x: number; y: number }[] = [];
      let lx = p.x;
      let ly = p.y;
      for (let s = 0; s < 5; s++) {
        lx += Math.cos(lAngle + (Math.random() - 0.5)) * (10 + Math.random() * 20);
        ly += Math.sin(lAngle + (Math.random() - 0.5)) * (10 + Math.random() * 20);
        segs.push({ x: lx, y: ly });
      }
      this.lightning.push({ x: lx, y: ly, segments: segs, life: 0.3, maxLife: 0.3 });
    }

    for (let i = this.lightning.length - 1; i >= 0; i--) {
      this.lightning[i].life -= dt;
      if (this.lightning[i].life <= 0) this.lightning.splice(i, 1);
    }
  }

  draw() {
    if (!this.active) return;
    const { ctx, centerX, centerY, time, W, H } = this;
    const t = time;

    let expansion = 0;
    if (this.phase === "forming") expansion = (t / 0.3) * 5;
    else if (this.phase === "widening") expansion = 5 + ((t - 0.3) / 0.9) * 400;
    else if (this.phase === "collapsing") expansion = 405 + ((t - 1.2) / 0.8) * 600;

    ctx.save();
    ctx.clearRect(0, 0, W, H);

    // Void gradient
    const voidGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, expansion * 1.5);
    voidGrad.addColorStop(0, CONFIG.VOID_BLACK);
    voidGrad.addColorStop(0.3, CONFIG.VOID_BLACK);
    voidGrad.addColorStop(0.5, "rgba(255,0,51,0.1)");
    voidGrad.addColorStop(0.7, "rgba(255,0,51,0.3)");
    voidGrad.addColorStop(0.85, "rgba(255,50,80,0.15)");
    voidGrad.addColorStop(1, "transparent");
    ctx.fillStyle = voidGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, expansion * 2, 0, Math.PI * 2);
    ctx.fill();

    // Crack edges
    if (this.crackPoints.length > 1) {
      ctx.shadowColor = CONFIG.CORE_RED;
      ctx.shadowBlur = 20;
      ctx.strokeStyle = "rgba(255, 0, 51, 0.8)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < this.crackPoints.length; i++) {
        const p = this.crackPoints[i];
        const r = p.baseRadius + expansion + Math.sin(t * 10 + i) * 3;
        const x = centerX + Math.cos(p.angle) * r;
        const y = centerY + Math.sin(p.angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();

      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = 10;
      ctx.strokeStyle = "rgba(255, 200, 200, 0.9)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < this.crackPoints.length; i++) {
        const p = this.crackPoints[i];
        const r = p.baseRadius + expansion * 0.95 + Math.sin(t * 15 + i) * 2;
        const x = centerX + Math.cos(p.angle) * r;
        const y = centerY + Math.sin(p.angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Lightning
    ctx.shadowBlur = 15;
    for (const l of this.lightning) {
      const alpha = l.life / l.maxLife;
      ctx.strokeStyle = `rgba(255, 200, 255, ${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(l.x, l.y);
      for (const s of l.segments) ctx.lineTo(s.x, s.y);
      ctx.stroke();
    }

    // Debris
    ctx.shadowBlur = 5;
    for (const d of this.debris) {
      const alpha = Math.max(0, d.life);
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.angle);
      const r = 255;
      const g = 50 + d.life * 100;
      const b = 80 + d.life * 50;
      ctx.fillStyle = `rgba(${r}, ${g | 0}, ${b | 0}, ${alpha})`;
      ctx.fillRect(-d.size / 2, -d.size / 2, d.size, d.size);
      ctx.restore();
    }

    // Vignette during collapse
    if (this.phase === "collapsing") {
      const collapseT = (t - 1.2) / 0.8;
      const vigAlpha = collapseT * 0.95;
      const vig = ctx.createRadialGradient(
        centerX, centerY, expansion * 0.5,
        centerX, centerY, Math.max(W, H)
      );
      vig.addColorStop(0, "transparent");
      vig.addColorStop(0.4, `rgba(3, 0, 1, ${vigAlpha * 0.3})`);
      vig.addColorStop(1, `rgba(3, 0, 1, ${vigAlpha})`);
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);
    }

    ctx.restore();
  }
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT — COMPLETELY ISOLATED FROM REACT RENDER CYCLE
// ═══════════════════════════════════════════════════════════════════════
interface LoaderProps {
  onComplete?: () => void;
}

export default function Loader({ onComplete }: LoaderProps) {
  // React state — ONLY used for mount/unmount, NEVER inside RAF
  const [isComplete, setIsComplete] = useState(false);

  // DOM Refs — for direct manipulation, zero React involvement
  const containerRef = useRef<HTMLDivElement>(null);
  const matrixCanvasRef = useRef<HTMLCanvasElement>(null);
  const tearCanvasRef = useRef<HTMLCanvasElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const percentTextRef = useRef<HTMLSpanElement>(null);
  const statusTextRef = useRef<HTMLSpanElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const counterC1Ref = useRef<HTMLSpanElement>(null);
  const counterC2Ref = useRef<HTMLSpanElement>(null);
  const counterC3Ref = useRef<HTMLSpanElement>(null);
  const uiLayerRef = useRef<HTMLDivElement>(null);
  const bigCounterRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);

  // Animation state — ALL in refs, NEVER triggers re-render
  const dropsRef = useRef<MicroDrop[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const mouseSmoothRef = useRef({ x: -1000, y: -1000 });
  const tearEngineRef = useRef<TearEngine | null>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());
  const phaseTimerRef = useRef(0);
  const hasCompletedRef = useRef(false);
  const progressRef = useRef(0);
  const phaseRef = useRef<"loading" | "converging" | "tearing" | "done">("loading");
  const shownLogsRef = useRef<Set<number>>(new Set());
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  // Initialize drops — called ONCE, never again
  const initDrops = (w: number, h: number) => {
    const drops: MicroDrop[] = [];
    const configs = [
      { count: CONFIG.DROP_COUNTS.back, font: 7, speed: CONFIG.SPEEDS.back, opacity: 0.06, chars: 4 },
      { count: CONFIG.DROP_COUNTS.mid, font: 10, speed: CONFIG.SPEEDS.mid, opacity: 0.12, chars: 7 },
      { count: CONFIG.DROP_COUNTS.front, font: 13, speed: CONFIG.SPEEDS.front, opacity: 0.28, chars: 10 },
    ];

    for (let layer = 0; layer < 3; layer++) {
      const cfg = configs[layer];
      for (let i = 0; i < cfg.count; i++) {
        const chars: DropChar[] = [];
        for (let c = 0; c < cfg.chars; c++) {
          chars.push({
            char: CHAR_POOL[Math.floor(Math.random() * CHAR_POOL.length)],
            switchTimer: Math.random() * 30,
          });
        }
        drops.push({
          x: Math.random() * w,
          y: Math.random() * h,
          fontSize: cfg.font + Math.random() * 3,
          baseSpeed: cfg.speed * (0.7 + Math.random() * 0.6),
          baseOpacity: cfg.opacity,
          chars,
          phase: Math.random() * Math.PI * 2,
          layer,
        });
      }
    }
    dropsRef.current = drops;
  };

  // Main effect — runs ONCE, sets up everything, never re-runs
  useEffect(() => {
    const matrixCanvas = matrixCanvasRef.current;
    const tearCanvas = tearCanvasRef.current;
    if (!matrixCanvas || !tearCanvas) return;

    // Setup matrix canvas context ONCE
    const ctx = matrixCanvas.getContext("2d");
    if (!ctx) return;
    ctxRef.current = ctx;

    let W = window.innerWidth;
    let H = window.innerHeight;

    const dpr = Math.min(window.devicePixelRatio, 2);
    matrixCanvas.width = W * dpr;
    matrixCanvas.height = H * dpr;
    matrixCanvas.style.width = W + "px";
    matrixCanvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Setup tear engine
    tearEngineRef.current = new TearEngine(tearCanvas);
    tearEngineRef.current.resize(W, H);
    tearEngineRef.current.onComplete = () => {
      if (hasCompletedRef.current) return;
      hasCompletedRef.current = true;
      phaseRef.current = "done";

      // White flash
      if (flashRef.current) {
        flashRef.current.style.transition = "opacity 0.1s";
        flashRef.current.style.opacity = "1";
        setTimeout(() => {
          if (flashRef.current) {
            flashRef.current.style.transition = "opacity 1.5s ease-out";
            flashRef.current.style.opacity = "0";
          }
        }, 100);
      }

      // Hide UI
      if (uiLayerRef.current) {
        uiLayerRef.current.style.transition = "opacity 0.5s";
        uiLayerRef.current.style.opacity = "0";
      }
      if (bigCounterRef.current) {
        bigCounterRef.current.style.transition = "opacity 0.5s";
        bigCounterRef.current.style.opacity = "0";
      }

      // Notify completion after flash fades
      setTimeout(() => {
        setIsComplete(true);
        onComplete?.();
      }, 1600);
    };

    initDrops(W, H);

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Resize handler
    const handleResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      matrixCanvas.width = W * dpr;
      matrixCanvas.height = H * dpr;
      matrixCanvas.style.width = W + "px";
      matrixCanvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      tearEngineRef.current?.resize(W, H);
      initDrops(W, H);
    };
    window.addEventListener("resize", handleResize);

    // ═══════════════════════════════════════════════════════════════
    // THE ANIMATION LOOP — ZERO React state updates, pure DOM refs
    // ═══════════════════════════════════════════════════════════════
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const time = now / 1000;

      // Smooth mouse
      mouseSmoothRef.current.x += (mouseRef.current.x - mouseSmoothRef.current.x) * 0.1;
      mouseSmoothRef.current.y += (mouseRef.current.y - mouseSmoothRef.current.y) * 0.1;
      const mx = mouseSmoothRef.current.x;
      const my = mouseSmoothRef.current.y;

      // ── PROGRESS LOGIC ──
      if (phaseRef.current === "loading") {
        const elapsed = Date.now() - startTimeRef.current;
        progressRef.current = Math.min(elapsed / CONFIG.LOAD_DURATION, 1) * 100;

        if (progressRef.current >= 100) {
          progressRef.current = 100;
          phaseRef.current = "converging";
          phaseTimerRef.current = 0;
          if (statusTextRef.current) {
            statusTextRef.current.textContent = "DIMENSIONAL BREACH IMMINENT";
          }
        }
      } else if (phaseRef.current === "converging") {
        phaseTimerRef.current += dt;
        // Rain converges to center
        for (const d of dropsRef.current) {
          const dx = W / 2 - d.x;
          const dy = H / 2 - d.y;
          d.x += dx * 0.02 * dt * 60;
          d.y += dy * 0.02 * dt * 60;
          d.baseSpeed *= 1.01;
        }
        if (phaseTimerRef.current > CONFIG.CONVERGE_DURATION / 1000) {
          phaseRef.current = "tearing";
          tearEngineRef.current?.start();
        }
      }

      // ── UPDATE UI VIA DOM MANIPULATION (NOT setState) ──
      const currentProgress = progressRef.current;
      const displayProgress = Math.floor(currentProgress);

      // Progress bar width
      if (progressFillRef.current) {
        progressFillRef.current.style.width = displayProgress + "%";
      }
      // Percent text
      if (percentTextRef.current) {
        percentTextRef.current.textContent = displayProgress + "%";
      }
      // Counter digits
      const s = displayProgress.toString().padStart(3, "0");
      if (counterC1Ref.current) counterC1Ref.current.textContent = s[0];
      if (counterC2Ref.current) counterC2Ref.current.textContent = s[1];
      if (counterC3Ref.current) counterC3Ref.current.textContent = s[2];

      // Terminal logs — add via DOM, NOT state
      for (const log of LOG_LINES) {
        if (currentProgress >= log.threshold && !shownLogsRef.current.has(log.threshold)) {
          shownLogsRef.current.add(log.threshold);
          if (terminalRef.current) {
            const div = document.createElement("div");
            div.textContent = log.text;
            div.style.opacity = "0";
            div.style.transition = "opacity 0.3s";
            terminalRef.current.appendChild(div);
            requestAnimationFrame(() => { div.style.opacity = "1"; });
            if (terminalRef.current.children.length > 4) {
              terminalRef.current.removeChild(terminalRef.current.firstChild!);
            }
          }
        }
      }

      // Shake UI during convergence
      if (phaseRef.current === "converging" && uiLayerRef.current) {
        const shake = (1 - phaseTimerRef.current / (CONFIG.CONVERGE_DURATION / 1000)) * 3;
        uiLayerRef.current.style.transform =
          `translate(${(Math.random() - 0.5) * shake}px, ${(Math.random() - 0.5) * shake}px)`;
      }

      // ── CLEAR CANVAS ──
      ctx.fillStyle = `rgba(3, 0, 1, ${CONFIG.CLEAR_ALPHA})`;
      ctx.fillRect(0, 0, W, H);

      // ── DRAW DROPS ── (matches working prototype exactly)
      const drops = dropsRef.current;
      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        const dx = d.x - mx;
        const dy = d.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const mouseRadius = CONFIG.MOUSE_RADIUS;

        let speed = d.baseSpeed;
        let opacity = d.baseOpacity;

        if (dist < mouseRadius && mouseRef.current.active) {
          const influence = 1 - dist / mouseRadius;
          speed *= (1 - influence * 0.7);
          opacity = Math.min(1, opacity + influence * 0.6);
          d.x -= (dx / Math.max(dist, 1)) * influence * 0.3;
        }

        // Breathing
        const breathe = Math.sin(time * 2 + d.phase) * 0.3 + 0.7;
        opacity *= breathe;

        // Move
        d.y += speed * (dt * 60);

        // Character switching
        for (let c = 0; c < d.chars.length; c++) {
          const ch = d.chars[c];
          ch.switchTimer -= dt * 60;
          if (ch.switchTimer <= 0) {
            ch.char = CHAR_POOL[Math.floor(Math.random() * CHAR_POOL.length)];
            ch.switchTimer = 5 + Math.random() * 25;
          }
        }

        // Reset if off screen
        if (d.y > H + 20) {
          d.y = -20;
          d.x = Math.random() * W;
        }

        // Draw
        for (let c = 0; c < d.chars.length; c++) {
          const cy = d.y - c * d.fontSize * 1.1;
          if (cy < -10 || cy > H + 10) continue;

          const charOpacity = c === 0 ? opacity : opacity * (1 - c / d.chars.length) * 0.7;
          if (charOpacity < 0.005) continue;

          // Color by layer (matches prototype)
          let r: number, g: number, b: number;
          if (d.layer === 2 && c === 0) {
            r = 255; g = 200 + Math.sin(time * 3) * 55; b = 200 + Math.sin(time * 3) * 55;
          } else if (d.layer === 2) {
            r = 255; g = 30; b = 50;
          } else if (d.layer === 1) {
            r = 180; g = 10; b = 25;
          } else {
            r = 80; g = 0; b = 8;
          }

          // Mouse glow
          if (dist < mouseRadius * 0.5 && mouseRef.current.active) {
            const h = 1 - dist / (mouseRadius * 0.5);
            r = 255;
            g = Math.min(255, g + h * 200);
            b = Math.min(255, b + h * 200);
          }

          ctx.fillStyle = `rgba(${r | 0}, ${g | 0}, ${b | 0}, ${charOpacity})`;
          ctx.font = `${d.fontSize}px "JetBrains Mono", "Courier New", monospace`;
          ctx.fillText(d.chars[c].char, d.x, cy);
        }
      }

      // ── SCANLINES ──
      ctx.fillStyle = "rgba(255, 0, 51, 0.02)";
      for (let y = 0; y < H; y += 4) {
        ctx.fillRect(0, y, W, 1);
      }

      // ── TEAR ──
      tearEngineRef.current?.update(dt);
      tearEngineRef.current?.draw();

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // EMPTY ARRAY = runs ONCE, never re-runs

  // If loader is complete, render nothing
  if (isComplete) return null;

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER — Static JSX, no state dependencies except isComplete
  // All animated elements are updated via refs, not React state
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[99999] overflow-hidden"
      style={{ background: CONFIG.VOID_BLACK, cursor: "none" }}
    >
      {/* Matrix rain canvas */}
      <canvas
        ref={matrixCanvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ imageRendering: "auto" }}
      />

      {/* Tear overlay canvas */}
      <canvas
        ref={tearCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 100 }}
      />

      {/* White flash on breach */}
      <div
        ref={flashRef}
        className="absolute inset-0 pointer-events-none bg-white"
        style={{ zIndex: 200, opacity: 0 }}
      />

      {/* UI Layer — updated via DOM refs, not React state */}
      <div
        ref={uiLayerRef}
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{ zIndex: 10 }}
      >
        {/* Logo */}
        <div className="relative w-[140px] h-[140px] mb-16">
          <div
            className="absolute inset-[-20px] rounded-full border border-[#ff0033]/20 border-t-[#ff0033]/80"
            style={{ animation: "spin 4s linear infinite" }}
          />
          <div
            className="absolute inset-[-35px] rounded-full border-[0.5px] border-b-[#ff0033]/40 border-t-transparent"
            style={{ animation: "spin-reverse 6s linear infinite" }}
          />
          <div
            className="absolute inset-[-50px] rounded-full border-[0.3px] border-l-[#ff0033]/30 border-r-transparent"
            style={{ animation: "spin 8s linear infinite" }}
          />
          <svg viewBox="0 0 100 100" className="w-full h-full" style={{ filter: "drop-shadow(0 0 20px rgba(255,0,51,0.6))" }}>
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff0033" />
                <stop offset="50%" stopColor="#ff3366" />
                <stop offset="100%" stopColor="#660011" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              d="M28 18 h28 c16 0 24 10 24 22 c0 14 -10 22 -26 22 h-18 v30 h-16 v-74 h8"
              stroke="url(#logoGrad)"
              strokeWidth="3.5"
              fill="none"
              filter="url(#glow)"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M28 34 h20 c8 0 12 4 12 10 c0 7 -5 10 -14 10 h-18 v-20"
              stroke="url(#logoGrad)"
              strokeWidth="3"
              fill="none"
              opacity="0.6"
            />
            <circle cx="42" cy="40" r="3" fill="#ff0033" opacity="0.8">
              <animate attributeName="opacity" values="0.4;0.9;0.4" dur="2s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>

        {/* Progress bar */}
        <div className="w-[320px] relative">
          <div className="flex justify-between mb-2">
            <span
              ref={statusTextRef}
              className="text-[9px] tracking-[0.3em] text-[#ff0033]/70 uppercase font-mono"
            >
              ESTABLISHING UPLINK
            </span>
            <span
              ref={percentTextRef}
              className="text-[9px] tracking-[0.2em] text-[#ff0033]/70 font-mono"
            >
              0%
            </span>
          </div>
          <div className="h-[1px] bg-[#ff0033]/10 relative overflow-hidden">
            <div
              ref={progressFillRef}
              className="h-full absolute left-0 top-0"
              style={{
                width: "0%",
                background: "linear-gradient(90deg, #ff0033, #ff3366)",
                boxShadow: "0 0 10px rgba(255,0,51,0.8), 0 0 30px rgba(255,0,51,0.3)",
                transition: "width 0.1s linear",
              }}
            >
              <div className="absolute right-0 top-[-2px] w-1 h-[5px] bg-white shadow-[0_0_10px_#fff,0_0_20px_#ff0033]" />
            </div>
          </div>
        </div>

        {/* Terminal logs */}
        <div
          ref={terminalRef}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 text-center min-h-[80px]"
        />
      </div>

      {/* Big counter */}
      <div
        ref={bigCounterRef}
        className="fixed bottom-10 left-10 font-mono pointer-events-none"
        style={{ zIndex: 10 }}
      >
        <div className="flex items-baseline">
          <span
            ref={counterC1Ref}
            className="text-[80px] font-black leading-none tracking-tighter"
            style={{
              color: "rgba(255, 0, 51, 0.15)",
              fontFamily: "var(--font-jetbrains-mono), monospace",
            }}
          >
            0
          </span>
          <span
            ref={counterC2Ref}
            className="text-[80px] font-black leading-none tracking-tighter"
            style={{
              color: "rgba(255, 0, 51, 0.15)",
              fontFamily: "var(--font-jetbrains-mono), monospace",
            }}
          >
            0
          </span>
          <span
            ref={counterC3Ref}
            className="text-[80px] font-black leading-none tracking-tighter"
            style={{
              color: "rgba(255, 0, 51, 0.15)",
              fontFamily: "var(--font-jetbrains-mono), monospace",
            }}
          >
            0
          </span>
        </div>
        <p className="text-[9px] tracking-[0.32em] text-white/25 uppercase mt-1">
          System Integrity Matrix
        </p>
      </div>
    </div>
  );
}
```

## File: `src/components/ui/Navbar.tsx`

```typescript
"use client";

import React, { useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const navLinks = ["HOME", "ABOUT", "SKILLS", "PROJECTS", "EXPERIENCE", "BLOG", "CONTACT"];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("HOME");

  const handleLinkClick = (link: string) => {
    setActiveLink(link);
    setIsOpen(false);

    const targetElement = document.getElementById(link.toLowerCase());
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const renderNavLabel = (link: string) => link;

  return (
    <>
      <nav className="fixed left-0 top-0 z-50 w-full border-b border-white/[0.04] bg-[#050508]/35 px-6 py-4 backdrop-blur-md md:px-12">
        <div className="mx-auto flex max-w-[96rem] items-center justify-between">
          <div className="flex select-none items-center space-x-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#ff1744]/20 bg-[#ff1744]/5 shadow-[0_0_18px_rgba(255,23,68,0.18)]">
              <svg width="30" height="34" viewBox="0 0 40 45" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_10px_var(--electric-blue)]">
                <path d="M5 5H22C28.6274 5 34 10.3726 34 17C34 23.6274 28.6274 29 22 29H13V40" stroke="#ff1744" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13 17H22C23.6569 17 25 15.6569 25 14C25 12.3431 23.6569 11 22 11H13V17Z" fill="#800010" />
              </svg>
            </div>

            <div className="flex flex-col">
              <span className="text-xs font-bold tracking-[0.28em] text-white md:text-sm">POSHAN MS</span>
              <span className="font-mono text-[8px] font-medium uppercase tracking-[0.24em] text-[var(--electric-blue)] text-glow-blue md:text-[9px]">
                Full Stack Engineer
              </span>
            </div>
          </div>

          <div className="hidden items-center space-x-4 lg:flex">
            {navLinks.map((link, idx) => (
              <React.Fragment key={link}>
                {idx > 0 && <span className="select-none text-[8px] text-white/25">{"•"}</span>}
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => handleLinkClick(link)}
                  className={`relative px-3 py-1 font-mono text-[10px] font-semibold tracking-widest transition-all duration-300 md:text-xs ${
                    activeLink === link ? "text-[var(--electric-blue)] text-glow-blue" : "text-white/64 hover:text-white"
                  }`}
                >
                  {renderNavLabel(link)}
                  {activeLink === link && (
                    <motion.div
                      layoutId="activeUnderline"
                      className="absolute bottom-[-11px] left-3 right-3 h-[2px] bg-gradient-to-r from-[var(--electric-blue)] to-[var(--hot-pink)] shadow-[0_0_8px_var(--electric-blue)]"
                    />
                  )}
                </button>
              </React.Fragment>
            ))}
          </div>

          <div className="hidden items-center space-x-4 md:flex">
            <a
              href="mailto:siddeshwaraprasanna5@gmail.com"
              className="group flex items-center space-x-1.5 rounded-full border border-[var(--electric-blue)] bg-transparent px-5 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-white shadow-[0_0_16px_rgba(255,23,68,0.2)] transition-all duration-300 hover:border-[var(--hot-pink)] hover:bg-white/[0.02] hover:text-[var(--hot-pink)] hover:shadow-[0_0_18px_rgba(204,17,51,0.24)] md:text-xs"
            >
              <span>LET&apos;S CONNECT</span>
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>

            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setIsOpen(!isOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[var(--glass-dark)] text-white/80 transition-all duration-300 hover:border-[var(--electric-blue)] hover:text-[var(--electric-blue)] hover:shadow-[0_0_12px_rgba(255,23,68,0.24)]"
              aria-label="Open navigation menu"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center md:hidden">
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setIsOpen(!isOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[var(--glass-dark)] text-white"
              aria-label="Open navigation menu"
            >
              {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: "-20px" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "-20px" }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 flex flex-col justify-center bg-[#050508]/95 px-8 backdrop-blur-xl md:px-24"
          >
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] opacity-20" />
            <div className="mt-16 flex flex-col space-y-6">
              {navLinks.map((link, idx) => (
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={link}
                  onClick={() => handleLinkClick(link)}
                  className={`text-left text-3xl font-bold tracking-[0.1em] transition-all duration-300 ${
                    activeLink === link ? "text-[var(--electric-blue)] text-glow-blue" : "text-white/60 hover:text-white"
                  }`}
                >
                  {renderNavLabel(link)}
                </motion.button>
              ))}

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="border-t border-white/10 pt-8">
                <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-[#555577]">{"// Contact Details"}</p>
                <a href="mailto:siddeshwaraprasanna5@gmail.com" className="mb-2 block text-sm font-semibold tracking-wider text-[var(--electric-blue)] transition-colors duration-300 hover:text-white">
                  siddeshwaraprasanna5@gmail.com
                </a>
                <div className="flex space-x-4 pt-2 text-xs font-medium text-white/50">
                  <a href="https://github.com/POSHANMS" target="_blank" rel="noreferrer" className="transition-colors duration-300 hover:text-white">
                    GITHUB
                  </a>
                  <a href="https://linkedin.com/in/poshanms/" target="_blank" rel="noreferrer" className="transition-colors duration-300 hover:text-white">
                    LINKEDIN
                  </a>
                </div>
              </motion.div>
            </div>

            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setIsOpen(false)}
              className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/70 hover:text-white"
              aria-label="Close navigation menu"
            >
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

## File: `src/components/ui/ScrollIndicator.tsx`

```typescript
"use client";

import React from "react";
import { motion } from "framer-motion";

export default function ScrollIndicator({ scrollProgress = 0 }: { scrollProgress?: number }) {
  const isHeroVisible = scrollProgress < 0.08;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isHeroVisible ? 1 : 0, y: isHeroVisible ? 0 : 12 }}
      transition={{ duration: 0.35, delay: isHeroVisible ? 3.0 : 0 }}
      className="fixed bottom-6 left-1/2 z-20 hidden -translate-x-1/2 flex-col items-center gap-1.5 pointer-events-none md:flex"
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/45">SCROLL TO EXPLORE</span>
      <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }} className="flex flex-col items-center gap-0.5">
        <svg width="18" height="10" viewBox="0 0 18 10" fill="none">
          <path d="M1 1L9 9L17 1" stroke="rgba(0,212,255,0.75)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <svg width="18" height="10" viewBox="0 0 18 10" fill="none">
          <path d="M1 1L9 9L17 1" stroke="rgba(255,45,120,0.55)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>
    </motion.div>
  );
}
```

## File: `src/components/ui/SocialSidebar.tsx`

```typescript
"use client";

import React from "react";
import { BriefcaseBusiness, Box, Code2, Home, Mail, Settings, UserRound } from "lucide-react";
import { motion } from "framer-motion";

const socials = [
  {
    name: "Home",
    href: "#home",
    icon: <Home className="h-[18px] w-[18px]" />,
  },
  {
    name: "About",
    href: "#about",
    icon: <UserRound className="h-[18px] w-[18px]" />,
  },
  {
    name: "Code",
    href: "#skills",
    icon: <Code2 className="h-[18px] w-[18px]" />,
  },
  {
    name: "Projects",
    href: "#projects",
    icon: <Box className="h-[18px] w-[18px]" />,
  },
  {
    name: "Mail",
    href: "mailto:siddeshwaraprasanna5@gmail.com",
    icon: <Mail className="h-[18px] w-[18px]" />,
  },
  {
    name: "Work",
    href: "#experience",
    icon: <BriefcaseBusiness className="h-[18px] w-[18px]" />,
  },
  {
    name: "Settings",
    href: "#contact",
    icon: <Settings className="h-[18px] w-[18px]" />,
  },
];

export default function SocialSidebar() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 2.0 }}
      className="fixed left-5 top-[7.1rem] z-30 hidden h-[calc(100vh-9rem)] w-[4.1rem] flex-col items-center justify-between rounded-[2rem] border border-white/10 bg-[rgba(6,8,24,0.55)] px-3 py-6 shadow-[0_0_30px_rgba(0,212,255,0.08)] backdrop-blur-md pointer-events-auto md:flex"
    >
      <div className="flex flex-col items-center gap-6">
        {socials.slice(0, 7).map((social, index) => (
          <motion.a
            key={social.name}
            href={social.href}
            aria-label={social.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 1.1 + index * 0.08 }}
            className={`block transition-all duration-300 hover:scale-125 hover:text-[#ff1744] hover:drop-shadow-[0_0_8px_#ff1744] ${
              index === 0 ? "text-[#ff1744] drop-shadow-[0_0_10px_#ff1744]" : "text-white/55"
            }`}
          >
            {social.icon}
          </motion.a>
        ))}
      </div>

      <div className="flex flex-col items-center gap-4 rounded-full border border-white/10 bg-white/[0.03] px-2 py-3">
        <span className="h-4 w-4 rounded-full border border-white/80" />
        <span className="h-3 w-6 rounded-full bg-white/15 after:block after:h-3 after:w-3 after:rounded-full after:bg-[var(--deep-violet)]" />
      </div>
    </motion.div>
  );
}
```

## File: `src/components/ui/StatsPanel.tsx`

```typescript
"use client";

import React from "react";
import { BarChart3, Coffee, Code2, Rocket } from "lucide-react";
import { motion } from "framer-motion";

const stats = [
  { icon: Rocket, value: "3+", label: "Years Experience" },
  { icon: Code2, value: "20+", label: "Projects Completed" },
  { icon: BarChart3, value: "10K+", label: "Lines of Code" },
  { icon: Coffee, value: "24/7", label: "Coffee Fueled" },
];

export default function StatsPanel({ scrollProgress = 0 }: { scrollProgress?: number }) {
  const isHeroVisible = scrollProgress < 0.08;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isHeroVisible ? 1 : 0, y: isHeroVisible ? 0 : 24 }}
      transition={{ duration: 0.35, delay: isHeroVisible ? 2.4 : 0 }}
      className="fixed bottom-[4.25rem] left-1/2 z-20 hidden -translate-x-1/2 pointer-events-none lg:block"
    >
      <div
        className="flex h-[100px] w-[760px] items-center gap-8 overflow-hidden rounded-lg px-[30px] py-5"
        style={{
          background: "linear-gradient(135deg, rgba(5, 5, 8, 0.88), rgba(0, 0, 0, 0.94))",
          backdropFilter: "blur(18px) saturate(1.25)",
          WebkitBackdropFilter: "blur(18px) saturate(1.25)",
          border: "1px solid rgba(255, 23, 68, 0.28)",
          boxShadow: "0 0 28px rgba(255, 23, 68, 0.14), inset 0 0 28px rgba(128, 0, 16, 0.08)",
        }}
      >
        <div className="border-r border-white/10 pr-6">
          <span className="font-mono text-[11px] tracking-widest text-[#ff1744]/90">{"// STATS"}</span>
        </div>

        <div className="grid flex-1 grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 2.6 + index * 0.1 }}
              className="flex min-w-0 items-center gap-3.5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#ff1744]/35 bg-white/8 text-[#ff1744] shadow-[0_0_18px_rgba(255,23,68,0.18)]">
                <stat.icon size={19} />
              </span>
              <div className="min-w-0">
                <div className="text-2xl font-black leading-none text-white">{stat.value}</div>
                <div className="mt-1.5 text-[10px] leading-tight text-white/68">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
```

## File: `src/components/ui/Terminal.tsx`

```typescript
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
```

## File: `src/hooks/useAudio.ts`

```typescript
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createAmbientAudio, type AmbientAudioController } from "@/lib/audio";

export function useAudio(scrollProgress: number) {
  const controllerRef = useRef<AmbientAudioController | null>(null);
  const [enabled, setEnabled] = useState(false);

  const toggle = useCallback(async () => {
    if (!controllerRef.current) {
      controllerRef.current = createAmbientAudio();
    }

    if (enabled) {
      controllerRef.current.stop();
      setEnabled(false);
      return;
    }

    await controllerRef.current.start();
    setEnabled(true);
  }, [enabled]);

  useEffect(() => {
    controllerRef.current?.setIntensity(scrollProgress);
  }, [scrollProgress]);

  useEffect(() => {
    const handleVisibility = () => {
      if (!controllerRef.current) return;
      controllerRef.current.setMuted(document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      controllerRef.current?.dispose();
      controllerRef.current = null;
    };
  }, []);

  return { enabled, toggle };
}
```

## File: `src/hooks/useDeviceSize.ts`

```typescript
"use client";

import { useEffect, useState } from "react";

export type DeviceTier = "mobile" | "tablet" | "desktop";

export function useDeviceSize() {
  const [deviceTier, setDeviceTier] = useState<DeviceTier>("desktop");
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const update = () => {
      const width = window.innerWidth;
      setDeviceTier(width < 768 ? "mobile" : width < 1180 ? "tablet" : "desktop");
      setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return { deviceTier, reducedMotion };
}
```

## File: `src/hooks/useMousePosition.ts`

```typescript
"use client";

import { useEffect, useState, useRef } from "react";

/**
 * Custom hook to track mouse position normalized between -1 and 1,
 * smoothed with linear interpolation (LERP) for fluid parallax and animations.
 * 
 * @param lerpSpeed The speed coefficient of the LERP smoothing (0.01 - 1.0)
 * @returns An object containing the smoothed x and y normalized coordinates
 */
export function useMousePosition(lerpSpeed = 0.08) {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize client coordinates: X: [-1.0, 1.0], Y: [-1.0, 1.0] (WebGL format)
      targetRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      targetRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    let animationFrameId: number;

    const updatePosition = () => {
      // Apply linear interpolation
      // Current = Current + (Target - Current) * Speed
      currentRef.current.x += (targetRef.current.x - currentRef.current.x) * lerpSpeed;
      currentRef.current.y += (targetRef.current.y - currentRef.current.y) * lerpSpeed;

      // Update state to trigger re-renders only when coordinates change significantly
      const diffX = Math.abs(currentRef.current.x - coords.x);
      const diffY = Math.abs(currentRef.current.y - coords.y);

      if (diffX > 0.001 || diffY > 0.001) {
        setCoords({
          x: currentRef.current.x,
          y: currentRef.current.y,
        });
      }

      animationFrameId = requestAnimationFrame(updatePosition);
    };

    animationFrameId = requestAnimationFrame(updatePosition);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [lerpSpeed, coords.x, coords.y]);

  return coords;
}
```

## File: `src/hooks/usePhysics.ts`

```typescript
"use client";

import { useDeviceSize } from "./useDeviceSize";

export function usePhysics() {
  const { deviceTier, reducedMotion } = useDeviceSize();
  return {
    enabled: deviceTier !== "mobile" && !reducedMotion,
    tier: deviceTier,
  };
}
```

## File: `src/hooks/useScrollProgress.ts`

```typescript
"use client";

import { useEffect, useState } from "react";

/**
 * Custom hook to track the normalized page scroll progress (0.0 to 1.0)
 * and identify the currently active cinematic scene (1 - 5).
 * 
 * @returns An object containing the current scroll progress and active scene index
 */
export function useScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeScene, setActiveScene] = useState(1);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      
      // Calculate progress normalized between 0.0 and 1.0
      const progress = maxScroll > 0 ? scrollY / maxScroll : 0;
      setScrollProgress(progress);

      // Determine active scene (5 scenes total, split progress into 5 equal ranges)
      // Scene 1: [0.0 - 0.2)
      // Scene 2: [0.2 - 0.4)
      // Scene 3: [0.4 - 0.6)
      // Scene 4: [0.6 - 0.8)
      // Scene 5: [0.8 - 1.0]
      if (progress < 0.2) {
        setActiveScene(1);
      } else if (progress < 0.4) {
        setActiveScene(2);
      } else if (progress < 0.6) {
        setActiveScene(3);
      } else if (progress < 0.8) {
        setActiveScene(4);
      } else {
        setActiveScene(5);
      }
    };

    // Initialize values on mount
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return { progress: scrollProgress, activeScene };
}
```

## File: `src/hooks/useSuspenseAudio.ts`

```typescript
"use client";

import { useEffect, useRef, useCallback } from "react";

export function useSuspenseAudio() {
  const startedRef = useRef(false);
  const synthRef = useRef<any>(null);
  const noiseRef = useRef<any>(null);
  const filterRef = useRef<any>(null);
  const lfoRef = useRef<any>(null);

  const start = useCallback(async () => {
    if (startedRef.current) return;
    try {
      const tone = await import("tone");
      
      // Start Tone audio context
      await tone.start();

      // Low Drone Filter
      const filter = new tone.Filter(200, "lowpass").toDestination();
      filterRef.current = filter;
      
      // Suspenseful low synth drone
      const synth = new tone.PolySynth(tone.Synth, {
        oscillator: { type: "fatsawtooth" },
        envelope: { attack: 3, decay: 1, sustain: 1, release: 4 },
      }).connect(filter);
      synth.volume.value = -20;
      synthRef.current = synth;
      
      // LFO to modulate filter frequency for suspense wobble
      const lfo = new tone.LFO(0.12, 80, 320).connect(filter.frequency);
      lfoRef.current = lfo;
      
      // Pink noise for cosmic atmospheric wind
      const noise = new tone.Noise("pink").connect(filter);
      noise.volume.value = -32;
      noiseRef.current = noise;

      // Play notes
      synth.triggerAttack(["C2", "G1", "D2"]);
      lfo.start();
      noise.start();
      startedRef.current = true;
    } catch (err) {
      console.warn("Suspense audio failed to initialize:", err);
    }
  }, []);

  const setProgress = useCallback((progress: number) => {
    if (!startedRef.current) return;
    try {
      const norm = progress / 100;
      
      // Accelerate LFO wobble as load progress completes (from 0.12Hz up to 2.2Hz)
      if (lfoRef.current) {
        lfoRef.current.frequency.rampTo(0.12 + norm * 2.05, 0.15);
      }
      
      // Open filter cutoff to make the sound brighter and more intense (from 200Hz up to 650Hz)
      if (filterRef.current) {
        filterRef.current.frequency.rampTo(200 + norm * 450, 0.15);
      }
      
      // Slowly swell the volume of the drone and noise to build climax
      if (synthRef.current) {
        synthRef.current.volume.rampTo(-20 + norm * 6, 0.15);
      }
      if (noiseRef.current) {
        noiseRef.current.volume.rampTo(-32 + norm * 7, 0.15);
      }
    } catch (err) {}
  }, []);

  const triggerTear = useCallback(async () => {
    try {
      const tone = await import("tone");
      
      // Sub-bass drop (portal tearing sound)
      const drop = new tone.MembraneSynth().toDestination();
      drop.volume.value = 2;
      drop.triggerAttackRelease("C1", "1n");
      
      // White noise burst for the crack explosion
      const burst = new tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.005, decay: 0.5, sustain: 0 },
      }).toDestination();
      burst.volume.value = -4;
      burst.triggerAttackRelease("1n");

      // Stop the suspense background drone
      if (synthRef.current) {
        synthRef.current.releaseAll();
      }
      if (noiseRef.current) {
        noiseRef.current.stop();
      }
      if (lfoRef.current) {
        lfoRef.current.stop();
      }
    } catch (err) {
      console.warn("Tear SFX failed to play:", err);
    }
  }, []);

  const stop = useCallback(() => {
    if (synthRef.current) {
      try { synthRef.current.releaseAll(); } catch {}
    }
    if (noiseRef.current) {
      try { noiseRef.current.stop(); } catch {}
    }
    if (lfoRef.current) {
      try { lfoRef.current.stop(); } catch {}
    }
    startedRef.current = false;
  }, []);

  useEffect(() => {
    // Attempt automatic start, and hook to interaction to bypass browser audio policies
    const handleInteraction = () => {
      start();
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("mousemove", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };

    window.addEventListener("click", handleInteraction);
    window.addEventListener("mousemove", handleInteraction);
    window.addEventListener("keydown", handleInteraction);

    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("mousemove", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
      stop();
    };
  }, [start, stop]);

  return { start, setProgress, triggerTear, stop };
}
```

## File: `src/hooks/useSVGTexture.ts`

```typescript
"use client";

import { useState, useEffect } from "react";
import * as THREE from "three";

/**
 * Custom hook that loads an SVG file and rasterizes it to a Canvas,
 * then creates a proper WebGL-compatible texture from it.
 * 
 * This avoids the "texSubImage2D: bad image data" and "Texture is immutable"
 * WebGL errors that occur when Three.js's TextureLoader tries to use
 * SVG images directly as WebGL textures.
 * 
 * @param svgPath - The URL path to the SVG file (e.g., "/icons/react.svg")
 * @param size - The raster resolution to render the SVG at (default: 256)
 * @returns A THREE.CanvasTexture or null while loading
 */
export function useSVGTexture(svgPath: string, size: number = 256): THREE.CanvasTexture | null {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadSVG = async () => {
      try {
        // Fetch the SVG file as text
        const response = await fetch(svgPath);
        const svgText = await response.text();

        // Create a Blob from the SVG text
        const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);

        // Create an Image element and wait for it to load
        const img = new Image();
        img.crossOrigin = "anonymous";

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = (e) => reject(e);
          img.src = url;
        });

        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }

        // Rasterize the SVG to a canvas at the target resolution
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          // Clear with transparent background
          ctx.clearRect(0, 0, size, size);
          // Draw the SVG image centered and scaled to fill the canvas
          ctx.drawImage(img, 0, 0, size, size);
        }

        // Create the Three.js texture from the rasterized canvas
        const canvasTexture = new THREE.CanvasTexture(canvas);
        canvasTexture.needsUpdate = true;
        canvasTexture.colorSpace = THREE.SRGBColorSpace;

        if (!cancelled) {
          setTexture(canvasTexture);
        }

        URL.revokeObjectURL(url);
      } catch (error) {
        console.error(`[useSVGTexture] Failed to load SVG: ${svgPath}`, error);
      }
    };

    loadSVG();

    return () => {
      cancelled = true;
      if (texture) {
        texture.dispose();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svgPath, size]);

  return texture;
}
```

## File: `src/lib/audio.ts`

```typescript
export type AmbientAudioController = {
  start: () => Promise<void>;
  stop: () => void;
  setIntensity: (progress: number) => void;
  setMuted: (muted: boolean) => void;
  dispose: () => void;
};

type ToneModule = typeof import("tone");

export function createAmbientAudio(): AmbientAudioController {
  let tone: ToneModule | null = null;
  let player: InstanceType<ToneModule["Player"]> | null = null;
  let loadingPromise: Promise<unknown> | null = null;
  let lastProgress = 0;

  const ensurePlayer = async () => {
    if (!tone) {
      tone = await import("tone");
    }

    if (!player) {
      player = new tone.Player({
        url: "/audio/ambient.mp3",
        loop: true,
        autostart: false,
        fadeIn: 1,
        fadeOut: 1,
      }).toDestination();
      player.volume.value = -16;
      loadingPromise = player.load("/audio/ambient.mp3");
    }

    return { tone, player };
  };

  return {
    start: async () => {
      const audio = await ensurePlayer();
      await audio.tone.start();
      await loadingPromise;
      if (audio.player.state !== "started") audio.player.start();
    },
    stop: () => {
      if (player?.state === "started") player.stop();
    },
    setIntensity: (progress: number) => {
      lastProgress = Math.max(0, Math.min(progress, 1));
      if (!player) return;
      player.playbackRate = 0.92 + lastProgress * 0.22;
      player.volume.rampTo(-18 + lastProgress * 5, 0.2);
    },
    setMuted: (muted: boolean) => {
      if (!player) return;
      player.volume.rampTo(muted ? -48 : -16 + lastProgress * 4, 0.4);
    },
    dispose: () => {
      player?.dispose();
      player = null;
    },
  };
}
```

## File: `src/shaders/fragment/aberration.frag`

```glsl
/*
 * Mathematical formulations for Chromatic Aberration:
 * Let I(uv) be the input texture color at coordinate uv.
 * Let d = uOffset be the displacement vector.
 * The displaced color channels are sampled as:
 *   Color_R = I(uv + d)
 *   Color_G = I(uv)
 *   Color_B = I(uv - d)
 * 
 * The combined output color is:
 *   Color_out = [Color_R.r, Color_G.g, Color_B.b, Color_G.a]
 */

uniform sampler2D tDiffuse;
uniform vec2 uOffset;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  
  // Sample red channel with positive offset, blue with negative, green centered
  float r = texture2D(tDiffuse, uv + uOffset).r;
  float g = texture2D(tDiffuse, uv).g;
  float b = texture2D(tDiffuse, uv - uOffset).b;
  float a = texture2D(tDiffuse, uv).a;
  
  gl_FragColor = vec4(r, g, b, a);
}
```

## File: `src/shaders/fragment/glow.frag`

```glsl
/*
 * Mathematical formulations for Fresnel Glow:
 * Let N be the normalized surface normal vector in view space.
 * Let V be the normalized view direction vector (from surface to camera).
 * The dot product cosine = dot(N, V) represents surface orientation relative to view.
 * The edge glow factor is modeled by:
 *   GlowIntensity = uCoefficient * pow(1.0 - max(0.0, dot(N, V)), uPower)
 * 
 * Final Color:
 *   Color_out = uColor * GlowIntensity
 */

uniform vec3 uColor;
uniform float uCoefficient;
uniform float uPower;

varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);

  // Fresnel formula: glow intensifies as surface normal becomes perpendicular to view direction
  float intensity = pow(1.0 - max(0.0, dot(normal, viewDir)), uPower) * uCoefficient;
  
  gl_FragColor = vec4(uColor * intensity, intensity);
}
```

## File: `src/shaders/fragment/nebula.frag`

```glsl
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;

varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;

  for (int i = 0; i < 5; i++) {  // Increased from 4 to 5 octaves
    value += amplitude * noise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }

  return value;
}

void main() {
  vec2 uv = vUv;
  vec2 aspectUv = vec2((uv.x - 0.5) * (uResolution.x / uResolution.y), uv.y - 0.5);

  // Much slower drift for majestic feel
  vec2 slowDrift = vec2(uTime * 0.012, -uTime * 0.006);
  float cloudA = fbm(uv * 2.8 + slowDrift);
  float cloudB = fbm(uv * 3.8 - slowDrift * 1.2 + vec2(8.2, 2.7));
  float cloudC = fbm(uv * 6.0 + vec2(-uTime * 0.008, uTime * 0.012));
  float cloudD = fbm(uv * 9.0 + vec2(uTime * 0.004, -uTime * 0.008)); // Extra detail layer

  // Upper mask — allow more fog to show
  float upperMask = smoothstep(0.12, 0.65, uv.y);
  float horizonMask = smoothstep(0.06, 0.35, uv.y);

  // Galaxy swirl — positioned upper right like reference
  vec2 galaxyCenter = vec2(0.72, 0.68);
  vec2 galaxyVector = uv - galaxyCenter;
  float galaxyRadius = length(galaxyVector);
  float galaxyAngle = atan(galaxyVector.y, galaxyVector.x);
  float spiral = 0.5 + 0.5 * cos(galaxyAngle * 4.0 - 12.0 * galaxyRadius + uTime * 0.12);
  float galaxyCore = exp(-galaxyRadius * galaxyRadius * 55.0);
  float galaxyArms = exp(-galaxyRadius * galaxyRadius * 12.0) * pow(spiral, 2.5);

  // Data stream lines on left (like reference image)
  float streamLines = smoothstep(0.48, 0.52, sin(uv.y * 40.0 + uTime * 0.3)) * 
                      smoothstep(0.0, 0.25, uv.x) * 
                      smoothstep(1.0, 0.7, uv.x) * 0.5;

  // Fog density — MUCH denser than before
  float fogShape = pow(cloudA, 2.8) * 0.7 + pow(cloudB, 3.2) * 0.8 + 
                   pow(cloudC, 4.5) * 0.5 + pow(cloudD, 5.0) * 0.3;
  fogShape *= upperMask * horizonMask;

  // RICH RED COLOR PALETTE (matching reference)
  // Deep crimson core
  vec3 crimsonCore = vec3(0.95, 0.02, 0.08) * pow(cloudA, 2.5) * 0.35;
  // Burgundy mid-tones  
  vec3 burgundyMid = vec3(0.55, 0.0, 0.04) * pow(cloudB, 3.0) * 0.28;
  // Dark wine shadows
  vec3 wineShadow = vec3(0.25, 0.0, 0.02) * pow(cloudC, 4.0) * 0.18;
  // Bright red highlights
  vec3 redHighlight = vec3(1.0, 0.08, 0.15) * galaxyArms * 0.45;
  // Hot pink core glow
  vec3 pinkCore = vec3(1.0, 0.15, 0.35) * galaxyCore * 0.55;
  // Data stream glow
  vec3 streamGlow = vec3(0.9, 0.05, 0.12) * streamLines * 0.25;
  
  // Horizon glow — red sunset feel
  float horizonGlow = exp(-pow(uv.y - 0.18, 2.0) * 45.0);
  vec3 horizonColor = vec3(0.85, 0.02, 0.06) * horizonGlow * 0.12 + 
                      vec3(0.4, 0.0, 0.02) * horizonGlow * 0.06;

  vec3 color = crimsonCore + burgundyMid + wineShadow + redHighlight + pinkCore + streamGlow + horizonColor;
  
  // Boost overall brightness
  color = clamp(color, 0.0, 1.8);

  // Alpha — much more visible
  float alpha = clamp(fogShape * 0.35 + galaxyCore * 0.25 + galaxyArms * 0.18 + 
                      horizonGlow * 0.12 + streamLines * 0.08, 0.0, 0.55);
  alpha *= smoothstep(0.01, 0.12, uv.y);

  gl_FragColor = vec4(color, alpha);
}
```

## File: `src/shaders/fragment/rings.frag`

```glsl
/*
 * Mathematical formulations for Rings Fragment Shader:
 * 
 * 1. Normalized Radial Distance:
 *    Let P = vUv - vec2(0.5, 0.5) be the UV offset from the center.
 *    r = length(P)
 * 
 * 2. Concentric Wave Function:
 *    Let K = 45.0 be the wave density.
 *    Let omega = 4.0 be the wave speed.
 *    wave = sin(r * K - uTime * omega)
 * 
 * 3. Thin Neon Ring Mask:
 *    ringMask = smoothstep(0.85, 0.98, wave)
 * 
 * 4. Radial Fade (Distance Decay):
 *    fade = max(0.0, 1.0 - (r * 2.2))
 */

uniform float uTime;
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vec2 uv = vUv;
  
  // Calculate distance from center (UV coordinate range is [0, 1])
  vec2 center = uv - vec2(0.5, 0.5);
  float r = length(center);
  
  // Spatial wave density and expansion speed create many tight neon rings.
  float wave = sin(r * 70.0 - uTime * 5.0);
  
  // Create thin, sharp rings instead of broad sine waves
  float ringMask = smoothstep(0.9, 0.995, wave);
  
  // Fades out rings as they expand outward
  float fade = max(0.0, 1.0 - (r * 1.55));
  
  // Cyberpunk colors: Crimson at the center, shifting to burgundy on edges
  vec3 innerColor = vec3(1.0, 0.09, 0.27); // Crimson
  vec3 outerColor = vec3(0.50, 0.0, 0.06); // Burgundy
  vec3 ringColor = mix(innerColor, outerColor, r * 2.0);
  
  // Apply mask, fade, and increase brightness for bloom
  float coreGlow = exp(-r * 4.5) * 0.18;
  vec4 finalColor = vec4(ringColor, ringMask * fade * 0.42 + coreGlow * 0.62);
  
  // Discard completely transparent pixels to save fillrate
  if (finalColor.a < 0.01) {
    discard;
  }
  
  gl_FragColor = finalColor;
}
```

## File: `src/shaders/fragment/stars.frag`

```glsl
/*
 * Mathematical formulations for Starfield Fragment Shader:
 * 
 * 1. Twinkling Intensity:
 *    Let T_f = 2.0 + vRandom * 3.0 be the frequency.
 *    Let T_o = vRandom * 100.0 be the phase offset.
 *    TwinkleIntensity = mix(uMinBrightness, 1.0, sin(time * T_f + T_o) * 0.5 + 0.5)
 * 
 * 2. Point Sprite Circular Masking (SDF):
 *    Let C = gl_PointCoord be the local coordinate of the point sprite, C in [0,1]x[0,1].
 *    Let d = length(C - vec2(0.5, 0.5)) be the distance from center.
 *    CircularMask = smoothstep(0.5, 0.2, d)  // Creates soft glowing edge
 */

uniform float uTime;

varying float vRandom;
varying vec3 vViewPosition;

void main() {
  // Compute distance from center of point sprite to draw a circle
  vec2 center = gl_PointCoord - vec2(0.5, 0.5);
  float dist = length(center);
  
  // Discard fragments outside the radius of the star particle
  if (dist > 0.5) {
    discard;
  }

  // Soft circular glow mask
  float glow = smoothstep(0.5, 0.0, dist);

  // Twinkling sine wave based on the random value per particle
  float twinkleFreq = 1.5 + vRandom * 3.5;
  float twinklePhase = vRandom * 62.8; // 20 * PI
  float twinkle = sin(uTime * twinkleFreq + twinklePhase) * 0.5 + 0.5;
  
  // Mix twinkle to adjust minimum brightness (stars never fully disappear)
  float brightness = mix(0.15, 1.0, twinkle);

  // Core color is electric-blue-white
  vec3 starColor = vec3(0.9, 0.95, 1.0);
  
  // Apply twinkle and circular glow mask
  gl_FragColor = vec4(starColor, brightness * glow);
}
```

## File: `src/shaders/vertex/morph.vert`

```glsl
/*
 * Mathematical formulations for Vertex Wave Morphing:
 * Let P_model = [x, y, z]^T be the input vertex position.
 * Let N be the vertex normal.
 * We offset the vertex along its normal using a wave function:
 *   Displacement = sin(P_model.y * uFrequency + uTime * uSpeed) * cos(P_model.x * uFrequency) * uAmplitude
 *   P_morphed = P_model + N * Displacement
 * 
 * The morphed vertex is then projected as:
 *   gl_Position = projectionMatrix * modelViewMatrix * vec4(P_morphed, 1.0)
 */

uniform float uTime;
uniform float uSpeed;
uniform float uFrequency;
uniform float uAmplitude;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec2 vUv;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vUv = uv;

  // Calculate procedural wave displacement
  float displacement = sin(position.y * uFrequency + uTime * uSpeed) * 
                       cos(position.x * uFrequency) * 
                       uAmplitude;
  
  // Displace vertex along its normal vector
  vec3 morphedPosition = position + normal * displacement;

  vec4 mvPosition = modelViewMatrix * vec4(morphedPosition, 1.0);
  vViewPosition = mvPosition.xyz;
  
  gl_Position = projectionMatrix * mvPosition;
}
```

## File: `src/shaders/vertex/nebula.vert`

```glsl
/*
 * Mathematical formulations for vertex projection:
 * Let P_model be the 3D model coordinate of a vertex: P_model = [x, y, z, 1]^T
 * Let M_modelview be the model-view transformation matrix.
 * Let M_proj be the camera projection matrix.
 * The projected homogeneous coordinate P_clip is given by:
 *   P_clip = M_proj * M_modelview * P_model
 * 
 * Texture coordinates UV map:
 *   vUv = uv
 */

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

## File: `src/shaders/vertex/rings.vert`

```glsl
/*
 * Mathematical formulations for Rings Vertex Shader:
 * 
 * 1. Vertex Projection:
 *    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0)
 * 
 * 2. UV Interpolation:
 *    vUv = uv
 */

varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vUv = uv;
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

## File: `src/shaders/vertex/stars.vert`

```glsl
uniform float uSize;
attribute float aRandom;

varying float vRandom;
varying vec3 vViewPosition;

void main() {
  vRandom = aRandom;
  
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = mvPosition.xyz;
  
  gl_Position = projectionMatrix * mvPosition;
  
  gl_PointSize = min(uSize * (300.0 / -mvPosition.z), 3.0);
}
```

## File: `src/types/css.d.ts`

```typescript
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.scss' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.sass' {
  const content: { [className: string]: string };
  export default content;
}
```

## File: `src/types/index.ts`

```typescript
declare module '*.vert' {
  const content: string;
  export default content;
}

declare module '*.frag' {
  const content: string;
  export default content;
}

declare module '*.glsl' {
  const content: string;
  export default content;
}
declare module '*.tsx' {
  const content: any;
  export default content;
}
```

## File: `src/utils/constants.ts`

```typescript
export const PROFILE = {
  name: "Poshan MS",
  title: "Full Stack Engineer",
  location: "Karnataka, India",
  status: "Available for work / freelance",
  email: "siddeshwaraprasanna5@gmail.com",
  github: "https://github.com/POSHANMS",
  linkedin: "https://linkedin.com/in/poshanms/",
};

export const STATS = [
  { value: "2+", label: "Years Experience" },
  { value: "20+", label: "Projects Completed" },
  { value: "10K+", label: "Lines of Code" },
  { value: "24/7", label: "Coffee Fueled" },
];

export const PROJECTS = [
  {
    name: "FindIt",
    subtitle: "Campus Lost & Found Portal",
    stack: ["React", "Flask", "PostgreSQL", "Redis", "Socket.io", "JWT", "Docker", "Cloudinary"],
    liveLabel: "Deployed on Vercel",
    href: "",
    description:
      "Built solo in 2 weeks with real-time notifications, image upload, JWT authentication, Docker containerization, and Cloudinary media handling.",
  },
  {
    name: "NoteFlash",
    subtitle: "Flask + MySQL Notes App",
    stack: ["Flask", "MySQL", "Railway"],
    liveLabel: "noteflash.up.railway.app",
    href: "https://noteflash.up.railway.app",
    description:
      "Deployed on Railway with a custom subdomain and a focused note management system.",
  },
  {
    name: "SocialWave",
    subtitle: "Mini Social Media App",
    stack: ["MongoDB", "Express", "React", "Node.js", "JWT", "Cloudinary", "MongoDB Atlas"],
    liveLabel: "",
    href: "",
    description:
      "Full MERN stack social app with auth routes, post likes, comments, pagination, and Cloudinary image upload.",
  },
];

export const SKILL_GROUPS = [
  ["Languages", ["Python", "JavaScript", "TypeScript", "Java", "C", "C++", "SQL"]],
  ["Frontend", ["React (18)", "Next.js", "HTML5", "CSS3", "Tailwind CSS", "Bootstrap 5", "Vite", "Framer Motion", "Leaflet.js"]],
  ["Backend", ["Flask", "SQLAlchemy", "Node.js", "Express", "Spring Boot"]],
  ["Databases", ["PostgreSQL", "MongoDB", "MySQL", "SQLite3", "Redis"]],
  ["Realtime/Auth", ["Socket.io", "WebSockets", "JWT"]],
  ["AI / ML", ["Flask-based ML integration (HealthGPT)", "Scikit-learn", "Naive Bayes", "Decision Tree", "Model training & evaluation", "Binance Futures API / algorithmic trading bot"]],
  ["Mobile", ["Android (WebView-based apps)"]],
  ["DevOps/Tools", ["Docker", "Git", "GitHub", "VS Code"]],
  ["Cloud/Hosting", ["Vercel", "Railway", "Render", "Cloudinary"]],
  ["Cybersecurity", ["Log analysis", "Vulnerability assessment", "Ethical hacking fundamentals (TryHackMe)"]],
  ["Core Concepts", ["DSA", "OOP", "REST APIs", "DBMS", "Operating Systems", "Computer Networks"]],
  ["Operating Systems", ["Windows", "Linux (Ubuntu, Kali Linux)"]],
] as const;
```

## File: `src/utils/helpers.ts`

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## File: `src/workers/physics.worker.ts`

```typescript
export type PhysicsWorkerMessage = {
  type: "hover-bounce";
  id: string;
  impulse: [number, number, number];
};

self.onmessage = (event: MessageEvent<PhysicsWorkerMessage>) => {
  if (event.data.type === "hover-bounce") {
    self.postMessage({
      type: "hover-bounce-result",
      id: event.data.id,
      impulse: event.data.impulse,
      timestamp: performance.now(),
    });
  }
};
```

## File: `scratch/bake_laptop.js`

```javascript
module.paths.push('c:/Users/poshan m s/Documents/A LEARNING/Portfolio/node_modules');

const { NodeIO } = require('@gltf-transform/core');
const { KHRDracoMeshCompression } = require('@gltf-transform/extensions');
const draco3d = require('draco3d');
const path = require('path');
const fs = require('fs');

const inputGlbPath = path.resolve('c:/Users/poshan m s/Documents/A LEARNING/Portfolio/public/models/laptop.glb');
const outputGlbPath = path.resolve('c:/Users/poshan m s/Documents/A LEARNING/Portfolio/public/models/laptop-baked.glb');
const texturePath = path.resolve('c:/Users/poshan m s/Documents/A LEARNING/Portfolio/public/textures/vscode-screen.png');

console.log('Input GLB:', inputGlbPath);
console.log('Output GLB:', outputGlbPath);
console.log('Texture PNG:', texturePath);

async function main() {
  if (!fs.existsSync(texturePath)) {
    throw new Error(`Texture not found at: ${texturePath}`);
  }

  const io = new NodeIO()
    .registerExtensions([KHRDracoMeshCompression])
    .registerDependencies({
      'draco3d.decoder': await draco3d.createDecoderModule(),
      'draco3d.encoder': await draco3d.createEncoderModule(),
    });
  
  const document = await io.read(inputGlbPath);
  const root = document.getRoot();

  // Find Material.004
  const materials = root.listMaterials();
  const screenMaterial = materials.find(m => m.getName() === 'Material.004');
  
  if (!screenMaterial) {
    throw new Error('Screen material "Material.004" not found in the GLB!');
  }
  
  console.log(`Found material: "${screenMaterial.getName()}"`);

  // Load the new PNG texture
  const textureData = fs.readFileSync(texturePath);
  const screenTexture = document.createTexture('vscode-screen')
    .setImage(textureData)
    .setMimeType('image/png');

  // Assign baseColorTexture
  screenMaterial.setBaseColorTexture(screenTexture);
  console.log('Assigned vscode-screen.png to baseColorTexture');

  // Assign emissiveTexture with glow factor 0.38
  screenMaterial.setEmissiveTexture(screenTexture);
  screenMaterial.setEmissiveFactor([0.38, 0.38, 0.38]);
  console.log('Assigned vscode-screen.png to emissiveTexture with factor 0.38');

  // Write out the modified GLB
  console.log('Writing output GLB...');
  await io.write(outputGlbPath, document);
  console.log('Success! Baked laptop saved to:', outputGlbPath);
}

main().catch(console.error);
```

## File: `scratch/calculate_world_bounds.js`

```javascript
module.paths.push('c:/Users/poshan m s/Documents/A LEARNING/Portfolio/node_modules');

const THREE = require('three');
const { NodeIO } = require('@gltf-transform/core');
const { KHRDracoMeshCompression } = require('@gltf-transform/extensions');
const draco3d = require('draco3d');
const path = require('path');

const glbPath = path.resolve('c:/Users/poshan m s/Documents/A LEARNING/Portfolio/public/models/laptop.glb');

async function main() {
  const io = new NodeIO()
    .registerExtensions([KHRDracoMeshCompression])
    .registerDependencies({
      'draco3d.decoder': await draco3d.createDecoderModule(),
      'draco3d.encoder': await draco3d.createEncoderModule(),
    });
  
  const document = await io.read(glbPath);
  const root = document.getRoot();
  
  // We will build a Three.js scene structure from the glTF nodes to compute the world matrices
  const scene = new THREE.Scene();
  const threeNodes = new Map(); // node ID -> THREE.Object3D or THREE.Mesh

  const gltfNodes = root.listNodes();
  
  // First pass: create all Three.js nodes with local transforms
  for (const node of gltfNodes) {
    let obj;
    const mesh = node.getMesh();
    if (mesh) {
      // Create a mesh with a dummy geometry so Box3 can compute its bounds
      // We will fill the geometry with vertices transformed by the world matrix later,
      // or we can just attach the local positions to the geometry.
      const geometry = new THREE.BufferGeometry();
      
      // Accumulate all primitive positions
      const positions = [];
      const uvs = [];
      for (const prim of mesh.listPrimitives()) {
        const posAcc = prim.getAttribute('POSITION');
        const uvAcc = prim.getAttribute('TEXCOORD_0');
        if (posAcc) {
          const arr = posAcc.getArray();
          for (let i = 0; i < arr.length; i++) {
            positions.push(arr[i]);
          }
          if (uvAcc) {
            const uvArr = uvAcc.getArray();
            for (let i = 0; i < uvArr.length; i++) {
              uvs.push(uvArr[i]);
            }
          } else {
            // Fill with dummy UVs if missing
            for (let i = 0; i < (arr.length / 3) * 2; i++) {
              uvs.push(0);
            }
          }
        }
      }
      
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      obj = new THREE.Mesh(geometry);
    } else {
      obj = new THREE.Group();
    }
    
    obj.name = node.getName();
    
    // Set local transform
    const t = node.getTranslation();
    const r = node.getRotation();
    const s = node.getScale();
    
    if (t) obj.position.set(t[0], t[1], t[2]);
    if (r) obj.quaternion.set(r[0], r[1], r[2], r[3]);
    if (s) obj.scale.set(s[0], s[1], s[2]);
    
    threeNodes.set(node, obj);
  }
  
  // Second pass: build parent-child hierarchy
  for (const node of gltfNodes) {
    const obj = threeNodes.get(node);
    const children = node.listChildren();
    for (const childNode of children) {
      const childObj = threeNodes.get(childNode);
      if (childObj) {
        obj.add(childObj);
      }
    }
  }
  
  // Add root nodes (nodes without parents) to the scene
  const scenes = root.listScenes();
  const activeScene = scenes[0] || root.listScenes()[0];
  if (activeScene) {
    for (const node of activeScene.listChildren()) {
      const obj = threeNodes.get(node);
      if (obj) {
        scene.add(obj);
      }
    }
  }
  
  // Update world matrices
  scene.updateMatrixWorld(true);
  
  console.log('\n--- Three.js Traversal, Bounding Boxes, and Scores ---');
  const screenCandidates = [];

  scene.traverse((child) => {
    if (!child.isMesh) return;

    // Calculate bounding box in world space (relative to glTF root)
    const bounds = new THREE.Box3().setFromObject(child);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    bounds.getSize(size);
    bounds.getCenter(center);

    const flatness = size.z / Math.max(size.x, size.y, 0.0001);
    const score = size.x * size.y * 1.4 - size.z * 8 + center.y * 2.5 - flatness * 12;

    const satisfiesCondition = center.y > 0.15 && size.x > 0.2 && size.y > 0.12;

    console.log(`\nNode / Mesh: "${child.name}"`);
    console.log(`  Size: x=${size.x.toFixed(4)}, y=${size.y.toFixed(4)}, z=${size.z.toFixed(4)}`);
    console.log(`  Center: x=${center.x.toFixed(4)}, y=${center.y.toFixed(4)}, z=${center.z.toFixed(4)}`);
    console.log(`  Flatness: ${flatness.toFixed(4)}, Score: ${score.toFixed(4)}`);
    console.log(`  Satisfies Condition: ${satisfiesCondition}`);

    // Find the corresponding glTF mesh to get texture/UV details
    const gltfNode = gltfNodes.find(n => n.getName() === child.name);
    const gltfMesh = gltfNode ? gltfNode.getMesh() : null;
    const prim = gltfMesh ? gltfMesh.listPrimitives()[0] : null;
    const materialName = prim && prim.getMaterial() ? prim.getMaterial().getName() : 'none';
    const hasBaseColorTexture = prim && prim.getMaterial() && !!prim.getMaterial().getBaseColorTexture();
    const hasUvs = prim && !!prim.getAttribute('TEXCOORD_0');

    if (satisfiesCondition) {
      screenCandidates.push({
        name: child.name,
        score: score,
        material: materialName,
        hasTexture: hasBaseColorTexture,
        hasUvs: hasUvs,
        mesh: child,
        gltfMesh: gltfMesh
      });
    }
  });

  console.log('\n--- Screen Mesh Candidates (Sorted by Score) ---');
  screenCandidates.sort((a, b) => b.score - a.score);
  for (const c of screenCandidates) {
    console.log(`Candidate Name: "${c.name}"`);
    console.log(`  Score: ${c.score.toFixed(4)}`);
    console.log(`  Material: "${c.material}"`);
    console.log(`  Has BaseColorTexture: ${c.hasTexture}`);
    console.log(`  Has UVs (TEXCOORD_0) in glTF: ${c.hasUvs}`);
    
    // Let's compute physical aspect ratio from the world geometry vertices!
    // We can get the world positions of the quad corners
    const geometry = c.mesh.geometry;
    const posAttr = geometry.getAttribute('position');
    const uvAttr = geometry.getAttribute('uv');
    
    if (posAttr && uvAttr) {
      const posArr = posAttr.array;
      const uvArr = uvAttr.array;
      
      // Let's find corners in UV space from world positions
      let c00 = null, c10 = null, c11 = null, c01 = null;
      let d00 = Infinity, d10 = Infinity, d11 = Infinity, d01 = Infinity;

      for (let i = 0; i < posArr.length / 3; i++) {
        const localPt = new THREE.Vector3(posArr[i * 3], posArr[i * 3 + 1], posArr[i * 3 + 2]);
        // Transform local point to world space
        const worldPt = localPt.applyMatrix4(c.mesh.matrixWorld);
        const u = uvArr[i * 2];
        const v = uvArr[i * 2 + 1];

        const dist00 = Math.hypot(u - 0, v - 0);
        const dist10 = Math.hypot(u - 1, v - 0);
        const dist11 = Math.hypot(u - 1, v - 1);
        const dist01 = Math.hypot(u - 0, v - 1);

        if (dist00 < d00) { d00 = dist00; c00 = worldPt; }
        if (dist10 < d10) { d10 = dist10; c10 = worldPt; }
        if (dist11 < d11) { d11 = dist11; c11 = worldPt; }
        if (dist01 < d01) { d01 = dist01; c01 = worldPt; }
      }

      if (c00 && c10 && c11 && c01) {
        const width1 = c00.distanceTo(c10);
        const width2 = c01.distanceTo(c11);
        const physicalWidth = (width1 + width2) / 2;

        const height1 = c00.distanceTo(c01);
        const height2 = c10.distanceTo(c11);
        const physicalHeight = (height1 + height2) / 2;

        console.log(`  World Screen Dimensions: Width=${physicalWidth.toFixed(4)}, Height=${physicalHeight.toFixed(4)}`);
        console.log(`  World Screen Aspect Ratio (Width/Height): ${(physicalWidth / physicalHeight).toFixed(4)}`);
      }
    }
  }
}

main().catch(console.error);
```

## File: `scratch/check-font-tools.js`

```javascript
// Script: convert-font.js
// Converts a Google Fonts .ttf to Three.js typeface.json using opentype.js
// Usage: node convert-font.js <path-to.ttf> <output.json>

module.paths.push('c:/Users/poshan m s/Documents/A LEARNING/Portfolio/node_modules');

const fs = require('fs');
const path = require('path');

// Check opentype.js availability
let opentype;
try {
  opentype = require('opentype.js');
  console.log('opentype.js found in node_modules');
} catch (e) {
  console.log('opentype.js NOT found:', e.message);
}

// Check if facetype CLI exists
const faceTypePaths = [
  'node_modules/.bin/facetype',
  'node_modules/facetype.js/index.js',
  'node_modules/facetype/index.js',
];

for (const p of faceTypePaths) {
  const full = path.resolve('c:/Users/poshan m s/Documents/A LEARNING/Portfolio', p);
  if (fs.existsSync(full)) {
    console.log('Found facetype at:', full);
  } else {
    console.log('Not found:', full);
  }
}
```

## File: `scratch/check_lockfile.js`

```javascript
const fs = require('fs');
const semver = require('semver');

const lockfilePath = 'c:/Users/poshan m s/Documents/A LEARNING/Portfolio/package-lock.json';

if (!fs.existsSync(lockfilePath)) {
  console.log('package-lock.json does not exist!');
  process.exit(1);
}

try {
  const lock = JSON.parse(fs.readFileSync(lockfilePath, 'utf8'));
  console.log('Parsed package-lock.json successfully.');
  
  if (lock.packages) {
    for (const [name, pkg] of Object.entries(lock.packages)) {
      if (pkg.version) {
        if (!semver.valid(pkg.version)) {
          console.log(`Invalid version in packages["${name}"]: "${pkg.version}"`);
        }
      }
    }
  }
  
  if (lock.dependencies) {
    for (const [name, pkg] of Object.entries(lock.dependencies)) {
      if (pkg.version) {
        if (!semver.valid(pkg.version)) {
          console.log(`Invalid version in dependencies["${name}"]: "${pkg.version}"`);
        }
      }
    }
  }
  
  console.log('Finished scanning package-lock.json.');
} catch (e) {
  console.error('Failed to read or parse package-lock.json:', e);
}
```

## File: `scratch/convert-ttf-to-typeface.js`

```javascript
/**
 * convert-ttf-to-typeface.js
 * 
 * Converts a TTF/OTF font to Three.js typeface.json format using opentype.js.
 * Equivalent to what facetype.js produces online.
 * 
 * Usage: node convert-ttf-to-typeface.js
 */

// Use global opentype.js
const GLOBAL_NM = 'C:/Users/poshan m s/AppData/Roaming/npm/node_modules';
const opentype = require(GLOBAL_NM + '/opentype.js/dist/opentype.js');
const fs = require('fs');
const path = require('path');

const TTF_PATH = path.resolve('c:/Users/poshan m s/Documents/A LEARNING/Portfolio/public/fonts/Poppins-Black.ttf');
const OUT_PATH = path.resolve('c:/Users/poshan m s/Documents/A LEARNING/Portfolio/public/fonts/poppins-black.typeface.json');

// Characters we need for "POSHAN MS" (+ common punctuation for fallback)
const CHARS = ' ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?-_';

function convertPathToFacetype(path, unitsPerEm) {
  /**
   * Convert opentype.js Path to facetype.js "o" string format.
   * Three.js uses a compact space-separated command string:
   *   m x y   = moveTo
   *   l x y   = lineTo
   *   q cx cy x y  = quadraticCurveTo
   *   b cx1 cy1 cx2 cy2 x y = bezierCurveTo
   *   z        = closePath
   * 
   * All Y coordinates are FLIPPED (Three.js uses Y-up) and scaled to resolution.
   */
  const scale = 1000 / unitsPerEm;
  const cmds = [];

  for (const cmd of path.commands) {
    if (cmd.type === 'M') {
      cmds.push(`m ${round(cmd.x * scale)} ${round(-cmd.y * scale)}`);
    } else if (cmd.type === 'L') {
      cmds.push(`l ${round(cmd.x * scale)} ${round(-cmd.y * scale)}`);
    } else if (cmd.type === 'Q') {
      cmds.push(`q ${round(cmd.x1 * scale)} ${round(-cmd.y1 * scale)} ${round(cmd.x * scale)} ${round(-cmd.y * scale)}`);
    } else if (cmd.type === 'C') {
      cmds.push(`b ${round(cmd.x1 * scale)} ${round(-cmd.y1 * scale)} ${round(cmd.x2 * scale)} ${round(-cmd.y2 * scale)} ${round(cmd.x * scale)} ${round(-cmd.y * scale)}`);
    } else if (cmd.type === 'Z') {
      cmds.push('z');
    }
  }

  return cmds.join(' ');
}

function round(n) {
  return Math.round(n * 100) / 100;
}

console.log('Loading TTF:', TTF_PATH);
const buf = fs.readFileSync(TTF_PATH);
// opentype.js v1+ uses parse() on an ArrayBuffer
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
const font = opentype.parse(ab);
const n = font.names.windows || font.names;
console.log(`Font loaded: ${(n.fullName || n.fontFamily || {en:'Poppins'}).en}, unitsPerEm: ${font.unitsPerEm}`);

const scale = 1000 / font.unitsPerEm;
const glyphs = {};

for (const char of CHARS) {
  const glyph = font.charToGlyph(char);
  if (!glyph) continue;

  const glyphPath = glyph.getPath(0, 0, font.unitsPerEm);
  const ha = glyph.advanceWidth ? Math.round(glyph.advanceWidth * scale) : 0;
  
  let xMin = 0, xMax = 0, yMin = 0, yMax = 0;
  if (glyph.xMin !== undefined) {
    xMin = Math.round(glyph.xMin * scale);
    xMax = Math.round(glyph.xMax * scale);
    yMin = Math.round(glyph.yMin * scale);
    yMax = Math.round(glyph.yMax * scale);
  }

  const o = convertPathToFacetype(glyphPath, font.unitsPerEm);

  glyphs[char] = {
    x_min: xMin,
    x_max: xMax,
    ha: ha,
    o: o
  };
}

// Also add space glyph explicitly
const spaceGlyph = font.charToGlyph(' ');
const spaceHa = spaceGlyph && spaceGlyph.advanceWidth
  ? Math.round(spaceGlyph.advanceWidth * scale)
  : 300;
glyphs[' '] = { x_min: 0, x_max: 0, ha: spaceHa, o: '' };

const bb = font.tables.head;
const ascender = Math.round((font.tables.os2.sTypoAscender || font.ascender) * scale);
const descender = Math.round((font.tables.os2.sTypoDescender || font.descender) * scale);

const typefaceJson = {
  glyphs,
  familyName: (n.fontFamily || {en: 'Poppins'}).en || 'Poppins',
  ascender,
  descender,
  underlinePosition: font.tables.post ? Math.round(font.tables.post.underlinePosition * scale) : -100,
  underlineThickness: font.tables.post ? Math.round(font.tables.post.underlineThickness * scale) : 50,
  boundingBox: {
    yMin: Math.round((bb.yMin || -500) * scale),
    xMin: Math.round((bb.xMin || -200) * scale),
    yMax: Math.round((bb.yMax || 1200) * scale),
    xMax: Math.round((bb.xMax || 1500) * scale),
  },
  resolution: 1000,
  original_font_information: {
    format: 0,
    copyright: (n.copyright || {en: ''}).en || '',
    fontFamily: (n.fontFamily || {en: ''}).en || '',
    fontSubfamily: (n.fontSubfamily || {en: ''}).en || '',
    fullName: (n.fullName || {en: 'Poppins Black'}).en || '',
    version: (n.version || {en: ''}).en || '',
  }
};

const json = JSON.stringify(typefaceJson);
fs.writeFileSync(OUT_PATH, json, 'utf8');

const stats = fs.statSync(OUT_PATH);
console.log(`\nOutput written to: ${OUT_PATH}`);
console.log(`File size: ${(stats.size / 1024).toFixed(1)} KB`);
console.log(`Glyphs converted: ${Object.keys(glyphs).length}`);
console.log(`ascender: ${ascender}, descender: ${descender}`);
console.log('Done!');
```

## File: `scratch/find_draco.js`

```javascript
const fs = require('fs');
const path = require('path');

const nodeModulesPath = 'c:/Users/poshan m s/Documents/A LEARNING/Portfolio/node_modules';

function findDraco(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    let stat;
    try { stat = fs.statSync(fullPath); } catch (e) { continue; }
    if (stat.isDirectory()) {
      if (file.toLowerCase().includes('draco')) {
        console.log('Found Draco folder:', fullPath);
      }
      findDraco(fullPath);
    }
  }
}

console.log('Searching for "draco" in node_modules...');
findDraco(nodeModulesPath);
console.log('Done searching.');
```

## File: `scratch/find_invalid_version.js`

```javascript
const fs = require('fs');
const path = require('path');
const semver = require('semver');

const nodeModulesPath = 'c:/Users/poshan m s/Documents/A LEARNING/Portfolio/node_modules';

function scan(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (file === 'node_modules') continue;
    
    let stat;
    try {
      stat = fs.statSync(fullPath);
    } catch (e) {
      continue;
    }
    
    if (stat.isDirectory()) {
      const pkgPath = path.join(fullPath, 'package.json');
      if (fs.existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
          if (pkg.name) {
            const version = pkg.version;
            if (!version) {
              console.log(`Missing version in ${pkgPath} (Name: ${pkg.name})`);
            } else if (!semver.valid(version)) {
              console.log(`Invalid version in ${pkgPath}: "${version}" (Name: ${pkg.name})`);
            }
          }
        } catch (e) {
          console.log(`Failed to parse ${pkgPath}:`, e.message);
        }
      }
      
      // Recurse under scoped directory or if it's a directory
      if (file.startsWith('@') || !fs.existsSync(path.join(fullPath, 'package.json'))) {
        scan(fullPath);
      }
    }
  }
}

console.log('Scanning node_modules for invalid versions...');
scan(nodeModulesPath);
console.log('Done scanning.');
```

## File: `scratch/inspect_gltf_uvs.js`

```javascript
module.paths.push('c:/Users/poshan m s/Documents/A LEARNING/Portfolio/node_modules');

const { NodeIO } = require('@gltf-transform/core');
const { KHRDracoMeshCompression } = require('@gltf-transform/extensions');
const draco3d = require('draco3d');
const path = require('path');

const glbPath = path.resolve('c:/Users/poshan m s/Documents/A LEARNING/Portfolio/public/models/laptop.glb');

async function main() {
  const io = new NodeIO()
    .registerExtensions([KHRDracoMeshCompression])
    .registerDependencies({
      'draco3d.decoder': await draco3d.createDecoderModule(),
      'draco3d.encoder': await draco3d.createEncoderModule(),
    });
  
  const document = await io.read(glbPath);
  const root = document.getRoot();
  const meshes = root.listMeshes();

  const screenMesh = meshes.find(m => m.getName() === 'Object_7');
  if (!screenMesh) {
    console.error('Could not find Object_7 mesh!');
    return;
  }

  const prim = screenMesh.listPrimitives()[0];
  if (!prim) {
    console.error('Mesh has no primitives!');
    return;
  }

  console.log('List of attributes for Object_7:');
  const semantics = prim.listSemantics();
  for (const sem of semantics) {
    const acc = prim.getAttribute(sem);
    console.log(`  Semantics: "${sem}" -> Accessor Name: "${acc ? acc.getName() : 'none'}"`);
  }
}

main().catch(console.error);
```

## File: `scratch/inspect_laptop.js`

```javascript
module.paths.push('c:/Users/poshan m s/Documents/A LEARNING/Portfolio/node_modules');

const { NodeIO } = require('@gltf-transform/core');
const { KHRDracoMeshCompression } = require('@gltf-transform/extensions');
const draco3d = require('draco3d');
const path = require('path');

const glbPath = path.resolve('c:/Users/poshan m s/Documents/A LEARNING/Portfolio/public/models/laptop.glb');

async function main() {
  const io = new NodeIO()
    .registerExtensions([KHRDracoMeshCompression])
    .registerDependencies({
      'draco3d.decoder': await draco3d.createDecoderModule(),
      'draco3d.encoder': await draco3d.createEncoderModule(),
    });
  
  const document = await io.read(glbPath);
  const root = document.getRoot();
  const meshes = root.listMeshes();

  console.log('\n--- Bounding Boxes and Scores ---');
  const candidates = [];

  for (const mesh of meshes) {
    const prims = mesh.listPrimitives();
    if (prims.length === 0) continue;

    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (const prim of prims) {
      const positionAccessor = prim.getAttribute('POSITION');
      if (positionAccessor) {
        const arr = positionAccessor.getArray();
        if (arr) {
          for (let i = 0; i < arr.length; i += 3) {
            const x = arr[i];
            const y = arr[i + 1];
            const z = arr[i + 2];
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (z < minZ) minZ = z;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
            if (z > maxZ) maxZ = z;
          }
        }
      }
    }

    if (minX === Infinity) continue;

    const size = {
      x: maxX - minX,
      y: maxY - minY,
      z: maxZ - minZ
    };

    const center = {
      x: (maxX + minX) / 2,
      y: (maxY + minY) / 2,
      z: (maxZ + minZ) / 2
    };

    const flatness = size.z / Math.max(size.x, size.y, 0.0001);
    const score = size.x * size.y * 1.4 - size.z * 8 + center.y * 2.5 - flatness * 12;

    const satisfiesCondition = center.y > 0.15 && size.x > 0.2 && size.y > 0.12;

    console.log(`\nMesh: "${mesh.getName()}"`);
    console.log(`  Size: x=${size.x.toFixed(4)}, y=${size.y.toFixed(4)}, z=${size.z.toFixed(4)}`);
    console.log(`  Center: x=${center.x.toFixed(4)}, y=${center.y.toFixed(4)}, z=${center.z.toFixed(4)}`);
    console.log(`  Flatness: ${flatness.toFixed(4)}, Score: ${score.toFixed(4)}`);
    console.log(`  Satisfies Condition: ${satisfiesCondition}`);

    const materialName = prims[0].getMaterial() ? prims[0].getMaterial().getName() : 'none';
    const hasBaseColorTexture = prims[0].getMaterial() && !!prims[0].getMaterial().getBaseColorTexture();

    if (satisfiesCondition) {
      candidates.push({
        name: mesh.getName(),
        score: score,
        material: materialName,
        hasTexture: hasBaseColorTexture,
        aspectRatio: size.x / size.y,
        sizeX: size.x,
        sizeY: size.y
      });
    }
  }

  console.log('\n--- Screen Mesh Candidates (Sorted by Score) ---');
  candidates.sort((a, b) => b.score - a.score);
  for (const c of candidates) {
    console.log(`Candidate Mesh: "${c.name}"`);
    console.log(`  Score: ${c.score.toFixed(4)}`);
    console.log(`  Material: "${c.material}"`);
    console.log(`  Has BaseColorTexture: ${c.hasTexture}`);
    console.log(`  Dimensions: ${c.sizeX.toFixed(4)} x ${c.sizeY.toFixed(4)}`);
    console.log(`  Aspect Ratio (Width/Height): ${c.aspectRatio.toFixed(4)}`);
  }
}

main().catch(console.error);
```

## File: `scratch/list_files.js`

```javascript
const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}
const publicDir = path.join(__dirname, '../public');
console.log(walk(publicDir).map(p => path.relative(publicDir, p)));
```

## File: `package.json`

```json
{
  "name": "poshanms-portfolio",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@gltf-transform/core": "^4.4.1",
    "@gltf-transform/functions": "^4.4.1",
    "@google/generative-ai": "^0.24.1",
    "@react-three/drei": "^9.122.0",
    "@react-three/fiber": "^8.18.0",
    "@react-three/rapier": "^1.5.0",
    "@theatre/core": "^0.7.2",
    "@theatre/studio": "^0.7.2",
    "clsx": "^2.1.1",
    "framer-motion": "^12.40.0",
    "gsap": "^3.15.0",
    "lenis": "^1.3.23",
    "lucide-react": "^1.21.0",
    "next": "14.2.35",
    "react": "^18",
    "react-dom": "^18",
    "tailwind-merge": "^3.6.0",
    "three": "^0.184.0",
    "tone": "^15.1.22"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@types/three": "^0.184.1",
    "eslint": "^8",
    "eslint-config-next": "14.2.35",
    "postcss": "^8",
    "raw-loader": "^4.0.2",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  }
}
```

## File: `tsconfig.json`

```json
{
  "compilerOptions": {
    "lib": [
      "dom",
      "dom.iterable",
      "esnext"
    ],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": [
        "./src/*"
      ]
    }
  },
  "include": [
    "next-env.d.ts",
    "src/types/**/*.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

## File: `tailwind.config.ts`

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "void-black": "var(--void-black)",
        "electric-blue": "var(--electric-blue)",
        "deep-violet": "var(--deep-violet)",
        "hot-pink": "var(--hot-pink)",
        "terminal-green": "var(--terminal-green)",
        "pure-white": "var(--pure-white)",
        "deep-navy": "var(--deep-navy)",
        "node-green": "var(--node-green)",
        "nebula-purple": "var(--nebula-purple)",
        "glass-dark": "var(--glass-dark)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      gridTemplateColumns: {
        '16': 'repeat(16, minmax(0, 1fr))',
      },
    },
  },
  plugins: [],
};
export default config;
```

## File: `next.config.mjs`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      exclude: /node_modules/,
      use: ['raw-loader'],
    });
    return config;
  },
};

export default nextConfig;
```

## File: `postcss.config.mjs`

```javascript
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
  },
};

export default config;
```

## File: `.eslintrc.json`

```json
{
  "extends": ["next/core-web-vitals", "next/typescript"]
}
```

## File: `.gitignore`

```text
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js
.yarn/install-state.gz

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
```

## File: `README.md`

```markdown
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
```

## File: `next-env.d.ts`

```typescript
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/building-your-application/configuring/typescript for more information.
```

