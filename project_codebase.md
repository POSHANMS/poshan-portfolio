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
    camera: new THREE.Vector3(0.2, 2.2, 7.85),
    lookAt: new THREE.Vector3(0.15, 1.62, 0),
    fov: 43,
  },
  {
    camera: new THREE.Vector3(2.5, 0.45, 2.6),
    lookAt: new THREE.Vector3(2.45, 0.35, -0.2),
    fov: 45,
  },
  {
    camera: new THREE.Vector3(-2.0, 1.2, 9),
    lookAt: new THREE.Vector3(0, 0.5, 0),
    fov: 55,
  },
  {
    camera: new THREE.Vector3(3.5, 2.0, 8),
    lookAt: new THREE.Vector3(0, 0.5, 0),
    fov: 52,
  },
  {
    camera: new THREE.Vector3(0, 2.0, 14),
    lookAt: new THREE.Vector3(0, 0, 0),
    fov: 65,
  },
];

export function CinematicCamera({ scrollProgress }: { scrollProgress: number }) {
  const currentPos = useRef(new THREE.Vector3(0.2, 2.2, 7.85));
  const currentLookAt = useRef(new THREE.Vector3(0.15, 1.62, 0));
  const currentFov = useRef(43);

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
  --background: #050508;
  --foreground: #f0f0f0;
  --font-inter: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-jetbrains-mono: "JetBrains Mono", "Cascadia Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  
  --void-black: #050508;
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
    radial-gradient(circle at 70% 50%, rgba(255, 23, 68, 0.05), transparent 18rem),
    radial-gradient(circle at 76% 58%, rgba(128, 0, 16, 0.07), transparent 19rem),
    radial-gradient(circle at 30% 40%, rgba(204, 17, 51, 0.015), transparent 17rem),
    radial-gradient(circle at 82% 18%, rgba(128, 0, 16, 0.09), transparent 22rem),
    linear-gradient(180deg, rgba(2, 3, 13, 0.08), rgba(4, 4, 12, 0.02) 56%, rgba(4, 4, 12, 0.28));
  mix-blend-mode: screen;
}

.dashboard-scanlines {
  opacity: 0.18;
  background:
    linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 23, 68, 0.02) 1px, transparent 1px),
    radial-gradient(circle at 74% 18%, rgba(255, 23, 68, 0.09), transparent 12rem);
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
  background: radial-gradient(circle, rgba(255, 23, 68, 0.075), rgba(128, 0, 16, 0.025) 38%, transparent 72%);
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
    radial-gradient(circle at 55% 48%, rgba(255, 23, 68, 0.18), transparent 38%),
    radial-gradient(circle at 72% 62%, rgba(128, 0, 16, 0.12), transparent 44%),
    radial-gradient(circle at 48% 78%, rgba(204, 17, 51, 0.12), transparent 52%);
  filter: blur(74px);
  opacity: 0.58;
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
```

## File: `src/app/layout.tsx`

```typescript
import type { Metadata } from "next";
import "./globals.css";
import Cursor from "@/components/ui/Cursor";
import Loader from "@/components/ui/Loader";
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
        <Loader />
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
import About from "@/components/sections/About";
import Skills from "@/components/sections/Skills";
import Projects from "@/components/sections/Projects";
import Experience from "@/components/sections/Experience";
import Contact from "@/components/sections/Contact";

const Scene = dynamic(() => import("@/components/canvas/Scene"), {
  ssr: false,
  loading: () => null,
});

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
  const stageScale = useStageScale();

  useEffect(() => {
    const scrollControl = initScrollCamera((progress) => {
      setScrollProgress(progress);
    });
    return () => {
      if (scrollControl) scrollControl.destroy();
    };
  }, []);

  return (
    <main className="relative min-h-[500vh] bg-[#050508]">
      <Scene scrollProgress={scrollProgress} />
      <SocialSidebar />
      <DashboardHero scrollProgress={scrollProgress} stageScale={stageScale} />
      <div className="relative z-10 -mt-px bg-[linear-gradient(180deg,rgba(5,5,8,0.38)_0%,rgba(5,5,8,0.82)_18%,rgba(5,5,8,0.94)_100%)]">
        <About />
        <Skills />
        <Projects />
        <Experience />
        <Contact />
      </div>
    </main>
  );
}
```

## File: `src/components/canvas/DeepSpaceGlobe.tsx`

```typescript
"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function DeepSpaceGlobe() {
  const globeRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (globeRef.current) {
      globeRef.current.rotation.y = t * 0.08;
      globeRef.current.rotation.x = Math.sin(t * 0.18) * 0.08;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.045;
      ringRef.current.rotation.y = Math.sin(t * 0.12) * 0.12;
    }
  });

  return (
    <group position={[12.9, 7.15, -48]} scale={2.05} renderOrder={-8}>
      <pointLight position={[0, 0, 2.2]} color="#ff1744" intensity={2.2} distance={11} decay={2} />
      <pointLight position={[-2.2, 1.8, 0.5]} color="#ffd6dc" intensity={0.55} distance={7} decay={2} />

      <group ref={globeRef}>
        <mesh>
          <sphereGeometry args={[1.1, 64, 36]} />
          <meshBasicMaterial color="#ff1744" wireframe transparent opacity={0.48} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>

        <mesh scale={[1.015, 1.015, 1.015]}>
          <sphereGeometry args={[1.1, 32, 18]} />
          <meshBasicMaterial color="#800010" wireframe transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>

        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <sphereGeometry args={[1.105, 48, 16]} />
          <meshBasicMaterial color="#ff1744" wireframe transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>

        <mesh>
          <sphereGeometry args={[1.02, 48, 24]} />
          <meshBasicMaterial color="#5a0010" transparent opacity={0.035} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      </group>

      <group ref={ringRef} rotation={[0.95, 0.22, -0.28]}>
        {[1.32, 1.58, 1.86].map((radius, index) => (
          <mesh key={radius}>
            <torusGeometry args={[radius, 0.006, 8, 160]} />
            <meshBasicMaterial
              color={index === 1 ? "#ff1744" : "#800010"}
              transparent
              opacity={index === 1 ? 0.22 : 0.12}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      <mesh scale={[1.75, 1.75, 1.75]}>
        <sphereGeometry args={[1.1, 42, 24]} />
        <meshBasicMaterial color="#ff1744" transparent opacity={0.03} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
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

// ─────────────────────────────────────────────────────────────
// Screen texture is BAKED into laptop-baked.glb as Material.004.
// No runtime CanvasTexture / VideoTexture / CSS3DRenderer needed.
// ─────────────────────────────────────────────────────────────

const SCREEN_MATERIAL_NAME = "Material.004"; // baked screen in GLB

export default function FloatingLaptop() {
  const { scene } = useGLTF("/models/laptop-baked.glb");

  const groupRef = useRef<THREE.Group>(null);
  const bobRef   = useRef<THREE.Group>(null);

  useMemo(() => {
    const darkBody = new THREE.MeshStandardMaterial({
      color:             "#09091a",
      metalness:          0.92,
      roughness:          0.1,
      emissive:          "#06142f",
      emissiveIntensity:  0.16,
    });

    scene.updateMatrixWorld(true);

    scene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;

      mesh.castShadow    = true;
      mesh.receiveShadow = true;

      // Leave the baked screen material untouched — it already has
      // the VS Code texture + emissive glow baked in.
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat && mat.name === SCREEN_MATERIAL_NAME) {
        mat.toneMapped = false; // keep screen colours accurate
        mat.needsUpdate = true;
        return;
      }

      // Everything else gets the dark metallic chassis look.
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
        -Math.PI / 2 - 0.26 + state.pointer.x * 0.045,
        0.045,
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        0.09 - state.pointer.y * 0.035,
        0.045,
      );
    }
  });

  const { width } = useThree((state) => state.viewport);
  const laptopX   = Math.max(1.65, width * 0.145);

  return (
    <group
      ref={groupRef}
      position={[laptopX, -0.52, -1.34]}
      rotation={[0.09, -Math.PI / 2 - 0.26, -0.03]}
    >
      <group ref={bobRef}>
        <primitive object={scene} scale={1.24} />

        {/* Screen back-glow plane */}
        <mesh position={[0.2, 0.78, -0.72]} rotation={[0.05, 0, 0]}>
          <planeGeometry args={[2.2, 1.35]} />
          <meshBasicMaterial
            color="#ff1744"
            transparent
            opacity={0.16}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Keyboard glow */}
        <mesh position={[0.36, -0.28, 0.22]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.5, 1.0]} />
          <meshBasicMaterial
            color="#ff1744"
            transparent
            opacity={0.18}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Floor bounce-light disk */}
        <mesh position={[0.32, -0.9, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[2.35, 72]} />
          <meshBasicMaterial
            color="#ff1744"
            transparent
            opacity={0.11}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Concentric platform ring */}
        <mesh position={[0.0, -1.02, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.25, 2.75, 96]} />
          <meshBasicMaterial
            color="#ff1744"
            transparent
            opacity={0.075}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Lights */}
        <pointLight position={[0, 1.8, -1.2]}   intensity={7.5} distance={12} color="#ff1744" decay={2} />
        <pointLight position={[-2.1, 0.65, 0.45]} intensity={4.4} distance={9}  color="#ff1744" decay={2} />
        <pointLight position={[0.8, -1.15, 0.95]} intensity={3.8} distance={8}  color="#800010" decay={2} />
        <pointLight position={[0, 0.5, 1.5]}      intensity={3.2} distance={8}  color="#ff1744" decay={2} />
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
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import ringsVertex from "@/shaders/vertex/rings.vert";
import ringsFragment from "@/shaders/fragment/rings.frag";

export default function FloorRings() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
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
    <mesh position={[3.15, -1.9, -0.32]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-8}>
      <planeGeometry args={[5.2, 5.2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={ringsVertex}
        fragmentShader={ringsFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
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

## File: `src/components/canvas/ImageBackground.tsx`

```typescript
"use client";

import React, { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

export default function ImageBackground() {
  const texture = useTexture("/Reference/space-bg-red.jpg");
  texture.colorSpace = THREE.SRGBColorSpace;

  const { camera } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.position.x = camera.position.x * 0.12;
    meshRef.current.position.y = camera.position.y * 0.08 - 0.6;
  });

  return (
    <mesh ref={meshRef} position={[0, -0.6, -72]} renderOrder={-30}>
      <planeGeometry args={[300, 168]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.92}
        depthWrite={false}
        depthTest={false}
        fog={false}
        toneMapped={false}
        blending={THREE.NormalBlending}
      />
    </mesh>
  );
}

useTexture.preload("/Reference/space-bg-red.jpg");
```

## File: `src/components/canvas/NebulaBackground.tsx`

```typescript
"use client";

import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import nebulaVertex from "@/shaders/vertex/nebula.vert";
import nebulaFragment from "@/shaders/fragment/nebula.frag";

export default function NebulaBackground() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0.0 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uMouse: { value: new THREE.Vector2(0, 0) },
    }),
    [size]
  );

  useFrame((state) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();

    materialRef.current.uniforms.uMouse.value.x = THREE.MathUtils.lerp(
      materialRef.current.uniforms.uMouse.value.x,
      state.pointer.x,
      0.04
    );
    materialRef.current.uniforms.uMouse.value.y = THREE.MathUtils.lerp(
      materialRef.current.uniforms.uMouse.value.y,
      state.pointer.y,
      0.04
    );
  });

  return (
    <mesh position={[0, 1.4, -70]} renderOrder={-18}>
      <planeGeometry args={[420, 210]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={nebulaVertex}
        fragmentShader={nebulaFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
        opacity={0.2}
      />
    </mesh>
  );
}
```

## File: `src/components/canvas/NeonGrid.tsx`

```typescript
"use client";

import React from "react";
import { Grid } from "@react-three/drei";
import * as THREE from "three";

export default function NeonGrid() {
  const streaks = [
    [-11.5, -18, 0.75, 7.8, 0.09],
    [-4.2, -21, 0.52, 5.6, 0.06],
    [3.4, -19.5, 0.62, 6.2, 0.07],
    [10.8, -23, 0.88, 8.4, 0.1],
    [18.5, -27, 0.46, 5.2, 0.055],
  ] as const;

  return (
    <group position={[0, -1.82, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]}>
        <planeGeometry args={[220, 220]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.78} depthWrite={false} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
        <planeGeometry args={[220, 220]} />
        <meshBasicMaterial color="#ff1744" transparent opacity={0.018} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
        <planeGeometry args={[220, 220]} />
        <meshBasicMaterial color="#800010" transparent opacity={0.012} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      <group position={[0, 0.055, 0]}>
        <Grid
          args={[220, 220]}
          rotation={[-Math.PI / 2, 0, 0]}
          cellSize={1.1}
          cellThickness={0.05}
          cellColor="#ff1744"
          sectionSize={7}
          sectionThickness={0.09}
          sectionColor="#5a0010"
          fadeDistance={46}
          fadeStrength={1.65}
          infiniteGrid
        />

        <Grid
          args={[220, 220]}
          position={[0, 0.004, 0]}
          rotation={[-Math.PI / 2, 0.22, 0]}
          cellSize={4.2}
          cellThickness={0.038}
          cellColor="#800010"
          sectionSize={16}
          sectionThickness={0.07}
          sectionColor="#800010"
          fadeDistance={42}
          fadeStrength={1.8}
          infiniteGrid
        />
      </group>

      {[2.15, 3.2, 4.75, 6.3].map((radius, index) => (
        <mesh key={radius} position={[2.45, 0.025 + index * 0.003, -0.55]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius, radius + 0.035, 160]} />
          <meshBasicMaterial
            color={index % 2 === 0 ? "#ff1744" : "#800010"}
            transparent
            opacity={(0.14 - index * 0.02) * 0.11}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      {[2.15, 3.2, 4.75, 6.3].map((radius, index) => (
        <mesh key={`ref-${radius}`} position={[2.45, -0.08 - index * 0.003, -0.55]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius, radius + 0.05, 120]} />
          <meshBasicMaterial
            color="#ff1744"
            transparent
            opacity={(0.08 - index * 0.015) * 0.08}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      <mesh position={[7.4, 0.08, -8]} rotation={[-Math.PI / 2, 0.1, -0.07]}>
        <planeGeometry args={[0.045, 34]} />
        <meshBasicMaterial color="#ff1744" transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {streaks.map(([x, z, width, height, opacity]) => (
        <mesh key={`${x}-${z}`} position={[x, 0.09, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial color="#ff1744" transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}
```

## File: `src/components/canvas/ParticleNetwork.tsx`

```typescript
"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function ParticleNetwork() {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const particleCount = 1800;

  const [positions, velocities, sizes] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);
    const sz = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      pos[idx] = (Math.random() - 0.5) * 26;
      pos[idx + 1] = (Math.random() - 0.5) * 16;
      pos[idx + 2] = (Math.random() - 0.5) * 11;
      vel[idx] = (Math.random() - 0.5) * 0.01;
      vel[idx + 1] = (Math.random() - 0.5) * 0.01;
      vel[idx + 2] = (Math.random() - 0.5) * 0.004;
      sz[i] = 0.18 + Math.random() * 0.84;
    }

    return [pos, vel, sz];
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uColor: { value: new THREE.Color("#ff1744") },
    }),
    []
  );

  useFrame((state) => {
    if (!pointsRef.current || !materialRef.current) return;

    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position;
    const posArray = posAttr.array as Float32Array;
    const targetX = state.pointer.x * 10.5;
    const targetY = state.pointer.y * 6.4;

    materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    materialRef.current.uniforms.uMouse.value.x = THREE.MathUtils.lerp(materialRef.current.uniforms.uMouse.value.x, targetX, 0.09);
    materialRef.current.uniforms.uMouse.value.y = THREE.MathUtils.lerp(materialRef.current.uniforms.uMouse.value.y, targetY, 0.09);

    const mx = materialRef.current.uniforms.uMouse.value.x;
    const my = materialRef.current.uniforms.uMouse.value.y;

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;

      posArray[idx] += velocities[idx];
      posArray[idx + 1] += velocities[idx + 1];
      posArray[idx + 2] += velocities[idx + 2];

      const px = posArray[idx];
      const py = posArray[idx + 1];
      const pz = posArray[idx + 2];

      const dx = mx - px;
      const dy = my - py;
      const dz = -pz;
      const distToMouse = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distToMouse < 8.5 && distToMouse > 0.001) {
        const dirX = dx / distToMouse;
        const dirY = dy / distToMouse;
        const dirZ = dz / distToMouse;

        const tangentX = -dirY;
        const tangentY = dirX;

        const force = (8.5 - distToMouse) * 0.0042;
        const drift = (8.5 - distToMouse) * 0.0032;

        posArray[idx] += dirX * force + tangentX * drift;
        posArray[idx + 1] += dirY * force + tangentY * drift;
        posArray[idx + 2] += dirZ * force;
      }

      if (Math.abs(posArray[idx]) > 15) posArray[idx] = -posArray[idx];
      if (Math.abs(posArray[idx + 1]) > 9) posArray[idx + 1] = -posArray[idx + 1];
      if (Math.abs(posArray[idx + 2]) > 6.5) posArray[idx + 2] = -posArray[idx + 2];
    }

    posAttr.needsUpdate = true;
  });

  const vertexShader = `
    attribute float aSize;
    uniform float uTime;
    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      gl_PointSize = aSize * (18.0 / -mvPosition.z);
    }
  `;

  const fragmentShader = `
    uniform vec3 uColor;
    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      if (dist > 0.5) discard;
      float alpha = smoothstep(0.5, 0.02, dist);
      vec3 color = mix(uColor, vec3(1.0, 0.18, 0.47), smoothstep(0.1, 0.5, coord.x + 0.5));
      gl_FragColor = vec4(color, alpha * 0.72);
    }
  `;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
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
      0.24,
      0.28,
      0.52
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
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import { CinematicCamera } from "@/animations/scrollCamera";
import { useDeviceSize } from "@/hooks/useDeviceSize";
import NebulaBackground from "./NebulaBackground";
import ImageBackground from "./ImageBackground";
import StarField from "./StarField";
import NeonGrid from "./NeonGrid";
import FloatingLaptop from "./FloatingLaptop";
import TechCubes from "./TechCubes";
import FloorRings from "./FloorRings";
import DeepSpaceGlobe from "./DeepSpaceGlobe";
import PostProcessing from "./PostProcessing";

interface SceneProps {
  scrollProgress: number;
}

export default function Scene({ scrollProgress }: SceneProps) {
  const { deviceTier, reducedMotion } = useDeviceSize();
  const isMobile = deviceTier === "mobile";

  return (
    <div className="hero-mobile-soften fixed inset-0 z-0 h-full w-full bg-[#050508]">
      <Canvas
        shadows
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: isMobile ? "default" : "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.9,
        }}
        camera={{
          position: [0.15, 2.2, 9.2],
          fov: 45,
          near: 0.1,
          far: 100,
        }}
      >
        <CinematicCamera scrollProgress={scrollProgress} />
        <color attach="background" args={["#000000"]} />
        <fog attach="fog" args={["#000000", 10, 62]} />
        <Environment preset="city" background={false} blur={0.8} />

        <ambientLight intensity={0.16} color="#0c0406" />
        <pointLight position={[4.8, 1.4, 4.8]} intensity={2.8} color="#ff1744" distance={34} decay={2} />
        <pointLight position={[3.6, -1.4, 3.2]} intensity={1.8} color="#800010" distance={30} decay={2} />
        <pointLight position={[-4.8, 4.8, 2.6]} intensity={1.4} color="#2a2a30" distance={30} decay={2} />
        <pointLight position={[0.2, 4.2, -8]} intensity={1.2} color="#800010" distance={38} decay={2} />
        <spotLight position={[1.8, 5.8, 5]} angle={0.45} penumbra={0.8} intensity={1.8} color="#ff1744" distance={34} />
        <spotLight position={[5.6, 2.0, 2.4]} angle={0.5} penumbra={0.85} intensity={1.2} color="#3a3a42" distance={28} />

        <Suspense fallback={null}>
          <ImageBackground />
          <NebulaBackground />
          <StarField />
          {!isMobile && !reducedMotion && <DeepSpaceGlobe />}

          <FloatingLaptop />
          {!reducedMotion && <TechCubes />}
          <NeonGrid />
          {!reducedMotion && <FloorRings />}
          <PostProcessing />
        </Suspense>
      </Canvas>
    </div>
  );
}
```

## File: `src/components/canvas/StarField.tsx`

```typescript
"use client";

import React, { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";

type AuthoredNode = [number, number, number];
type AuthoredConnection = [number, number];

const authoredNodes: AuthoredNode[] = [
  [-16.5, 8.2, -24],
  [-14.1, 10.6, -25.5],
  [-11.2, 8.9, -24.8],
  [-12.7, 6.4, -26.2],
  [-2.8, 13.2, -32],
  [-0.6, 15.1, -33.4],
  [2.4, 13.8, -32.6],
  [0.8, 11.4, -34.2],
  [11.8, 10.1, -28.5],
  [14.2, 12.2, -29.2],
  [17.1, 10.8, -30.4],
  [15.6, 7.8, -29.6],
  [23.5, 17.4, -38],
  [26.2, 19.2, -39.5],
  [29.6, 17.8, -40.8],
  [27.5, 15.4, -39.8],
  [-25.6, 18.4, -42],
  [-22.8, 20.1, -43.5],
  [-19.6, 17.5, -42.4],
  [34.5, 6.8, -35.2],
  [38.1, 8.7, -36.4],
  [41.0, 6.0, -37.2],
];

const authoredConnections: AuthoredConnection[] = [
  [0, 1],
  [1, 2],
  [1, 3],
  [4, 5],
  [5, 6],
  [6, 7],
  [8, 9],
  [9, 10],
  [9, 11],
  [12, 13],
  [13, 14],
  [13, 15],
  [16, 17],
  [17, 18],
  [19, 20],
  [20, 21],
];

function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function createStarShader(opacity: number) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uOpacity: { value: opacity },
      uTime: { value: 0 },
    },
    vertexShader: `
      uniform float uTime;
      attribute float aSize;
      attribute float aPhase;
      attribute vec3 color;
      varying vec3 vColor;
      varying float vTwinkle;

      void main() {
        vColor = color;
        vTwinkle = 0.72 + 0.28 * sin(uTime * 1.45 + aPhase);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = aSize * vTwinkle * (52.0 / max(1.0, -mvPosition.z));
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      varying vec3 vColor;
      varying float vTwinkle;

      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float d = length(uv);
        float core = smoothstep(0.5, 0.04, d);
        float halo = smoothstep(0.5, 0.16, d) * 0.52;
        if (core <= 0.001) discard;
        vec3 glow = mix(vColor, vec3(1.0, 0.18, 0.28), halo * 0.32);
        gl_FragColor = vec4(glow, (core + halo) * uOpacity * vTwinkle);
      }
    `,
    transparent: true,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

export default function StarField() {
  const ambientStarsRef = useRef<THREE.Points>(null);
  const heroStarsRef = useRef<THREE.Points>(null);
  const constellationRef = useRef<THREE.LineSegments>(null);
  const { camera } = useThree();

  const [ambientPositions, ambientColors, ambientSizes, ambientPhases] = useMemo(() => {
    const random = seededRandom(7331);
    const count = 2600;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const palette = [
      new THREE.Color("#ffffff"),
      new THREE.Color("#f5f0e8"),
      new THREE.Color("#ffffff"),
      new THREE.Color("#f5f0e8"),
      new THREE.Color("#ffd89a"),
      new THREE.Color("#cfe8ff"),
    ];

    const exclusionZones = [
      { x1: -0.98, x2: -0.36, y1: -0.42, y2: 0.72 },
      { x1: -0.28, x2: 0.12, y1: -0.2, y2: 0.78 },
      { x1: 0.48, x2: 0.98, y1: -0.52, y2: 0.76 },
    ];

    const candidate = new THREE.Vector3();
    let accepted = 0;
    let attempts = 0;

    while (accepted < count && attempts < count * 12) {
      attempts += 1;
      candidate.set((random() - 0.5) * 128, random() * 44 - 2, -18 - random() * 58);
      const ndc = candidate.clone().project(camera);
      const blocked = exclusionZones.some((zone) => ndc.x > zone.x1 && ndc.x < zone.x2 && ndc.y > zone.y1 && ndc.y < zone.y2);
      if (blocked) continue;

      const i3 = accepted * 3;
      const color = palette[Math.floor(random() * palette.length)];
      const hero = random() > 0.94;

      positions[i3] = candidate.x;
      positions[i3 + 1] = candidate.y;
      positions[i3 + 2] = candidate.z;
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
      sizes[accepted] = hero ? 0.24 + random() * 0.18 : 0.055 + random() * 0.105;
      phases[accepted] = random() * Math.PI * 2;
      accepted += 1;
    }

    return [positions, colors, sizes, phases];
  }, [camera]);

  const [heroPositions, heroColors, heroSizes, heroPhases] = useMemo(() => {
    const positions = new Float32Array(authoredNodes.length * 3);
    const colors = new Float32Array(authoredNodes.length * 3);
    const sizes = new Float32Array(authoredNodes.length);
    const phases = new Float32Array(authoredNodes.length);
    const starColors = [new THREE.Color("#ffffff"), new THREE.Color("#f5f0e8"), new THREE.Color("#ffd89a"), new THREE.Color("#cfe8ff")];

    authoredNodes.forEach((node, index) => {
      const i3 = index * 3;
      const color = starColors[index % starColors.length];
      positions[i3] = node[0];
      positions[i3 + 1] = node[1];
      positions[i3 + 2] = node[2];
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
      sizes[index] = index % 5 === 0 ? 0.42 : 0.26;
      phases[index] = index * 0.73;
    });

    return [positions, colors, sizes, phases];
  }, []);

  const constellationGeometry = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    const crimson = new THREE.Color("#ff1744");
    const burgundy = new THREE.Color("#800010");

    authoredConnections.forEach(([start, end], index) => {
      const a = authoredNodes[start];
      const b = authoredNodes[end];
      const color = index % 3 === 0 ? burgundy : crimson;
      positions.push(a[0], a[1], a[2], b[0], b[1], b[2]);
      colors.push(color.r, color.g, color.b, color.r, color.g, color.b);
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return geometry;
  }, []);

  const ambientMaterial = useMemo(() => createStarShader(0.78), []);
  const heroMaterial = useMemo(() => createStarShader(0.95), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    ambientMaterial.uniforms.uTime.value = t;
    heroMaterial.uniforms.uTime.value = t;
    if (ambientStarsRef.current) ambientStarsRef.current.rotation.y = t * 0.0025;
    if (heroStarsRef.current) heroStarsRef.current.rotation.y = Math.sin(t * 0.12) * 0.008;
    if (constellationRef.current) {
      const material = constellationRef.current.material as THREE.LineBasicMaterial;
      material.opacity = 0.48 + Math.sin(t * 0.65) * 0.08;
    }
  });

  return (
    <group>
      <points ref={ambientStarsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[ambientPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[ambientColors, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[ambientSizes, 1]} />
          <bufferAttribute attach="attributes-aPhase" args={[ambientPhases, 1]} />
        </bufferGeometry>
        <primitive object={ambientMaterial} attach="material" />
      </points>

      <lineSegments ref={constellationRef} geometry={constellationGeometry}>
        <lineBasicMaterial vertexColors transparent opacity={0.52} blending={THREE.AdditiveBlending} depthWrite={false} depthTest={false} />
      </lineSegments>

      <group>
        {authoredConnections.map(([start, end], index) => (
          <Line
            key={`${start}-${end}`}
            points={[authoredNodes[start], authoredNodes[end]]}
            color={index % 3 === 0 ? "#800010" : "#ff1744"}
            lineWidth={index % 3 === 0 ? 0.85 : 1.15}
            transparent
            opacity={index % 3 === 0 ? 0.42 : 0.68}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
          />
        ))}
      </group>

      <points ref={heroStarsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[heroPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[heroColors, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[heroSizes, 1]} />
          <bufferAttribute attach="attributes-aPhase" args={[heroPhases, 1]} />
        </bufferGeometry>
        <primitive object={heroMaterial} attach="material" />
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
      lightRef.current.intensity = hovered ? 10.5 + pulse * 3.6 : 6.6 + pulse * 2.2;
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
      <pointLight ref={lightRef} color={glowColor} intensity={5.2} distance={5.6} decay={2} />

      <mesh scale={[1.1, 1.1, 1.1]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color={glowColor} transparent opacity={hovered ? 0.11 : 0.045} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      <lineSegments scale={[1.08, 1.08, 1.08]}>
        <edgesGeometry args={[edgeGeometry]} />
        <lineBasicMaterial color={glowColor} transparent opacity={hovered ? 0.48 : 0.28} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>

      <RoundedBox args={[1, 1, 1]} radius={0.075} smoothness={6} castShadow>
        <mesh>
          <boxGeometry args={[0.94, 0.94, 0.94]} />
          <meshBasicMaterial color={color} transparent opacity={0.16} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        <MeshTransmissionMaterial
          color={new THREE.Color(color).lerp(new THREE.Color("#f7fbff"), 0.72)}
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
          attenuationColor={new THREE.Color(color).lerp(new THREE.Color("#f0fbff"), 0.35)}
          attenuationDistance={0.95}
          emissive={glow}
          emissiveIntensity={hovered ? 0.52 : 0.28}
          envMapIntensity={2.35}
          side={THREE.FrontSide}
        />
      </RoundedBox>

      <lineSegments>
        <edgesGeometry args={[edgeGeometry]} />
        <lineBasicMaterial color="#ffd6dc" transparent opacity={hovered ? 0.5 : 0.28} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>

      <mesh position={[0, 0, 0.535]}>
        <planeGeometry args={[0.68, 0.68]} />
        <meshBasicMaterial map={logoTex} transparent opacity={0.42} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      <mesh position={[0, 0, -0.535]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.68, 0.68]} />
        <meshBasicMaterial map={logoTex} transparent opacity={0.12} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      <mesh position={[0, 0.535, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.48, 0.515, 4]} />
        <meshBasicMaterial color={glowColor} toneMapped={false} transparent opacity={hovered ? 0.16 : 0.08} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      <mesh position={[0, -0.535, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.48, 0.515, 4]} />
        <meshBasicMaterial color={glowColor} toneMapped={false} transparent opacity={hovered ? 0.1 : 0.05} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      <mesh position={[0, -0.78, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.28, 1.28, 1]}>
        <circleGeometry args={[0.72, 48]} />
        <meshBasicMaterial color={glowColor} toneMapped={false} transparent opacity={hovered ? 0.15 : 0.075} blending={THREE.AdditiveBlending} depthWrite={false} />
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
        position: [1.45, 2.85, -0.15] as [number, number, number],
        scale: 0.78,
        color: "#ffb0b0",
        glowColor: "#ff1744",
        logoPath: "/icons/react.svg",
      },
      {
        id: "node",
        position: [3.85, 1.05, 0.1] as [number, number, number],
        scale: 0.72,
        color: "#ffaaaa",
        glowColor: "#cc1133",
        logoPath: "/icons/node.svg",
      },
      {
        id: "typescript",
        position: [2.95, -1.25, 0.75] as [number, number, number],
        scale: 0.52,
        color: "#e8a0a0",
        glowColor: "#800010",
        logoPath: "/icons/typescript.svg",
      },
      {
        id: "next",
        position: [-0.75, 0.85, 0.65] as [number, number, number],
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
  const ringRef = useRef<HTMLDivElement>(null);
  
  const mouseRef = useRef({ x: 0, y: 0 });
  const ringPosRef = useRef({ x: 0, y: 0 });
  const isHoveredRef = useRef(false);

  useEffect(() => {
    // Check if device supports fine pointers (like a mouse/trackpad)
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (!isFinePointer) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // Initially hide cursor elements until first mouse move to prevent flash
    dot.style.opacity = "0";
    ring.style.opacity = "0";

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;

      dot.style.opacity = "1";
      ring.style.opacity = "1";

      // Directly update dot position for zero-latency feel
      dot.style.transform = `translate3d(${e.clientX - 4}px, ${e.clientY - 4}px, 0)`;
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Detect interactive elements
      const isInteractive = 
        target.tagName === "A" || 
        target.tagName === "BUTTON" || 
        target.closest("a") || 
        target.closest("button") || 
        target.closest('[role="button"]') ||
        target.classList.contains("hover-target") ||
        target.getAttribute("data-magnetic") !== null;

      if (isInteractive) {
        isHoveredRef.current = true;
        ring.classList.add("cursor-morph");
        dot.classList.add("dot-morph");
      } else {
        isHoveredRef.current = false;
        ring.classList.remove("cursor-morph");
        dot.classList.remove("dot-morph");
      }
    };

    const handleMouseDown = () => {
      ring.classList.add("cursor-click");
    };

    const handleMouseUp = () => {
      ring.classList.remove("cursor-click");
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseover", handleMouseOver);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    // Smooth LERP (Linear Interpolation) loop for the outer ring lag effect
    let animationFrameId: number;
    const lerp = (start: number, end: number, amt: number) => (1 - amt) * start + amt * end;

    const render = () => {
      // Lerp ring coordinates toward target mouse coordinates
      // 0.15 is the speed of follow (lower = slower lag)
      const targetX = mouseRef.current.x;
      const targetY = mouseRef.current.y;

      ringPosRef.current.x = lerp(ringPosRef.current.x, targetX, 0.15);
      ringPosRef.current.y = lerp(ringPosRef.current.y, targetY, 0.15);

      // Apply coordinates offset by half of ring's normal size (24px / 2 = 12px)
      ring.style.transform = `translate3d(${ringPosRef.current.x - 12}px, ${ringPosRef.current.y - 12}px, 0)`;

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      {/* Central glowing white orb */}
      <div
        ref={dotRef}
        className="pointer-events-none fixed top-0 left-0 z-[9999] h-2 w-2 rounded-full bg-white shadow-[0_0_10px_#fff,_0_0_20px_var(--electric-blue)] transition-transform duration-[0.05s] ease-out will-change-transform hidden md:block"
        style={{ transform: "translate3d(-100px, -100px, 0)" }}
      />
      {/* Outer LERP ring (Light trail & hover morph) */}
      <div
        ref={ringRef}
        className="pointer-events-none fixed top-0 left-0 z-[9998] h-6 w-6 rounded-full border border-white/40 bg-transparent transition-all duration-300 ease-out will-change-transform hidden md:block"
        style={{
          transform: "translate3d(-100px, -100px, 0)",
          boxShadow: "0 0 8px rgba(255, 255, 255, 0.1)",
        }}
      />
      
      {/* Morph styling rules locally managed */}
      <style jsx global>{`
        .cursor-morph {
          width: 48px !important;
          height: 48px !important;
          border-color: var(--electric-blue) !important;
          box-shadow: 0 0 15px var(--electric-blue), inset 0 0 10px rgba(255, 23, 68, 0.3) !important;
          margin-top: -12px;
          margin-left: -12px;
          background-color: rgba(255, 23, 68, 0.05) !important;
        }
        .dot-morph {
          transform: scale(0.5) !important;
          background-color: var(--hot-pink) !important;
          shadow-[0_0_10px_#cc1133] !important;
        }
        .cursor-click {
          transform: scale(0.7) !important;
          border-color: var(--hot-pink) !important;
          background-color: rgba(255, 23, 68, 0.2) !important;
        }
      `}</style>
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
          className="h-full rounded-full bg-gradient-to-r from-[#ff1744] to-[#800010]"
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
          <p className="mt-2 max-w-[28rem] font-mono text-[14px] leading-7 text-[#f5f0e8]/72">
            I build{" "}
            <span className="font-semibold text-[#ff1744]">scalable</span>{" "}
            <span className="text-white/30">·</span>{" "}
            <span className="font-semibold text-[#cc1133]">performant</span>{" "}
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
                        ? "rgba(255,23,68,0.95)"
                        : cell % 5 === 0
                          ? "rgba(255,23,68,0.68)"
                          : cell % 3 === 0
                            ? "rgba(255,23,68,0.42)"
                            : "rgba(255,23,68,0.18)",
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

import React, { useEffect, useState } from "react";
import { useProgress } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";

// Simulated log lines based on loading percentage
const logLines = [
  { threshold: 5, text: ">> INITIALIZING SECURE CYBERNETIC CONNECTION..." },
  { threshold: 20, text: ">> RETRIEVING NEURAL SHADER MODULES..." },
  { threshold: 45, text: ">> LOADING 3D METALLIC CHASSIS MODEL (laptop.glb)..." },
  { threshold: 65, text: ">> INJECTING REFRACTION TECHNOLOGY (TechCubes)..." },
  { threshold: 85, text: ">> ESTABLISHING QUANTUM STARFIELD NETWORK..." },
  { threshold: 98, text: ">> PORTFOLIO ONLINE. DEPLOYING MATRIX..." },
];

export default function Loader() {
  const { progress } = useProgress();
  const [displayProgress, setDisplayProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [bootLogs, setBootLogs] = useState<string[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    // Smooth progress count-up
    const targetProgress = Math.max(progress, displayProgress);
    
    if (displayProgress < 100) {
      interval = setInterval(() => {
        setDisplayProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          // Increment faster if actual loading progress is ahead
          const increment = targetProgress > prev ? Math.max(2, Math.ceil((targetProgress - prev) * 0.2)) : 1;
          const next = prev + increment;
          return next > 100 ? 100 : next;
        });
      }, 30);
    } else {
      // Delay transition for half a second to let user see "100%"
      const timeout = setTimeout(() => {
        setIsDone(true);
      }, 800);
      return () => clearTimeout(timeout);
    }

    return () => clearInterval(interval);
  }, [progress, displayProgress]);

  // Update terminal logs based on progress
  useEffect(() => {
    const activeLogs = logLines
      .filter((line) => displayProgress >= line.threshold)
      .map((line) => line.text);
    setBootLogs(activeLogs);
  }, [displayProgress]);

  return (
    <AnimatePresence>
      {!isDone && (
        <motion.div
          key="loader"
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0, 
            y: "-100vh",
            transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } 
          }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#050508] font-mono text-xs select-none"
        >
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none opacity-40" />

          {/* Core Loader Box */}
          <div className="relative flex flex-col items-center max-w-md w-full px-8">
            
            {/* 3D Spinning Logo Intro */}
            <div className="relative w-24 h-24 mb-8 flex items-center justify-center">
              {/* Outer rotating neon glow ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                className="absolute inset-0 border border-t-[var(--electric-blue)] border-r-[var(--hot-pink)] border-b-transparent border-l-transparent rounded-full shadow-[0_0_15px_rgba(255,23,68,0.4)]"
              />
              
              {/* Secondary reverse rotating ring */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                className="absolute inset-2 border border-b-[var(--deep-violet)] border-l-[var(--node-green)] border-t-transparent border-r-transparent rounded-full opacity-60"
              />

              {/* Stylized P Logo */}
              <motion.div 
                animate={{ 
                  scale: [1, 1.05, 1],
                  filter: ["drop-shadow(0 0 5px #ff1744)", "drop-shadow(0 0 12px #800010)", "drop-shadow(0 0 5px #ff1744)"]
                }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="relative z-10 flex items-center justify-center"
              >
                <svg
                  width="40"
                  height="45"
                  viewBox="0 0 40 45"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="filter drop-shadow-[0_0_8px_var(--electric-blue)]"
                >
                  <path
                    d="M5 5H22C28.6274 5 34 10.3726 34 17C34 23.6274 28.6274 29 22 29H13V40"
                    stroke="#ff1744"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M13 17H22C23.6569 17 25 15.6569 25 14C25 12.3431 23.6569 11 22 11H13V17Z"
                    fill="#800010"
                  />
                </svg>
              </motion.div>
            </div>

            {/* Terminal Feed Details */}
            <div className="w-full bg-[rgba(5,5,8,0.92)] border border-[rgba(255,23,68,0.22)] p-4 rounded mb-6 text-[10px] text-[var(--terminal-green)] leading-5 h-36 overflow-hidden flex flex-col justify-end">
              <div className="space-y-1">
                {bootLogs.map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="truncate text-[var(--terminal-green)] text-glow-green"
                  >
                    {log}
                  </motion.div>
                ))}
                {displayProgress < 100 && (
                  <span className="inline-block w-2 h-4 bg-[var(--terminal-green)] animate-[pulse_1s_infinite] ml-1 align-middle" />
                )}
              </div>
            </div>

            {/* Loader percentage and progress bar */}
            <div className="w-full flex items-center justify-between text-xs font-semibold mb-2">
              <span className="text-[var(--electric-blue)] uppercase tracking-widest text-glow-blue">
                Initializing System
              </span>
              <span className="text-[var(--hot-pink)] text-glow-pink">
                {displayProgress}%
              </span>
            </div>

            <div className="w-full h-1.5 bg-[#0a0a0c] rounded-full overflow-hidden border border-white/5 relative">
              <motion.div
                className="h-full bg-gradient-to-r from-[var(--electric-blue)] via-[var(--deep-violet)] to-[var(--hot-pink)] shadow-[0_0_10px_var(--electric-blue)]"
                style={{ width: `${displayProgress}%` }}
                layout
              />
            </div>
            
            <div className="mt-8 text-[9px] text-[#555577] text-center select-none">
              POSHAN MS PORTFOLIO v1.0.0 · NODE_ENV = PRODUCTION
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
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

  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }

  return value;
}

void main() {
  vec2 uv = vUv;
  vec2 aspectUv = vec2((uv.x - 0.5) * (uResolution.x / uResolution.y), uv.y - 0.5);

  vec2 slowDrift = vec2(uTime * 0.018, -uTime * 0.009);
  float cloudA = fbm(uv * 3.1 + slowDrift);
  float cloudB = fbm(uv * 4.4 - slowDrift * 1.4 + vec2(8.2, 2.7));
  float cloudC = fbm(uv * 7.0 + vec2(-uTime * 0.012, uTime * 0.016));

  float upperMask = smoothstep(0.18, 0.58, uv.y);
  float horizonMask = smoothstep(0.08, 0.28, uv.y);

  vec2 galaxyCenter = vec2(0.64, 0.75);
  vec2 galaxyVector = uv - galaxyCenter;
  float galaxyRadius = length(galaxyVector);
  float galaxyAngle = atan(galaxyVector.y, galaxyVector.x);
  float spiral = 0.5 + 0.5 * cos(galaxyAngle * 3.0 - 10.0 * galaxyRadius + uTime * 0.18);
  float galaxyCore = exp(-galaxyRadius * galaxyRadius * 42.0);
  float galaxyArms = exp(-galaxyRadius * galaxyRadius * 9.0) * pow(spiral, 2.2);

  vec2 faceCenter = vec2(-0.58, 0.2);
  float faceSilhouette = exp(-length(aspectUv - faceCenter) * 3.2) * smoothstep(0.24, 0.72, uv.y);

  float fogShape = pow(cloudA, 3.2) * 0.58 + pow(cloudB, 3.8) * 0.72 + pow(cloudC, 5.0) * 0.42;
  fogShape *= upperMask * horizonMask;

  vec3 blueFog = vec3(0.72, 0.02, 0.08) * pow(cloudA, 3.4) * 0.26;
  vec3 violetFog = vec3(0.48, 0.01, 0.05) * pow(cloudB, 3.7) * 0.2;
  vec3 magentaFog = vec3(0.34, 0.0, 0.03) * pow(cloudC, 4.6) * 0.13;
  vec3 cyanEdge = vec3(0.95, 0.05, 0.12) * galaxyArms * 0.28;
  vec3 purpleCore = vec3(1.0, 0.02, 0.18) * galaxyCore * 0.36;
  vec3 faceGlow = vec3(0.28, 0.01, 0.03) * faceSilhouette * 0.07;

  float horizonGlow = exp(-pow(uv.y - 0.22, 2.0) * 58.0);
  vec3 horizonColor = vec3(0.8, 0.02, 0.08) * horizonGlow * 0.08 + vec3(0.45, 0.0, 0.02) * horizonGlow * 0.03;

  vec3 color = blueFog + violetFog + magentaFog + cyanEdge + purpleCore + faceGlow + horizonColor;
  color = clamp(color, 0.0, 1.35);

  float alpha = clamp(fogShape * 0.24 + galaxyCore * 0.18 + galaxyArms * 0.13 + horizonGlow * 0.1 + faceSilhouette * 0.05, 0.0, 0.38);
  alpha *= smoothstep(0.02, 0.18, uv.y);

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
    "lib": ["dom", "dom.iterable", "esnext"],
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
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
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