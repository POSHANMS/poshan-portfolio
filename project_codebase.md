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

## File: `src/animations/powerUpSequence.ts`

```typescript
"use client";

import gsap from "gsap";

export type PowerUpStage =
  | "idle"
  | "welcome"
  | "floor"
  | "stars"
  | "globe"
  | "laptop"
  | "cubes"
  | "ui"
  | "complete";

export interface PowerUpStageValues {
  sceneOpacity: number;
  floorOpacity: number;
  floorFlicker: number;
  laptopOpacity: number;
  globeOpacity: number;
  starsOpacity: number;
  cubesOpacity: number;
  uiOpacity: number;
}

export interface PowerUpCallbacks {
  onStageChange?: (stage: PowerUpStage) => void;
  onValuesUpdate?: (values: PowerUpStageValues) => void;
  onComplete?: () => void;
}

export function start3DPowerUpSequence(callbacks: PowerUpCallbacks) {
  const values: PowerUpStageValues = {
    sceneOpacity: 0,
    floorOpacity: 0,
    floorFlicker: 1,
    laptopOpacity: 0,
    globeOpacity: 0,
    starsOpacity: 0,
    cubesOpacity: 0,
    uiOpacity: 0,
  };

  const update = () => {
    callbacks.onValuesUpdate?.({ ...values });
  };

  const tl = gsap.timeline({
    onComplete: () => {
      callbacks.onStageChange?.("complete");
      callbacks.onComplete?.();
    },
  });

  // ═══════════════════════════════════════════════════════════════
  // TOTAL DURATION: ~16.5 seconds of cinematic power-up
  // Order: Floor → Stars → Globe → Laptop → Cubes → UI
  // ═══════════════════════════════════════════════════════════════

  // ── SCENE FADE-IN (0s → 2.5s) ──
  // Very slow fade from black so the eye adjusts
  tl.to(
    values,
    {
      sceneOpacity: 1,
      duration: 2.5,
      ease: "power2.inOut",
      onUpdate: update,
    },
    0
  );

  // ── STAGE 1: FLOOR GRID IGNITION (0.5s → 5s) ──
  // 4.5 seconds — perspective grid illuminates outward from center
  tl.add(() => callbacks.onStageChange?.("floor"), 0.5);

  tl.to(
    values,
    {
      floorOpacity: 1,
      duration: 4.5,
      ease: "power2.inOut",
      onUpdate: update,
    },
    0.5
  );

  // Electrical flicker: unstable power flow during early boot (2s → 4s)
  tl.to(
    values,
    {
      floorFlicker: 0.25,
      duration: 0.08,
      repeat: 12,
      yoyo: true,
      ease: "rough({ template: none, strength: 1.2, points: 16, taper: 'none', randomize: true, clamp: true })",
      onUpdate: update,
    },
    2
  );

  // Power stabilizes (4s → 5s)
  tl.to(
    values,
    {
      floorFlicker: 1,
      duration: 1,
      ease: "power2.out",
      onUpdate: update,
    },
    4
  );

  // Brief power surge at 5s (capacitor discharge into the grid)
  tl.to(
    values,
    {
      floorFlicker: 1.4,
      duration: 0.15,
      yoyo: true,
      repeat: 1,
      ease: "power2.inOut",
      onUpdate: update,
    },
    5
  );

  // ── STAGE 2: DEEP STARFIELD EMERGENCE (2.5s → 6.5s) ──
  // 4 seconds — deep space slowly revealing itself behind the grid
  tl.add(() => callbacks.onStageChange?.("stars"), 2.5);

  tl.to(
    values,
    {
      starsOpacity: 1,
      duration: 4,
      ease: "power2.inOut",
      onUpdate: update,
    },
    2.5
  );

  // ── STAGE 3: REACTOR GLOBE WARM-UP (5s → 9s) ──
  // 4 seconds total — dark metal transitions to crimson core over 1.8s
  // then holds with holographic flicker
  tl.add(() => callbacks.onStageChange?.("globe"), 5);

  tl.to(
    values,
    {
      globeOpacity: 1,
      duration: 1.8,
      ease: "power2.inOut",
      onUpdate: update,
    },
    5
  );

  // Globe has a "hologram flicker" as it fully materializes (7s → 8s)
  tl.to(
    values,
    {
      globeOpacity: 0.5,
      duration: 0.05,
      repeat: 10,
      yoyo: true,
      ease: "rough({ strength: 1, points: 8, randomize: true })",
      onUpdate: update,
    },
    7
  );

  tl.to(
    values,
    {
      globeOpacity: 1,
      duration: 1,
      ease: "power2.out",
      onUpdate: update,
    },
    8
  );

  // ── STAGE 4: LAPTOP SMOOTH MATERIALIZATION (8.5s → 10.0s) ──
  // 1.5 seconds — premium cinematic scale-in, zero flicker
  tl.add(() => callbacks.onStageChange?.("laptop"), 8.5);

  tl.to(
    values,
    {
      laptopOpacity: 1,
      duration: 1.5,
      ease: "back.out(1.1)",
      onUpdate: update,
    },
    8.5
  );

  // ── STAGE 5: TECH CUBES MATERIALIZE (10.5s → 14.5s) ──
  // 4 seconds — crystalline objects phasing in
  tl.add(() => callbacks.onStageChange?.("cubes"), 10.5);

  tl.to(
    values,
    {
      cubesOpacity: 1,
      duration: 4,
      ease: "power2.inOut",
      onUpdate: update,
    },
    10.5
  );

  // ── STAGE 6: UI OVERLAY & NAVBAR REVEAL (13.5s → 16.5s) ──
  // 3 seconds — HUD elements fading in last
  tl.add(() => callbacks.onStageChange?.("ui"), 13.5);

  tl.to(
    values,
    {
      uiOpacity: 1,
      duration: 3,
      ease: "power3.out",
      onUpdate: update,
    },
    13.5
  );

  return tl;
}
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

export function CinematicCamera({
  scrollProgress,
  lensDistortion = 0,
}: {
  scrollProgress: number;
  lensDistortion?: number;
}) {
  const currentPos = useRef(new THREE.Vector3(0.5, 0.5, 8));
  const currentLookAt = useRef(new THREE.Vector3(0.8, 0, -1));
  const currentFov = useRef(45);

  // Station 1 is the hard-locked hero position — camera must be frozen here
  // until the user physically scrolls. Clamp to 0 to prevent any drift.
  const clampedProgress = Math.max(0, Math.min(1, scrollProgress));

  useFrame((state) => {
    const camera = state.camera as THREE.PerspectiveCamera;

    // Camera locked at Station 1 — landing page phase
    if (clampedProgress <= 0.75) {
      const s1 = sceneCoordinates[0];
      camera.position.copy(s1.camera);
      camera.lookAt(s1.lookAt);
      camera.fov = s1.fov + lensDistortion * 15;
      camera.updateProjectionMatrix();
      currentPos.current.copy(s1.camera);
      currentLookAt.current.copy(s1.lookAt);
      currentFov.current = s1.fov;
      return;
    }

    // 0.75 → 1.0: Two-segment transition: S1→S2 (0.75→0.875), S2→S3 (0.875→1.0)
    let fromIdx = 0;
    let toIdx = 1;
    let localT = (clampedProgress - 0.75) / 0.25;

    if (localT <= 0.5) {
      // First half: Station 1 → Station 2
      localT = localT / 0.5;
      fromIdx = 0;
      toIdx = 1;
    } else {
      // Second half: Station 2 → Station 3
      localT = (localT - 0.5) / 0.5;
      fromIdx = 1;
      toIdx = 2;
    }

    const easedT = localT * localT * (3.0 - 2.0 * localT);
    const from = sceneCoordinates[fromIdx];
    const to = sceneCoordinates[toIdx];

    currentPos.current.lerpVectors(from.camera, to.camera, easedT);
    currentLookAt.current.lerpVectors(from.lookAt, to.lookAt, easedT);
    currentFov.current = THREE.MathUtils.lerp(from.fov, to.fov, easedT);

    camera.position.copy(currentPos.current);
    camera.lookAt(currentLookAt.current);
    camera.fov = currentFov.current + lensDistortion * 15;
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

## File: `src/animations/wormholeLaptop.ts`

```typescript
"use client";

import gsap from "gsap";

export type WormholePhase =
  | "idle"
  | "gravity"
  | "rift"
  | "emergence"
  | "landing"
  | "shockwave"
  | "complete";

export interface WormholeValues {
  // Phase 1: Gravitational Pull & Energy Implosion
  gravitationStrength: number;   // 0 → 1.0 → 0   (particle accretion pull)
  singularityGlow: number;       // 0 → 2.8 → 0   (central light leak intensity)
  floorWarp: number;             // 0 → 1.0 → 0   (grid depression / lensing)

  // Phase 2: Spatial Rift & Event Horizon
  riftScale: number;             // 0 → 1.2 → 0   (dimensional ring scale)
  riftRotation: number;          // 0 → 4π          (ring spin)
  riftOpacity: number;           // 0 → 1.0 → 0   (rift visibility)
  laptopEmergence: number;       // 0 → 1.0         (progress through rift)
  laptopEmergenceY: number;      // -2.0 → 0        (vertical rise from below floor)
  laptopTiltX: number;           // 55° → 9°        (forward tilt while pushing through)
  lensDistortion: number;        // 0 → 0.12 → 0   (camera FOV pulse)

  // Phase 3: Heavy Inertia Landing
  laptopScale: number;           // 0 → 0.85 → 1.22 → 1.0  (physical overshoot)
  laptopY: number;               // 0 → -0.18 → 0   (dip & settle on Y)
  laptopRotationY: number;       // -π/2-0.55 → -π/2-0.15  (rotation lock-in)
  landingImpact: number;         // 0 → 1.0 → 0     (impact frame flash)

  // Phase 4: Shockwave & Rift Closure
  shockwaveRadius: number;       // 0 → 14          (expanding floor ring)
  shockwaveOpacity: number;      // 0 → 0.9 → 0     (shockwave visibility)
  energyRingOpacity: number;     // 0 → 1.0 → 0     (secondary energy ring)
  ambientTransition: number;     // 0 → 1.0         (light handoff to scene)
}

export interface WormholeCallbacks {
  onPhaseChange?: (phase: WormholePhase) => void;
  onValuesUpdate?: (values: WormholeValues) => void;
  onComplete?: () => void;
}

/**
 * ═══════════════════════════════════════════════════════════════════════
 * WORMHOLE MATERIALIZATION SEQUENCE
 * Total Duration: ~6.2 seconds
 * ═══════════════════════════════════════════════════════════════════════
 */
export function startWormholeSequence(callbacks: WormholeCallbacks) {
  const values: WormholeValues = {
    gravitationStrength: 0,
    singularityGlow: 0,
    floorWarp: 0,
    riftScale: 0,
    riftRotation: 0,
    riftOpacity: 0,
    laptopEmergence: 0,
    laptopEmergenceY: -2.0,
    laptopTiltX: 55,
    lensDistortion: 0,
    laptopScale: 0,
    laptopY: 0,
    laptopRotationY: -Math.PI / 2 - 0.55,
    landingImpact: 0,
    shockwaveRadius: 0,
    shockwaveOpacity: 0,
    energyRingOpacity: 0,
    ambientTransition: 0,
  };

  const update = () => callbacks.onValuesUpdate?.({ ...values });

  const tl = gsap.timeline({
    onComplete: () => {
      callbacks.onPhaseChange?.("complete");
      callbacks.onComplete?.();
    },
  });

  // ═══════════════════════════════════════════════════════════════
  // PHASE 1: GRAVITATIONAL PULL & ENERGY IMPLOSION
  // Duration: 0s → 1.8s
  // Space bends inward. Particles violently sucked toward
  // the central singularity. Crimson light leaks intensify.
  // ═══════════════════════════════════════════════════════════════
  tl.add(() => callbacks.onPhaseChange?.("gravity"), 0);

  tl.to(values, {
    gravitationStrength: 1,
    duration: 1.2,
    ease: "power3.in",
    onUpdate: update,
  }, 0);

  tl.to(values, {
    singularityGlow: 2.8,
    duration: 1.0,
    ease: "power2.inOut",
    onUpdate: update,
  }, 0.2);

  tl.to(values, {
    floorWarp: 1,
    duration: 1.5,
    ease: "power4.in",
    onUpdate: update,
  }, 0);

  // ═══════════════════════════════════════════════════════════════
  // PHASE 2: SPATIAL RIFT & EVENT HORIZON EMERGENCE
  // Duration: 1.2s → 3.4s
  // A narrow dimensional rift tears open. The laptop pushes
  // through the event horizon, tilted forward, bending light.
  // ═══════════════════════════════════════════════════════════════
  tl.add(() => callbacks.onPhaseChange?.("rift"), 1.2);

  // Rift violently opens with back-out overshoot
  tl.to(values, {
    riftScale: 1.2,
    riftOpacity: 1,
    duration: 0.7,
    ease: "back.out(2.2)",
    onUpdate: update,
  }, 1.2);

  // Rift spins at high velocity
  tl.to(values, {
    riftRotation: Math.PI * 4,
    duration: 2.2,
    ease: "none",
    onUpdate: update,
  }, 1.2);

  // Gravity pull releases as rift stabilizes
  tl.to(values, {
    gravitationStrength: 0,
    duration: 0.8,
    ease: "power3.out",
    onUpdate: update,
  }, 1.6);

  // Singularity dims slightly as rift opens
  tl.to(values, {
    singularityGlow: 1.2,
    duration: 0.8,
    ease: "power2.out",
    onUpdate: update,
  }, 2.0);

  // ── Laptop begins pushing through the event horizon ──
  tl.add(() => callbacks.onPhaseChange?.("emergence"), 1.8);

  tl.to(values, {
    laptopEmergence: 1,
    laptopEmergenceY: 0,
    laptopScale: 0.85,
    duration: 1.6,
    ease: "power2.inOut",
    onUpdate: update,
  }, 1.8);

  tl.to(values, {
    laptopTiltX: 9,
    duration: 1.6,
    ease: "power3.out",
    onUpdate: update,
  }, 1.8);

  // Camera lens distortion pulse — spatial snap as laptop breaks through
  tl.to(values, {
    lensDistortion: 0.14,
    duration: 0.18,
    ease: "power2.out",
    yoyo: true,
    repeat: 1,
    onUpdate: update,
  }, 2.6);

  // ═══════════════════════════════════════════════════════════════
  // PHASE 3: HEAVY INERTIA LANDING & MOMENTUM SETTLE
  // Duration: 3.4s → 5.0s
  // The laptop slams down with massive physical weight.
  // Elastic overshoot on scale. Bounce settle on Y-axis.
  // ═══════════════════════════════════════════════════════════════
  tl.add(() => callbacks.onPhaseChange?.("landing"), 3.4);

  // Heavy overshoot: scale punches past 1.0 then locks
  tl.to(values, {
    laptopScale: 1.22,
    duration: 0.35,
    ease: "power4.out",
    onUpdate: update,
  }, 3.4);

  tl.to(values, {
    laptopScale: 1.0,
    duration: 0.9,
    ease: "elastic.out(1, 0.45)",
    onUpdate: update,
  }, 3.75);

  // Physical weight: dip down on Y then bounce to rest
  tl.to(values, {
    laptopY: -0.18,
    duration: 0.25,
    ease: "power3.out",
    onUpdate: update,
  }, 3.4);

  tl.to(values, {
    laptopY: 0,
    duration: 0.7,
    ease: "bounce.out",
    onUpdate: update,
  }, 3.65);

  // Rotation locks into final hero stance
  tl.to(values, {
    laptopRotationY: -Math.PI / 2 - 0.15,
    duration: 1.3,
    ease: "power3.out",
    onUpdate: update,
  }, 3.4);

  // Landing impact frame flash
  tl.to(values, {
    landingImpact: 1,
    duration: 0.08,
    ease: "power4.out",
    onUpdate: update,
  }, 3.4);

  tl.to(values, {
    landingImpact: 0,
    duration: 0.9,
    ease: "power2.out",
    onUpdate: update,
  }, 3.48);

  // Rift begins collapsing as laptop locks in
  tl.to(values, {
    riftScale: 0,
    riftOpacity: 0,
    duration: 0.7,
    ease: "power4.in",
    onUpdate: update,
  }, 3.6);

  // ═══════════════════════════════════════════════════════════════
  // PHASE 4: ENVIRONMENTAL SHOCKWAVE & RIFT CLOSURE
  // Duration: 4.2s → 6.2s
  // Radial energy wave expands across the grid floor.
  // Rift snaps shut. Light smoothly hands off to ambient scene.
  // ═══════════════════════════════════════════════════════════════
  tl.add(() => callbacks.onPhaseChange?.("shockwave"), 4.2);

  // Expanding shockwave ring across floor
  tl.to(values, {
    shockwaveRadius: 14,
    duration: 1.8,
    ease: "power2.out",
    onUpdate: update,
  }, 4.2);

  tl.to(values, {
    shockwaveOpacity: 0.9,
    duration: 0.25,
    ease: "power2.out",
    onUpdate: update,
  }, 4.2);

  tl.to(values, {
    shockwaveOpacity: 0,
    duration: 1.55,
    ease: "power2.out",
    onUpdate: update,
  }, 4.45);

  // Secondary energy ring
  tl.to(values, {
    energyRingOpacity: 1,
    duration: 0.3,
    ease: "power2.out",
    onUpdate: update,
  }, 4.2);

  tl.to(values, {
    energyRingOpacity: 0,
    duration: 1.6,
    ease: "power2.out",
    onUpdate: update,
  }, 4.5);

  // Smooth light handoff to scene ambient
  tl.to(values, {
    ambientTransition: 1,
    duration: 2.0,
    ease: "power2.inOut",
    onUpdate: update,
  }, 4.2);

  // Singularity light dims into ambient reactor glow
  tl.to(values, {
    singularityGlow: 0,
    duration: 2.2,
    ease: "power2.out",
    onUpdate: update,
  }, 4.2);

  tl.to(values, {
    floorWarp: 0,
    duration: 1.5,
    ease: "power2.out",
    onUpdate: update,
  }, 4.5);

  return tl;
}
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

@keyframes navItemSlideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
  /* Only animate opacity — transform is controlled by inline React style */
  animation: stage-reveal-opacity 1.5s ease-out 0.3s forwards;
}

@keyframes stage-reveal-opacity {
  from { opacity: 0; }
  to { opacity: 1; }
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


/* ═══════════════════════════════════════════════════════════════════════
   CINEMATIC BREACH ENHANCEMENTS
   ═══════════════════════════════════════════════════════════════════════ */

/* Enhanced spin animations for breach rings */
@keyframes breach-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes breach-spin-reverse {
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
}

@keyframes breach-pulse {
  0%, 100% { 
    filter: drop-shadow(0 0 15px rgba(255, 0, 51, 0.4));
    opacity: 0.9;
  }
  50% { 
    filter: drop-shadow(0 0 30px rgba(255, 0, 51, 0.7)) drop-shadow(0 0 60px rgba(255, 0, 51, 0.3));
    opacity: 1;
  }
}

@keyframes singularity-glow {
  0%, 100% {
    box-shadow: 0 0 30px rgba(255, 0, 51, 0.5), inset 0 0 30px rgba(255, 0, 51, 0.2);
  }
  33% {
    box-shadow: 0 0 50px rgba(255, 50, 50, 0.6), inset 0 0 40px rgba(255, 50, 50, 0.3);
  }
  66% {
    box-shadow: 0 0 40px rgba(255, 100, 100, 0.5), inset 0 0 35px rgba(255, 100, 100, 0.25);
  }
}

/* Logo emergence animation */
.logo-emerge {
  animation: logo-emerge 2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes logo-emerge {
  0% {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
    filter: blur(20px) brightness(3);
  }
  30% {
    transform: scale(0.3) rotate(-60deg);
    opacity: 0.3;
    filter: blur(10px) brightness(2);
  }
  60% {
    transform: scale(0.8) rotate(-10deg);
    opacity: 0.8;
    filter: blur(3px) brightness(1.5);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
    filter: blur(0) brightness(1);
  }
}

/* Chromatic aberration text effect */
.chromatic-text {
  position: relative;
}
.chromatic-text::before,
.chromatic-text::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.chromatic-text::before {
  color: #ff0033;
  transform: translate(-2px, -1px);
  opacity: 0.7;
  filter: blur(0.5px);
}
.chromatic-text::after {
  color: #00f0ff;
  transform: translate(2px, 1px);
  opacity: 0.7;
  filter: blur(0.5px);
}

/* Spacetime distortion overlay */
.spacetime-distort {
  position: relative;
  overflow: hidden;
}
.spacetime-distort::before {
  content: "";
  position: absolute;
  inset: -50%;
  background: radial-gradient(
    ellipse at center,
    transparent 0%,
    rgba(255, 0, 51, 0.03) 30%,
    transparent 60%
  );
  animation: distort-rotate 20s linear infinite;
  pointer-events: none;
}

@keyframes distort-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Enhanced scanline flicker */
@keyframes scanline-flicker-breach {
  0%, 100% { opacity: 0.015; }
  50% { opacity: 0.035; }
}

/* Breach phase indicator */
.breach-phase {
  position: relative;
}
.breach-phase::after {
  content: "";
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #ff0033, #ff3366, #00f0ff);
  background-size: 200% 100%;
  animation: phase-scan 2s linear infinite;
}

@keyframes phase-scan {
  0% { background-position: 0% 0%; }
  100% { background-position: 200% 0%; }
}

/* ═══════ BREACH LOGO FIXES ═══════ */

.logo-breach-container {
  will-change: transform, opacity, filter;
}

.logo-breach-container svg {
  animation: logo-breathe 3s ease-in-out infinite;
}

@keyframes logo-breathe {
  0%, 100% {
    filter: drop-shadow(0 0 12px rgba(255, 0, 51, 0.6));
  }
  50% {
    filter: drop-shadow(0 0 20px rgba(255, 0, 51, 0.9)) drop-shadow(0 0 40px rgba(255, 0, 51, 0.3));
  }
}

/* Terminal log styling for breach phase */
.terminal-breach-log {
  color: #ff0033 !important;
  text-shadow: 0 0 8px rgba(255, 0, 51, 0.6) !important;
  font-family: var(--font-jetbrains-mono), monospace !important;
  font-size: 11px !important;
  letter-spacing: 0.15em !important;
  margin-bottom: 4px !important;
  text-transform: uppercase !important;
}

@keyframes p-blink {
  0%, 100% { opacity: 1; filter: brightness(1); }
  45% { opacity: 1; filter: brightness(1.2); }
  50% { opacity: 0.3; filter: brightness(2); }
  55% { opacity: 1; filter: brightness(1); }
  70% { opacity: 0.85; filter: brightness(1.3); }
  75% { opacity: 1; filter: brightness(1); }
}

@keyframes p-flicker {
  0%, 90%, 100% { opacity: 1; }
  92% { opacity: 0.7; }
  94% { opacity: 0.2; }
  96% { opacity: 0.9; }
  98% { opacity: 0.4; }
}

@keyframes glitch-pulse {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.02); }
}

@keyframes spin-reverse {
  from { transform: rotate(0deg); }
  to { transform: rotate(-360deg); }
}

/* ═══════════════════════════════════════════════════════════════════════
   CINEMATIC HERO — ADDITIONAL CSS
   Append this to src/app/globals.css or keep as hero-additions.css
   ═══════════════════════════════════════════════════════════════════════ */

/* Glass panel base class (used in DashboardHero className) */
.hero-glass-panel {
  position: relative;
  overflow: hidden;
}

/* Scanline animation for volumetric light beam */
@keyframes beam-scan {
  0% { transform: translateY(0); }
  100% { transform: translateY(8px); }
}

/* Floating stat orb — right side (Projects) */
@keyframes hero-float-1 {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}

/* Floating stat orb — left side (Years Exp) */
@keyframes hero-float-2 {
  0%, 100% { transform: translateY(0px) rotate(12deg); }
  50% { transform: translateY(-10px) rotate(12deg); }
}

/* Ambient border glow pulse during stabilization phase */
@keyframes border-glow-pulse {
  0%, 100% {
    box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.14),
                inset 0 0 50px rgba(255, 23, 68, 0.08),
                0 0 60px rgba(255, 23, 68, 0.18),
                0 0 120px rgba(255, 23, 68, 0.08),
                0 50px 120px rgba(0, 0, 0, 0.85);
  }
  50% {
    box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.16),
                inset 0 0 60px rgba(255, 23, 68, 0.12),
                0 0 80px rgba(255, 23, 68, 0.25),
                0 0 140px rgba(255, 23, 68, 0.12),
                0 50px 120px rgba(0, 0, 0, 0.85);
  }
}
@keyframes beam-scan {
  0% { transform: translateY(0); }
  100% { transform: translateY(8px); }
}

@keyframes hero-float-1 {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}

@keyframes hero-float-2 {
  0%, 100% { transform: translateY(0px) rotate(12deg); }
  50% { transform: translateY(-10px) rotate(12deg); }
}

@keyframes border-glow-pulse {
  0%, 100% {
    box-shadow: inset 0 1px 1px rgba(255,255,255,0.14),
                inset 0 0 50px rgba(255,23,68,0.08),
                0 0 60px rgba(255,23,68,0.18),
                0 0 120px rgba(255,23,68,0.08),
                0 50px 120px rgba(0,0,0,0.85);
  }
  50% {
    box-shadow: inset 0 1px 1px rgba(255,255,255,0.16),
                inset 0 0 60px rgba(255,23,68,0.12),
                0 0 80px rgba(255,23,68,0.25),
                0 0 140px rgba(255,23,68,0.12),
                0 50px 120px rgba(0,0,0,0.85);
  }
}

@keyframes corner-draw {
  0% {
    stroke-dashoffset: 80;
    opacity: 0;
  }
  100% {
    stroke-dashoffset: 0;
    opacity: 1;
  }
}

.corner-bracket-path {
  stroke-dasharray: 80;
  stroke-dashoffset: 80;
  opacity: 0;
}

.corner-bracket-path.active,
.has-emerged .corner-bracket-path {
  animation: corner-draw 1.1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

```

## File: `src/app/layout.tsx`

```typescript
import type { Metadata } from "next";
import "./globals.css";
import Cursor from "@/components/ui/Cursor";

import { AudioProvider } from "@/context/AudioContext";

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
        <AudioProvider>
          <Cursor />

          {children}
        </AudioProvider>
      </body>
    </html>
  );
}
```

## File: `src/app/page.tsx`

```typescript
"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { start3DPowerUpSequence, PowerUpStage, PowerUpStageValues } from "@/animations/powerUpSequence";
import { startWormholeSequence, WormholeValues, WormholePhase } from "@/animations/wormholeLaptop";
import Loader from "@/components/ui/Loader";
import WelcomeText from "@/components/ui/WelcomeText";
import CinematicHUD from "@/components/ui/CinematicHUD";

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

const DEFAULT_WORMHOLE_VALUES: WormholeValues = {
  gravitationStrength: 0,
  singularityGlow: 0,
  floorWarp: 0,
  riftScale: 0,
  riftRotation: 0,
  riftOpacity: 0,
  laptopEmergence: 0,
  laptopEmergenceY: -2.0,
  laptopTiltX: 55,
  lensDistortion: 0,
  laptopScale: 0,
  laptopY: 0,
  laptopRotationY: -Math.PI / 2 - 0.55,
  landingImpact: 0,
  shockwaveRadius: 0,
  shockwaveOpacity: 0,
  energyRingOpacity: 0,
  ambientTransition: 0,
};

export default function Home() {
  const [loaderComplete, setLoaderComplete] = useState(false);
  const [showWelcomeText, setShowWelcomeText] = useState(false);

  const [powerUpStage, setPowerUpStage] = useState<PowerUpStage>("idle");
  const [powerUpValues, setPowerUpValues] = useState<PowerUpStageValues>({
    sceneOpacity: 0,
    floorOpacity: 0,
    floorFlicker: 1,
    laptopOpacity: 0,
    globeOpacity: 0,
    starsOpacity: 0,
    cubesOpacity: 0,
    uiOpacity: 0,
  });

  const [wormholePhase, setWormholePhase] = useState<WormholePhase>("idle");
  const [wormholeValues, setWormholeValues] = useState<WormholeValues>(DEFAULT_WORMHOLE_VALUES);

  const [scrollProgress, setScrollProgress] = useState(0);

  // Scroll progress — derived from window.scrollY through the 250vh hero track.
  // CSS sticky (on the inner element) provides the pinned experience.
  // No GSAP DOM manipulation = no React reconciliation conflict.
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const hero = heroRef.current;
      if (!hero) return;
      // The outer div is 250vh. The pin region is the extra 150vh beyond the viewport.
      const scrollTrack = hero.offsetHeight - window.innerHeight;
      if (scrollTrack <= 0) return;
      const heroTop = hero.getBoundingClientRect().top + window.scrollY;
      const scrolled = Math.max(0, window.scrollY - heroTop);
      setScrollProgress(Math.min(1, scrolled / scrollTrack));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // seed on mount
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const stageScale = useStageScale();

  const handleLoaderComplete = () => {
    setLoaderComplete(true);
    setShowWelcomeText(true);
    setPowerUpStage("welcome");
  };

  const handleWelcomeComplete = () => {
    setShowWelcomeText(false);

    start3DPowerUpSequence({
      onStageChange: (stage) => {
        setPowerUpStage(stage);
        if (stage === "laptop") {
          startWormholeSequence({
            onPhaseChange: (phase) => setWormholePhase(phase),
            onValuesUpdate: (vals) => setWormholeValues(vals),
            onComplete: () => {},
          });
        }
      },
      onValuesUpdate: (vals) => setPowerUpValues(vals),
      onComplete: () => {},
    });
  };

  const isPowerUpActive = loaderComplete && powerUpStage !== "complete" && powerUpStage !== "idle";
  const wormholeActive = wormholePhase !== "idle" && wormholePhase !== "complete";

  return (
    <main className="relative w-full bg-[#000000]">
      {/* LOADER */}
      {!loaderComplete && <Loader onComplete={handleLoaderComplete} />}

      {/* WELCOME TEXT */}
      {showWelcomeText && (
        <WelcomeText onComplete={handleWelcomeComplete} layoutMode="stacked" />
      )}

      {/* PINNED HERO TRACK — 250vh outer creates the scroll distance.
          Inner sticky div stays fixed at top while user scrolls through it.
          CSS sticky = zero DOM mutation = React-safe. */}
      <div ref={heroRef} className="relative w-full" style={{ height: "250vh" }}>
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          {/* 3D SCENE */}
          <div
            className="absolute inset-0 z-0 pointer-events-auto"
            style={{
              opacity: showWelcomeText || powerUpStage === "welcome" ? 0 : powerUpValues.sceneOpacity,
            }}
          >
            <Scene
              scrollProgress={scrollProgress}
              powerUpStage={powerUpStage}
              powerUpValues={powerUpValues}
              isPowerUpActive={isPowerUpActive}
              wormholeValues={wormholeValues}
              wormholeActive={wormholeActive}
              lensDistortion={wormholeValues.lensDistortion}
            />
          </div>

          {/* ═══ CHROMATIC ABERRATION OVERLAY (CSS) — vignette now handled by WebGL PostProcessing ═══ */}
          {(powerUpStage === "ui" || powerUpStage === "complete") && (
            <div
              className="absolute inset-0 z-[6] pointer-events-none mix-blend-screen"
              style={{
                background: [
                  "radial-gradient(ellipse at 0% 50%, rgba(255,0,60,0.06) 0%, transparent 40%)",
                  "radial-gradient(ellipse at 100% 50%, rgba(0,220,255,0.05) 0%, transparent 40%)",
                  "radial-gradient(ellipse at 50% 0%, rgba(255,0,60,0.04) 0%, transparent 30%)",
                  "radial-gradient(ellipse at 50% 100%, rgba(0,220,255,0.04) 0%, transparent 30%)",
                ].join(", "),
              }}
            />
          )}

          {/* CINEMATIC HUD OVERLAY */}
          <CinematicHUD visible={powerUpStage === "ui" || powerUpStage === "complete"} />
        </div>
      </div>

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
  uniform float uIgnition;
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

    // ═══════════════════════════════════════════════════════════════
    // WARM-UP IGNITION — dark metal transitions to crimson core
    // ═══════════════════════════════════════════════════════════════
    vec3 darkMetal = vec3(0.015, 0.003, 0.005);
    vec3 crimsonCore = uColor;
    vec3 col = mix(darkMetal, crimsonCore, uIgnition);
    
    // Grid lines brighten with ignition
    if (gridPattern > 0.01) {
      col = mix(col, vec3(1.0, 0.5, 0.6), gridPattern * 0.5 * uIgnition);
    }

    // Smoothstep-like ignition curve for organic warm-up feel
    float ignitionBoost = uIgnition * uIgnition * (3.0 - 2.0 * uIgnition);
    
    float alpha = uOpacity * ignitionBoost * (gridPattern * 0.6 + 0.15) * (0.7 + 0.3 * scanline);
    alpha += fresnel * 0.35 * (0.8 + 0.2 * scanline) * ignitionBoost;

    gl_FragColor = vec4(col, alpha);
  }
`;

interface DeepSpaceGlobeProps {
  scrollProgress: number;
  globeOpacity?: number;
}

export default function DeepSpaceGlobe({ scrollProgress, globeOpacity = 1 }: DeepSpaceGlobeProps) {
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
      uIgnition: { value: 0.0 },
    }),
    []
  );

  const secondUniforms = useMemo(
    () => ({
      uTime: { value: 0.0 },
      uSpeed: { value: 1.4 },
      uColor: { value: new THREE.Color("#ff4444") },
      uOpacity: { value: 0.28 },
      uIgnition: { value: 0.0 },
    }),
    []
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (mainShaderRef.current) {
      mainShaderRef.current.uniforms.uTime.value = t;
      mainShaderRef.current.uniforms.uIgnition.value = globeOpacity;
    }
    if (secondShaderRef.current) {
      secondShaderRef.current.uniforms.uTime.value = t;
      secondShaderRef.current.uniforms.uIgnition.value = globeOpacity;
    }

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
      {/* Core point lights — intensity scales with warm-up for real-time floor reflections */}
      <pointLight position={[0, 0, 2.2]} color="#ff1744" intensity={2.0 * globeOpacity} distance={15} decay={2} />
      <pointLight position={[-2.2, 1.8, 0.5]} color="#ff8a80" intensity={0.5 * globeOpacity} distance={10} decay={2} />

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
          <meshBasicMaterial color="#ff1744" wireframe transparent opacity={0.12 * globeOpacity} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>

        {/* Inner glow sphere */}
        <mesh>
          <sphereGeometry args={[1.02, 48, 24]} />
          <meshBasicMaterial color="#800010" transparent opacity={0.04 * globeOpacity} blending={THREE.AdditiveBlending} depthWrite={false} />
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
              opacity={(index === 1 ? 0.22 : 0.12) * globeOpacity}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* Outer atmosphere glow */}
      <mesh scale={[1.75, 1.75, 1.75]}>
        <sphereGeometry args={[1.1, 42, 24]} />
        <meshBasicMaterial color="#ff1744" transparent opacity={0.03 * globeOpacity} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}
```

## File: `src/components/canvas/FloatingDebris.tsx`

```typescript
"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useMousePosition } from "@/hooks/useMousePosition";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES — Strict, zero `any`
// ═══════════════════════════════════════════════════════════════════════════════

interface AnimationValues {
  beamOpacity: number;
  beamScaleY: number;
  glassOpacity: number;
  htmlOpacity: number;
  htmlBlur: number;
  panelZ: number;
  panelRotateX: number;
  panelScale: number;
  chromaticAberration: number;
  wireframeScale: number;
  floorOpacity: number;
  debrisOpacity: number;
  rimPulse: number;
  hasEmerged: boolean;
  sourceGlow: number;
  brightness: number;
  emergenceProgress: number;
  dissipationProgress: number;
  panelY: number;
  hoverPhase: number;
}

interface FloatingDebrisProps {
  visible: boolean;
  isMobile: boolean;
  animRef: React.RefObject<AnimationValues>;
}

interface ShardConfig {
  orbitA: number;
  orbitB: number;
  orbitSpeed: number;
  orbitPhase: number;
  inclinationX: number;
  inclinationY: number;
  inclinationZ: number;
  spinAxis: THREE.Vector3;
  spinSpeed: number;
  baseSize: number;
  color: THREE.Color;
  emissive: THREE.Color;
  repulsionStrength: number;
  formationDelay: number;
}

interface ChipConfig {
  text: string;
  basePos: THREE.Vector3;
  phase: number;
  speed: number;
  scale: number;
  parallaxFactor: number;
  rotationSpeed: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const SHARD_COUNT_DESKTOP = 30;
const SHARD_COUNT_MOBILE = 8;
const CHIP_COUNT_DESKTOP = 12;
const CHIP_COUNT_MOBILE = 4;
const DUST_COUNT_DESKTOP = 80;
const DUST_COUNT_MOBILE = 0;

const PALETTE: { color: THREE.Color; emissive: THREE.Color; weight: number }[] = [
  { color: new THREE.Color("#ff1744"), emissive: new THREE.Color("#ff0033"), weight: 0.35 },
  { color: new THREE.Color("#ff3355"), emissive: new THREE.Color("#ff6688"), weight: 0.35 },
  { color: new THREE.Color("#800010"), emissive: new THREE.Color("#400008"), weight: 0.25 },
  { color: new THREE.Color("#ffffff"), emissive: new THREE.Color("#ffcccc"), weight: 0.05 },
];

const CHIP_TEXTS = [
  "01", "AP", "◢", "∴", "REACT", "NODE", "TS", "NEXT", "◤", "PY", "GO", "R3F",
];

// ═══════════════════════════════════════════════════════════════════════════════
// MATH UTILITIES — GC-free helpers
// ═══════════════════════════════════════════════════════════════════════════════

function weightedRandomEntry<T>(items: { value: T; weight: number }[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item.value;
  }
  return items[items.length - 1].value;
}

function damp(current: number, target: number, lambda: number, dt: number): number {
  return THREE.MathUtils.lerp(current, target, 1.0 - Math.exp(-lambda * dt));
}

// ═══════════════════════════════════════════════════════════════════════════════
// CANVAS TEXTURE FACTORY — JetBrains Mono holographic chips
// ═══════════════════════════════════════════════════════════════════════════════

function createChipTexture(text: string): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("[FloatingDebris] Canvas 2D context acquisition failed");

  // Transparent background
  ctx.clearRect(0, 0, size, size);

  // Outer glow pass (crimson)
  ctx.shadowColor = "#ff0033";
  ctx.shadowBlur = 60;
  ctx.font = "bold 96px 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ff1744";
  ctx.fillText(text, size / 2, size / 2);

  // Inner glow pass (bright core)
  ctx.shadowColor = "#ff99aa";
  ctx.shadowBlur = 25;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(text, size / 2, size / 2);

  // Subtle scanline overlay on texture
  ctx.globalCompositeOperation = "overlay";
  for (let y = 0; y < size; y += 4) {
    ctx.fillStyle = `rgba(255, 0, 30, ${0.03 + Math.random() * 0.04})`;
    ctx.fillRect(0, y, size, 1);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENT: HEX SHARD SYSTEM
// 30 instanced hexagonal prisms with elliptical orbits, magnetic repulsion,
// tumbling spin, and cinematic formation animation.
// ═══════════════════════════════════════════════════════════════════════════════

interface HexShardSystemProps {
  count: number;
  animRef: React.RefObject<AnimationValues>;
  mousePos: { x: number; y: number };
}

const HexShardSystem = React.memo(function HexShardSystem({
  count,
  animRef,
  mousePos,
}: HexShardSystemProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { camera } = useThree();

  // Scratch objects — persisted across frames to eliminate GC pressure
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const _pos = useMemo(() => new THREE.Vector3(), []);
  const _push = useMemo(() => new THREE.Vector3(), []);
  const _euler = useMemo(() => new THREE.Euler(), []);
  const _color = useMemo(() => new THREE.Color(), []);

  // Smooth formation & opacity
  const smoothForm = useRef(0);
  const smoothOpacity = useRef(0);

  // Generate shard configurations
  const shards = useMemo<ShardConfig[]>(() => {
    return Array.from({ length: count }, () => {
      const spinAxis = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize();

      const paletteEntry = weightedRandomEntry(
        PALETTE.map((p) => ({ value: p, weight: p.weight }))
      );

      return {
        orbitA: 2.0 + Math.random() * 2.6,
        orbitB: 1.3 + Math.random() * 1.7,
        orbitSpeed: (Math.random() - 0.5) * 0.45 + 0.18,
        orbitPhase: Math.random() * Math.PI * 2,
        inclinationX: (Math.random() - 0.5) * 1.4,
        inclinationY: (Math.random() - 0.5) * 0.8,
        inclinationZ: (Math.random() - 0.5) * 1.4,
        spinAxis,
        spinSpeed: (Math.random() - 0.5) * 3.5,
        baseSize: 0.02 + Math.random() * 0.06,
        color: paletteEntry.color.clone(),
        emissive: paletteEntry.emissive.clone(),
        repulsionStrength: 0.9 + Math.random() * 1.4,
        formationDelay: Math.random() * 0.6,
      };
    });
  }, [count]);

  // Hexagonal prism geometry — flattened into chip-like plates
  const geometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.5, 0.5, 1, 6);
    geo.scale(1, 0.22, 1);
    return geo;
  }, []);

  // Physical material for glass-like crystalline feel with emissive bloom
  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.15,
        roughness: 0.15,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        emissive: 0xff1744,
        emissiveIntensity: 0.35,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
      }),
    []
  );

  // Initialize instance colors & matrices
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    for (let i = 0; i < shards.length; i++) {
      mesh.setColorAt(i, shards[i].color);
      dummy.position.set(0, -999, 0);
      dummy.scale.setScalar(0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.instanceMatrix.needsUpdate = true;
  }, [shards, dummy]);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    const a = animRef.current;
    if (!mesh || !a) return;

    const dt = Math.min(delta, 0.05);
    const t = state.clock.getElapsedTime();

    // Gate visibility
    const targetOpacity = a.debrisOpacity * (a.hasEmerged ? 1 : 0);
    smoothOpacity.current = damp(smoothOpacity.current, targetOpacity, 10, dt);

    if (smoothOpacity.current <= 0.001) {
      mesh.visible = false;
      return;
    }
    mesh.visible = true;

    // Formation progress: shards spiral in from expanded orbits
    const rawForm = Math.max(0, (a.debrisOpacity - 0.1) / 0.9);
    smoothForm.current = damp(smoothForm.current, rawForm, 4, dt);
    const form = smoothForm.current;

    // Material pulse synced with hologram rim
    const pulse = 0.85 + 0.15 * Math.sin(t * 1.8) * a.rimPulse;
    material.opacity = smoothOpacity.current * pulse;
    material.emissiveIntensity = (0.25 + 0.2 * a.rimPulse) * smoothOpacity.current;

    // Mouse repulsor in local panel space
    // Panel faces camera via lookAt, so local XY ≈ screen space
    const repulsorX = mousePos.x * 5.5;
    const repulsorY = mousePos.y * 3.8;

    for (let i = 0; i < shards.length; i++) {
      const s = shards[i];
      const staggeredForm = Math.max(0, Math.min(1, (form - s.formationDelay) / (1 - s.formationDelay)));
      if (staggeredForm <= 0.001) {
        dummy.position.set(0, -999, 0);
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        continue;
      }

      // Elliptical orbit
      const angle = t * s.orbitSpeed + s.orbitPhase;
      const expand = 1.0 + (1.0 - staggeredForm) * 2.5; // Start far, spiral in
      _pos.set(
        Math.cos(angle) * s.orbitA * expand,
        Math.sin(angle) * s.orbitB * expand,
        0
      );

      // Apply 3D inclination to orbit plane
      _euler.set(s.inclinationX, s.inclinationY, s.inclinationZ);
      _pos.applyEuler(_euler);

      // Magnetic repulsion from cursor (world-space approx in local XY)
      _push.copy(_pos);
      _push.x -= repulsorX;
      _push.y -= repulsorY;
      const dist = _push.length();
      const repelRadius = 3.2;
      if (dist < repelRadius && dist > 0.001) {
        const force = Math.pow(1.0 - dist / repelRadius, 1.5) * s.repulsionStrength;
        _push.normalize().multiplyScalar(force);
        _pos.add(_push);
      }

      // Breathing scale
      const breathe = 1.0 + Math.sin(t * 2.2 + i * 0.7) * 0.06 * a.rimPulse;
      const scale = s.baseSize * staggeredForm * breathe;

      // Tumble rotation
      dummy.position.copy(_pos);
      dummy.scale.setScalar(scale);
      dummy.rotation.set(0, 0, 0);
      dummy.rotateOnAxis(s.spinAxis, t * s.spinSpeed + i * 1.3);
      dummy.updateMatrix();

      mesh.setMatrixAt(i, dummy.matrix);

      // Dynamic emissive color pulse per shard
      _color.copy(s.color).lerp(s.emissive, 0.3 + 0.2 * Math.sin(t * 3 + i));
      mesh.setColorAt(i, _color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={true}
      renderOrder={15}
    />
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENT: DATA CHIP SYSTEM
// 12 floating text chips rendered as canvas textures. They float in the
// foreground (closer to camera than panel) with 1.5x parallax reactivity.
// ═══════════════════════════════════════════════════════════════════════════════

interface DataChipSystemProps {
  count: number;
  animRef: React.RefObject<AnimationValues>;
  mousePos: { x: number; y: number };
}

const DataChipSystem = React.memo(function DataChipSystem({
  count,
  animRef,
  mousePos,
}: DataChipSystemProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Smooth parallax state
  const smoothMouse = useRef({ x: 0, y: 0 });
  const smoothForm = useRef(0);

  const chips = useMemo<ChipConfig[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      text: CHIP_TEXTS[i % CHIP_TEXTS.length],
      basePos: new THREE.Vector3(
        (Math.random() - 0.5) * 5.8,
        (Math.random() - 0.5) * 3.6,
        0.25 + Math.random() * 0.75 // Foreground layer
      ),
      phase: Math.random() * Math.PI * 2,
      speed: 0.2 + Math.random() * 0.45,
      scale: 0.09 + Math.random() * 0.13,
      parallaxFactor: 1.3 + Math.random() * 0.8,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
    }));
  }, [count]);

  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

  const materials = useMemo(() => {
    return chips.map((chip) => {
      const tex = createChipTexture(chip.text);
      return new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      });
    });
  }, [chips]);

  useFrame((state, delta) => {
    const group = groupRef.current;
    const a = animRef.current;
    if (!group || !a) return;

    const dt = Math.min(delta, 0.05);
    const t = state.clock.getElapsedTime();

    const targetOpacity = a.debrisOpacity * (a.hasEmerged ? 1 : 0);
    if (targetOpacity <= 0.001) {
      group.visible = false;
      return;
    }
    group.visible = true;

    // Smooth formation
    const rawForm = Math.max(0, (a.debrisOpacity - 0.15) / 0.85);
    smoothForm.current = damp(smoothForm.current, rawForm, 5, dt);
    const form = smoothForm.current;

    // Parallax at 1.5x panel rate (opposite direction for depth)
    const targetX = -mousePos.x * 0.55;
    const targetY = -mousePos.y * 0.42;
    smoothMouse.current.x += (targetX - smoothMouse.current.x) * 0.07;
    smoothMouse.current.y += (targetY - smoothMouse.current.y) * 0.07;

    group.children.forEach((child, i) => {
      if (i >= chips.length) return;
      const chip = chips[i];
      const mesh = child as THREE.Mesh;
      const mat = mesh.material as THREE.MeshBasicMaterial;

      const staggeredForm = Math.max(0, Math.min(1, (form - i * 0.04) / 0.7));

      // Organic bobbing
      const bobY = Math.sin(t * chip.speed + chip.phase) * 0.14;
      const bobX = Math.cos(t * chip.speed * 0.65 + chip.phase) * 0.07;
      const bobZ = Math.sin(t * chip.speed * 0.35 + chip.phase) * 0.05;

      // Parallax offset (1.5x rate as specified)
      const paraX = smoothMouse.current.x * chip.parallaxFactor;
      const paraY = smoothMouse.current.y * chip.parallaxFactor;

      mesh.position.set(
        chip.basePos.x + bobX + paraX,
        chip.basePos.y + bobY + paraY,
        chip.basePos.z + bobZ
      );

      // Gentle rotation
      mesh.rotation.z = Math.sin(t * chip.rotationSpeed + chip.phase) * 0.08;

      // Scale & opacity with formation
      const s = chip.scale * staggeredForm;
      mesh.scale.set(s, s, s);
      mat.opacity = targetOpacity * staggeredForm * (0.85 + 0.15 * Math.sin(t * 2 + i));
    });
  });

  return (
    <group ref={groupRef}>
      {chips.map((chip, i) => (
        <mesh
          key={`chip-${chip.text}-${i}`}
          geometry={geometry}
          material={materials[i]}
          renderOrder={16}
        />
      ))}
    </group>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENT: ATMOSPHERIC DUST
// Ultra-subtle crimson motes that drift around the hologram. Adds volumetric
// depth and sells the "physical light" illusion. Disabled on mobile.
// ═══════════════════════════════════════════════════════════════════════════════

interface AtmosphericDustProps {
  count: number;
  animRef: React.RefObject<AnimationValues>;
}

const AtmosphericDust = React.memo(function AtmosphericDust({
  count,
  animRef,
}: AtmosphericDustProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const smoothOpacity = useRef(0);

  const { positions, phases, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const ph = new Float32Array(count);
    const sz = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * 9;
      pos[i3 + 1] = (Math.random() - 0.5) * 5.5;
      pos[i3 + 2] = (Math.random() - 0.5) * 2.5;
      ph[i] = Math.random() * Math.PI * 2;
      sz[i] = 0.008 + Math.random() * 0.025;
    }
    return { positions: pos, phases: ph, sizes: sz };
  }, [count]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uOpacity: { value: 0 },
          uColor: { value: new THREE.Color("#ff1744") },
        },
        vertexShader: /* glsl */ `
          attribute float aPhase;
          attribute float aSize;
          varying float vAlpha;
          uniform float uTime;
          void main() {
            vAlpha = 0.3 + 0.25 * sin(uTime * 0.7 + aPhase);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = aSize * (45.0 / max(1.0, -mv.z));
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform float uOpacity;
          varying float vAlpha;
          void main() {
            vec2 uv = gl_PointCoord - vec2(0.5);
            float d = length(uv);
            if (d > 0.5) discard;
            float core = smoothstep(0.5, 0.0, d);
            float halo = smoothstep(0.5, 0.2, d) * 0.4;
            float alpha = (core + halo) * vAlpha * uOpacity;
            if (alpha < 0.003) discard;
            gl_FragColor = vec4(uColor * (1.0 + core * 0.5), alpha);
          }
        `,
      }),
    []
  );

  useFrame((state, delta) => {
    const points = pointsRef.current;
    const a = animRef.current;
    if (!points || !a || count === 0) return;

    const dt = Math.min(delta, 0.05);
    const t = state.clock.getElapsedTime();

    const targetOpacity = a.debrisOpacity * 0.3 * (a.hasEmerged ? 1 : 0);
    smoothOpacity.current = damp(smoothOpacity.current, targetOpacity, 8, dt);

    if (smoothOpacity.current <= 0.001) {
      points.visible = false;
      return;
    }
    points.visible = true;
    material.uniforms.uTime.value = t;
    material.uniforms.uOpacity.value = smoothOpacity.current;

    const posAttr = points.geometry.attributes.position;
    const posArray = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      posArray[i3] += Math.sin(t * 0.25 + phases[i]) * 0.0006;
      posArray[i3 + 1] += Math.cos(t * 0.18 + phases[i]) * 0.0005;
      posArray[i3 + 2] += Math.sin(t * 0.12 + phases[i]) * 0.0003;
    }
    posAttr.needsUpdate = true;
  });

  if (count === 0) return null;

  return (
    <points ref={pointsRef} material={material} renderOrder={13} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
      </bufferGeometry>
    </points>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT: FloatingDebris
// Orchestrates shards, chips, and dust into one cohesive debris field.
// ═══════════════════════════════════════════════════════════════════════════════

export default function FloatingDebris({
  visible,
  isMobile,
  animRef,
}: FloatingDebrisProps) {
  const mousePos = useMousePosition(0.08);

  if (!visible) return null;

  const shardCount = isMobile ? SHARD_COUNT_MOBILE : SHARD_COUNT_DESKTOP;
  const chipCount = isMobile ? CHIP_COUNT_MOBILE : CHIP_COUNT_DESKTOP;
  const dustCount = isMobile ? DUST_COUNT_MOBILE : DUST_COUNT_DESKTOP;

  return (
    <group name="FloatingDebrisRig">
      {/* Orbiting glass shards — elliptical hex prisms */}
      <HexShardSystem count={shardCount} animRef={animRef} mousePos={mousePos} />

      {/* Foreground data chips — canvas text textures */}
      <DataChipSystem count={chipCount} animRef={animRef} mousePos={mousePos} />

      {/* Atmospheric dust motes — volumetric depth */}
      <AtmosphericDust count={dustCount} animRef={animRef} />
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

import React, { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useMousePosition } from "@/hooks/useMousePosition";
import { WormholeValues } from "@/animations/wormholeLaptop";

const SCREEN_MATERIAL_NAME = "Material.004";

interface FloatingLaptopProps {
  powerUpStage?: string;
  laptopOpacity?: number;
  wormholeValues?: WormholeValues;
  wormholeActive?: boolean;
  laptopScreenRef?: React.MutableRefObject<THREE.Mesh | null>;
}

const TERMINAL_LINES = [
  "[ CORE ARCHITECTURE ONLINE ]",
  "> USER_IDENTITY: POSHAN_M_S",
  "> SYSTEM_STATUS: OPERATIONAL",
  "> SCROLL TO INITIALIZE HOLOGRAM INTERFACE_",
];

export default function FloatingLaptop({
  powerUpStage = "complete",
  laptopOpacity = 1,
  wormholeValues,
  wormholeActive = false,
  laptopScreenRef,
}: FloatingLaptopProps) {
  const { scene } = useGLTF("/models/laptop-baked.glb");

  const groupRef = useRef<THREE.Group>(null);
  const bobRef   = useRef<THREE.Group>(null);
  const kbLightRef = useRef<THREE.PointLight>(null);
  const mouse = useMousePosition(0.08);

  // ── Live terminal canvas texture refs & persistent animation state ────
  const canvasRef       = useRef<HTMLCanvasElement | null>(null);
  const textureRef      = useRef<THREE.CanvasTexture | null>(null);
  const screenMeshRef   = useRef<THREE.Mesh | null>(null);
  const textureDirtyRef = useRef(false);

  // Persistent typewriter & boot state
  const animRef = useRef({
    booting: false,
    bootStartTime: 0,
    booted: false,
    completedLines: [] as string[],
    currentText: "",
    lineIndex: 0,
    cursorVisible: true,
    phase: "typing" as "typing" | "waiting" | "clearing",
    waitCounter: 0,
    lastTypeTime: 0,
    lastBlinkTime: 0,
    initialized: false,
    locked: false,
  });

  useMemo(() => {
    // ═══════════════════════════════════════════════════════════════════
    // PBR MATERIAL TUNING — Gunmetal Chassis + Backlit Keyboard
    // ═══════════════════════════════════════════════════════════════════
    const chassisMaterial = new THREE.MeshStandardMaterial({
      color:             "#1a0a10",
      metalness:          0.80,
      roughness:          0.35,
      emissive:          "#0d0204",
      emissiveIntensity:  0.05,
    });

    const keyboardMaterial = new THREE.MeshStandardMaterial({
      color:             "#0f0508",
      metalness:          0.55,
      roughness:          0.48,
      emissive:          "#ff1744",
      emissiveIntensity:  0.18,
    });

    const trackpadMaterial = new THREE.MeshStandardMaterial({
      color:             "#14080c",
      metalness:          0.70,
      roughness:          0.25,
      emissive:          "#1a0005",
      emissiveIntensity:  0.04,
    });

    scene.updateMatrixWorld(true);

    scene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;

      mesh.castShadow    = true;
      mesh.receiveShadow = true;

      const mat = mesh.material as THREE.MeshStandardMaterial;
      const name = mesh.name.toLowerCase();

      if (mat && mat.name === SCREEN_MATERIAL_NAME) {
        screenMeshRef.current = mesh;
        if (laptopScreenRef) laptopScreenRef.current = mesh;
        mat.color.set("#050508");
        mat.emissive.set("#000000");
        mat.emissiveIntensity = 0; // Screen completely dark/off on load
        mat.roughness = 0.05;
        mat.metalness = 0.0;
        mat.toneMapped = false;
        mat.needsUpdate = true;
        return;
      }

      if (
        name.includes("keyboard") ||
        name.includes("keycap") ||
        name.includes("keys") ||
        (name.includes("key") && !name.includes("iskey"))
      ) {
        mesh.material = keyboardMaterial;
        return;
      }

      if (name.includes("trackpad") || name.includes("touchpad")) {
        mesh.material = trackpadMaterial;
        return;
      }

      mesh.material = chassisMaterial;
    });
  }, [scene, laptopScreenRef]);

  // Create canvas + texture once
  useEffect(() => {
    if (!canvasRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width  = 512;
      canvas.height = 320;
      canvasRef.current = canvas;

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      textureRef.current = texture;
    }
  }, []);

  // Attach texture to screen mesh as soon as it exists
  useEffect(() => {
    const id = setInterval(() => {
      const texture = textureRef.current;
      const mesh = screenMeshRef.current;
      if (texture && mesh) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (!mat.map) {
          mat.map = texture;
          mat.emissiveMap = texture;
          mat.emissive = new THREE.Color("#ff2244");
          mat.emissiveIntensity = 0;
          mat.needsUpdate = true;
          clearInterval(id);
        }
      }
    }, 50);
    return () => clearInterval(id);
  }, []);

  // Helper to draw terminal frame to canvas
  const drawTerminal = (screenOn: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const anim = animRef.current;

    // Pitch black if screen is off
    if (!screenOn) {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      textureDirtyRef.current = true;
      return;
    }

    // Black background
    ctx.fillStyle = "#050508";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle crimson scanlines
    for (let y = 0; y < canvas.height; y += 3) {
      ctx.fillStyle = "rgba(255,0,30,0.04)";
      ctx.fillRect(0, y, canvas.width, 1);
    }

    // Typography
    ctx.font = "bold 13.5px monospace";
    const lineH = 32, padX = 22, padY = 55;

    // Faded completed lines
    ctx.globalAlpha = 0.65;
    ctx.fillStyle   = "#ff2244";
    for (let i = 0; i < anim.completedLines.length; i++) {
      ctx.fillText(anim.completedLines[i], padX, padY + i * lineH);
    }

    // Active typing line — full brightness
    ctx.globalAlpha = 1.0;
    const curY = padY + anim.completedLines.length * lineH;
    ctx.fillText(anim.currentText, padX, curY);

    // 1Hz blinking cursor
    if (anim.cursorVisible) {
      const tw = ctx.measureText(anim.currentText).width;
      ctx.fillText("\u2588", padX + tw, curY);
    }

    ctx.globalAlpha = 1.0;
    textureDirtyRef.current = true;
  };

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const anim = animRef.current;

    // Determine if stage has reached UI or complete
    const isStageReady =
      powerUpStage === "ui" ||
      powerUpStage === "complete" ||
      (!wormholeActive && laptopOpacity >= 0.95);

    // Trigger boot sequence when stage is ready
    if (isStageReady && !anim.booted && !anim.booting) {
      anim.booting = true;
      anim.bootStartTime = t;
    }

    // Handle 1.0 second power-on screen flash
    if (anim.booting) {
      const elapsed = t - anim.bootStartTime;
      if (screenMeshRef.current) {
        const mat = screenMeshRef.current.material as THREE.MeshStandardMaterial;
        if (elapsed < 0.2) {
          // Rapid flash burst
          mat.emissiveIntensity = (elapsed / 0.2) * 1.2;
        } else if (elapsed < 0.6) {
          // Dip & settle
          mat.emissiveIntensity = 1.2 - ((elapsed - 0.2) / 0.4) * 0.6;
        } else if (elapsed < 1.0) {
          mat.emissiveIntensity = 0.6;
        } else {
          mat.emissiveIntensity = 0.6;
          anim.booting = false;
          anim.booted = true;
          anim.lastTypeTime = t;
          anim.lastBlinkTime = t;
        }
      }
    }

    // Initial pitch-black frame paint if screen is off
    if (!anim.initialized) {
      anim.initialized = true;
      drawTerminal(false);
    }

    // Run typewriter & cursor logic ONLY when booted or booting is complete
    if (anim.booted) {
      // Continuous 1Hz cursor blink (every 500ms)
      if (t - anim.lastBlinkTime > 0.5) {
        anim.cursorVisible = !anim.cursorVisible;
        anim.lastBlinkTime = t;
        drawTerminal(true);
      }

      // Typewriter Advance (every 45ms) until locked
      if (!anim.locked && t - anim.lastTypeTime > 0.045) {
        anim.lastTypeTime = t;
        const line = TERMINAL_LINES[anim.lineIndex];
        if (anim.currentText.length < line.length) {
          anim.currentText += line[anim.currentText.length];
          drawTerminal(true);
        } else {
          anim.completedLines.push(anim.currentText);
          anim.currentText = "";
          anim.lineIndex++;
          if (anim.lineIndex >= TERMINAL_LINES.length) {
            anim.locked = true; // Permanently locked — never reset or clear
            anim.cursorVisible = true;
          }
          drawTerminal(true);
        }
      }
    } else if (anim.booting) {
      drawTerminal(true);
    }

    // Upload updated canvas texture to GPU
    if (textureRef.current && textureDirtyRef.current) {
      textureRef.current.needsUpdate = true;
      textureDirtyRef.current = false;
    }

    // ═══════════════════════════════════════════════════════════════
    // WORMHOLE OVERRIDE — direct transform control during materialization
    // ═══════════════════════════════════════════════════════════════
    if (wormholeActive && wormholeValues && wormholeValues.laptopScale > 0.001) {
      const v = wormholeValues;

      if (groupRef.current) {
        const finalY = -0.52;
        const currentY = finalY + v.laptopEmergenceY + v.laptopY;

        groupRef.current.position.set(laptopX, currentY, -1.14);
        groupRef.current.rotation.set(
          (v.laptopTiltX * Math.PI) / 180,
          v.laptopRotationY,
          -0.03
        );
        groupRef.current.scale.setScalar(v.laptopScale * 1.21);
      }

      if (bobRef.current) {
        bobRef.current.position.y = 0;
      }

      if (kbLightRef.current) {
        const ambientRamp = Math.max(laptopOpacity, v.ambientTransition);
        kbLightRef.current.intensity = (0.8 + 1.2 * ambientRamp) * v.laptopScale;
        kbLightRef.current.distance = 3.5;
      }

      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // NORMAL MODE — bobbing & mouse reactivity
    // ═══════════════════════════════════════════════════════════════
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
      const proximity = Math.exp(-dist * dist * 4.0);

      kbLightRef.current.intensity = (0.8 + proximity * 2.5) * laptopOpacity;
      kbLightRef.current.distance = 2.5 + proximity * 2.0;
    }
  });

  const { width } = useThree((state) => state.viewport);
  const laptopX   = Math.max(0.8, width * 0.08);

  const effectiveOpacity = wormholeActive && wormholeValues
    ? Math.max(laptopOpacity, wormholeValues.laptopEmergence)
    : laptopOpacity;

  return (
    <group
      ref={groupRef}
      position={[laptopX, -0.52, -1.14]}
      rotation={[0.09, -Math.PI / 2 - 0.15, -0.03]}
      scale={wormholeActive && wormholeValues ? wormholeValues.laptopScale * 1.21 : laptopOpacity * 1.21}
    >
      <group ref={bobRef}>
        <primitive object={scene} />

        <spotLight
          position={[0, 3.0, 2.0]}
          target-position={[0, 0, 0]}
          angle={0.55}
          penumbra={0.85}
          intensity={2.2 * effectiveOpacity}
          color="#ff8a95"
          distance={14}
          decay={2}
          castShadow={false}
        />

        <pointLight
          position={[-2.4, 0.4, 0.8]}
          intensity={1.4 * effectiveOpacity}
          color="#ff1744"
          distance={9}
          decay={2}
        />

        <pointLight
          position={[2.4, 0.4, 0.8]}
          intensity={1.4 * effectiveOpacity}
          color="#ff4466"
          distance={9}
          decay={2}
        />

        <pointLight
          position={[0, 0.3, 2.8]}
          intensity={1.2 * effectiveOpacity}
          color="#ffb3c1"
          distance={10}
          decay={2}
        />

        <pointLight
          position={[0, -1.4, 0.6]}
          intensity={1.0 * effectiveOpacity}
          color="#800010"
          distance={8}
          decay={2}
        />

        <pointLight
          ref={kbLightRef}
          position={[0.3, -0.12, 0.35]}
          intensity={1.2 * effectiveOpacity}
          distance={3.5}
          color="#ff6680"
          decay={2}
        />

        <pointLight
          position={[0, 1.6, -0.8]}
          intensity={1.8 * effectiveOpacity}
          color="#ff1744"
          distance={12}
          decay={2}
        />
      </group>
    </group>
  );
}

useGLTF.preload("/models/laptop-baked.glb");
```

## File: `src/components/canvas/FloorProjection.tsx`

```typescript
"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES — Strict zero-`any` interface matching HolographicProjection.tsx
// ═══════════════════════════════════════════════════════════════════════════════

interface AnimationValues {
  beamOpacity: number;
  beamScaleY: number;
  glassOpacity: number;
  htmlOpacity: number;
  htmlBlur: number;
  panelZ: number;
  panelRotateX: number;
  panelScale: number;
  chromaticAberration: number;
  wireframeScale: number;
  floorOpacity: number;
  debrisOpacity: number;
  rimPulse: number;
  hasEmerged: boolean;
  sourceGlow: number;
  brightness: number;
  emergenceProgress: number;
  dissipationProgress: number;
  panelY: number;
  hoverPhase: number;
}

interface FloorProjectionProps {
  visible: boolean;
  animRef: React.RefObject<AnimationValues>;
  laptopScreenRef?: React.MutableRefObject<THREE.Mesh | null>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const CRIMSON_CORE = new THREE.Color("#ff1744");
const CRIMSON_DEEP = new THREE.Color("#ff0033");
const CRIMSON_DARK = new THREE.Color("#800010");
const CRIMSON_SOFT = new THREE.Color("#ff3355");
const WHITE_HOT = new THREE.Color("#ffffff");

const DISC_RADIUS = 6.5;
const DISC_SEGMENTS = 128;

// ═══════════════════════════════════════════════════════════════════════════════
// SHADER: VOLUMETRIC PROJECTION DISC
// AAA-grade floor decal with FBM noise, data-radar HUD, rotating sweep,
// chromatic aberration, multi-ripple emergence, and scanline grid.
// ═══════════════════════════════════════════════════════════════════════════════

const discVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying float vDist;

  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPosition.xyz;
    vDist = length(uv - 0.5) * 2.0;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const discFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uRippleProgress;
  uniform float uPulse;
  uniform float uChromatic;
  uniform float uBrightness;

  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying float vDist;

  // Hash & FBM for organic volumetric texture
  vec3 hash33(vec3 p) {
    p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
             dot(p, vec3(269.5, 183.3, 246.1)),
             dot(p, vec3(113.5, 271.9, 124.6)));
    return fract(sin(p) * 43758.5453);
  }

  float hash13(vec3 p) {
    p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
             dot(p, vec3(269.5, 183.3, 246.1)),
             dot(p, vec3(113.5, 271.9, 124.6)));
    return fract(sin(p.x) * 43758.5453);
  }

  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n = mix(
      mix(mix(hash13(i), hash13(i + vec3(1,0,0)), f.x),
          mix(hash13(i + vec3(0,1,0)), hash13(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash13(i + vec3(0,0,1)), hash13(i + vec3(1,0,1)), f.x),
          mix(hash13(i + vec3(0,1,1)), hash13(i + vec3(1,1,1)), f.x), f.y),
      f.z
    );
    return n;
  }

  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.1;
      a *= 0.48;
    }
    return v;
  }

  void main() {
    float dist = vDist;
    float t = uTime;

    // ═══ RADIAL GRADIENTS ═══
    float core = 1.0 - smoothstep(0.0, 0.22, dist);
    float mid = 1.0 - smoothstep(0.0, 0.55, dist);
    float edge = 1.0 - smoothstep(0.0, 1.0, dist);
    float outerRim = 1.0 - smoothstep(0.72, 1.0, dist);

    // ═══ ORGANIC VOLUMETRIC NOISE ═══
    float volNoise = fbm(vec3(vUv * 3.5, t * 0.15)) * 0.35;
    float volNoise2 = fbm(vec3(vUv * 6.0, t * 0.22 + 10.0)) * 0.2;

    // ═══ DATA RADAR — slowly rotating concentric rings ═══
    float radar = sin(dist * 22.0 - t * 0.9) * 0.5 + 0.5;
    float radarRing = smoothstep(0.47, 0.53, radar) * 0.18;
    float radar2 = sin(dist * 14.0 + t * 0.6) * 0.5 + 0.5;
    float radarRing2 = smoothstep(0.48, 0.52, radar2) * 0.1;

    // ═══ ROTATING SWEEP LINE (holographic HUD scanner) ═══
    float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
    float sweep = angle + t * 0.45;
    float sweepLine = smoothstep(0.025, 0.0, abs(fract(sweep / 6.28318530718) - 0.5)) * 0.28;
    float sweepTrail = smoothstep(0.12, 0.0, abs(fract(sweep / 6.28318530718) - 0.5)) * 0.08;

    // ═══ SCANLINE GRID OVERLAY ═══
    float scanGrid = sin(vUv.x * 120.0 + t * 0.3) * sin(vUv.y * 120.0 - t * 0.2);
    scanGrid = smoothstep(0.92, 1.0, abs(scanGrid)) * 0.06;

    // ═══ EMERGENCE RIPPLE (white-hot expanding ring) ═══
    float ripple = 0.0;
    float rippleBright = 0.0;
    float rippleGlow = 0.0;
    if (uRippleProgress > 0.0 && uRippleProgress < 1.0) {
      float rp = uRippleProgress;
      // Primary ripple
      float r1 = smoothstep(0.0, 0.08, dist - rp);
      float r2 = smoothstep(0.0, 0.12, rp + 0.08 - dist);
      ripple = r1 * r2;
      rippleBright = ripple * 3.0;
      // Secondary echo ripple
      float rp2 = rp * 0.85;
      float r1b = smoothstep(0.0, 0.06, dist - rp2);
      float r2b = smoothstep(0.0, 0.1, rp2 + 0.06 - dist);
      rippleGlow = r1b * r2b * 0.6;
    }

    // ═══ CHROMATIC ABERRATION (during dissipation) ═══
    float chroma = uChromatic * smoothstep(0.3, 0.9, dist) * 0.25;

    // ═══ COLOR PALETTE ═══
    vec3 crimson   = vec3(1.0, 0.09, 0.27);
    vec3 deepRed   = vec3(1.0, 0.0,  0.20);
    vec3 softRed   = vec3(1.0, 0.20, 0.33);
    vec3 darkRed   = vec3(0.5, 0.0,  0.06);
    vec3 white     = vec3(1.0, 1.0,  1.0);
    vec3 hotCore   = vec3(1.0, 0.92, 0.90);

    // Base color mixing with noise
    vec3 color = mix(darkRed, crimson, core + volNoise * 0.3);
    color = mix(color, deepRed, mid * 0.5 + volNoise2 * 0.2);
    color = mix(color, softRed, edge * 0.25);
    color = mix(color, hotCore, core * core * 0.6);

    // Add radar HUD patterns
    color += crimson * radarRing * (0.9 + uPulse * 0.3);
    color += softRed * radarRing2 * 0.5;
    color += vec3(1.0, 0.5, 0.5) * sweepLine * edge;
    color += vec3(1.0, 0.3, 0.3) * sweepTrail * edge * 0.5;
    color += crimson * scanGrid * mid;

    // Ripple: white-hot leading edge, fading to crimson
    vec3 rippleColor = mix(crimson, white, ripple * 0.85);
    color += rippleColor * rippleBright;
    color += softRed * rippleGlow * 1.2;

    // Chromatic split
    color.r += chroma * (core + 0.3);
    color.b -= chroma * 0.15;
    color.g += chroma * 0.05;

    // Outer rim glow pulse
    float rimPulse = outerRim * (0.08 + 0.06 * sin(t * 1.8) * uPulse);
    color += crimson * rimPulse;

    // ═══ ALPHA COMPOSITION ═══
    float alpha = (core * 0.55 + mid * 0.28 + edge * 0.10) * uOpacity;
    alpha += ripple * 0.75 * uOpacity;
    alpha += rippleGlow * 0.35 * uOpacity;
    alpha += radarRing * 0.35 * uOpacity;
    alpha += sweepLine * 0.22 * uOpacity;
    alpha += scanGrid * 0.15 * uOpacity;
    alpha += rimPulse * 2.5 * uOpacity;
    alpha *= uBrightness;

    if (alpha < 0.003) discard;

    gl_FragColor = vec4(color, alpha);
  }
`;


// ═══════════════════════════════════════════════════════════════════════════════
// SHADER: GRID WARP DECAL
// Darkens and warps the neon grid beneath the hologram with a "burn" effect
// and subtle edge-glow where the projection meets the floor.
// ═══════════════════════════════════════════════════════════════════════════════

const gridDecalVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying float vDist;

  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPosition.xyz;
    vDist = length(uv - 0.5) * 2.0;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const gridDecalFragmentShader = /* glsl */ `
  uniform float uOpacity;
  uniform float uTime;
  uniform float uPulse;
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying float vDist;

  void main() {
    float dist = vDist;
    float radial = 1.0 - smoothstep(0.0, 1.0, dist);

    // Grid line sampling (simulated)
    vec2 gridUv = vWorldPos.xz * 0.5;
    vec2 gridFract = fract(gridUv);
    vec2 lineDist = abs(gridFract - 0.5) * 2.0;
    float gridLine = 1.0 - smoothstep(0.0, 0.06, lineDist.x);
    gridLine = max(gridLine, 1.0 - smoothstep(0.0, 0.06, lineDist.y));

    // Dark crimson "burn" color with grid line illumination
    vec3 burnColor = vec3(0.08, 0.0, 0.015);
    vec3 lineColor = vec3(1.0, 0.08, 0.18) * gridLine * 0.25;

    // Edge glow where hologram projection meets floor
    float edgeGlow = exp(-dist * dist * 8.0) * (0.3 + 0.15 * sin(uTime * 2.5) * uPulse);
    vec3 edgeColor = vec3(1.0, 0.1, 0.25) * edgeGlow;

    // Warp distortion visual (subtle heat shimmer at edges)
    float warp = sin(vWorldPos.x * 8.0 + uTime * 1.2) * cos(vWorldPos.z * 6.0 - uTime * 0.9) * 0.03 * radial;

    vec3 color = burnColor + lineColor + edgeColor;
    float alpha = (radial * 0.55 + edgeGlow * 0.8 + gridLine * 0.15) * uOpacity + warp;
    if (alpha < 0.002) discard;

    gl_FragColor = vec4(color, alpha);
  }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// SHADER: SHOCKWAVE ENERGY RING
// Expanding multi-harmonic energy ring with chromatic leading edge.
// ═══════════════════════════════════════════════════════════════════════════════

const shockwaveVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying float vDist;
  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vDist = length(uv - 0.5) * 2.0;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const shockwaveFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uProgress;
  varying vec2 vUv;
  varying float vDist;

  void main() {
    float dist = vDist;
    float t = uTime;
    float prog = uProgress;

    // Multi-harmonic ring
    float ring1 = smoothstep(0.0, 0.04, abs(dist - prog));
    float ring2 = smoothstep(0.0, 0.06, abs(dist - prog * 0.92));
    float ring3 = smoothstep(0.0, 0.08, abs(dist - prog * 1.08));

    float combined = (1.0 - ring1) * 1.0 + (1.0 - ring2) * 0.5 + (1.0 - ring3) * 0.25;
    combined *= smoothstep(1.0, 0.75, prog); // fade as it expands
    combined *= smoothstep(0.0, 0.1, prog);  // fade in at start

    // Chromatic leading edge
    vec2 center = vUv - 0.5;
    float angle = atan(center.y, center.x);
    float chroma = sin(angle * 6.0 + t * 2.0) * 0.5 + 0.5;

    vec3 color = mix(vec3(1.0, 0.08, 0.22), vec3(1.0, 0.5, 0.4), chroma * combined);
    color += vec3(0.9, 0.9, 1.0) * (1.0 - ring1) * 0.6; // white-hot core

    float alpha = combined * uOpacity;
    if (alpha < 0.003) discard;

    gl_FragColor = vec4(color, alpha);
  }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// SHADER: FLOOR PARTICLES (Atmospheric Dust Motes)
// Ultra-subtle crimson/white motes that drift across the projection area
// and get pushed outward during the emergence ripple.
// ═══════════════════════════════════════════════════════════════════════════════

const floorParticleVertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute float aSpeed;
  varying float vAlpha;
  varying float vPhase;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uRippleProgress;

  void main() {
    float t = uTime;
    vAlpha = 0.25 + 0.2 * sin(t * 0.7 + aPhase);
    vPhase = aPhase;

    vec3 pos = position;

    // Gentle organic drift
    pos.x += sin(t * 0.3 + aPhase) * 0.12;
    pos.z += cos(t * 0.25 + aPhase * 1.3) * 0.1;
    pos.y += sin(t * 0.4 + aPhase * 0.7) * 0.03;

    // Ripple push: particles are shoved outward during emergence
    float dist = length(pos.xz);
    if (uRippleProgress > 0.0 && uRippleProgress < 1.0 && dist > 0.01) {
      float push = smoothstep(0.0, 0.5, uRippleProgress) * exp(-dist * 0.5) * 0.15;
      pos.xz += normalize(pos.xz) * push;
    }

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * (40.0 / max(1.0, -mv.z));
  }
`;

const floorParticleFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vPhase;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float d = length(uv);
    if (d > 0.5) discard;

    float core = smoothstep(0.5, 0.0, d);
    float glow = smoothstep(0.5, 0.2, d) * 0.4;
    float halo = smoothstep(0.5, 0.35, d) * 0.15;

    // Rare white-hot particles
    vec3 color = mix(uColor, vec3(1.0, 0.95, 0.95), core * 0.6);

    float alpha = (core * 0.9 + glow * 0.5 + halo * 0.2) * vAlpha * uOpacity;
    if (alpha < 0.004) discard;

    gl_FragColor = vec4(color, alpha);
  }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// SHADER: ENERGY RETICLE RING
// Rotating targeting rings that sit on the floor like a holographic HUD.
// ═══════════════════════════════════════════════════════════════════════════════

const reticleVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying float vDist;
  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vDist = length(uv - 0.5) * 2.0;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const reticleFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uPulse;
  uniform vec3 uColor;
  varying vec2 vUv;
  varying float vDist;

  void main() {
    float dist = vDist;
    float t = uTime;

    // Rotating arc segments
    float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
    float arc = sin(angle * 3.0 + t * 0.8) * 0.5 + 0.5;
    float arc2 = sin(angle * 5.0 - t * 1.2) * 0.5 + 0.5;

    float ring = smoothstep(0.02, 0.0, abs(dist - 0.85)) * arc;
    float ring2 = smoothstep(0.015, 0.0, abs(dist - 0.62)) * arc2 * 0.6;
    float ring3 = smoothstep(0.01, 0.0, abs(dist - 0.38)) * 0.3;

    float pulse = 0.8 + 0.2 * sin(t * 1.5) * uPulse;

    vec3 color = uColor * (ring + ring2 + ring3) * pulse;
    float alpha = (ring + ring2 * 0.7 + ring3 * 0.4) * uOpacity * pulse;
    if (alpha < 0.003) discard;

    gl_FragColor = vec4(color, alpha);
  }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY: Exponential decay lerp (butter-smooth damping)
// ═══════════════════════════════════════════════════════════════════════════════

function damp(current: number, target: number, lambda: number, dt: number): number {
  return THREE.MathUtils.lerp(current, target, 1.0 - Math.exp(-lambda * dt));
}


// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT: FloorProjection
// AAA-grade cinematic floor projection system. No early returns before hooks.
// ═══════════════════════════════════════════════════════════════════════════════

export default function FloorProjection({
  visible,
  animRef,
  laptopScreenRef,
}: FloorProjectionProps) {
  // ═── Refs ─══════════════════════════════════════════════════════════════════
  const groupRef = useRef<THREE.Group>(null);
  const discRef = useRef<THREE.Mesh>(null);
  const gridDecalRef = useRef<THREE.Mesh>(null);
  const shockwaveRef = useRef<THREE.Mesh>(null);
  const shockwave2Ref = useRef<THREE.Mesh>(null);
  const reticleRef = useRef<THREE.Mesh>(null);
  const reticle2Ref = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const ambientLightRef = useRef<THREE.PointLight>(null);
  const screenWorldPosRef = useRef(new THREE.Vector3());

  // Ripple animation state (all refs — zero setState in useFrame)
  const rippleState = useRef({
    progress: 0.0,
    active: false,
    hasTriggered: false,
  });
  const prevFloorOpacity = useRef(0.0);
  const prevHasEmerged = useRef(false);
  const smoothOpacity = useRef(0.0);
  const smoothPulse = useRef(0.0);

  // ═── Geometries (useMemo) ─══════════════════════════════════════════════════
  const discGeometry = useMemo(() => new THREE.CircleGeometry(DISC_RADIUS, DISC_SEGMENTS), []);
  const gridDecalGeometry = useMemo(() => new THREE.CircleGeometry(DISC_RADIUS * 1.05, DISC_SEGMENTS), []);
  const shockwaveGeometry = useMemo(() => new THREE.RingGeometry(0.96, 1.0, DISC_SEGMENTS), []);
  const reticleGeometry = useMemo(() => new THREE.RingGeometry(0.92, 0.96, DISC_SEGMENTS), []);
  const reticle2Geometry = useMemo(() => new THREE.RingGeometry(0.72, 0.75, DISC_SEGMENTS), []);

  // ═── Dust Particle Data ─══════════════════════════════════════════════════════
  const PARTICLE_COUNT = 120;

  const {
    particlePositions,
    particlePhases,
    particleSizes,
  } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const ph = new Float32Array(PARTICLE_COUNT);
    const sz = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * DISC_RADIUS * 0.92;
      pos[i3] = Math.cos(angle) * radius;
      pos[i3 + 1] = 0.02 + Math.random() * 0.08; // Just above floor
      pos[i3 + 2] = Math.sin(angle) * radius;
      ph[i] = Math.random() * Math.PI * 2;
      sz[i] = 0.008 + Math.random() * 0.022;
    }
    return { particlePositions: pos, particlePhases: ph, particleSizes: sz };
  }, []);

  // ═── Materials (useMemo) ─═══════════════════════════════════════════════════

  const discUniforms = useMemo(
    () => ({
      uTime: { value: 0.0 },
      uOpacity: { value: 0.0 },
      uRippleProgress: { value: 0.0 },
      uPulse: { value: 0.0 },
      uChromatic: { value: 0.0 },
      uBrightness: { value: 1.0 },
    }),
    []
  );

  const discMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: discVertexShader,
        fragmentShader: discFragmentShader,
        uniforms: discUniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [discUniforms]
  );

  const gridDecalUniforms = useMemo(
    () => ({
      uOpacity: { value: 0.0 },
      uTime: { value: 0.0 },
      uPulse: { value: 0.0 },
    }),
    []
  );

  const gridDecalMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: gridDecalVertexShader,
        fragmentShader: gridDecalFragmentShader,
        uniforms: gridDecalUniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [gridDecalUniforms]
  );

  const shockwaveUniforms = useMemo(
    () => ({
      uTime: { value: 0.0 },
      uOpacity: { value: 0.0 },
      uProgress: { value: 0.0 },
    }),
    []
  );

  const shockwaveMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: shockwaveVertexShader,
        fragmentShader: shockwaveFragmentShader,
        uniforms: shockwaveUniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [shockwaveUniforms]
  );

  const shockwave2Uniforms = useMemo(
    () => ({
      uTime: { value: 0.0 },
      uOpacity: { value: 0.0 },
      uProgress: { value: 0.0 },
    }),
    []
  );

  const shockwave2Material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: shockwaveVertexShader,
        fragmentShader: shockwaveFragmentShader,
        uniforms: shockwave2Uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [shockwave2Uniforms]
  );

  const reticleUniforms = useMemo(
    () => ({
      uTime: { value: 0.0 },
      uOpacity: { value: 0.0 },
      uPulse: { value: 0.0 },
      uColor: { value: CRIMSON_CORE.clone() },
    }),
    []
  );

  const reticleMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: reticleVertexShader,
        fragmentShader: reticleFragmentShader,
        uniforms: reticleUniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [reticleUniforms]
  );

  const reticle2Uniforms = useMemo(
    () => ({
      uTime: { value: 0.0 },
      uOpacity: { value: 0.0 },
      uPulse: { value: 0.0 },
      uColor: { value: CRIMSON_SOFT.clone() },
    }),
    []
  );

  const reticle2Material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: reticleVertexShader,
        fragmentShader: reticleFragmentShader,
        uniforms: reticle2Uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [reticle2Uniforms]
  );

  const particleUniforms = useMemo(
    () => ({
      uTime: { value: 0.0 },
      uOpacity: { value: 0.0 },
      uRippleProgress: { value: 0.0 },
      uColor: { value: CRIMSON_CORE.clone() },
    }),
    []
  );

  const particleMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: floorParticleVertexShader,
        fragmentShader: floorParticleFragmentShader,
        uniforms: particleUniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [particleUniforms]
  );

  // ═── Main Animation Loop ─═════════════════════════════════════════════════════
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const a = animRef.current;
    const group = groupRef.current;

    // Guard: if animRef is not ready, hide but keep processing
    if (!a || !group) {
      if (group) group.visible = false;
      return;
    }

    const dt = Math.min(delta, 0.05);

    // ── Visibility gating (NO early return — hooks-safe) ──
    const targetOpacity = visible ? a.floorOpacity : 0.0;
    smoothOpacity.current = damp(smoothOpacity.current, targetOpacity, 12, dt);
    smoothPulse.current = damp(smoothPulse.current, a.rimPulse, 8, dt);

    if (smoothOpacity.current <= 0.001) {
      group.visible = false;
      return;
    }
    group.visible = true;

    // ── Detect emergence trigger for one-shot ripple ──
    const justEmerged = a.hasEmerged && !prevHasEmerged.current;
    const floorJustActivated = a.floorOpacity > 0.001 && prevFloorOpacity.current <= 0.001;
    if ((justEmerged || floorJustActivated) && !rippleState.current.hasTriggered && visible) {
      rippleState.current.active = true;
      rippleState.current.progress = 0.0;
      rippleState.current.hasTriggered = true;
    }
    prevHasEmerged.current = a.hasEmerged;
    prevFloorOpacity.current = a.floorOpacity;

    // ── Animate ripple progress ──
    if (rippleState.current.active) {
      rippleState.current.progress += dt * 0.35; // Expand speed
      if (rippleState.current.progress >= 1.0) {
        rippleState.current.progress = 1.0;
        rippleState.current.active = false;
      }
    }

    const rippleProg = rippleState.current.active || rippleState.current.progress < 1.0
      ? rippleState.current.progress
      : 0.0;

    // ── Disc shader uniforms ──
    discMaterial.uniforms.uTime.value = t;
    discMaterial.uniforms.uOpacity.value = smoothOpacity.current;
    discMaterial.uniforms.uRippleProgress.value = rippleProg;
    discMaterial.uniforms.uPulse.value = smoothPulse.current;
    discMaterial.uniforms.uChromatic.value = a.chromaticAberration * 0.4;
    discMaterial.uniforms.uBrightness.value = a.brightness;

    // ── Grid decal uniforms ──
    gridDecalMaterial.uniforms.uOpacity.value = smoothOpacity.current * 0.85;
    gridDecalMaterial.uniforms.uTime.value = t;
    gridDecalMaterial.uniforms.uPulse.value = smoothPulse.current;

    // ── Shockwave rings ──
    const shockOp = smoothOpacity.current * (rippleState.current.active ? 1.0 : 0.0);
    shockwaveMaterial.uniforms.uTime.value = t;
    shockwaveMaterial.uniforms.uOpacity.value = shockOp;
    shockwaveMaterial.uniforms.uProgress.value = rippleProg;

    // Secondary shockwave (faster, delayed)
    const rippleProg2 = Math.max(0.0, rippleProg - 0.12) / 0.88;
    shockwave2Material.uniforms.uTime.value = t;
    shockwave2Material.uniforms.uOpacity.value = shockOp * 0.6;
    shockwave2Material.uniforms.uProgress.value = rippleProg2;

    if (shockwaveRef.current) {
      const s = rippleProg * 10.0; // Expand to 10x
      shockwaveRef.current.scale.set(s, s, 1.0);
      shockwaveRef.current.visible = rippleState.current.active || rippleProg > 0.0;
    }
    if (shockwave2Ref.current) {
      const s = rippleProg2 * 8.5;
      shockwave2Ref.current.scale.set(s, s, 1.0);
      shockwave2Ref.current.visible = rippleState.current.active || rippleProg2 > 0.0;
    }

    // ── Reticle rings (rotating HUD) ──
    if (reticleRef.current) {
      reticleRef.current.rotation.z = t * 0.25;
      const retOp = smoothOpacity.current * (0.35 + 0.15 * Math.sin(t * 1.2) * smoothPulse.current);
      reticleMaterial.uniforms.uTime.value = t;
      reticleMaterial.uniforms.uOpacity.value = retOp;
      reticleMaterial.uniforms.uPulse.value = smoothPulse.current;
      reticleRef.current.visible = smoothOpacity.current > 0.01;
    }
    if (reticle2Ref.current) {
      reticle2Ref.current.rotation.z = -t * 0.35;
      const retOp2 = smoothOpacity.current * (0.25 + 0.1 * Math.sin(t * 1.8 + 1.0) * smoothPulse.current);
      reticle2Material.uniforms.uTime.value = t;
      reticle2Material.uniforms.uOpacity.value = retOp2;
      reticle2Material.uniforms.uPulse.value = smoothPulse.current;
      reticle2Ref.current.visible = smoothOpacity.current > 0.01;
    }

    // ── Floor particles ──
    if (particlesRef.current) {
      particleMaterial.uniforms.uTime.value = t;
      particleMaterial.uniforms.uOpacity.value = smoothOpacity.current * 0.45;
      particleMaterial.uniforms.uRippleProgress.value = rippleProg;
      particlesRef.current.visible = smoothOpacity.current > 0.02;
    }

    // ── Lights ──
    if (lightRef.current) {
      lightRef.current.intensity = smoothOpacity.current * 3.5 * a.sourceGlow;
      lightRef.current.color.lerp(
        a.chromaticAberration > 1.0 ? CRIMSON_DEEP : CRIMSON_CORE,
        dt * 2.0
      );
    }
    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = smoothOpacity.current * 1.2 * smoothPulse.current;
    }

    // ── Track laptop screen position for X/Z alignment ──
    if (laptopScreenRef?.current && group) {
      const screen = laptopScreenRef.current;
      screen.updateWorldMatrix(true, false);
      screen.getWorldPosition(screenWorldPosRef.current);
      group.position.x = THREE.MathUtils.lerp(group.position.x, screenWorldPosRef.current.x, dt * 6.0);
      group.position.z = THREE.MathUtils.lerp(group.position.z, screenWorldPosRef.current.z, dt * 6.0);
    }
  });

  // ═── Render ─══════════════════════════════════════════════════════════════════
  return (
    <group ref={groupRef} position={[0, -2.12, 0]} visible={false}>
      {/* ═══ GRID WARP DECAL (darkens & warps the neon grid beneath) ═══ */}
      <mesh
        ref={gridDecalRef}
        geometry={gridDecalGeometry}
        material={gridDecalMaterial}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.005, 0]}
        renderOrder={1}
      />

      {/* ═══ CORE VOLUMETRIC DISC (main floor projection) ═══ */}
      <mesh
        ref={discRef}
        geometry={discGeometry}
        material={discMaterial}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={2}
      />

      {/* ═══ PRIMARY SHOCKWAVE RING (emergence expansion) ═══ */}
      <mesh
        ref={shockwaveRef}
        geometry={shockwaveGeometry}
        material={shockwaveMaterial}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.008, 0]}
        renderOrder={3}
        visible={false}
      />

      {/* ═══ SECONDARY SHOCKWAVE RING (echo) ═══ */}
      <mesh
        ref={shockwave2Ref}
        geometry={shockwaveGeometry}
        material={shockwave2Material}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.012, 0]}
        renderOrder={3}
        visible={false}
      />

      {/* ═══ ENERGY RETICLE RING 1 (outer HUD) ═══ */}
      <mesh
        ref={reticleRef}
        geometry={reticleGeometry}
        material={reticleMaterial}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.015, 0]}
        renderOrder={4}
        visible={false}
      />

      {/* ═══ ENERGY RETICLE RING 2 (inner HUD) ═══ */}
      <mesh
        ref={reticle2Ref}
        geometry={reticle2Geometry}
        material={reticle2Material}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.018, 0]}
        renderOrder={4}
        visible={false}
      />

      {/* ═══ ATMOSPHERIC FLOOR DUST (volumetric motes) ═══ */}
      <points ref={particlesRef} material={particleMaterial} renderOrder={5} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particlePositions, 3]} />
          <bufferAttribute attach="attributes-aPhase" args={[particlePhases, 1]} />
          <bufferAttribute attach="attributes-aSize" args={[particleSizes, 1]} />
        </bufferGeometry>
      </points>

      {/* ═══ UPWARD VOLUMETRIC LIGHT (illuminates hologram from below) ═══ */}
      <pointLight
        ref={lightRef}
        color={CRIMSON_CORE}
        intensity={0}
        distance={14}
        decay={2}
        position={[0, 0.2, 0]}
      />

      {/* ═══ AMBIENT FILL LIGHT (soft crimson wash) ═══ */}
      <pointLight
        ref={ambientLightRef}
        color={CRIMSON_DARK}
        intensity={0}
        distance={18}
        decay={2}
        position={[0, 0.1, 0]}
      />
    </group>
  );
}
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

## File: `src/components/canvas/HolographicProjection.tsx`

```typescript
"use client";

import React, { useRef, useMemo, useEffect, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import DashboardHero from "@/components/ui/DashboardHero";
import FloatingDebris from "./FloatingDebris";
import FloorProjection from "./FloorProjection";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface HolographicProjectionProps {
  scrollProgress: number;
  laptopScreenRef: React.MutableRefObject<THREE.Mesh | null>;
  visible: boolean;
  deviceTier?: "mobile" | "tablet" | "desktop";
}

interface AnimationValues {
  beamOpacity: number;
  beamScaleY: number;
  glassOpacity: number;
  htmlOpacity: number;
  htmlBlur: number;
  panelZ: number;
  panelRotateX: number;
  panelScale: number;
  chromaticAberration: number;
  wireframeScale: number;
  floorOpacity: number;
  debrisOpacity: number;
  rimPulse: number;
  hasEmerged: boolean;
  sourceGlow: number;
  brightness: number;
  emergenceProgress: number;
  dissipationProgress: number;
  panelY: number;
  hoverPhase: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const CRIMSON = {
  core: new THREE.Color("#ff1744"),
  deep: new THREE.Color("#ff0033"),
  dark: new THREE.Color("#800010"),
  mid: new THREE.Color("#ff3355"),
  white: new THREE.Color("#ffffff"),
  hot: new THREE.Color("#ff8a80"),
};

const PANEL_WIDTH = 3.9;
const PANEL_HEIGHT = 2.1;
const PANEL_DEPTH = 0.15;
const BEAM_HEIGHT_SEGMENTS_DESKTOP = 24;
const BEAM_HEIGHT_SEGMENTS_MOBILE = 12;
const PARTICLE_COUNT_DESKTOP = 150;
const PARTICLE_COUNT_MOBILE = 0;

// ═══════════════════════════════════════════════════════════════════════════════
// SHADER: VOLUMETRIC BEAM (Light Cone)
// Overkill: 3D noise displacement, chromatic aberration, heat shimmer,
// volumetric scattering, scanlines, dust sparkle
// ═══════════════════════════════════════════════════════════════════════════════

const beamVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uPulse;
  uniform float uChromatic;

  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying float vDistFromCenter;
  varying float vChromatic;

  // Simplex 3D noise
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

  float snoise(vec3 v){ 
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod(i, 289.0); 
    vec4 p = permute(permute(permute( 
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0)) 
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 1.0/7.0;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vUv = uv;
    vChromatic = uChromatic;

    vec3 pos = position;

    // Organic breathing: expand/contract radius with time
    float breathe = 1.0 + sin(uTime * 2.5 + uv.y * 8.0) * 0.08 * uPulse;
    pos.x *= breathe;
    pos.z *= breathe;

    // Heat shimmer waviness
    float noiseVal = snoise(vec3(pos.x * 3.0, pos.y * 2.0 - uTime * 1.5, uTime * 0.5));
    pos.x += noiseVal * 0.06 * uv.y;
    pos.z += snoise(vec3(pos.z * 3.0, pos.y * 2.0 + uTime * 1.2, uTime * 0.3)) * 0.04 * uv.y;

    // Sine waviness overlay
    pos.x += sin(uv.y * 12.0 + uTime * 3.0) * 0.10 * uv.y;
    pos.z += cos(uv.y * 10.0 + uTime * 2.5) * 0.07 * uv.y;

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPos.xyz;
    vDistFromCenter = length(vec2(pos.x, pos.z));

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const beamFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uIntensity;
  uniform float uChromatic;

  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying float vDistFromCenter;
  varying float vChromatic;

  void main() {
    float dist = vDistFromCenter;

    // Core vs rim
    float core = 1.0 - smoothstep(0.0, 0.30, dist);
    float rim = 1.0 - smoothstep(0.15, 0.80, dist);

    // Vertical fade: brighter at bottom (source), dimmer at top
    float verticalFade = 1.0 - smoothstep(0.25, 1.0, vUv.y);
    float sourceGlow = 1.0 - smoothstep(0.0, 0.12, vUv.y);

    // Scanlines moving upward
    float scan = sin(vUv.y * 70.0 - uTime * 10.0) * 0.5 + 0.5;
    float scanlines = scan * 0.12;

    // Secondary faster scanline
    float scan2 = sin(vUv.y * 140.0 - uTime * 18.0) * 0.5 + 0.5;
    scanlines += scan2 * 0.06;

    // Dust sparkle inside beam
    float sparkle = pow(sin(vUv.y * 130.0 + uTime * 16.0) * 0.5 + 0.5, 14.0) * 0.5;
    float sparkle2 = pow(sin(vUv.x * 90.0 + vUv.y * 60.0 + uTime * 12.0) * 0.5 + 0.5, 20.0) * 0.3;

    // Colors: hot white core, crimson body, deep red edges
    vec3 coreColor = vec3(1.0, 0.95, 0.95);
    vec3 midColor = vec3(1.0, 0.08, 0.22);
    vec3 rimColor = vec3(0.65, 0.02, 0.10);

    vec3 color = mix(rimColor, midColor, rim);
    color = mix(color, coreColor, core * 0.7);

    // Add scanline tint
    color += midColor * scanlines * 1.2;
    color += coreColor * (sparkle + sparkle2);

    // Chromatic aberration at edges during dissipation
    float chroma = vChromatic * smoothstep(0.2, 0.8, dist);
    color.r += chroma * 0.15;
    color.b -= chroma * 0.10;

    // Volumetric heat haze tint
    color += vec3(1.0, 0.3, 0.1) * sin(vUv.y * 20.0 + uTime * 4.0) * 0.02 * (1.0 - dist);

    // Alpha: core is solid, edges fade, bottom is brightest
    float alpha = (core * 0.95 + rim * 0.40 + scanlines * 0.6) * verticalFade * uOpacity;
    alpha += sourceGlow * 0.5 * uOpacity;
    alpha *= (1.0 - vUv.y * 0.25); // gentle top fade
    alpha += sparkle * 0.3 * uOpacity;

    if (alpha < 0.003) discard;

    gl_FragColor = vec4(color * uIntensity, alpha);
  }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// SHADER: BEAM PARTICLES (Dust Motes)
// ═══════════════════════════════════════════════════════════════════════════════

const particleVertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute float aSpeed;
  attribute float aLife;

  varying float vAlpha;
  varying float vLife;
  uniform float uTime;
  uniform float uOpacity;

  void main() {
    float t = uTime;
    vAlpha = 0.35 + 0.25 * sin(t * 0.9 + aPhase);
    vLife = aLife;

    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;

    float sizeAtten = aSize * (35.0 / max(1.0, -mv.z));
    gl_PointSize = min(sizeAtten, 28.0);
  }
`;

const particleFragmentShader = /* glsl */ `
  uniform float uOpacity;
  varying float vAlpha;
  varying float vLife;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float d = length(uv);
    if (d > 0.5) discard;

    float core = smoothstep(0.5, 0.0, d);
    float glow = smoothstep(0.5, 0.12, d) * 0.45;
    float halo = smoothstep(0.5, 0.30, d) * 0.15;

    // White-hot center, crimson edge
    vec3 color = mix(vec3(1.0, 0.08, 0.22), vec3(1.0, 0.92, 0.90), core);

    // Life fade: particles die as they reach top
    float lifeFade = 1.0 - vLife * vLife;

    float alpha = (core * 0.95 + glow * 0.5 + halo * 0.2) * vAlpha * lifeFade * uOpacity;
    if (alpha < 0.005) discard;

    gl_FragColor = vec4(color, alpha);
  }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// SHADER: BACKING GLOW (Radial bloom behind panel)
// ═══════════════════════════════════════════════════════════════════════════════

const backingVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const backingFragmentShader = /* glsl */ `
  uniform float uOpacity;
  uniform float uTime;
  uniform float uPulse;
  varying vec2 vUv;

  void main() {
    vec2 center = vUv - 0.5;
    float dist = length(center);
    float radial = 1.0 - smoothstep(0.0, 0.55, dist);

    // Organic pulse
    float pulse = 0.85 + 0.15 * sin(uTime * 1.8) * uPulse;

    // Multi-lobed glow for cinematic feel
    float angle = atan(center.y, center.x);
    float lobe = sin(angle * 3.0 + uTime * 0.4) * 0.5 + 0.5;
    radial *= (0.8 + 0.2 * lobe);

    vec3 centerColor = vec3(1.0, 0.92, 0.92);
    vec3 edgeColor = vec3(1.0, 0.06, 0.18);
    vec3 color = mix(edgeColor, centerColor, radial * radial);

    float alpha = radial * 0.10 * uOpacity * pulse;
    if (alpha < 0.002) discard;

    gl_FragColor = vec4(color, alpha);
  }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// SHADER: CHROMATIC DISSOLVE (Pixelation / scanline dissolve effect)
// ═══════════════════════════════════════════════════════════════════════════════

const chromaticVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const chromaticFragmentShader = /* glsl */ `
  uniform float uIntensity;
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv - 0.5;
    float dist = length(uv);

    // RGB split based on distance from center and intensity
    float shift = uIntensity * 0.025 * dist;

    vec3 color;
    color.r = smoothstep(0.5, 0.0, abs(uv.x - shift)) * smoothstep(0.5, 0.0, abs(uv.y));
    color.g = smoothstep(0.5, 0.0, abs(uv.x)) * smoothstep(0.5, 0.0, abs(uv.y));
    color.b = smoothstep(0.5, 0.0, abs(uv.x + shift * 0.7)) * smoothstep(0.5, 0.0, abs(uv.y));

    // Scanline dissolve
    float scan = step(0.5, sin(vUv.y * 80.0 + uTime * 10.0));
    float dissolve = scan * uIntensity * 0.3;

    float alpha = (color.r + color.g + color.b) * 0.15 * uIntensity + dissolve;

    gl_FragColor = vec4(vec3(1.0, 0.1, 0.2) * color + vec3(0.0, 0.8, 1.0) * color.b * 0.5, alpha);
  }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// SHADER: WIREFRAME SPARK (The Breach Cube)
// ═══════════════════════════════════════════════════════════════════════════════

const wireframeVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uScale;
  uniform float uChromatic;
  varying float vDist;

  void main() {
    vec3 pos = position * uScale;
    // Glitch displacement
    float glitch = step(0.92, sin(uTime * 25.0 + position.y * 10.0)) * uChromatic * 0.15;
    pos.x += glitch * (sin(uTime * 40.0) * 0.5 + 0.5);
    pos.y += glitch * (cos(uTime * 35.0) * 0.5 + 0.5);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    vDist = length(pos);
    gl_Position = projectionMatrix * mv;
  }
`;

const wireframeFragmentShader = /* glsl */ `
  uniform float uOpacity;
  uniform float uChromatic;
  uniform float uTime;
  varying float vDist;

  void main() {
    float alpha = uOpacity * (0.8 + 0.2 * sin(uTime * 8.0 + vDist * 20.0));
    vec3 color = vec3(1.0, 0.08, 0.2);
    color.r += uChromatic * 0.4;
    color.b += uChromatic * 0.2;
    gl_FragColor = vec4(color, alpha);
  }
`;


// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY: Smooth value interpolation (exponential decay lerp)
// ═══════════════════════════════════════════════════════════════════════════════

function damp(current: number, target: number, lambda: number, dt: number): number {
  return THREE.MathUtils.lerp(current, target, 1.0 - Math.exp(-lambda * dt));
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENT: VolumetricBeam
// ═══════════════════════════════════════════════════════════════════════════════

interface BeamProps {
  beamRef: React.Ref<THREE.Mesh>;
  material: THREE.ShaderMaterial;
  isMobile: boolean;
}

const VolumetricBeam = React.memo(function VolumetricBeam({ beamRef, material, isMobile }: BeamProps) {
  return (
    <mesh ref={beamRef} material={material} renderOrder={5} frustumCulled={false}>
      <cylinderGeometry
        args={[
          0.80, // topRadius
          0.04, // bottomRadius
          1.0,  // height
          4,    // radialSegments
          isMobile ? BEAM_HEIGHT_SEGMENTS_MOBILE : BEAM_HEIGHT_SEGMENTS_DESKTOP,
          true, // openEnded
        ]}
      />
    </mesh>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENT: BeamParticles
// ═══════════════════════════════════════════════════════════════════════════════

interface BeamParticlesProps {
  particlesRef: React.Ref<THREE.Points>;
  material: THREE.ShaderMaterial;
  count: number;
  positions: Float32Array;
  sizes: Float32Array;
  phases: Float32Array;
  speeds: Float32Array;
  lives: Float32Array;
}

const BeamParticles = React.memo(function BeamParticles({
  particlesRef,
  material,
  count,
  positions,
  sizes,
  phases,
  speeds,
  lives,
}: BeamParticlesProps) {
  if (count === 0) return null;

  return (
    <points ref={particlesRef} material={material} renderOrder={6} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        <bufferAttribute attach="attributes-aSpeed" args={[speeds, 1]} />
        <bufferAttribute attach="attributes-aLife" args={[lives, 1]} />
      </bufferGeometry>
    </points>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENT: GlassSlab
// ═══════════════════════════════════════════════════════════════════════════════

interface GlassSlabProps {
  glassRef: React.Ref<THREE.Mesh>;
  material: THREE.Material;
}

const GlassSlab = React.memo(function GlassSlab({ glassRef, material }: GlassSlabProps) {
  return (
    <mesh ref={glassRef} material={material} renderOrder={10} castShadow={false} receiveShadow={false}>
      <boxGeometry args={[PANEL_WIDTH, PANEL_HEIGHT, PANEL_DEPTH]} />
    </mesh>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENT: EdgeGlow
// ═══════════════════════════════════════════════════════════════════════════════

interface EdgeGlowProps {
  edgeRef: React.Ref<THREE.LineSegments>;
}

const EdgeGlow = React.memo(function EdgeGlow({ edgeRef }: EdgeGlowProps) {
  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: CRIMSON.core,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    []
  );

  const geometry = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(PANEL_WIDTH, PANEL_HEIGHT, PANEL_DEPTH)),
    []
  );

  return (
    <lineSegments ref={edgeRef} geometry={geometry} material={material} renderOrder={11} />
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENT: BackingGlow
// ═══════════════════════════════════════════════════════════════════════════════

interface BackingGlowProps {
  glowRef: React.Ref<THREE.Mesh>;
  material: THREE.ShaderMaterial;
}

const BackingGlow = React.memo(function BackingGlow({ glowRef, material }: BackingGlowProps) {
  return (
    <mesh
      ref={glowRef}
      material={material}
      position={[0, 0, -0.12]}
      renderOrder={8}
      frustumCulled={false}
    >
      <planeGeometry args={[PANEL_WIDTH + 0.6, PANEL_HEIGHT + 0.6]} />
    </mesh>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENT: ChromaticDissolve
// ═══════════════════════════════════════════════════════════════════════════════

interface ChromaticDissolveProps {
  chromaticRef: React.Ref<THREE.Mesh>;
  material: THREE.ShaderMaterial;
}

const ChromaticDissolve = React.memo(function ChromaticDissolve({ chromaticRef, material }: ChromaticDissolveProps) {
  return (
    <mesh
      ref={chromaticRef}
      material={material}
      position={[0, 0, 0.02]}
      renderOrder={12}
      frustumCulled={false}
    >
      <planeGeometry args={[PANEL_WIDTH + 0.2, PANEL_HEIGHT + 0.2]} />
    </mesh>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENT: WireframeSpark
// ═══════════════════════════════════════════════════════════════════════════════

interface WireframeSparkProps {
  wireframeRef: React.Ref<THREE.Mesh>;
  material: THREE.ShaderMaterial;
}

const WireframeSpark = React.memo(function WireframeSpark({ wireframeRef, material }: WireframeSparkProps) {
  return (
    <mesh ref={wireframeRef} material={material} renderOrder={7} frustumCulled={false}>
      <boxGeometry args={[0.1, 0.1, 0.1]} />
    </mesh>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENT: RimLight
// ═══════════════════════════════════════════════════════════════════════════════

interface RimLightProps {
  rimLightRef: React.Ref<THREE.PointLight>;
}

const RimLight = React.memo(function RimLight({ rimLightRef }: RimLightProps) {
  return (
    <pointLight
      ref={rimLightRef}
      color={CRIMSON.core}
      intensity={0}
      distance={4.5}
      decay={2}
      position={[0, 0, 0.3]}
    />
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENT: BeamBaseLight
// ═══════════════════════════════════════════════════════════════════════════════

interface BeamBaseLightProps {
  lightRef: React.Ref<THREE.PointLight>;
}

const BeamBaseLight = React.memo(function BeamBaseLight({ lightRef }: BeamBaseLightProps) {
  return (
    <pointLight
      ref={lightRef}
      color={CRIMSON.core}
      intensity={0}
      distance={3.5}
      decay={2}
    />
  );
});


// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT: HolographicProjection
// ═══════════════════════════════════════════════════════════════════════════════

export default function HolographicProjection({
  scrollProgress,
  laptopScreenRef,
  visible,
  deviceTier = "desktop",
}: HolographicProjectionProps) {
  const { camera } = useThree();
  const isMobile = deviceTier === "mobile";

  // ── Refs ───────────────────────────────────────────────────────────────────
  const rigRef = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.Mesh>(null!);
  const particlesRef = useRef<THREE.Points>(null!);
  const glassRef = useRef<THREE.Mesh>(null!);
  const rimLightRef = useRef<THREE.PointLight>(null!);
  const beamBaseLightRef = useRef<THREE.PointLight>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const edgeTorusRef = useRef<THREE.LineSegments>(null!);
  const wireframeRef = useRef<THREE.Mesh>(null!);
  const chromaticRef = useRef<THREE.Mesh>(null!);
  const htmlWrapperRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const hasEmergedRef = useRef(false);
  const isVisibleRef = useRef(visible);
  const scrollRef = useRef(scrollProgress);
  const mouseRef = useRef({ x: 0, y: 0 });
  const smoothMouse = useRef({ x: 0, y: 0 });

  // Animation values (all refs — zero React re-renders during animation)
  const animRef = useRef<AnimationValues>({
    beamOpacity: 0,
    beamScaleY: 0.1,
    glassOpacity: 0,
    htmlOpacity: 0,
    htmlBlur: 12,
    panelZ: 0,
    panelRotateX: 45,
    panelScale: 0.2,
    chromaticAberration: 0,
    wireframeScale: 0.01,
    floorOpacity: 0,
    debrisOpacity: 0,
    rimPulse: 0,
    hasEmerged: false,
    sourceGlow: 0,
    brightness: 1,
    emergenceProgress: 0,
    dissipationProgress: 0,
    panelY: 0,
    hoverPhase: 0,
  });

  // Scratch vectors (persisted across frames to avoid GC)
  const scratch = useMemo(
    () => ({
      screenPos: new THREE.Vector3(),
      screenCenter: new THREE.Vector3(),
      screenUp: new THREE.Vector3(),
      screenQuat: new THREE.Quaternion(),
      screenScale: new THREE.Vector3(),
      screenNormal: new THREE.Vector3(),
      rigPos: new THREE.Vector3(),
      up: new THREE.Vector3(0, 1, 0),
      beamTarget: new THREE.Vector3(),
      beamMid: new THREE.Vector3(),
      beamDir: new THREE.Vector3(),
      tempVec: new THREE.Vector3(),
      wireframePos: new THREE.Vector3(),
      wireframeQuat: new THREE.Quaternion(),
      wireframeScale: new THREE.Vector3(),
      cameraDir: new THREE.Vector3(),
    }),
    []
  );

  // ── Materials ────────────────────────────────────────────────────────────────

  const beamMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uOpacity: { value: 0 },
          uPulse: { value: 0 },
          uIntensity: { value: 1.2 },
          uChromatic: { value: 0 },
        },
        vertexShader: beamVertexShader,
        fragmentShader: beamFragmentShader,
      }),
    []
  );

  const particleMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uOpacity: { value: 0 },
        },
        vertexShader: particleVertexShader,
        fragmentShader: particleFragmentShader,
      }),
    []
  );

  const backingMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: {
          uOpacity: { value: 0 },
          uTime: { value: 0 },
          uPulse: { value: 0 },
        },
        vertexShader: backingVertexShader,
        fragmentShader: backingFragmentShader,
      }),
    []
  );

  const chromaticMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: {
          uIntensity: { value: 0 },
          uTime: { value: 0 },
        },
        vertexShader: chromaticVertexShader,
        fragmentShader: chromaticFragmentShader,
      }),
    []
  );

  const wireframeMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        wireframe: true,
        uniforms: {
          uTime: { value: 0 },
          uOpacity: { value: 0 },
          uScale: { value: 0.01 },
          uChromatic: { value: 0 },
        },
        vertexShader: wireframeVertexShader,
        fragmentShader: wireframeFragmentShader,
      }),
    []
  );

  const glassMaterial = useMemo(() => {
    if (isMobile) {
      return new THREE.MeshBasicMaterial({
        color: new THREE.Color("#1a0206"),
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
    }
    return new THREE.MeshPhysicalMaterial({
      transmission: 0.95,
      thickness: 2.0,
      roughness: 0.05,
      metalness: 0.1,
      color: new THREE.Color("#0a0002"),
      attenuationColor: new THREE.Color("#ff0033"),
      attenuationDistance: 5.0,
      ior: 1.7,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      envMapIntensity: 2.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      depthWrite: true,
    });
  }, [isMobile]);

  // ── Particle Geometry & Data ─────────────────────────────────────────────────

  const particleCount = isMobile ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT_DESKTOP;

  const {
    particlePositions,
    particleSizes,
    particlePhases,
    particleSpeeds,
    particleLives,
  } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const sz = new Float32Array(particleCount);
    const ph = new Float32Array(particleCount);
    const spd = new Float32Array(particleCount);
    const life = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const radius = Math.random() * 0.55;
      const angle = Math.random() * Math.PI * 2;
      const y = Math.random();

      pos[i3] = Math.cos(angle) * radius * (1.0 - y * 0.5);
      pos[i3 + 1] = y;
      pos[i3 + 2] = Math.sin(angle) * radius * (1.0 - y * 0.5);

      sz[i] = 0.6 + Math.random() * 1.8;
      ph[i] = Math.random() * Math.PI * 2;
      spd[i] = 0.15 + Math.random() * 0.45;
      life[i] = Math.random();
    }

    return {
      particlePositions: pos,
      particleSizes: sz,
      particlePhases: ph,
      particleSpeeds: spd,
      particleLives: life,
    };
  }, [particleCount]);

  // ── Mouse Listener ───────────────────────────────────────────────────────────

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  // ── GSAP Emergence Timeline ────────────────────────────────────────────────
  // Master Prompt Section 5: Emergence Animation Sequence (0.0s → 3.5s)

  useEffect(() => {
    if (!visible) {
      // Reset emergence when hidden
      if (timelineRef.current) {
        timelineRef.current.kill();
        timelineRef.current = null;
      }
      hasEmergedRef.current = false;
      const a = animRef.current;
      a.emergenceProgress = 0;
      a.beamOpacity = 0;
      a.beamScaleY = 0.1;
      a.glassOpacity = 0;
      a.htmlOpacity = 0;
      a.htmlBlur = 12;
      a.wireframeScale = 0.01;
      a.floorOpacity = 0;
      a.debrisOpacity = 0;
      a.rimPulse = 0;
      a.hasEmerged = false;
      a.sourceGlow = 0;
      return;
    }

    // Only start timeline if not already emerged
    if (hasEmergedRef.current || timelineRef.current) return;

    const a = animRef.current;
    const tl = gsap.timeline({
      onComplete: () => {
        hasEmergedRef.current = true;
        a.hasEmerged = true;
      },
    });
    timelineRef.current = tl;

    // Phase 1: The Spark (0.0s - 0.4s)
    tl.to(
      a,
      {
        wireframeScale: 0.3,
        beamOpacity: 0.15,
        beamScaleY: 0.2,
        sourceGlow: 3.0,
        duration: 0.4,
        ease: "power2.out",
      },
      0
    );

    // Phase 2: The Breach (0.4s - 1.2s)
    tl.to(
      a,
      {
        wireframeScale: 0.01,
        beamOpacity: 0.85,
        beamScaleY: 1.0,
        glassOpacity: isMobile ? 0.4 : 0.3,
        chromaticAberration: 4.0,
        duration: 0.8,
        ease: "power4.out",
      },
      0.4
    );

    // Phase 3: Materialization (1.2s - 2.2s)
    tl.to(
      a,
      {
        chromaticAberration: 0,
        glassOpacity: isMobile ? 0.4 : 0.3,
        htmlOpacity: 1,
        htmlBlur: 0,
        rimPulse: 1,
        floorOpacity: 0.12,
        debrisOpacity: 1,
        duration: 1.0,
        ease: "power2.out",
      },
      1.2
    );

    // Phase 4: Stabilization (2.2s - 3.5s)
    tl.to(
      a,
      {
        sourceGlow: 0.6,
        duration: 1.3,
        ease: "sine.inOut",
      },
      2.2
    );

    return () => {
      tl.kill();
      timelineRef.current = null;
    };
  }, [visible, isMobile]);

  // ── Scroll-Driven Lifecycle (useFrame) ───────────────────────────────────────

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05); // Cap delta for stability
    const t = state.clock.getElapsedTime();
    const screen = laptopScreenRef.current;
    const rig = rigRef.current;
    const a = animRef.current;

    // Sync refs
    isVisibleRef.current = visible;
    scrollRef.current = scrollProgress;

    // If not visible and not emerging, hide everything
    if (!visible && !hasEmergedRef.current) {
      if (rig) rig.visible = false;
      if (beamRef.current) beamRef.current.visible = false;
      if (particlesRef.current) particlesRef.current.visible = false;
      if (wireframeRef.current) wireframeRef.current.visible = false;
      if (chromaticRef.current) chromaticRef.current.visible = false;
      return;
    }

    // Smooth mouse interpolation
    smoothMouse.current.x = damp(smoothMouse.current.x, mouseRef.current.x, 8, dt);
    smoothMouse.current.y = damp(smoothMouse.current.y, mouseRef.current.y, 8, dt);
    const mx = smoothMouse.current.x;
    const my = smoothMouse.current.y;

    // ── Scroll Phase Calculations ──
    const p = Math.max(0, Math.min(1, scrollProgress));

    // Speed up emergence if user scrolls before auto-emergence completes
    if (p > 0.01 && p <= 0.15 && timelineRef.current && !hasEmergedRef.current) {
      const targetProgress = Math.min(1, p / 0.15);
      timelineRef.current.progress(targetProgress);
    }

    // Scroll-driven values (independent of emergence)
    let targetPanelZ: number;
    let targetRotateX: number;
    let targetScale: number;
    let targetY: number;
    let targetBeamOpacity: number;
    let targetBeamScaleY: number;
    let targetGlassOpacity: number;
    let targetHtmlOpacity: number;
    let targetHtmlBlur: number;
    let targetChromatic: number;
    let targetBrightness: number;
    let targetDissipation: number;
    let mouseParallaxActive: boolean;

    if (p <= 0.15) {
      // EMERGENCE / APPROACH
      const s = p / 0.15;
      targetPanelZ = THREE.MathUtils.lerp(0.2, 2.2, s); // Forward from screen
      targetRotateX = THREE.MathUtils.lerp(45, 8, s);
      targetScale = THREE.MathUtils.lerp(0.2, 1.0, s);
      targetY = THREE.MathUtils.lerp(0.0, 0.35, s);
      targetBeamOpacity = a.beamOpacity; // Controlled by GSAP
      targetBeamScaleY = a.beamScaleY;
      targetGlassOpacity = a.glassOpacity;
      targetHtmlOpacity = a.htmlOpacity;
      targetHtmlBlur = a.htmlBlur;
      targetChromatic = a.chromaticAberration;
      targetBrightness = 1.0;
      targetDissipation = 0;
      mouseParallaxActive = false;
    } else if (p <= 0.50) {
      // STABILIZED HERO
      targetPanelZ = 2.2;
      targetRotateX = 8;
      targetScale = 1.0;
      targetY = 0.35;
      targetBeamOpacity = 0.85;
      targetBeamScaleY = 1.0;
      targetGlassOpacity = isMobile ? 0.4 : 0.3;
      targetHtmlOpacity = 1.0;
      targetHtmlBlur = 0;
      targetChromatic = 0;
      targetBrightness = 1.0;
      targetDissipation = 0;
      mouseParallaxActive = true;
    } else if (p <= 0.75) {
      // DEEP READ
      const s = (p - 0.50) / 0.25;
      targetPanelZ = 2.2;
      targetRotateX = 8 + s * 2; // Slight tilt
      targetScale = 1.0;
      targetY = 0.35;
      targetBeamOpacity = 0.85;
      targetBeamScaleY = 1.0;
      targetGlassOpacity = isMobile ? 0.4 : 0.3;
      targetHtmlOpacity = 1.0;
      targetHtmlBlur = 0;
      targetChromatic = 0;
      targetBrightness = THREE.MathUtils.lerp(1.0, 0.85, s);
      targetDissipation = 0;
      mouseParallaxActive = true;
    } else if (p <= 0.90) {
      // ASCENSION
      const s = (p - 0.75) / 0.15;
      targetPanelZ = THREE.MathUtils.lerp(2.2, 2.5, s);
      targetRotateX = THREE.MathUtils.lerp(8, -15, s);
      targetScale = THREE.MathUtils.lerp(1.0, 0.92, s);
      targetY = THREE.MathUtils.lerp(0.35, 0.75, s); // Lift up
      targetBeamOpacity = THREE.MathUtils.lerp(0.85, 0.4, s);
      targetBeamScaleY = THREE.MathUtils.lerp(1.0, 0.6, s);
      targetGlassOpacity = THREE.MathUtils.lerp(isMobile ? 0.4 : 0.3, 0.05, s);
      targetHtmlOpacity = THREE.MathUtils.lerp(1.0, 0.5, s);
      targetHtmlBlur = s * 3;
      targetChromatic = s * 2;
      targetBrightness = 0.85;
      targetDissipation = s * 0.3;
      mouseParallaxActive = false;
    } else {
      // DISSIPATION
      const s = (p - 0.90) / 0.10;
      targetPanelZ = 2.5;
      targetRotateX = -15;
      targetScale = 0.92;
      targetY = 0.75;
      targetBeamOpacity = THREE.MathUtils.lerp(0.4, 0, s);
      targetBeamScaleY = THREE.MathUtils.lerp(0.6, 0.1, s);
      targetGlassOpacity = THREE.MathUtils.lerp(0.05, 0, s);
      targetHtmlOpacity = THREE.MathUtils.lerp(0.5, 0, s);
      targetHtmlBlur = 3 + s * 10;
      targetChromatic = 2 + s * 8; // RGB split intensifies
      targetBrightness = 0.85;
      targetDissipation = 0.3 + s * 0.7;
      mouseParallaxActive = false;
    }

    // Lerp current values toward targets for buttery smoothness
    const lambda = 12; // High responsiveness but smooth
    a.panelZ = damp(a.panelZ, targetPanelZ, lambda, dt);
    a.panelRotateX = damp(a.panelRotateX, targetRotateX, lambda, dt);
    a.panelScale = damp(a.panelScale, targetScale, lambda, dt);
    a.panelY = damp(a.panelY, targetY, lambda, dt);
    a.brightness = damp(a.brightness, targetBrightness, lambda, dt);
    a.chromaticAberration = damp(a.chromaticAberration, targetChromatic, lambda, dt);
    a.dissipationProgress = damp(a.dissipationProgress, targetDissipation, lambda, dt);

    // Beam values: use GSAP during emergence, then scroll-driven
    if (p > 0.15 || hasEmergedRef.current) {
      a.beamOpacity = damp(a.beamOpacity, targetBeamOpacity, lambda, dt);
      a.beamScaleY = damp(a.beamScaleY, targetBeamScaleY, lambda, dt);
    }
    if (p > 0.15 && hasEmergedRef.current) {
      a.glassOpacity = damp(a.glassOpacity, targetGlassOpacity, lambda, dt);
      a.htmlOpacity = damp(a.htmlOpacity, targetHtmlOpacity, lambda, dt);
      a.htmlBlur = damp(a.htmlBlur, targetHtmlBlur, lambda, dt);
    }

    // ── Laptop Screen Transform Decomposition ──
    if (!screen || !rig) {
      if (htmlWrapperRef.current) {
        htmlWrapperRef.current.style.opacity = "0";
      }
      return;
    }

    screen.updateWorldMatrix(true, false);
    screen.matrixWorld.decompose(
      scratch.screenPos,
      scratch.screenQuat,
      scratch.screenScale
    );

    scratch.screenNormal.set(0, 0, 1).applyQuaternion(scratch.screenQuat).normalize();
    scratch.screenUp.set(0, 1, 0).applyQuaternion(scratch.screenQuat).normalize();

    // Screen center (hinge + 0.75 up along screen face)
    scratch.screenCenter.copy(scratch.screenPos).addScaledVector(scratch.screenUp, 0.75);

    // ── Mouse Parallax ──
    const parallaxX = mouseParallaxActive ? mx * 3.0 : 0;
    const parallaxY = mouseParallaxActive ? my * 3.0 : 0;

    // ── Panel Hover (gentle sinusoidal float) ──
    const hoverY = hasEmergedRef.current && p < 0.85
      ? Math.sin(t * 1.05) * 0.04
      : 0;
    a.hoverPhase = t;

    // ── Position Hologram Rig ──
    // Forward along screenNormal from screenCenter
    scratch.rigPos.copy(scratch.screenCenter).add(scratch.screenNormal.clone().multiplyScalar(a.panelZ));
    scratch.rigPos.y += a.panelY + parallaxY * 0.015 + hoverY;

    rig.position.copy(scratch.rigPos);

    // Make panel face camera (billboard-ish but with tilt)
    rig.lookAt(camera.position);

    // Apply cinematic rotations
    const rotXRad = (a.panelRotateX + parallaxY) * (Math.PI / 180);
    const rotYRad = parallaxX * (Math.PI / 180);
    rig.rotateX(rotXRad);
    rig.rotateY(rotYRad);
    rig.scale.setScalar(a.panelScale);

    // Visibility culling
    const effectiveOpacity = a.htmlOpacity * (1 - a.dissipationProgress);
    rig.visible = effectiveOpacity > 0.005 && visible;

    // ── Update HTML Wrapper (via CSS custom properties, NOT React state) ──
    if (htmlWrapperRef.current) {
      const el = htmlWrapperRef.current;
      el.style.opacity = effectiveOpacity.toFixed(5);
      el.style.filter = `blur(${a.htmlBlur.toFixed(2)}px) brightness(${a.brightness.toFixed(3)})`;
      el.style.setProperty("--chromatic-shift", `${a.chromaticAberration.toFixed(2)}px`);
      el.classList.toggle("has-emerged", a.htmlOpacity > 0.05);
    }

    // ── Update Volumetric Beam ──
    if (beamRef.current) {
      const beamOp = a.beamOpacity;
      beamRef.current.visible = beamOp > 0.005 && visible;

      if (beamRef.current.visible) {
        // Beam connects screen center to hologram base
        scratch.beamTarget.copy(scratch.rigPos);
        scratch.beamTarget.y -= (PANEL_HEIGHT * 0.5 + 0.05) * a.panelScale;

        scratch.beamMid.copy(scratch.screenCenter).lerp(scratch.beamTarget, 0.5);
        scratch.beamDir.copy(scratch.beamTarget).sub(scratch.screenCenter).normalize();

        const beamDistance = scratch.screenCenter.distanceTo(scratch.beamTarget);

        beamRef.current.position.copy(scratch.beamMid);
        beamRef.current.quaternion.setFromUnitVectors(scratch.up, scratch.beamDir);
        beamRef.current.scale.set(
          0.5 * a.panelScale,
          beamDistance * a.beamScaleY,
          0.5 * a.panelScale
        );

        beamMaterial.uniforms.uTime.value = t;
        beamMaterial.uniforms.uOpacity.value = beamOp;
        beamMaterial.uniforms.uPulse.value = hasEmergedRef.current ? 1.0 : 0.5;
        beamMaterial.uniforms.uChromatic.value = a.chromaticAberration * 0.5;
      }
    }

    // ── Update Beam Particles ──
    if (particlesRef.current && particleCount > 0) {
      particleMaterial.uniforms.uTime.value = t;
      particleMaterial.uniforms.uOpacity.value = a.beamOpacity;
      particlesRef.current.visible = a.beamOpacity > 0.02 && visible;

      if (particlesRef.current.visible) {
        const posAttr = particlesRef.current.geometry.attributes.position;
        const posArray = posAttr.array as Float32Array;
        const lifeAttr = particlesRef.current.geometry.attributes.aLife;
        const lifeArray = lifeAttr.array as Float32Array;

        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;
          // Drift upward slowly
          posArray[i3 + 1] += particleSpeeds[i] * 0.0015;
          // Reset if too high
          if (posArray[i3 + 1] > 1.15) {
            posArray[i3 + 1] = 0;
            const radius = Math.random() * 0.5;
            const angle = Math.random() * Math.PI * 2;
            const y = 0;
            posArray[i3] = Math.cos(angle) * radius;
            posArray[i3 + 2] = Math.sin(angle) * radius;
          }
          // Update life cycle
          lifeArray[i] += 0.003;
          if (lifeArray[i] > 1) lifeArray[i] = 0;
        }
        posAttr.needsUpdate = true;
        lifeAttr.needsUpdate = true;
      }
    }

    // ── Update Glass Slab ──
    if (glassRef.current) {
      const mat = glassRef.current.material as THREE.MeshPhysicalMaterial | THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = a.glassOpacity;
        if ("transmission" in mat && !isMobile) {
          (mat as THREE.MeshPhysicalMaterial).transmission = a.glassOpacity > 0.01 ? 0.95 : 0;
        }
      }
    }

    // ── Update Edge Glow ──
    if (edgeTorusRef.current) {
      const pulse = 0.4 + Math.sin(t * 1.5) * 0.25 * a.rimPulse;
      const mat = edgeTorusRef.current.material as THREE.LineBasicMaterial;
      if (mat) {
        mat.opacity = pulse * a.glassOpacity * (1 - a.dissipationProgress);
      }
    }

    // ── Update Backing Glow ──
    if (glowRef.current) {
      backingMaterial.uniforms.uOpacity.value = a.glassOpacity * a.rimPulse * (1 - a.dissipationProgress);
      backingMaterial.uniforms.uTime.value = t;
      backingMaterial.uniforms.uPulse.value = a.rimPulse;
    }

    // ── Update Chromatic Dissolve Overlay ──
    if (chromaticRef.current) {
      chromaticRef.current.visible = a.chromaticAberration > 0.1 && visible;
      chromaticMaterial.uniforms.uIntensity.value = a.chromaticAberration;
      chromaticMaterial.uniforms.uTime.value = t;
    }

    // ── Update Rim Light ──
    if (rimLightRef.current) {
      rimLightRef.current.position.copy(scratch.rigPos);
      rimLightRef.current.position.z += 0.3;
      rimLightRef.current.intensity = a.beamOpacity * 2.8 * (1 - a.dissipationProgress);
    }

    // ── Update Beam Base Light (red tint on laptop chassis) ──
    if (beamBaseLightRef.current) {
      beamBaseLightRef.current.position.copy(scratch.screenCenter);
      beamBaseLightRef.current.position.y -= 0.1;
      beamBaseLightRef.current.intensity = a.beamOpacity * 1.8 * a.sourceGlow;
    }

    // ── Update Wireframe Spark ──
    if (wireframeRef.current) {
      screen.matrixWorld.decompose(
        scratch.wireframePos,
        scratch.wireframeQuat,
        scratch.wireframeScale
      );
      wireframeRef.current.position.copy(scratch.wireframePos);
      wireframeRef.current.quaternion.copy(scratch.wireframeQuat);
      wireframeRef.current.scale.setScalar(Math.max(0.001, a.wireframeScale));
      wireframeRef.current.visible = a.wireframeScale > 0.001 && visible;

      wireframeMaterial.uniforms.uTime.value = t;
      wireframeMaterial.uniforms.uOpacity.value = a.wireframeScale > 0.01 ? 0.8 : 0;
      wireframeMaterial.uniforms.uScale.value = a.wireframeScale;
      wireframeMaterial.uniforms.uChromatic.value = a.chromaticAberration;
    }
  });

  // ── Render ─────────────────────────────────────────────────────────────────
  if (!visible) return null;

  return (
    <group>
      {/* ═══ VOLUMETRIC BEAM ═══ */}
      <VolumetricBeam beamRef={beamRef} material={beamMaterial} isMobile={isMobile} />

      {/* ═══ BEAM PARTICLES ═══ */}
      <BeamParticles
        particlesRef={particlesRef}
        material={particleMaterial}
        count={particleCount}
        positions={particlePositions}
        sizes={particleSizes}
        phases={particlePhases}
        speeds={particleSpeeds}
        lives={particleLives}
      />

      {/* ═══ PHASE 1 WIREFRAME CUBE (The Spark) ═══ */}
      <WireframeSpark wireframeRef={wireframeRef} material={wireframeMaterial} />

      {/* ═══ BEAM BASE LIGHT ═══ */}
      <BeamBaseLight lightRef={beamBaseLightRef} />

      {/* ═══ HOLOGRAM RIG ═══ */}
      <group ref={rigRef} visible={false}>
        {/* ── Physical Glass Slab ── */}
        <GlassSlab glassRef={glassRef} material={glassMaterial} />

        {/* ── Edge Glow (rectangular rim) ── */}
        <EdgeGlow edgeRef={edgeTorusRef} />

        {/* ── Backing Glow (radial bloom behind panel) ── */}
        <BackingGlow glowRef={glowRef} material={backingMaterial} />

        {/* ── Chromatic Dissolve Overlay ── */}
        <ChromaticDissolve chromaticRef={chromaticRef} material={chromaticMaterial} />

        {/* ── Rim Light (crimson glow at panel) ── */}
        <RimLight rimLightRef={rimLightRef} />

        {/* ── HTML Content (DashboardHero) ── */}
        <Html
          transform
          center
          distanceFactor={0.27}
          zIndexRange={[20, 60]}
          style={{ pointerEvents: "auto", userSelect: "none" }}
        >
          <div
            ref={htmlWrapperRef}
            style={{
              width: isMobile ? "100vw" : "1400px",
              maxWidth: isMobile ? "100vw" : "1400px",
              padding: "32px 40px",
              background: "transparent",
              opacity: 0,
              transformOrigin: "center center",
              willChange: "opacity, filter",
            }}
          >
            <DashboardHero scrollProgress={scrollProgress} stageScale={1} spatial />
          </div>
        </Html>

        {/* ── Floating Debris (orbiting shards & data chips) ── */}
        <FloatingDebris visible={visible} isMobile={isMobile} animRef={animRef} />
      </group>

      {/* ═══ FLOOR PROJECTION ═══ */}
      <FloorProjection visible={visible} animRef={animRef} laptopScreenRef={laptopScreenRef} />
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
import { useMousePosition } from "@/hooks/useMousePosition";

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
  uniform float uIgnition;
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
    
    // ═══════════════════════════════════════════════════════════════
    // RADIAL IGNITION REVEAL — grid illuminates outward from center
    // ═══════════════════════════════════════════════════════════════
    float ignitionRadius = uIgnition * 55.0;
    float ignitionReveal = 1.0 - smoothstep(ignitionRadius * 0.7, ignitionRadius, dist);
    gridPattern *= ignitionReveal;
    nodeGlow *= ignitionReveal;
    centerGlow *= ignitionReveal;
    
    float alpha = (gridPattern + nodeGlow * 0.35 + centerGlow) * horizonFade * heightFade;
    alpha += mouseFloorGlow * 0.40 * perspectiveFade;
    alpha = clamp(alpha, 0.0, 0.65);
    
    gl_FragColor = vec4(color, alpha);
  }
`;

export default function NeonGrid({ floorOpacity = 1 }: { floorOpacity?: number }) {
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
      uIgnition: { value: 0.0 },
    }),
    []
  );

  useFrame((state) => {
    if (gridMaterialRef.current) {
      gridMaterialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      gridMaterialRef.current.uniforms.uIgnition.value = floorOpacity;

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

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import * as THREE from "three";

export interface PostProcessingProps {
  hologramActive?: boolean;
  scrollProgress?: number;
  powerUpStage?: string;
}

/* ═══════════════════════════════════════════════════════════════════════════
   1. CHROMATIC ABERRATION — RGB edge-split, intensifies with hologram
   ═══════════════════════════════════════════════════════════════════════════ */
const ChromaticShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uIntensity: { value: 0.0 },
    uTime: { value: 0.0 },
    uScroll: { value: 0.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uIntensity;
    uniform float uTime;
    uniform float uScroll;
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;
      vec2 center = uv - 0.5;
      float dist = length(center);

      // Radial shift — stronger at edges, animated micro-jitter
      float shift = uIntensity * 0.014 * pow(dist, 1.6);
      float jitter = sin(uTime * 18.0 + dist * 12.0) * 0.0012 * uIntensity;
      float scrollBoost = uScroll * 0.003;

      float r = texture2D(tDiffuse, uv + vec2(shift + jitter + scrollBoost, 0.0)).r;
      float g = texture2D(tDiffuse, uv + vec2(jitter * 0.5, 0.0)).g;
      float b = texture2D(tDiffuse, uv - vec2(shift * 0.8 + jitter - scrollBoost, 0.0)).b;

      // Vertical chromatic split (subtle)
      float vShift = shift * 0.25;
      r = mix(r, texture2D(tDiffuse, uv + vec2(0.0, vShift)).r, 0.15);
      b = mix(b, texture2D(tDiffuse, uv - vec2(0.0, vShift * 0.6)).b, 0.15);

      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `,
};

/* ═══════════════════════════════════════════════════════════════════════════
   2. VIGNETTE — Cinematic corner-darkening, crimson-tinted in hologram mode
   ═══════════════════════════════════════════════════════════════════════════ */
const VignetteShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uIntensity: { value: 0.08 },
    uColor: { value: new THREE.Color("#000000") },
    uCrimsonTint: { value: 0.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uIntensity;
    uniform vec3 uColor;
    uniform float uCrimsonTint;
    varying vec2 vUv;

    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec2 uv = vUv - 0.5;
      float dist = length(uv * vec2(1.0, 0.88));
      float vignette = 1.0 - smoothstep(0.35, 1.25, dist);
      vignette = mix(1.0, vignette, uIntensity);

      vec3 crimson = vec3(0.04, 0.0, 0.01);
      vec3 vignetteColor = mix(uColor, crimson, uCrimsonTint);
      texel.rgb = mix(vignetteColor * texel.rgb * 0.85, texel.rgb, vignette);

      gl_FragColor = texel;
    }
  `,
};

/* ═══════════════════════════════════════════════════════════════════════════
   3. FILM GRAIN + SCANLINES + FLICKER — Organic celluloid feel
   ═══════════════════════════════════════════════════════════════════════════ */
const FilmShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0.0 },
    uGrain: { value: 0.028 },
    uScanline: { value: 0.035 },
    uFlicker: { value: 0.012 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uGrain;
    uniform float uScanline;
    uniform float uFlicker;
    varying vec2 vUv;

    float rand(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453);
    }

    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);

      // Grain
      float g = rand(vUv * 600.0 + uTime * 3.0) * uGrain;
      texel.rgb += g - uGrain * 0.5;

      // Scanlines
      float sl = sin(vUv.y * 900.0 + uTime * 0.4) * 0.5 + 0.5;
      sl = pow(sl, 2.0) * uScanline;
      texel.rgb *= 1.0 - sl;

      // Flicker
      float flick = 1.0 + sin(uTime * 24.0 + vUv.x * 40.0) * uFlicker;
      texel.rgb *= flick;

      gl_FragColor = texel;
    }
  `,
};

/* ═══════════════════════════════════════════════════════════════════════════
   4. COLOR GRADING — ACES-inspired tone curve + crimson lift
   ═══════════════════════════════════════════════════════════════════════════ */
const ColorGradeShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uContrast: { value: 1.08 },
    uSaturation: { value: 1.12 },
    uCrimsonLift: { value: 0.0 },
    uBrightness: { value: 1.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uContrast;
    uniform float uSaturation;
    uniform float uCrimsonLift;
    uniform float uBrightness;
    varying vec2 vUv;

    vec3 applyContrast(vec3 c, float cst) {
      return (c - 0.5) * cst + 0.5;
    }

    vec3 applySaturation(vec3 c, float sat) {
      float lum = dot(c, vec3(0.299, 0.587, 0.114));
      return mix(vec3(lum), c, sat);
    }

    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec3 col = texel.rgb;

      col = applyContrast(col, uContrast);
      col = applySaturation(col, uSaturation);
      col *= uBrightness;

      // Crimson lift in shadows when hologram is active
      vec3 lift = vec3(0.04, 0.001, 0.005) * uCrimsonLift;
      col += lift * (1.0 - max(max(col.r, col.g), col.b));

      // S-curve for cinematic punch
      col = col * (col * (col * 0.14 + 0.68) + 0.18);

      gl_FragColor = vec4(clamp(col, 0.0, 1.0), texel.a);
    }
  `,
};

/* ═══════════════════════════════════════════════════════════════════════════
   5. LENS DISTORTION / BARREL — Subtle warping for anamorphic feel
   ═══════════════════════════════════════════════════════════════════════════ */
const LensDistortShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uStrength: { value: 0.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uStrength;
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv - 0.5;
      float dist = length(uv);
      float factor = 1.0 + uStrength * dist * dist;
      vec2 distorted = uv * factor + 0.5;

      if (distorted.x < 0.0 || distorted.x > 1.0 || distorted.y < 0.0 || distorted.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      } else {
        gl_FragColor = texture2D(tDiffuse, distorted);
      }
    }
  `,
};

/* ═══════════════════════════════════════════════════════════════════════════
   BLOOM PRESETS
   ═══════════════════════════════════════════════════════════════════════════ */
const BLOOM_DEFAULT = { strength: 0.32, radius: 0.35, threshold: 0.40 };
const BLOOM_HOLOGRAM = { strength: 0.55, radius: 0.45, threshold: 0.35 };
const BLOOM_WORMHOLE = { strength: 0.72, radius: 0.55, threshold: 0.28 };
const BLOOM_DISSIPATE = { strength: 0.68, radius: 0.50, threshold: 0.30 };

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN POST-PROCESSING COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function PostProcessing({
  hologramActive,
  scrollProgress = 0,
  powerUpStage,
}: PostProcessingProps) {
  const { gl, scene, camera, size } = useThree();

  const bloomRef = useRef<UnrealBloomPass | null>(null);
  const chromaticRef = useRef<ShaderPass | null>(null);
  const vignetteRef = useRef<ShaderPass | null>(null);
  const filmRef = useRef<ShaderPass | null>(null);
  const colorGradeRef = useRef<ShaderPass | null>(null);
  const lensRef = useRef<ShaderPass | null>(null);

  // Smooth animated values (refs — zero React re-renders)
  const smoothBloom = useRef({ s: BLOOM_DEFAULT.strength, r: BLOOM_DEFAULT.radius, t: BLOOM_DEFAULT.threshold });
  const smoothChromatic = useRef(0.0);
  const smoothVignette = useRef(0.08);
  const smoothCrimsonTint = useRef(0.0);
  const smoothFilm = useRef({ grain: 0.028, scanline: 0.035, flicker: 0.012 });
  const smoothColor = useRef({ contrast: 1.08, saturation: 1.12, lift: 0.0, brightness: 1.0 });
  const smoothLens = useRef(0.0);

  const composer = useMemo(() => {
    const comp = new EffectComposer(gl);

    // 1. Render
    comp.addPass(new RenderPass(scene, camera));

    // 2. Bloom (Unreal)
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      BLOOM_DEFAULT.strength,
      BLOOM_DEFAULT.radius,
      BLOOM_DEFAULT.threshold
    );
    bloomRef.current = bloom;
    comp.addPass(bloom);

    // 3. Chromatic Aberration
    const chromatic = new ShaderPass(ChromaticShader);
    chromaticRef.current = chromatic;
    comp.addPass(chromatic);

    // 4. Lens Distortion
    const lens = new ShaderPass(LensDistortShader);
    lensRef.current = lens;
    comp.addPass(lens);

    // 5. Vignette
    const vignette = new ShaderPass(VignetteShader);
    vignetteRef.current = vignette;
    comp.addPass(vignette);

    // 6. Film Grain + Scanlines
    const film = new ShaderPass(FilmShader);
    filmRef.current = film;
    comp.addPass(film);

    // 7. Color Grading
    const colorGrade = new ShaderPass(ColorGradeShader);
    colorGradeRef.current = colorGrade;
    comp.addPass(colorGrade);

    // 8. Output (ACES tone mapping handled by R3F, this is gamma + color space)
    comp.addPass(new OutputPass());

    return comp;
  }, [gl, scene, camera]);

  useEffect(() => {
    composer.setSize(size.width, size.height);
    const dpr = Math.min(window.devicePixelRatio, 2);
    composer.setPixelRatio(dpr);
    return () => { composer.dispose(); };
  }, [composer, size.width, size.height]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const p = Math.max(0, Math.min(1, scrollProgress));
    const isWormhole = powerUpStage === "wormhole" || powerUpStage === "rift" || powerUpStage === "emergence";
    const isDissipate = p > 0.90;

    /* ── Determine target bloom ── */
    let targetBloom = BLOOM_DEFAULT;
    if (isWormhole) targetBloom = BLOOM_WORMHOLE;
    else if (isDissipate) targetBloom = BLOOM_DISSIPATE;
    else if (hologramActive) targetBloom = BLOOM_HOLOGRAM;

    /* ── Smooth lerp all values ── */
    const dt = Math.min(state.clock.getDelta(), 0.05);
    const lambda = 6.0;
    const lerp = (c: number, tgt: number) => c + (tgt - c) * (1.0 - Math.exp(-lambda * dt));

    smoothBloom.current.s = lerp(smoothBloom.current.s, targetBloom.strength);
    smoothBloom.current.r = lerp(smoothBloom.current.r, targetBloom.radius);
    smoothBloom.current.t = lerp(smoothBloom.current.t, targetBloom.threshold);

    if (bloomRef.current) {
      bloomRef.current.strength = smoothBloom.current.s;
      bloomRef.current.radius = smoothBloom.current.r;
      bloomRef.current.threshold = smoothBloom.current.t;
    }

    /* ── Chromatic aberration ── */
    let targetChromatic = 0.0;
    if (hologramActive && p > 0.85) targetChromatic = 3.5 + (p - 0.85) * 40.0; // Dissipation burst
    else if (isWormhole) targetChromatic = 2.2;
    else if (hologramActive) targetChromatic = 0.6;

    smoothChromatic.current = lerp(smoothChromatic.current, targetChromatic);
    if (chromaticRef.current) {
      chromaticRef.current.uniforms.uIntensity.value = smoothChromatic.current;
      chromaticRef.current.uniforms.uTime.value = t;
      chromaticRef.current.uniforms.uScroll.value = p;
    }

    /* ── Vignette ── */
    let targetVignette = 0.08;
    let targetCrimsonTint = 0.0;
    if (hologramActive) { targetVignette = 0.18; targetCrimsonTint = 0.35; }
    if (isWormhole) { targetVignette = 0.22; targetCrimsonTint = 0.55; }
    if (p > 0.85) { targetVignette = 0.28; targetCrimsonTint = 0.65; }

    smoothVignette.current = lerp(smoothVignette.current, targetVignette);
    smoothCrimsonTint.current = lerp(smoothCrimsonTint.current, targetCrimsonTint);
    if (vignetteRef.current) {
      vignetteRef.current.uniforms.uIntensity.value = smoothVignette.current;
      vignetteRef.current.uniforms.uCrimsonTint.value = smoothCrimsonTint.current;
    }

    /* ── Film grain / scanlines ── */
    let targetGrain = 0.028;
    let targetScanline = 0.035;
    let targetFlicker = 0.012;
    if (hologramActive) { targetGrain = 0.038; targetScanline = 0.045; targetFlicker = 0.018; }
    if (isWormhole) { targetGrain = 0.055; targetScanline = 0.065; targetFlicker = 0.035; }

    smoothFilm.current.grain = lerp(smoothFilm.current.grain, targetGrain);
    smoothFilm.current.scanline = lerp(smoothFilm.current.scanline, targetScanline);
    smoothFilm.current.flicker = lerp(smoothFilm.current.flicker, targetFlicker);
    if (filmRef.current) {
      filmRef.current.uniforms.uGrain.value = smoothFilm.current.grain;
      filmRef.current.uniforms.uScanline.value = smoothFilm.current.scanline;
      filmRef.current.uniforms.uFlicker.value = smoothFilm.current.flicker;
      filmRef.current.uniforms.uTime.value = t;
    }

    /* ── Color grading ── */
    let targetContrast = 1.08;
    let targetSat = 1.12;
    let targetLift = 0.0;
    let targetBrightness = 1.0;
    if (hologramActive) { targetContrast = 1.14; targetSat = 1.22; targetLift = 0.12; targetBrightness = 1.05; }
    if (isWormhole) { targetContrast = 1.22; targetSat = 1.35; targetLift = 0.22; targetBrightness = 1.12; }
    if (p > 0.85) { targetBrightness = 0.88; targetSat = 0.95; }

    smoothColor.current.contrast = lerp(smoothColor.current.contrast, targetContrast);
    smoothColor.current.saturation = lerp(smoothColor.current.saturation, targetSat);
    smoothColor.current.lift = lerp(smoothColor.current.lift, targetLift);
    smoothColor.current.brightness = lerp(smoothColor.current.brightness, targetBrightness);
    if (colorGradeRef.current) {
      colorGradeRef.current.uniforms.uContrast.value = smoothColor.current.contrast;
      colorGradeRef.current.uniforms.uSaturation.value = smoothColor.current.saturation;
      colorGradeRef.current.uniforms.uCrimsonLift.value = smoothColor.current.lift;
      colorGradeRef.current.uniforms.uBrightness.value = smoothColor.current.brightness;
    }

    /* ── Lens distortion ── */
    let targetLens = 0.0;
    if (isWormhole) targetLens = 0.035;
    else if (hologramActive && p > 0.5) targetLens = 0.012;
    smoothLens.current = lerp(smoothLens.current, targetLens);
    if (lensRef.current) {
      lensRef.current.uniforms.uStrength.value = smoothLens.current;
    }

    /* ── Render ── */
    composer.render();
  }, 1);

  return null;
}
```

## File: `src/components/canvas/Scene.tsx`

```typescript
"use client";

import React, { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { CinematicCamera } from "@/animations/scrollCamera";
import { useDeviceSize } from "@/hooks/useDeviceSize";
import { PowerUpStageValues } from "@/animations/powerUpSequence";
import { WormholeValues } from "@/animations/wormholeLaptop";
import NebulaBackground from "./NebulaBackground";
import StarField from "./StarField";
import ShootingStars from "./ShootingStars";
import DeepSpaceGlobe from "./DeepSpaceGlobe";
import VolumetricRays from "./VolumetricRays";
import MagneticParticles from "./MagneticParticles";
import FloatingHexParticles from "./FloatingHexParticles";
import TechCubes from "./TechCubes";
import FloatingLaptop from "./FloatingLaptop";
import HolographicProjection from "./HolographicProjection";
import WormholeLaptopEntry from "./WormholeLaptopEntry";
import NeonGrid from "./NeonGrid";
import FloorRings from "./FloorRings";
import PostProcessing from "./PostProcessing";

interface SceneProps {
  scrollProgress: number;
  powerUpStage?: string;
  powerUpValues?: PowerUpStageValues;
  isPowerUpActive?: boolean;
  wormholeValues?: WormholeValues;
  wormholeActive?: boolean;
  lensDistortion?: number;
}

function SceneLights({ powerUpValues, isPowerUpActive }: { powerUpValues?: PowerUpStageValues; isPowerUpActive?: boolean }) {
  // Smooth multipliers — direct JSX calculation, no useFrame mutation hacks
  const s = isPowerUpActive && powerUpValues ? powerUpValues.sceneOpacity : 1;
  const f = isPowerUpActive && powerUpValues ? powerUpValues.floorOpacity : 1;
  const fl = isPowerUpActive && powerUpValues ? powerUpValues.floorFlicker : 1;
  const l = isPowerUpActive && powerUpValues ? powerUpValues.laptopOpacity : 1;
  const st = isPowerUpActive && powerUpValues ? powerUpValues.starsOpacity : 1;
  const c = isPowerUpActive && powerUpValues ? powerUpValues.cubesOpacity : 1;
  const g = isPowerUpActive && powerUpValues ? powerUpValues.globeOpacity : 1;

  return (
    <>
      <ambientLight intensity={0.03 * s} color="#0a0002" />

      {/* General scene lights */}
      <pointLight position={[5, 4, 6]} intensity={2.2 * s} color="#ff1744" distance={70} decay={2} />
      <pointLight position={[-5, 5, -4]} intensity={1.4 * s} color="#ff4444" distance={55} decay={2} />
      <pointLight position={[0, -1, 10]} intensity={1.6 * s} color="#800010" distance={45} decay={2} />
      <pointLight position={[14, 10, -22]} intensity={2.8 * st} color="#ff1744" distance={90} decay={2} />
      <spotLight position={[4, 7, 5]} angle={0.5} penumbra={0.8} intensity={1.4 * s} color="#ff1744" distance={55} />

      {/* Floor grid lights */}
      <pointLight position={[0.8, -1.0, 0]} intensity={2.2 * f * fl} color="#ff1744" distance={14} decay={2} />
      <pointLight position={[-2, -0.3, 2]} intensity={1.0 * f * fl} color="#cc1133" distance={10} decay={2} />
      <pointLight position={[0, -1.5, 5]} intensity={1.5 * f * fl} color="#660010" distance={20} decay={2} />

      {/* Laptop area lights */}
      <pointLight position={[2.5, 1.0, 0.5]} intensity={1.4 * l} color="#ff1744" distance={12} decay={2} />
      <pointLight position={[-1, 1.5, 3]} intensity={0.7 * l} color="#ff8a80" distance={10} decay={2} />

      {/* Background / star lights */}
      <pointLight position={[0, 8, -30]} intensity={1.0 * st} color="#ff1744" distance={60} decay={2} />
      <pointLight position={[-8, 3, 2]} intensity={0.4 * st} color="#ff3355" distance={30} decay={2} />

      {/* Globe accent light — casts real-time reflections on the floor */}
      <pointLight position={[4.5, 2.5, -8]} intensity={3.5 * g} color="#ff1744" distance={25} decay={2} />
      <pointLight position={[4.5, 0.5, -8]} intensity={2.0 * g} color="#800010" distance={20} decay={2} />

      {/* Cube accent light */}
      <pointLight position={[-1, 2, -2]} intensity={0.8 * c} color="#ff1744" distance={15} decay={2} />
    </>
  );
}

export default function Scene({
  scrollProgress,
  powerUpStage,
  powerUpValues,
  isPowerUpActive,
  wormholeValues,
  wormholeActive = false,
  lensDistortion = 0,
}: SceneProps) {
  const { deviceTier } = useDeviceSize();
  const isMobile = deviceTier === "mobile";
  const laptopScreenRef = useRef<THREE.Mesh | null>(null);

  const showFloor = !isPowerUpActive || (powerUpValues && powerUpValues.floorOpacity > 0.0001);
  const showGlobe = !isPowerUpActive || (powerUpValues && powerUpValues.globeOpacity > 0.0001);
  const showStars = !isPowerUpActive || (powerUpValues && powerUpValues.starsOpacity > 0.0001);
  const showCubes = !isPowerUpActive || (powerUpValues && powerUpValues.cubesOpacity > 0.0001);

  // Laptop is visible when wormhole is active OR when laptopOpacity > 0
  const showLaptop =
    wormholeActive ||
    !isPowerUpActive ||
    (powerUpValues && powerUpValues.laptopOpacity > 0.0001);

  const floorOpacity = powerUpValues?.floorOpacity ?? 1;
  const starsOpacity = powerUpValues?.starsOpacity ?? 1;
  const globeOpacity = powerUpValues?.globeOpacity ?? 1;
  const laptopOpacity = powerUpValues?.laptopOpacity ?? 1;
  const cubesOpacity = powerUpValues?.cubesOpacity ?? 1;
  const hologramVisible = powerUpStage === "ui" || powerUpStage === "complete" || (!isPowerUpActive && !wormholeActive);

  return (
    <div className="fixed inset-0 z-0 h-full w-full" style={{ background: "#000000" }}>
      <Canvas
        shadows
        frameloop="always"
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
        <CinematicCamera scrollProgress={scrollProgress} lensDistortion={lensDistortion} />

        <color attach="background" args={["#000000"]} />

        <SceneLights powerUpValues={powerUpValues} isPowerUpActive={isPowerUpActive} />

        <Suspense fallback={null}>
          <group visible={showStars}>
            <NebulaBackground />
            <StarField starsOpacity={starsOpacity} />
            <ShootingStars />
          </group>

          <group visible={showGlobe}>
            <DeepSpaceGlobe scrollProgress={scrollProgress} globeOpacity={globeOpacity} />
          </group>

          <VolumetricRays />
          <MagneticParticles />
          <FloatingHexParticles />

          <group visible={showCubes}>
            <TechCubes cubesOpacity={cubesOpacity} />
          </group>

          {/* Wormhole entry effects — only renders when active */}
          {wormholeActive && wormholeValues && (
            <WormholeLaptopEntry
              wormholeValues={wormholeValues}
              isActive={wormholeActive}
            />
          )}

          <group visible={!!showLaptop}>
            <FloatingLaptop
              powerUpStage={powerUpStage}
              laptopOpacity={laptopOpacity}
              wormholeValues={wormholeValues}
              wormholeActive={wormholeActive}
              laptopScreenRef={laptopScreenRef}
            />
          </group>

          <HolographicProjection
            scrollProgress={scrollProgress}
            laptopScreenRef={laptopScreenRef}
            visible={hologramVisible}
            deviceTier={deviceTier}
          />

          <group visible={showFloor}>
            <NeonGrid floorOpacity={floorOpacity} />
            <FloorRings />
          </group>

          <PostProcessing hologramActive={hologramVisible} />
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
  progress: number;
  delay: number;
  trailLength: number;
  active: boolean;
}

const STAR_COUNT = 5;
const TRAIL_SEGMENTS = 28;
const TOTAL_PARTICLES = STAR_COUNT * TRAIL_SEGMENTS;

export default function ShootingStars() {
  const pointsRef = useRef<THREE.Points>(null);
  const headRef = useRef<THREE.Points>(null);

  const stars = useMemo<StarData[]>(() => {
    const data: StarData[] = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      data.push({
        pos: new THREE.Vector3(),
        dir: new THREE.Vector3(),
        speed: 18 + Math.random() * 14,
        progress: 0,
        delay: 0.5 + Math.random() * 4.5,
        trailLength: 5 + Math.random() * 4,
        active: false,
      });
    }
    return data;
  }, []);

  // Trail particle buffers
  const trailPositions = useMemo(() => new Float32Array(TOTAL_PARTICLES * 3), []);
  const trailSizes = useMemo(() => new Float32Array(TOTAL_PARTICLES), []);
  const trailColors = useMemo(() => new Float32Array(TOTAL_PARTICLES * 3), []);
  const trailOpacities = useMemo(() => new Float32Array(TOTAL_PARTICLES), []);

  // Head spark buffers
  const headPositions = useMemo(() => new Float32Array(STAR_COUNT * 3), []);
  const headSizes = useMemo(() => {
    const sz = new Float32Array(STAR_COUNT);
    for (let i = 0; i < STAR_COUNT; i++) sz[i] = 8 + Math.random() * 4;
    return sz;
  }, []);

  const resetStar = (star: StarData) => {
    // Spawn in upper-right sky, arc across to lower-left
    star.pos.set(
      12 + Math.random() * 16,
      7 + Math.random() * 8,
      -14 - Math.random() * 10
    );
    star.progress = 0;
    star.delay = 1.0 + Math.random() * 5.0;
    star.speed = 16 + Math.random() * 14;
    star.trailLength = 5 + Math.random() * 5;
    star.active = false;
    // Direction: left, slightly down, slight Z variation
    star.dir.set(
      -0.92 + (Math.random() - 0.5) * 0.08,
      -0.32 + (Math.random() - 0.5) * 0.12,
      (Math.random() - 0.5) * 0.15
    ).normalize();
  };

  // Initialize all stars offscreen
  stars.forEach(s => resetStar(s));

  const trailUniforms = useMemo(() => ({
    uTime: { value: 0 },
  }), []);

  const headUniforms = useMemo(() => ({
    uTime: { value: 0 },
  }), []);

  useFrame((_, delta) => {
    if (!pointsRef.current || !headRef.current) return;
    const dt = Math.min(delta, 0.05);

    const posAttr = pointsRef.current.geometry.attributes.position;
    const posArray = posAttr.array as Float32Array;
    const sizeAttr = pointsRef.current.geometry.attributes.aSize;
    const sizeArray = sizeAttr.array as Float32Array;
    const colAttr = pointsRef.current.geometry.attributes.aColor;
    const colArray = colAttr.array as Float32Array;
    const opAttr = pointsRef.current.geometry.attributes.aOpacity;
    const opArray = opAttr.array as Float32Array;

    const headPosAttr = headRef.current.geometry.attributes.position;
    const headPosArray = headPosAttr.array as Float32Array;

    stars.forEach((star, si) => {
      const baseIdx = si * TRAIL_SEGMENTS;

      if (star.delay > 0) {
        star.delay -= dt;
        // Hide all trail particles offscreen
        for (let j = 0; j < TRAIL_SEGMENTS; j++) {
          const idx = (baseIdx + j) * 3;
          posArray[idx] = 0;
          posArray[idx + 1] = -999;
          posArray[idx + 2] = 0;
          opArray[baseIdx + j] = 0;
        }
        headPosArray[si * 3] = 0;
        headPosArray[si * 3 + 1] = -999;
        headPosArray[si * 3 + 2] = 0;
        return;
      }

      if (!star.active) {
        star.active = true;
      }

      star.progress += dt * star.speed;

      const head = star.pos.clone().addScaledVector(star.dir, star.progress);

      // Update head spark position
      headPosArray[si * 3] = head.x;
      headPosArray[si * 3 + 1] = head.y;
      headPosArray[si * 3 + 2] = head.z;

      // Build trail: interpolate from head backwards along direction
      for (let j = 0; j < TRAIL_SEGMENTS; j++) {
        const t = j / (TRAIL_SEGMENTS - 1); // 0 = head, 1 = tail
        const distBack = t * star.trailLength;
        const point = head.clone().addScaledVector(star.dir, -distBack);

        const idx = (baseIdx + j) * 3;
        posArray[idx] = point.x;
        posArray[idx + 1] = point.y;
        posArray[idx + 2] = point.z;

        // Size: head is largest, tail shrinks
        const sizeCurve = Math.pow(1 - t, 1.4);
        sizeArray[baseIdx + j] = (3.5 + sizeCurve * 5.5) * (0.8 + Math.random() * 0.05);

        // Color temperature: white-hot head -> orange -> red tail
        const r = 1.0;
        const g = t < 0.25 ? 0.95 - t * 1.8 : Math.max(0.08, 0.5 - t * 0.8);
        const b = t < 0.15 ? 0.85 - t * 4.0 : Math.max(0.02, 0.2 - t * 0.4);
        colArray[idx] = r;
        colArray[idx + 1] = g;
        colArray[idx + 2] = b;

        // Opacity: head bright, tail fades out
        const lifeRatio = Math.min(1.0, star.progress / 10.0);
        const lifeFade = Math.sin(lifeRatio * Math.PI); // fade in then out
        const trailFade = Math.pow(1 - t, 0.7);
        opArray[baseIdx + j] = lifeFade * trailFade;
      }

      // Reset when traveled too far
      if (star.progress > 35.0) {
        resetStar(star);
        // Hide head
        headPosArray[si * 3] = 0;
        headPosArray[si * 3 + 1] = -999;
        headPosArray[si * 3 + 2] = 0;
      }
    });

    posAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    opAttr.needsUpdate = true;
    headPosAttr.needsUpdate = true;
  });

  return (
    <group renderOrder={60}>
      {/* Glowing particle trail */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[trailPositions, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[trailSizes, 1]} />
          <bufferAttribute attach="attributes-aColor" args={[trailColors, 3]} />
          <bufferAttribute attach="attributes-aOpacity" args={[trailOpacities, 1]} />
        </bufferGeometry>
        <shaderMaterial
          uniforms={trailUniforms}
          vertexShader={`
            attribute float aSize;
            attribute vec3 aColor;
            attribute float aOpacity;
            varying vec3 vColor;
            varying float vAlpha;
            void main() {
              vColor = aColor;
              vAlpha = aOpacity;
              vec4 mv = modelViewMatrix * vec4(position, 1.0);
              gl_Position = projectionMatrix * mv;
              gl_PointSize = aSize * (28.0 / max(1.0, -mv.z));
              gl_PointSize = min(gl_PointSize, 64.0);
            }
          `}
          fragmentShader={`
            varying vec3 vColor;
            varying float vAlpha;
            void main() {
              vec2 uv = gl_PointCoord - vec2(0.5);
              float d = length(uv);
              // Soft radial glow with hot core
              float core = smoothstep(0.5, 0.0, d);
              float glow = smoothstep(0.5, 0.18, d) * 0.45;
              float halo = smoothstep(0.5, 0.35, d) * 0.15;
              if (core + glow + halo < 0.01) discard;
              float alpha = (core * 1.0 + glow * 0.7 + halo * 0.3) * vAlpha;
              vec3 finalColor = vColor * (1.0 + core * 0.8);
              gl_FragColor = vec4(finalColor, alpha);
            }
          `}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Bright white-hot head spark */}
      <points ref={headRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[headPositions, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[headSizes, 1]} />
        </bufferGeometry>
        <shaderMaterial
          uniforms={headUniforms}
          vertexShader={`
            attribute float aSize;
            varying float vSize;
            void main() {
              vSize = aSize;
              vec4 mv = modelViewMatrix * vec4(position, 1.0);
              gl_Position = projectionMatrix * mv;
              gl_PointSize = aSize * (32.0 / max(1.0, -mv.z));
              gl_PointSize = min(gl_PointSize, 80.0);
            }
          `}
          fragmentShader={`
            varying float vSize;
            void main() {
              vec2 uv = gl_PointCoord - vec2(0.5);
              float d = length(uv);
              // Intense white-hot core
              float core = smoothstep(0.5, 0.0, d);
              // Warm orange-red glow ring
              float glow = smoothstep(0.5, 0.15, d) * 0.6;
              // Wide faint halo
              float halo = smoothstep(0.5, 0.38, d) * 0.2;
              if (core + glow + halo < 0.01) discard;
              // Color: white core, warm outer
              vec3 color = mix(vec3(1.0, 0.92, 0.85), vec3(1.0, 0.4, 0.15), d * 1.8);
              float alpha = core * 1.0 + glow * 0.8 + halo * 0.25;
              gl_FragColor = vec4(color, alpha);
            }
          `}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
```

## File: `src/components/canvas/StarField.tsx`

```typescript
"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ═══════════════════════════════════════════════════════════════════════
// REALISTIC CONSTELLATIONS — Clean stick-figure asterisms
// No messy crossing lines. Recognizable mythological shapes.
// ═══════════════════════════════════════════════════════════════════════
const clusters = [
  {
    // ORION — The Hunter: belt of 3, shoulders, knees
    name: "orion",
    nodes: [
      [-7.0,  9.0, -22.0],  // 0 left shoulder
      [-5.0,  9.0, -22.0],  // 1 belt left
      [-3.0,  9.0, -22.0],  // 2 belt center
      [-1.0,  9.0, -22.0],  // 3 belt right
      [-6.0, 12.5, -23.0],  // 4 right shoulder
      [-4.0, 12.5, -23.0],  // 5 (unused spacer)
      [-5.5,  6.0, -21.0],  // 6 left knee
      [-2.5,  6.0, -21.0],  // 7 right knee
    ] as [number, number, number][],
    connections: [[0,1],[1,2],[2,3],[0,4],[3,4],[1,6],[2,7]] as [number, number][]
  },
  {
    // BIG DIPPER — Handle + bowl
    name: "dipper",
    nodes: [
      [10.0, 11.0, -26.0],  // 0 handle end
      [12.0, 11.5, -26.0],  // 1 handle mid
      [14.0, 11.0, -26.0],  // 2 bowl top-left
      [15.5,  9.0, -26.0],  // 3 bowl top-right
      [15.0,  7.0, -26.0],  // 4 bowl bottom-right
      [13.0,  6.5, -26.0],  // 5 bowl bottom-left
      [11.5,  7.5, -26.0],  // 6 bowl inner-left
    ] as [number, number, number][],
    connections: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,2]] as [number, number][]
  },
  {
    // CASSIOPEIA — Classic W in the sky
    name: "cassiopeia",
    nodes: [
      [-2.0, 13.5, -24.0],  // 0
      [-1.0, 11.0, -24.0],  // 1
      [ 0.0, 12.5, -24.0],  // 2
      [ 1.0, 11.0, -24.0],  // 3
      [ 2.0, 13.5, -24.0],  // 4
    ] as [number, number, number][],
    connections: [[0,1],[1,2],[2,3],[3,4]] as [number, number][]
  },
  {
    // CYGNUS — Northern Cross
    name: "cygnus",
    nodes: [
      [ 6.0, 16.0, -28.0],  // 0 head
      [ 6.0, 13.5, -28.0],  // 1 neck
      [ 6.0, 11.0, -28.0],  // 2 body
      [ 6.0,  8.5, -28.0],  // 3 lower body
      [ 4.5,  7.5, -28.0],  // 4 left wing
      [ 7.5,  7.5, -28.0],  // 5 right wing
    ] as [number, number, number][],
    connections: [[0,1],[1,2],[2,3],[3,4],[3,5]] as [number, number][]
  },
  {
    // LEO — Sickle mane + triangular body
    name: "leo",
    nodes: [
      [-12.0,  7.5, -25.0],  // 0 nose
      [-10.5,  9.0, -25.0],  // 1 mane top
      [-10.0,  6.5, -25.0],  // 2 mane bottom
      [-8.5,  8.0, -25.0],  // 3 neck
      [-8.0,  5.5, -25.0],  // 4 hind
    ] as [number, number, number][],
    connections: [[0,1],[1,2],[2,0],[1,3],[3,4]] as [number, number][]
  },
  {
    // CANIS MAJOR — Winter triangle
    name: "canis",
    nodes: [
      [16.0,  8.5, -30.0],  // 0
      [18.5, 10.0, -30.0],  // 1
      [17.5,  6.5, -30.0],  // 2
    ] as [number, number, number][],
    connections: [[0,1],[1,2],[2,0]] as [number, number][]
  },
  {
    // HERCULES — Keystone box
    name: "hercules",
    nodes: [
      [20.0, 10.5, -32.0],  // 0 top-left
      [22.0, 10.5, -32.0],  // 1 top-right
      [22.0,  8.0, -32.0],  // 2 bottom-right
      [20.0,  8.0, -32.0],  // 3 bottom-left
      [21.0, 13.0, -31.0],  // 4 arm
    ] as [number, number, number][],
    connections: [[0,1],[1,2],[2,3],[3,0],[1,4]] as [number, number][]
  },
];

const allNodes = clusters.flatMap(c => c.nodes);

// 2 faint mythological bridges between constellations
const interConnections: [number, number][] = [
  [3, 10],   // Orion belt -> Big Dipper handle
  [14, 22],  // Cassiopeia -> Cygnus wing
];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export default function StarField({ starsOpacity = 1 }: { starsOpacity?: number }) {
  const starsRef = useRef<THREE.Points>(null);
  const heroStarsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  const { positions, colors, sizes, phases } = useMemo(() => {
    const rand = seededRandom(42);
    const count = 5000;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const ph = new Float32Array(count);

    const palette = [
      new THREE.Color(1.0, 0.92, 0.92),
      new THREE.Color(1.0, 0.78, 0.78),
      new THREE.Color(1.0, 0.65, 0.65),
      new THREE.Color(1.0, 0.45, 0.45),
      new THREE.Color(1.0, 0.25, 0.30),
      new THREE.Color(0.95, 0.55, 0.55),
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
      if (r > 0.985) sz[i] = 18 + rand() * 12;
      else if (r > 0.92) sz[i] = 8 + rand() * 6;
      else if (r > 0.72) sz[i] = 3 + rand() * 3;
      else sz[i] = 1 + rand() * 2;

      ph[i] = rand() * Math.PI * 2;
    }

    return { positions: pos, colors: col, sizes: sz, phases: ph };
  }, []);

  // Build constellation line geometry
  const lineGeometry = useMemo(() => {
    const linePos: number[] = [];
    const lineColors: number[] = [];
    const lineOpacities: number[] = [];

    clusters.forEach(cluster => {
      cluster.connections.forEach(([a, b], connIdx) => {
        const p1 = cluster.nodes[a];
        const p2 = cluster.nodes[b];
        linePos.push(...p1, ...p2);
        const isMain = connIdx < cluster.connections.length - 1;
        const brightness = isMain ? 1.0 : 0.55;
        lineColors.push(1.0 * brightness, 0.18 * brightness, 0.22 * brightness);
        lineColors.push(1.0 * brightness, 0.18 * brightness, 0.22 * brightness);
        lineOpacities.push(isMain ? 1.0 : 0.45);
        lineOpacities.push(isMain ? 1.0 : 0.45);
      });
    });

    interConnections.forEach(([a, b]) => {
      const p1 = allNodes[a];
      const p2 = allNodes[b];
      linePos.push(...p1, ...p2);
      lineColors.push(0.8, 0.12, 0.15);
      lineColors.push(0.8, 0.12, 0.15);
      lineOpacities.push(0.3);
      lineOpacities.push(0.3);
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(linePos, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(lineColors, 3));
    geo.setAttribute("aOpacity", new THREE.Float32BufferAttribute(lineOpacities, 1));
    return geo;
  }, []);

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
      col[i * 3 + 1] = 0.55 + Math.random() * 0.25;
      col[i * 3 + 2] = 0.5 + Math.random() * 0.25;
      sz[i] = 6 + Math.random() * 4;
      ph[i] = Math.random() * Math.PI * 2;
    });

    return { heroPositions: pos, heroColors: col, heroSizes: sz, heroPhases: ph };
  }, []);

  const starMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uOpacity: { value: 1.0 } },
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
        uniform float uOpacity;
        varying float vAlpha;
        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float d = length(uv);
          float core = smoothstep(0.5, 0.0, d);
          float glow = smoothstep(0.5, 0.2, d) * 0.4;
          if (core + glow < 0.01) discard;
          gl_FragColor = vec4(1.0, 0.75, 0.78, (core + glow) * vAlpha * uOpacity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  const heroStarMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uOpacity: { value: 1.0 } },
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
        uniform float uOpacity;
        varying float vAlpha;
        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float d = length(uv);
          float core = smoothstep(0.5, 0.0, d);
          float glow = smoothstep(0.5, 0.1, d) * 0.6;
          float ring = smoothstep(0.55, 0.45, d) * smoothstep(0.35, 0.45, d) * 0.3;
          if (core + glow + ring < 0.01) discard;
          vec3 color = mix(vec3(1.0, 0.9, 0.9), vec3(1.0, 0.5, 0.5), glow);
          gl_FragColor = vec4(color, (core + glow + ring) * vAlpha * 0.85 * uOpacity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  const lineMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uOpacity: { value: 1.0 } },
      vertexShader: `
        attribute float aOpacity;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uTime;
        void main() {
          vColor = color;
          float pulse = 0.9 + 0.1 * sin(uTime * 1.5 + position.x * 0.5);
          vAlpha = aOpacity * pulse;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec3 finalColor = vColor * 1.2;
          float alpha = vAlpha * 0.55 * uOpacity;
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: false,
    });
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    starMaterial.uniforms.uTime.value = t;
    starMaterial.uniforms.uOpacity.value = starsOpacity;
    heroStarMaterial.uniforms.uTime.value = t;
    heroStarMaterial.uniforms.uOpacity.value = starsOpacity;
    lineMaterial.uniforms.uTime.value = t;
    lineMaterial.uniforms.uOpacity.value = starsOpacity;
    if (starsRef.current) starsRef.current.rotation.y = t * 0.0005;
    if (heroStarsRef.current) heroStarsRef.current.rotation.y = t * 0.0005;
    if (linesRef.current) linesRef.current.rotation.y = t * 0.0005;
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

      <lineSegments ref={linesRef} geometry={lineGeometry}>
        <primitive object={lineMaterial} attach="material" />
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

import React, { useEffect, useMemo, useRef, useState } from "react";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSVGTexture } from "@/hooks/useSVGTexture";

interface TechCubeProps {
  position: [number, number, number];
  scale?: number;
  color: string;
  glowColor: string;
  logoPath: string;
  cubesOpacity?: number;
  orbitIndex?: number;
  selfRot?: { x: number; y: number; z: number };
}

// ═══════════════════════════════════════════════════════════════════════
// SHADER: IRIDESCENT CRYSTALLINE BODY
// ═══════════════════════════════════════════════════════════════════════
const crystallineVertexShader = `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  varying vec3 vViewPosition;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const crystallineFragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  uniform vec3 uGlowColor;
  uniform float uOpacity;
  uniform float uHover;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  varying vec3 vViewPosition;

  void main() {
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - max(0.0, dot(vNormal, viewDir)), 3.5);
    float hueShift = fresnel * 0.3 + sin(uTime * 0.5 + vWorldPosition.x * 2.0) * 0.1;
    vec3 iridescent = mix(uColor, uGlowColor, hueShift + fresnel * 0.5);
    float scanY = sin(vUv.y * 60.0 + uTime * 1.2) * 0.5 + 0.5;
    float scanX = sin(vUv.x * 45.0 - uTime * 0.8) * 0.5 + 0.5;
    float scanPattern = scanY * scanX * 0.15;
    float edgeFire = pow(fresnel, 2.5) * (0.8 + uHover * 1.2);
    float internal = sin(vUv.x * 12.0 + vUv.y * 8.0 + uTime * 0.3) * 0.5 + 0.5;
    internal = pow(internal, 3.0) * 0.08;
    vec3 finalColor = iridescent * (0.25 + edgeFire + internal);
    finalColor += uGlowColor * scanPattern * (0.6 + uHover * 0.6);
    finalColor += vec3(0.8, 0.7, 0.7) * pow(fresnel, 4.0) * 0.25;
    float alpha = (0.08 + fresnel * 0.25 + edgeFire * 0.3 + internal * 0.3) * uOpacity;
    alpha = clamp(alpha, 0.0, 0.92);
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// ═══════════════════════════════════════════════════════════════════════
// SHADER: HOLOGRAM LOGO PROJECTION
// ═══════════════════════════════════════════════════════════════════════
const hologramLogoVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const hologramLogoFragmentShader = `
  uniform sampler2D uTexture;
  uniform float uTime;
  uniform vec3 uGlowColor;
  uniform float uOpacity;
  uniform float uHover;
  varying vec2 vUv;

  void main() {
    vec4 tex = texture2D(uTexture, vUv);
    float scan = sin(vUv.y * 90.0 + uTime * 2.5) * 0.5 + 0.5;
    float scanline = scan * 0.2;
    float flicker = step(0.96, sin(uTime * 45.0 + vUv.x * 30.0)) * 0.3;
    float slowFlicker = 0.92 + 0.08 * sin(uTime * 8.0) * sin(uTime * 17.0);
    float edge = tex.a * (1.0 - tex.a) * 4.0;
    vec3 chromatic = vec3(
      texture2D(uTexture, vUv + vec2(0.003, 0.0)).r,
      tex.g,
      texture2D(uTexture, vUv - vec2(0.003, 0.0)).b
    );
    vec3 logoColor = mix(tex.rgb, chromatic, edge * 0.5);
    vec3 finalColor = logoColor * uGlowColor * (1.5 + uHover * 2.0) * slowFlicker;
    finalColor += uGlowColor * scanline * (0.5 + uHover);
    finalColor += vec3(1.0, 0.95, 0.95) * flicker;
    float alpha = tex.a * uOpacity * (0.85 + scanline * 0.3) * slowFlicker;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// ═══════════════════════════════════════════════════════════════════════
// SHADER: PULSATING ENERGY CORE
// ═══════════════════════════════════════════════════════════════════════
const coreVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const coreFragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uPulse;
  uniform float uOpacity;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    float veinX = sin(vPosition.y * 8.0 + uTime * 3.0) * 0.5 + 0.5;
    float veinY = sin(vPosition.x * 6.0 - uTime * 2.0) * 0.5 + 0.5;
    float veins = pow(veinX * veinY, 2.0) * 0.6;
    float core = pow(0.5 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0) * 0.5 + 0.5;
    core *= (0.6 + uPulse * 0.4);
    vec3 color = uColor * (core + veins * 0.5) * 1.2;
    color += vec3(0.8, 0.6, 0.6) * pow(core, 3.0) * 0.3;
    float alpha = (core * 0.5 + veins * 0.2) * uOpacity;
    gl_FragColor = vec4(color, alpha);
  }
`;

// ═══════════════════════════════════════════════════════════════════════
// SHADER: ANIMATED WIREFRAME GLOW
// ═══════════════════════════════════════════════════════════════════════
const wireVertexShader = `
  varying float vDepth;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mvPosition.z;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const wireFragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uHover;
  varying float vDepth;

  void main() {
    float pulse = sin(uTime * 4.0) * 0.5 + 0.5;
    float dash = step(0.3, sin(vDepth * 2.0 + uTime * 8.0));
    float alpha = (0.5 + pulse * 0.3 + uHover * 0.5) * dash * uOpacity;
    vec3 color = uColor * (1.0 + pulse * 0.6 + uHover * 1.2);
    gl_FragColor = vec4(color, alpha);
  }
`;

// ═══════════════════════════════════════════════════════════════════════
// SPARK PARTICLES — Orbiting Energy Motes
// ═══════════════════════════════════════════════════════════════════════
function SparkParticles({
  color,
  cubesOpacity,
  orbitIndex,
}: {
  color: string;
  cubesOpacity: number;
  orbitIndex: number;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 16;

  const { positions, speeds, phases } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    const ph = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.65 + Math.random() * 0.35;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 1.2;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
      spd[i] = 0.8 + Math.random() * 2.0;
      ph[i] = Math.random() * Math.PI * 2;
    }
    return { positions: pos, speeds: spd, phases: ph };
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const t = state.clock.getElapsedTime();
    const posAttr = pointsRef.current.geometry.attributes.position;
    const posArray = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const angle = t * speeds[i] + phases[i] + orbitIndex;
      const radius = 0.7 + Math.sin(t * 0.4 + i + orbitIndex) * 0.12;
      posArray[idx] = Math.cos(angle) * radius;
      posArray[idx + 1] =
        Math.sin(angle * 0.6 + orbitIndex) * 0.5 + Math.sin(t * 1.2 + i) * 0.08;
      posArray[idx + 2] = Math.sin(angle) * radius;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.035}
        transparent
        opacity={0.75 * cubesOpacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN TECH CUBE COMPONENT — Overkill Edition
// ═══════════════════════════════════════════════════════════════════════
export default function TechCube({
  position,
  scale = 1,
  color,
  glowColor,
  logoPath,
  cubesOpacity = 1,
  orbitIndex = 0,
  selfRot = { x: 0.005, y: 0.008, z: 0.003 },
}: TechCubeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const logoTex = useSVGTexture(logoPath, 512);

  // Crystalline body uniforms
  const bodyUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uGlowColor: { value: new THREE.Color(glowColor) },
      uOpacity: { value: 1.0 },
      uHover: { value: 0.0 },
    }),
    [color, glowColor]
  );

  // Logo uniforms
  const logoUniforms = useMemo(
    () => ({
      uTexture: { value: null as THREE.Texture | null },
      uTime: { value: 0 },
      uGlowColor: { value: new THREE.Color(glowColor) },
      uOpacity: { value: 1.0 },
      uHover: { value: 0.0 },
    }),
    [glowColor]
  );

  // Core uniforms
  const coreUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(glowColor) },
      uPulse: { value: 0.5 },
      uOpacity: { value: 1.0 },
    }),
    [glowColor]
  );

  // Wireframe uniforms
  const wireUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(glowColor) },
      uOpacity: { value: 1.0 },
      uHover: { value: 0.0 },
    }),
    [glowColor]
  );

  // Assign logo texture when loaded
  useEffect(() => {
    if (logoTex && logoUniforms.uTexture) {
      logoUniforms.uTexture.value = logoTex;
    }
  }, [logoTex, logoUniforms]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Smooth hover lerp
    const hoverTarget = hovered ? 1.0 : 0.0;
    bodyUniforms.uHover.value += (hoverTarget - bodyUniforms.uHover.value) * 0.1;
    wireUniforms.uHover.value = bodyUniforms.uHover.value;
    logoUniforms.uHover.value = bodyUniforms.uHover.value;

    // Update time & opacity
    bodyUniforms.uTime.value = t;
    bodyUniforms.uOpacity.value = cubesOpacity;
    logoUniforms.uTime.value = t;
    logoUniforms.uOpacity.value = cubesOpacity;
    coreUniforms.uTime.value = t;
    coreUniforms.uOpacity.value = cubesOpacity;
    wireUniforms.uTime.value = t;
    wireUniforms.uOpacity.value = cubesOpacity;

    // Self-rotation on own axes
    if (groupRef.current) {
      groupRef.current.rotation.x += selfRot.x;
      groupRef.current.rotation.y += selfRot.y;
      groupRef.current.rotation.z += selfRot.z;
    }

    // Pulsating core
    if (coreRef.current) {
      const pulse = Math.sin(t * 2.5 + orbitIndex * 1.3) * 0.5 + 0.5;
      coreUniforms.uPulse.value = pulse;
      const s = 0.55 + pulse * 0.12;
      coreRef.current.scale.setScalar(s);
    }

    // Light pulse
    if (lightRef.current) {
      const pulse = Math.sin(t * 2.2 + orbitIndex) * 0.5 + 0.5;
      lightRef.current.intensity =
        (hovered ? 6.0 : 3.2) * cubesOpacity * (0.8 + pulse * 0.4);
    }
  });

  const effectiveScale = scale * cubesOpacity;

  return (
    <group
      ref={groupRef}
      position={position}
      scale={effectiveScale}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      {/* ═══ POINT LIGHT — Pulsating glow source ═══ */}
      <pointLight
        ref={lightRef}
        color={glowColor}
        intensity={1.6 * cubesOpacity}
        distance={4.5}
        decay={2}
      />

      {/* ═══ INNER ENERGY CORE — Pulsating reactor ═══ */}
      <mesh ref={coreRef}>
        <boxGeometry args={[0.65, 0.65, 0.65]} />
        <shaderMaterial
          vertexShader={coreVertexShader}
          fragmentShader={coreFragmentShader}
          uniforms={coreUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>

      {/* ═══ MAIN CRYSTALLINE BODY — Custom iridescent shader ═══ */}
      <RoundedBox args={[1, 1, 1]} radius={0.075} smoothness={6} castShadow>
        <shaderMaterial
          vertexShader={crystallineVertexShader}
          fragmentShader={crystallineFragmentShader}
          uniforms={bodyUniforms}
          transparent
          depthWrite={true}
          side={THREE.DoubleSide}
        />
      </RoundedBox>

      {/* ═══ OUTER GLOW SHELL — Volumetric aura ═══ */}
      <mesh scale={[1.1, 1.1, 1.1]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={(hovered ? 0.14 : 0.05) * cubesOpacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>

      {/* ═══ WIREFRAME EDGES — Animated dash glow ═══ */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1.06, 1.06, 1.06)]} />
        <shaderMaterial
          vertexShader={wireVertexShader}
          fragmentShader={wireFragmentShader}
          uniforms={wireUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* ═══ HOLOGRAM LOGO — Front face ═══ */}
      <mesh position={[0, 0, 0.51]}>
        <planeGeometry args={[0.62, 0.62]} />
        <shaderMaterial
          vertexShader={hologramLogoVertexShader}
          fragmentShader={hologramLogoFragmentShader}
          uniforms={logoUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* ═══ HOLOGRAM LOGO — Back face ═══ */}
      <mesh position={[0, 0, -0.51]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.62, 0.62]} />
        <shaderMaterial
          vertexShader={hologramLogoVertexShader}
          fragmentShader={hologramLogoFragmentShader}
          uniforms={logoUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* ═══ DECORATIVE RINGS — Rotating energy bands ═══ */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.72, 0.008, 16, 64]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={0.28 * cubesOpacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.72, 0.005, 16, 64]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.16 * cubesOpacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* ═══ BOTTOM GLOW PROJECTION — Floor decal ═══ */}
      <mesh
        position={[0, -0.78, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[1.28, 1.28, 1]}
      >
        <circleGeometry args={[0.72, 48]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={(hovered ? 0.18 : 0.07) * cubesOpacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* ═══ SPARK PARTICLES — Orbiting energy motes ═══ */}
      <SparkParticles
        color={glowColor}
        cubesOpacity={cubesOpacity}
        orbitIndex={orbitIndex}
      />
    </group>
  );
}
```

## File: `src/components/canvas/TechCubes.tsx`

```typescript
"use client";

import React, { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import TechCube from "./TechCube";

// ═══════════════════════════════════════════════════════════════════════
// ORBITAL CONFIG — 4 cubes, different radii / heights / speeds = NO COLLISION
// ═══════════════════════════════════════════════════════════════════════
const ORBIT_CONFIG = [
  {
    color: "#ff1744",
    glowColor: "#ff4444",
    logoPath: "/icons/react.svg",
    radius: 3.5,
    phase: 0,
    yOffset: 1.4,
    selfRot: { x: 0.0015, y: 0.003, z: 0.001 },
    scale: 0.765,
  },
  {
    color: "#ff1744",
    glowColor: "#ff3355",
    logoPath: "/icons/node.svg",
    radius: 4.2,
    phase: Math.PI / 2,
    yOffset: 2.0,
    selfRot: { x: 0.0025, y: 0.002, z: 0.001 },
    scale: 0.684,
  },
  {
    color: "#ff1744",
    glowColor: "#ff5566",
    logoPath: "/icons/typescript.svg",
    radius: 3.8,
    phase: Math.PI,
    yOffset: -0.4,
    selfRot: { x: 0.002, y: 0.0035, z: 0.0015 },
    scale: 0.612,
  },
  {
    color: "#ff1744",
    glowColor: "#ff2244",
    logoPath: "/icons/mongodb.svg",
    radius: 4.6,
    phase: (3 * Math.PI) / 2,
    yOffset: -1.0,
    selfRot: { x: 0.001, y: 0.0025, z: 0.0015 },
    scale: 0.648,
  },
];

export default function TechCubes({ cubesOpacity = 1 }: { cubesOpacity?: number }) {
  const orbitRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();

  // Laptop world position (must match FloatingLaptop exactly)
  const laptopX = Math.max(0.8, viewport.width * 0.08);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (orbitRef.current) {
      // Faster orbital revolution around laptop
      orbitRef.current.rotation.y = t * 0.075;
      // Organic wobble so orbit isn't mechanically stiff
      orbitRef.current.rotation.z = Math.sin(t * 0.08) * 0.04;
      orbitRef.current.rotation.x = Math.cos(t * 0.06) * 0.03;
    }
  });

  return (
    <group position={[laptopX, -0.52, -1.34]}>
      {/* Orbit plane slightly tilted for cinematic depth */}
      <group rotation={[0.12, 0, 0.08]}>
        <group ref={orbitRef}>
          {ORBIT_CONFIG.map((cfg, i) => (
            <group
              key={i}
              position={[
                Math.cos(cfg.phase) * cfg.radius,
                cfg.yOffset,
                Math.sin(cfg.phase) * cfg.radius,
              ]}
            >
              <TechCube
                position={[0, 0, 0]}
                scale={cfg.scale}
                color={cfg.color}
                glowColor={cfg.glowColor}
                logoPath={cfg.logoPath}
                cubesOpacity={cubesOpacity}
                selfRot={cfg.selfRot}
                orbitIndex={i}
              />
            </group>
          ))}
        </group>
      </group>
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

## File: `src/components/canvas/WormholeLaptopEntry.tsx`

```typescript
"use client";

import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { WormholeValues } from "@/animations/wormholeLaptop";

interface WormholeLaptopEntryProps {
  wormholeValues: WormholeValues;
  isActive: boolean;
}

// ═══════════════════════════════════════════════════════════════════════
// DIMENSIONAL RIFT SHADER
// Chromatic-separated event horizon with organic energy pulse
// ═══════════════════════════════════════════════════════════════════════
const riftVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const riftFragmentShader = `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uScale;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec2 uv = vUv;
    float t = uTime;
    
    // Torus UV: x = around the ring, y = across the tube
    float angle = uv.x * 6.28318;
    float tube = uv.y;
    
    // Event horizon core — brilliant white-hot center
    float core = exp(-pow((tube - 0.5) * 4.0, 2.0)) * 1.2;
    
    // Energy veins pulsing around the ring
    float veins = sin(angle * 12.0 + t * 4.0) * 0.5 + 0.5;
    veins = pow(veins, 4.0) * smoothstep(0.3, 0.5, tube) * smoothstep(0.7, 0.5, tube);
    
    // Chromatic aberration separation
    float r = core * 1.0 + veins * 0.9;
    float g = core * 0.2 + veins * 0.3;
    float b = core * 0.4 + veins * 0.6;
    
    // Fresnel rim glow — intense at glancing angles
    vec3 viewDir = normalize(vViewPosition);
    vec3 normal = normalize(vNormal);
    float fresnel = pow(1.0 - abs(dot(normal, viewDir)), 3.0);
    
    // Pulsing singularity beat
    float pulse = sin(t * 6.0) * 0.25 + 0.75;
    
    float alpha = (core * 0.95 + veins * 0.7 + fresnel * 0.6) * uOpacity * pulse;
    if (alpha < 0.005) discard;
    
    vec3 color = vec3(r, g, b) + fresnel * vec3(0.8, 0.1, 0.2);
    gl_FragColor = vec4(color, alpha);
  }
`;

// ═══════════════════════════════════════════════════════════════════════
// ACCRETION PARTICLE SHADER
// Particles swirl inward during gravity, explode on shockwave
// ═══════════════════════════════════════════════════════════════════════
const particleVertexShader = `
  attribute float aPhase;
  attribute float aSpeed;
  varying float vAlpha;
  uniform float uTime;
  uniform float uGravitation;
  uniform float uShockwave;
  
  void main() {
    vAlpha = 0.6 + 0.4 * sin(uTime * 2.0 + aPhase);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size scales with gravitational intensity
    float sizeBoost = 1.0 + uGravitation * 1.5 + uShockwave * 2.0;
    gl_PointSize = (3.0 + aSpeed * 2.0) * sizeBoost * (20.0 / max(1.0, -mvPosition.z));
    gl_PointSize = min(gl_PointSize, 32.0);
  }
`;

const particleFragmentShader = `
  varying float vAlpha;
  uniform float uShockwave;
  
  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;
    
    float core = smoothstep(0.5, 0.0, dist);
    float glow = smoothstep(0.5, 0.15, dist) * 0.5;
    
    // Shockwave particles glow white-hot
    vec3 color = mix(vec3(1.0, 0.08, 0.15), vec3(1.0, 0.9, 0.8), uShockwave);
    float alpha = (core + glow) * vAlpha * (0.8 + uShockwave * 0.4);
    
    gl_FragColor = vec4(color, alpha);
  }
`;

export default function WormholeLaptopEntry({
  wormholeValues,
  isActive,
}: WormholeLaptopEntryProps) {
  const riftRef = useRef<THREE.Mesh>(null);
  const shockwaveRef = useRef<THREE.Mesh>(null);
  const shockwave2Ref = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const singularityMeshRef = useRef<THREE.Mesh>(null);

  const { viewport } = useThree();
  const laptopX = Math.max(0.8, viewport.width * 0.08);

  // Rift shader material (persistent, updated via uniforms)
  const riftMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: riftVertexShader,
      fragmentShader: riftFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uScale: { value: 1 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
  }, []);

  // Accretion disk particles
  const { particlePositions, particlePhases, particleSpeeds } = useMemo(() => {
    const count = 600;
    const pos = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.3 + Math.random() * 4.5;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
      phases[i] = Math.random() * Math.PI * 2;
      speeds[i] = 0.5 + Math.random() * 1.0;
    }
    return { particlePositions: pos, particlePhases: phases, particleSpeeds: speeds };
  }, []);

  const particleUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uGravitation: { value: 0 },
    uShockwave: { value: 0 },
  }), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const v = wormholeValues;

    if (!isActive) return;

    // Update rift shader
    riftMaterial.uniforms.uTime.value = t;
    riftMaterial.uniforms.uOpacity.value = v.riftOpacity;
    riftMaterial.uniforms.uScale.value = v.riftScale;

    // Animate rift mesh
    if (riftRef.current) {
      const s = v.riftScale * 1.6;
      riftRef.current.scale.set(s, s, s);
      riftRef.current.rotation.x = Math.PI / 2;
      riftRef.current.rotation.z = v.riftRotation;
    }

    // Inner singularity glow disc
    if (singularityMeshRef.current) {
      const mat = singularityMeshRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = v.riftOpacity * 0.5;
      const s = v.riftScale * 1.1;
      singularityMeshRef.current.scale.set(s, s, s);
    }

    // Shockwave expansion
    if (shockwaveRef.current) {
      const r = v.shockwaveRadius;
      shockwaveRef.current.scale.set(r, r, r);
      const mat = shockwaveRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = v.shockwaveOpacity * 0.35;
    }

    if (shockwave2Ref.current) {
      const r = v.shockwaveRadius * 0.85;
      shockwave2Ref.current.scale.set(r, r, r);
      const mat = shockwave2Ref.current.material as THREE.MeshBasicMaterial;
      mat.opacity = v.energyRingOpacity * 0.25;
    }

    // Singularity point light — casts real-time floor reflections
    if (lightRef.current) {
      lightRef.current.intensity = v.singularityGlow * 10;
      lightRef.current.distance = 12 + v.singularityGlow * 15;
      lightRef.current.color.setHSL(0.02, 1.0, 0.5 + v.singularityGlow * 0.1);
    }

    // Accretion particle dynamics
    if (particlesRef.current) {
      particleUniforms.uTime.value = t;
      particleUniforms.uGravitation.value = v.gravitationStrength;
      particleUniforms.uShockwave.value = v.shockwaveOpacity > 0.2 ? 1 : 0;

      const posAttr = particlesRef.current.geometry.attributes.position;
      const posArray = posAttr.array as Float32Array;
      const grav = v.gravitationStrength;
      const shock = v.shockwaveOpacity > 0.15 ? v.shockwaveOpacity : 0;

      for (let i = 0; i < 600; i++) {
        const i3 = i * 3;
        let x = posArray[i3];
        let z = posArray[i3 + 2];
        const dist = Math.sqrt(x * x + z * z);
        const angle = Math.atan2(z, x);

        if (grav > 0.01 && shock < 0.2) {
          // Gravitational accretion — spiral inward
          const pull = (1.0 - Math.min(dist / 4.5, 1.0)) * grav * 0.06;
          x -= Math.cos(angle) * pull;
          z -= Math.sin(angle) * pull;
          // Orbital spiral
          const spiral = grav * 0.025 * (1.0 + Math.random() * 0.5);
          x += Math.cos(angle + Math.PI / 2) * spiral;
          z += Math.sin(angle + Math.PI / 2) * spiral;
        }

        if (shock > 0.01) {
          // Shockwave ejection — explode outward
          const push = shock * 0.12;
          x += Math.cos(angle) * push * (0.8 + Math.random() * 0.4);
          z += Math.sin(angle) * push * (0.8 + Math.random() * 0.4);
          posArray[i3 + 1] += shock * 0.02; // lift slightly
        }

        // Reset particles that went too far
        if (dist > 8) {
          const newAngle = Math.random() * Math.PI * 2;
          const newRadius = 0.5 + Math.random() * 4;
          posArray[i3] = Math.cos(newAngle) * newRadius;
          posArray[i3 + 2] = Math.sin(newAngle) * newRadius;
          posArray[i3 + 1] = (Math.random() - 0.5) * 0.2;
        } else {
          posArray[i3] = x;
          posArray[i3 + 2] = z;
        }
      }
      posAttr.needsUpdate = true;
    }
  });

  if (!isActive) return null;

  const v = wormholeValues;

  return (
    <group position={[laptopX + 0.2, -2.14, -1.24]}>

      {/* ═══ DIMENSIONAL RIFT — Rotating event horizon ring ═══ */}
      <mesh ref={riftRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1, 0.12, 32, 120]} />
        <primitive object={riftMaterial} attach="material" />
      </mesh>

      {/* Inner singularity disc — pure void glow */}
      <mesh ref={singularityMeshRef} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.9, 64]} />
        <meshBasicMaterial
          color="#ff0033"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* ═══ ACCRETION PARTICLES — Swirling energy matter ═══ */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particlePositions, 3]} />
          <bufferAttribute attach="attributes-aPhase" args={[particlePhases, 1]} />
          <bufferAttribute attach="attributes-aSpeed" args={[particleSpeeds, 1]} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={particleVertexShader}
          fragmentShader={particleFragmentShader}
          uniforms={particleUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* ═══ SHOCKWAVE RINGS — Expanding floor energy ═══ */}
      <mesh ref={shockwaveRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.96, 1.0, 160]} />
        <meshBasicMaterial
          color="#ff1744"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh ref={shockwave2Ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[0.97, 1.0, 160]} />
        <meshBasicMaterial
          color="#ff4466"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ═══ SINGULARITY LIGHT — Casts real-time floor reflections ═══ */}
      <pointLight
        ref={lightRef}
        position={[0, 0.8, 0]}
        color="#ff1744"
        intensity={0}
        distance={30}
        decay={2}
      />

      {/* Secondary fill light for the rift rim */}
      <pointLight
        position={[0, 0.2, 0]}
        color="#ff8a80"
        intensity={v.riftOpacity * 3}
        distance={8}
        decay={2}
      />

      {/* ═══ FLOOR WARP GLOW — Grid depression illumination ═══ */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[2.5, 64]} />
        <meshBasicMaterial
          color="#ff0033"
          transparent
          opacity={v.floorWarp * 0.2}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <circleGeometry args={[1.2, 48]} />
        <meshBasicMaterial
          color="#ff2244"
          transparent
          opacity={v.floorWarp * 0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Landing impact flash disc — white-hot burst on touchdown */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
        <circleGeometry args={[0.6, 48]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={v.landingImpact * 0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
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

## File: `src/components/ui/CinematicHUD.tsx`

```typescript
"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * CinematicHUD
 * ─────────────────────────────────────────────────────────
 * A full-screen, non-blocking cinematic overlay that fades in
 * after the 3D scene reveals. Contains:
 *
 *  ① FILM-STRIP RULER — bottom center  (footage counter)
 *  ② TIMECODE SIDEBAR — left edge      (frame counter)
 *  ③ CORNER BRACKETS  — all 4 corners  (viewfinder frame)
 *  ④ SCROLL HINT      — bottom center above ruler
 *  ⑤ STATUS BADGE     — bottom right   (REC indicator)
 * ─────────────────────────────────────────────────────────
 */

const RULER_TICKS = 41; // total tick slots visible
const CENTER = Math.floor(RULER_TICKS / 2);

function useAnimatedOffset() {
  return 0;
}

function useTimecode() {
  const [tc, setTc] = useState("00:00:00:00");
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    let raf: number;
    const tick = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const ms = ts - startRef.current;
      const totalFrames = Math.floor((ms / 1000) * 24);
      const h = Math.floor(totalFrames / (24 * 3600)).toString().padStart(2, "0");
      const m = Math.floor((totalFrames / (24 * 60)) % 60).toString().padStart(2, "0");
      const s = Math.floor((totalFrames / 24) % 60).toString().padStart(2, "0");
      const f = (totalFrames % 24).toString().padStart(2, "0");
      setTc(`${h}:${m}:${s}:${f}`);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return tc;
}

function FilmRuler({ offset }: { offset: number }) {
  const ticks = Array.from({ length: RULER_TICKS });

  return (
    <div className="relative flex items-end justify-center gap-0" style={{ width: "min(680px, 90vw)", height: 40 }}>
      {ticks.map((_, i) => {
        const pos = (i - offset + RULER_TICKS) % RULER_TICKS;
        // Label every 5 ticks
        const isMajor = Math.round(pos) % 5 === 0;
        const isCenter = i === CENTER;
        const labelValue = Math.round((i - CENTER - offset) * 2.5);

        return (
          <div key={i} className="flex flex-col items-center" style={{ flex: "1 0 0" }}>
            {/* Label on major ticks */}
            {isMajor && (
              <span
                className="font-mono text-[7px] text-white/25 mb-0.5 select-none"
                style={{ letterSpacing: "0.05em" }}
              >
                {labelValue > 0 ? `+${labelValue}` : labelValue}
              </span>
            )}
            {!isMajor && <span className="mb-0.5" style={{ height: 10 }} />}

            {/* Tick mark */}
            <div
              style={{
                width: isCenter ? 2 : 1,
                height: isMajor ? (isCenter ? 22 : 16) : 9,
                background: isCenter
                  ? "#ff1744"
                  : isMajor
                  ? "rgba(255,255,255,0.45)"
                  : "rgba(255,255,255,0.15)",
                boxShadow: isCenter ? "0 0 6px rgba(255,23,68,0.8)" : undefined,
                borderRadius: 1,
              }}
            />
          </div>
        );
      })}

      {/* Center playhead triangle */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{ zIndex: 10 }}
      >
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M5 0L10 8H0L5 0Z" fill="#ff1744" fillOpacity="0.9" />
        </svg>
      </div>
    </div>
  );
}

function CornerBracket({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const isLeft = position === "tl" || position === "bl";
  const isTop = position === "tl" || position === "tr";

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        top: isTop ? 72 : undefined,
        bottom: isTop ? undefined : 80,
        left: isLeft ? 28 : undefined,
        right: isLeft ? undefined : 28,
        width: 40,
        height: 40,
      }}
    >
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        {position === "tl" && (
          <>
            <path d="M0 20V0H20" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          </>
        )}
        {position === "tr" && (
          <>
            <path d="M40 20V0H20" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          </>
        )}
        {position === "bl" && (
          <>
            <path d="M0 20V40H20" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          </>
        )}
        {position === "br" && (
          <>
            <path d="M40 20V40H20" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          </>
        )}
      </svg>
    </div>
  );
}

export default function CinematicHUD({ visible }: { visible: boolean }) {
  const offset = useAnimatedOffset();
  const timecode = useTimecode();
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [scrollHintOpacity, setScrollHintOpacity] = useState(1);
  const [hasScrolled, setHasScrolled] = useState(false);

  // Delay scroll hint appearance
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setShowScrollHint(true), 1800);
    return () => clearTimeout(t);
  }, [visible]);

  // Fade hint after first scroll/wheel interaction
  useEffect(() => {
    const onWheel = () => {
      setHasScrolled(true);
      setScrollHintOpacity(0);
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchmove", onWheel, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", onWheel);
    };
  }, []);

  // Blinking REC dot
  const [recVisible, setRecVisible] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setRecVisible((v) => !v), 800);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-20 transition-opacity duration-1000"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {/* ─── CORNER BRACKETS ─────────────────────────── */}
      <CornerBracket position="tl" />
      <CornerBracket position="tr" />
      <CornerBracket position="bl" />
      <CornerBracket position="br" />

      {/* ─── LEFT TIMECODE SIDEBAR ───────────────────── */}
      <div
        className="absolute left-7 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4"
        style={{ opacity: 0.55 }}
      >
        {/* Vertical label */}
        <span
          className="font-mono text-[8px] uppercase tracking-[0.35em] text-white/40 select-none"
          style={{ writingMode: "vertical-lr", transform: "rotate(180deg)", letterSpacing: "0.3em" }}
        >
          TIMECODE
        </span>

        {/* Frame counter */}
        <div
          className="font-mono text-[10px] text-white/55 select-none tabular-nums"
          style={{ writingMode: "vertical-lr", transform: "rotate(180deg)", letterSpacing: "0.12em" }}
        >
          {timecode}
        </div>

        {/* Vertical thin line */}
        <div className="w-px bg-white/10" style={{ height: 80 }} />

        {/* Small crosshair */}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="5" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" />
          <line x1="6" y1="0" x2="6" y2="4" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" />
          <line x1="6" y1="8" x2="6" y2="12" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" />
          <line x1="0" y1="6" x2="4" y2="6" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" />
          <line x1="8" y1="6" x2="12" y2="6" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" />
        </svg>
      </div>

      {/* ─── BOTTOM CENTER: SCROLL HINT + FILM RULER ─── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">

        {/* Scroll hint */}
        <div
          className="flex flex-col items-center gap-2 transition-all duration-700"
          style={{
            opacity: showScrollHint && !hasScrolled ? scrollHintOpacity : 0,
            transform: showScrollHint ? "translateY(0)" : "translateY(8px)",
          }}
        >
          <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-white/35 select-none">
            DRAG · SCROLL TO EXPLORE
          </span>
          {/* Animated chevrons */}
          <div className="flex gap-1 opacity-60">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 1,
                  height: 8 + i * 3,
                  background: i === 2 ? "rgba(255,23,68,0.7)" : "rgba(255,255,255,0.25)",
                  borderRadius: 1,
                  animation: `pulse 1.4s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Film ruler with BZ labels */}
        <div className="flex flex-col items-center gap-1">
          {/* BZ label row */}
          <div
            className="flex justify-between font-mono text-[7px] text-white/20 select-none"
            style={{ width: "min(680px, 90vw)" }}
          >
            <span>-100 BZ</span>
            <span>-75</span>
            <span>-50</span>
            <span>-25</span>
            <span style={{ color: "rgba(255,23,68,0.5)" }}>± 0</span>
            <span>+25</span>
            <span>+50</span>
            <span>+75</span>
            <span>+100 BZ</span>
          </div>

          {/* Animated tick ruler */}
          <FilmRuler offset={offset} />

          {/* Bottom line */}
          <div
            className="bg-white/10"
            style={{ width: "min(680px, 90vw)", height: 1 }}
          />
        </div>
      </div>

      {/* ─── BOTTOM RIGHT: REC STATUS ─────────────────── */}
      <div
        className="absolute bottom-8 right-8 flex items-center gap-2"
        style={{ opacity: 0.6 }}
      >
        <div
          className="h-2 w-2 rounded-full bg-[#ff1744]"
          style={{
            opacity: recVisible ? 1 : 0.15,
            boxShadow: recVisible ? "0 0 6px rgba(255,23,68,0.9)" : "none",
            transition: "opacity 0.2s, box-shadow 0.2s",
          }}
        />
        <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/40 select-none">
          REC
        </span>
      </div>

      {/* ─── TOP RIGHT: SCENE LABEL ───────────────────── */}
      <div
        className="absolute right-8 flex flex-col items-end gap-0.5"
        style={{ top: 80, opacity: 0.45 }}
      >
        <span className="font-mono text-[8px] uppercase tracking-[0.4em] text-white/35 select-none">
          ACT I
        </span>
        <span className="font-mono text-[7px] text-white/20 select-none">
          HERO STATION
        </span>
      </div>
    </div>
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

## File: `src/components/ui/loader/HiddenTerminal.tsx`

```typescript
"use client";

import React, { useState, useEffect, useRef } from "react";

interface HiddenTerminalProps {
  onOverride?: () => void;
  onThemeChange?: (color: string) => void;
}

export default function HiddenTerminal({ onOverride, onThemeChange }: HiddenTerminalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [history, setHistory] = useState<string[]>([
    "NEURAL TERMINAL v2.4.0 — ARCHITECT KERNEL",
    "Type 'help' to display available operational commands.",
    "---------------------------------------------------",
  ]);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle terminal on '~' or '`' key, or any letter key if not focused elsewhere
      if (e.key === "`" || e.key === "~") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleCommand = (cmdStr: string) => {
    const raw = cmdStr.trim();
    if (!raw) return;
    const cmd = raw.toLowerCase();
    const newHistory = [...history, `> ${raw}`];

    switch (cmd) {
      case "help":
        newHistory.push(
          "AVAILABLE COMMANDS:",
          "  help     - List terminal commands",
          "  status   - Dump system hardware & memory telemetry",
          "  matrix   - Switch matrix rain theme (green/red/cyan/gold)",
          "  poshan   - Developer bio & credentials",
          "  override - Bypass preloader sequence immediately",
          "  clear    - Clear terminal output buffer",
          "  sudo     - Root authorization test"
        );
        break;
      case "status":
        newHistory.push(
          "SYSTEM TELEMETRY DUMP:",
          `  CORES: ${navigator.hardwareConcurrency || 8} logical threads`,
          `  MEMORY: ${(performance as any).memory ? Math.round((performance as any).memory.usedJSHeapSize / 1048576) + 'MB used' : '64MB heap allocated'}`,
          `  DISPLAY: ${window.innerWidth}x${window.innerHeight} @ DPR ${window.devicePixelRatio}`,
          "  UPLINK: STABLE 100Gbps (0.00% packet drop)",
          "  ENCRYPTION: G-256 QUANTUM LOCK"
        );
        break;
      case "matrix":
      case "theme":
        onThemeChange?.("#00ff88");
        newHistory.push(">> MATRIX RAIN THEME: EMERALD MATRIX ACTIVE [#00ff88]");
        break;
      case "poshan":
        newHistory.push(
          "=========================================",
          "  POSHAN MS — FULL STACK ENGINEER",
          "  Location: Karnataka, India",
          "  Specialties: React, Next.js, Node, Flask",
          "  Experience: 2+ Years | 20+ Completed Projects",
          "========================================="
        );
        break;
      case "override":
        newHistory.push(">> OVERRIDE COMMAND DETECTED. INITIATING BREACH...");
        onOverride?.();
        break;
      case "clear":
        setHistory([]);
        setInputVal("");
        return;
      case "sudo":
        newHistory.push(">> PERMISSION DENIED: Nice try, operative.");
        break;
      default:
        newHistory.push(`Command not recognized: '${raw}'. Type 'help' for options.`);
        break;
    }

    setHistory(newHistory);
    setInputVal("");
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-[300] pointer-events-auto px-3.5 py-1.5 bg-black/80 border border-[#ff0033]/60 rounded text-[10px] tracking-[0.2em] font-mono text-[#ff0033] shadow-[0_0_12px_rgba(255,0,51,0.4)] hover:bg-[#ff0033]/20 transition-all cursor-pointer flex items-center gap-2"
      >
        <span className="w-2 h-2 rounded-full bg-[#ff0033] animate-pulse" />
        {isOpen ? "[ CLOSE CLI ]" : "[ ~ ] TERMINAL CLI"}
      </button>

      {/* Terminal Drawer */}
      {isOpen && (
        <div className="fixed bottom-16 right-6 z-[400] w-[380px] max-w-[90vw] h-[260px] bg-black/90 border border-[#ff0033]/80 rounded-lg p-4 font-mono text-xs shadow-[0_0_30px_rgba(255,0,51,0.4)] backdrop-blur-md flex flex-col pointer-events-auto">
          {/* Header Bar */}
          <div className="flex justify-between items-center pb-2 mb-2 border-b border-[#ff0033]/40 text-[#ff0033]">
            <span className="text-[10px] tracking-widest font-bold">// NEURAL_CLI_v2.4</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#ff0033] hover:text-white text-sm"
            >
              ✕
            </button>
          </div>

          {/* History Scroll Area */}
          <div className="flex-1 overflow-y-auto space-y-1 text-red-400/90 text-[11px] pr-1 leading-relaxed">
            {history.map((line, i) => (
              <div key={i} className={line.startsWith(">") ? "text-white font-bold" : ""}>
                {line}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCommand(inputVal);
            }}
            className="flex items-center gap-2 mt-2 pt-2 border-t border-[#ff0033]/30"
          >
            <span className="text-[#ff0033] font-bold">&gt;</span>
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="type 'help' or 'override'..."
              className="w-full bg-transparent text-white outline-none font-mono text-xs placeholder:text-red-900/60"
            />
          </form>
        </div>
      )}
    </>
  );
}
```

## File: `src/components/ui/loader/HUDSystem.tsx`

```typescript
"use client";

import React, { useEffect, useState } from "react";

export default function HUDSystem() {
  const [latency, setLatency] = useState(12);
  const [hexBytes, setHexBytes] = useState("0x8F3A");
  const [nodeCount, setNodeCount] = useState(847);

  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(Math.floor(10 + Math.random() * 6));
      setHexBytes("0x" + Math.floor(Math.random() * 65535).toString(16).toUpperCase());
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      setNodeCount(document.querySelectorAll("*").length || 847);
    }
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-20 font-mono text-[9px] text-[#ff0033]/80 p-6 flex flex-col justify-between select-none">
      {/* TOP BAR */}
      <div className="flex justify-between items-start">
        {/* Top Left Telemetry */}
        <div className="bg-black/40 backdrop-blur-sm border border-[#ff0033]/30 p-3 rounded space-y-1 shadow-[0_0_15px_rgba(255,0,51,0.15)] animate-fade-in">
          <div className="flex items-center gap-2 font-bold text-white tracking-widest text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff0033] animate-ping" />
            SECURE_NET_CONNECTION
          </div>
          <div className="text-red-400/90">// PORTAL_GATE: [CHARGING...]</div>
          <div className="flex gap-4 text-[9px] pt-1 text-red-500/80">
            <span>UPLINK: STABLE</span>
            <span>LATENCY: {latency}ms</span>
            <span>LOSS: 0.00%</span>
          </div>
        </div>

        {/* Top Right Security */}
        <div className="bg-black/40 backdrop-blur-sm border border-[#ff0033]/30 p-3 rounded space-y-1 text-right shadow-[0_0_15px_rgba(255,0,51,0.15)] animate-fade-in">
          <div className="font-bold text-white tracking-widest text-[10px]">
            STATUS: ACTIVE // G-256
          </div>
          <div className="text-red-400/90">KEY_STREAM: {hexBytes}</div>
          <div className="flex gap-3 justify-end text-[9px] pt-1 text-red-500/80">
            <span>THREAT: NULL</span>
            <span>DIM_LOCK: HOLD</span>
          </div>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="flex justify-between items-end">
        {/* Bottom Left Telemetry Pill */}
        <div className="bg-black/40 backdrop-blur-sm border border-[#ff0033]/30 px-3.5 py-1.5 rounded shadow-[0_0_15px_rgba(255,0,51,0.15)] text-[9px] text-red-400/90 font-mono flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff0033] animate-pulse" />
          <span className="font-bold text-white">NODES:</span> {nodeCount} / {nodeCount}
          <span className="text-[#ff0033]/40">|</span>
          <span className="font-bold text-white">CORRUPTION:</span> 0.00%
        </div>

        {/* Bottom Center Version — Dead Centered */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center bg-black/40 backdrop-blur-sm border border-[#ff0033]/30 px-4 py-2 rounded text-[9px] text-red-400/80 shadow-[0_0_15px_rgba(255,0,51,0.15)]">
          <span className="font-bold text-white">POSHAN MS PORTFOLIO</span> v1.0.0 · NODE_ENV = PRODUCTION
        </div>
      </div>
    </div>
  );
}
```

## File: `src/components/ui/Loader.tsx`

```typescript
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSuspenseAudio } from "@/hooks/useSuspenseAudio";
import HUDSystem from "@/components/ui/loader/HUDSystem";
import HiddenTerminal from "@/components/ui/loader/HiddenTerminal";

// ═══════════════════════════════════════════════════════════════════════
// CINEMATIC BREACH CONFIGURATION — Professional spacetime tear
// ═══════════════════════════════════════════════════════════════════════
const CONFIG = {
  LOAD_DURATION: 10000,
  CONVERGE_DURATION: 2000,
  DROP_COUNTS: { back: 300, mid: 150, front: 50 },
  MOUSE_RADIUS: 220,
  MOUSE_INNER_RADIUS: 110,
  SPEEDS: { back: 0.4, mid: 0.9, front: 1.6 },
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
interface Shard {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  vertices: { x: number; y: number }[];
  color: { r: number; g: number; b: number };
  trail: { x: number; y: number }[];
}
interface EnergyTendril {
  points: { x: number; y: number }[];
  life: number; maxLife: number;
  amplitude: number;
  frequency: number;
}
interface ShockwaveRing {
  birth: number; maxRadius: number;
  speed: number; decay: number;
  intensity: number;
}

// ═══════════════════════════════════════════════════════════════════════
// CINEMATIC BREACH ENGINE — Spacetime Fabric Tear
// ═══════════════════════════════════════════════════════════════════════
class BreachEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  active = false;
  phase: "forming" | "widening" | "collapse" | "revealing" | "done" = "forming";
  time = 0;
  centerX = 0;
  centerY = 0;
  onComplete?: () => void;
  W = 0; H = 0;

  // Breach geometry
  breachRadius = 0;
  breachTargetRadius = 0;
  breachIrregularity: number[] = [];

  // Effects
  shards: Shard[] = [];
  tendrils: EnergyTendril[] = [];
  shockwaves: ShockwaveRing[] = [];

  // Gravitational lensing
  lensStrength = 0;

  // Accretion particles
  accretionParticles: { angle: number; dist: number; speed: number; size: number }[] = [];

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

  generateBreachGeometry() {
    this.breachIrregularity = [];
    const segments = 180;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * Math.PI * 2;
      // Multiple octaves of noise for organic tear shape
      const r1 = Math.sin(angle * 3) * 0.3;
      const r2 = Math.sin(angle * 7 + 1) * 0.15;
      const r3 = Math.sin(angle * 13 + 2) * 0.08;
      const r4 = Math.sin(angle * 23 + 3) * 0.04;
      this.breachIrregularity.push(1 + r1 + r2 + r3 + r4);
    }

    // Generate crystalline shards
    this.shards = [];
    for (let i = 0; i < 200; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 60;
      const speed = 2 + Math.random() * 8;

      // Create irregular crystalline shape
      const vertCount = 3 + Math.floor(Math.random() * 4);
      const vertices: { x: number; y: number }[] = [];
      for (let v = 0; v < vertCount; v++) {
        const va = (v / vertCount) * Math.PI * 2 + Math.random() * 0.5;
        const vr = 0.3 + Math.random() * 0.7;
        vertices.push({ x: Math.cos(va) * vr, y: Math.sin(va) * vr });
      }

      // Color variation: white-hot center, cooling to red, then dark
      const temp = Math.random();
      let color: { r: number; g: number; b: number };
      if (temp > 0.7) {
        color = { r: 255, g: 240 + Math.random() * 15, b: 230 + Math.random() * 25 };
      } else if (temp > 0.4) {
        color = { r: 255, g: 100 + Math.random() * 80, b: 80 + Math.random() * 60 };
      } else {
        color = { r: 180 + Math.random() * 75, g: 20 + Math.random() * 40, b: 30 + Math.random() * 50 };
      }

      this.shards.push({
        x: this.centerX + Math.cos(angle) * dist,
        y: this.centerY + Math.sin(angle) * dist,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 0.8 + Math.random() * 1.2,
        size: 2 + Math.random() * 5,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.3,
        vertices,
        color,
        trail: [],
      });
    }

    // Generate energy tendrils
    this.tendrils = [];
    for (let i = 0; i < 12; i++) {
      const points: { x: number; y: number }[] = [];
      const segments = 20;
      const baseAngle = (i / 12) * Math.PI * 2;
      for (let s = 0; s <= segments; s++) {
        const t = s / segments;
        const r = t * 150;
        const wave = Math.sin(t * Math.PI * 4) * (1 - t) * 20;
        points.push({
          x: this.centerX + Math.cos(baseAngle) * r + Math.cos(baseAngle + Math.PI / 2) * wave,
          y: this.centerY + Math.sin(baseAngle) * r + Math.sin(baseAngle + Math.PI / 2) * wave,
        });
      }
      this.tendrils.push({
        points,
        life: 1,
        maxLife: 0.6 + Math.random() * 0.4,
        amplitude: 10 + Math.random() * 20,
        frequency: 2 + Math.random() * 4,
      });
    }

    // Generate accretion disk particles
    this.accretionParticles = [];
    for (let i = 0; i < 100; i++) {
      this.accretionParticles.push({
        angle: Math.random() * Math.PI * 2,
        dist: 20 + Math.random() * 80,
        speed: 0.02 + Math.random() * 0.05,
        size: 0.5 + Math.random() * 1.5,
      });
    }
  }

  start() {
    this.active = true;
    this.phase = "forming";
    this.time = 0;
    this.breachRadius = 0;
    this.breachTargetRadius = 0;
    this.lensStrength = 0;
    this.generateBreachGeometry();
  }

  update(dt: number) {
    if (!this.active) return;
    this.time += dt;

    const t = this.time;

    // Phase transitions
    if (this.phase === "forming" && t > 0.3) {
      this.phase = "widening";
    } else if (this.phase === "widening" && t > 1.0) {
      this.phase = "collapse";
    } else if (this.phase === "collapse" && t > 1.6) {
      this.phase = "revealing";
    } else if (this.phase === "revealing" && t > 2.2) {
      this.phase = "done";
      this.active = false;
      this.onComplete?.();
      return;
    }

    // Breach radius animation
    if (this.phase === "forming") {
      this.breachTargetRadius = 15;
      this.lensStrength = t / 0.3;
    } else if (this.phase === "widening") {
      this.breachTargetRadius = 80 + (t - 0.3) / 0.7 * 400;
      this.lensStrength = 1 + (t - 0.3) / 0.7 * 2;
    } else if (this.phase === "collapse") {
      this.breachTargetRadius = 480 + (t - 1.0) / 0.6 * 600;
      this.lensStrength = 3 - (t - 1.0) / 0.6 * 2;
    } else if (this.phase === "revealing") {
      this.breachTargetRadius = 1080 + (t - 1.6) / 0.6 * 400;
      this.lensStrength = Math.max(0, 1 - (t - 1.6) / 0.6);
    }

    this.breachRadius += (this.breachTargetRadius - this.breachRadius) * 0.1;

    // Spawn shockwaves
    if (this.phase === "widening" && this.shockwaves.length === 0) {
      this.shockwaves.push({
        birth: performance.now(),
        maxRadius: Math.max(this.W, this.H) * 0.8,
        speed: 400,
        decay: 1.5,
        intensity: 1,
      });
    }

    // Update shards
    for (const shard of this.shards) {
      shard.x += shard.vx * dt * 60;
      shard.y += shard.vy * dt * 60;
      shard.vx *= 0.97;
      shard.vy *= 0.97;
      shard.life -= dt / shard.maxLife;
      shard.rotation += shard.rotSpeed * dt * 60;

      // Add to trail
      shard.trail.push({ x: shard.x, y: shard.y });
      if (shard.trail.length > 8) shard.trail.shift();
    }
    this.shards = this.shards.filter(s => s.life > 0);

    // Update tendrils
    for (const tendril of this.tendrils) {
      tendril.life -= dt / tendril.maxLife;
      // Animate points
      for (let i = 0; i < tendril.points.length; i++) {
        const p = tendril.points[i];
        const t2 = i / tendril.points.length;
        p.x += Math.sin(this.time * tendril.frequency + i * 0.5) * tendril.amplitude * t2 * dt;
        p.y += Math.cos(this.time * tendril.frequency + i * 0.5) * tendril.amplitude * t2 * dt;
      }
    }
    this.tendrils = this.tendrils.filter(t => t.life > 0);

    // Update shockwaves
    for (const sw of this.shockwaves) {
      sw.intensity -= dt / sw.decay;
    }
    this.shockwaves = this.shockwaves.filter(sw => sw.intensity > 0);

    // Update accretion particles
    for (const p of this.accretionParticles) {
      p.angle += p.speed * (1 + 2 / Math.max(p.dist, 10));
      p.dist *= 0.995;
    }
  }

  draw() {
    if (!this.active) return;
    const { ctx, centerX, centerY, time, W, H } = this;

    ctx.save();
    ctx.clearRect(0, 0, W, H);

    // 1. GRAVITATIONAL LENSING BACKGROUND
    // Draw the background with distortion around the breach
    if (this.lensStrength > 0) {
      this.drawGravitationalLensing(ctx, W, H, centerX, centerY, this.breachRadius, this.lensStrength);
    }

    // 2. ACCRETION DISK — Rotating energy ring around breach
    if (this.breachRadius > 20) {
      ctx.save();
      for (const p of this.accretionParticles) {
        const x = centerX + Math.cos(p.angle + time * 2) * p.dist;
        const y = centerY + Math.sin(p.angle + time * 2) * p.dist * 0.3;
        const alpha = (1 - p.dist / 100) * 0.6 * Math.min(1, time * 2);

        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, ${30 + p.dist}, ${50 + p.dist * 2}, ${alpha})`;
        ctx.fill();
      }
      ctx.restore();
    }

    // 3. VOID CORE — The actual hole in spacetime
    const voidGrad = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, this.breachRadius * 1.2
    );
    voidGrad.addColorStop(0, "rgba(3, 0, 1, 1)");
    voidGrad.addColorStop(0.3, "rgba(8, 0, 2, 0.95)");
    voidGrad.addColorStop(0.6, "rgba(20, 0, 5, 0.3)");
    voidGrad.addColorStop(0.85, "rgba(255, 0, 51, 0.15)");
    voidGrad.addColorStop(0.95, "rgba(0, 240, 255, 0.08)");
    voidGrad.addColorStop(1, "transparent");

    ctx.fillStyle = voidGrad;
    ctx.beginPath();
    this.drawBreachPath(ctx, centerX, centerY, this.breachRadius, this.breachIrregularity);
    ctx.fill();

    // 4. EVENT HORIZON GLOW — Intense ring at the edge
    const horizonGlow = ctx.createRadialGradient(
      centerX, centerY, this.breachRadius * 0.8,
      centerX, centerY, this.breachRadius * 1.15
    );
    horizonGlow.addColorStop(0, "transparent");
    horizonGlow.addColorStop(0.5, "rgba(255, 0, 51, 0.4)");
    horizonGlow.addColorStop(0.8, "rgba(255, 100, 50, 0.2)");
    horizonGlow.addColorStop(1, "transparent");

    ctx.fillStyle = horizonGlow;
    ctx.beginPath();
    this.drawBreachPath(ctx, centerX, centerY, this.breachRadius * 1.2, this.breachIrregularity);
    ctx.fill();

    // 5. SPACETIME FABRIC TEAR EDGES — Chromatic aberration
    this.drawTearEdges(ctx, centerX, centerY, this.breachRadius, this.breachIrregularity, time);

    // 6. ENERGY TENDRILS — Organic lightning
    ctx.save();
    for (const tendril of this.tendrils) {
      const alpha = tendril.life / tendril.maxLife;
      ctx.strokeStyle = `rgba(255, ${150 + Math.sin(time * 10) * 100}, 200, ${alpha * 0.8})`;
      ctx.lineWidth = 2;
      ctx.shadowColor = "#ff0033";
      ctx.shadowBlur = 15 * alpha;
      ctx.beginPath();
      ctx.moveTo(tendril.points[0].x, tendril.points[0].y);
      for (let i = 1; i < tendril.points.length; i++) {
        const cp1x = (tendril.points[i - 1].x + tendril.points[i].x) / 2;
        const cp1y = (tendril.points[i - 1].y + tendril.points[i].y) / 2;
        ctx.quadraticCurveTo(tendril.points[i - 1].x, tendril.points[i - 1].y, cp1x, cp1y);
      }
      ctx.stroke();
    }
    ctx.restore();

    // 7. CRYSTALLINE SHARDS — With motion blur trails
    ctx.save();
    for (const shard of this.shards) {
      const alpha = Math.max(0, shard.life);

      // Draw motion trail
      if (shard.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(shard.trail[0].x, shard.trail[0].y);
        for (let i = 1; i < shard.trail.length; i++) {
          ctx.lineTo(shard.trail[i].x, shard.trail[i].y);
        }
        ctx.strokeStyle = `rgba(${shard.color.r}, ${shard.color.g}, ${shard.color.b}, ${alpha * 0.3})`;
        ctx.lineWidth = shard.size * 0.5;
        ctx.stroke();
      }

      // Draw crystalline shard
      ctx.save();
      ctx.translate(shard.x, shard.y);
      ctx.rotate(shard.rotation);
      ctx.scale(shard.size, shard.size);

      ctx.beginPath();
      ctx.moveTo(shard.vertices[0].x, shard.vertices[0].y);
      for (let i = 1; i < shard.vertices.length; i++) {
        ctx.lineTo(shard.vertices[i].x, shard.vertices[i].y);
      }
      ctx.closePath();

      // Glass-like fill
      const grad = ctx.createLinearGradient(-1, -1, 1, 1);
      grad.addColorStop(0, `rgba(${shard.color.r}, ${shard.color.g}, ${shard.color.b}, ${alpha * 0.9})`);
      grad.addColorStop(0.5, `rgba(${shard.color.r}, ${shard.color.g}, ${shard.color.b}, ${alpha * 0.5})`);
      grad.addColorStop(1, `rgba(${shard.color.r * 0.5}, ${shard.color.g * 0.5}, ${shard.color.b * 0.5}, ${alpha * 0.3})`);
      ctx.fillStyle = grad;
      ctx.fill();

      // Edge glow
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
      ctx.lineWidth = 0.1;
      ctx.stroke();

      ctx.restore();
    }
    ctx.restore();

    // 8. SHOCKWAVE RINGS
    ctx.save();
    for (const sw of this.shockwaves) {
      const age = (performance.now() - sw.birth) / 1000;
      const radius = age * sw.speed;
      const alpha = sw.intensity * (1 - age / sw.decay);

      if (alpha > 0 && radius < sw.maxRadius) {
        // Primary ring
        ctx.strokeStyle = `rgba(255, 0, 51, ${alpha * 0.5})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = "#ff0033";
        ctx.shadowBlur = 20 * alpha;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Secondary cyan ring (chromatic separation)
        ctx.strokeStyle = `rgba(0, 240, 255, ${alpha * 0.3})`;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = "#00f0ff";
        ctx.shadowBlur = 15 * alpha;
        ctx.beginPath();
        ctx.arc(centerX + 3, centerY + 2, radius * 1.02, 0, Math.PI * 2);
        ctx.stroke();

        // Tertiary faint outer ring
        ctx.strokeStyle = `rgba(255, 100, 100, ${alpha * 0.15})`;
        ctx.lineWidth = 8;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 1.05, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();

    // 9. CENTER SINGULARITY GLOW
    if (this.phase !== "done") {
      const singularityGlow = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, this.breachRadius * 0.5
      );
      singularityGlow.addColorStop(0, "rgba(255, 255, 255, 0.8)");
      singularityGlow.addColorStop(0.2, "rgba(255, 200, 200, 0.4)");
      singularityGlow.addColorStop(0.5, "rgba(255, 50, 50, 0.2)");
      singularityGlow.addColorStop(1, "transparent");

      ctx.fillStyle = singularityGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.breachRadius * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 10. FINAL DISSOLVE VIGNETTE
    if (this.phase === "revealing") {
      const revealT = (time - 1.6) / 0.6;
      const vigAlpha = revealT * 0.9;
      const vig = ctx.createRadialGradient(
        centerX, centerY, this.breachRadius * 0.3,
        centerX, centerY, Math.max(W, H)
      );
      vig.addColorStop(0, "transparent");
      vig.addColorStop(0.2, `rgba(3, 0, 1, ${vigAlpha * 0.1})`);
      vig.addColorStop(0.6, `rgba(3, 0, 1, ${vigAlpha * 0.5})`);
      vig.addColorStop(1, `rgba(3, 0, 1, ${vigAlpha})`);
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);
    }

    ctx.restore();
  }

  private drawBreachPath(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number,
    radius: number,
    irregularity: number[]
  ) {
    const segments = irregularity.length - 1;
    ctx.moveTo(
      cx + Math.cos(0) * radius * irregularity[0],
      cy + Math.sin(0) * radius * irregularity[0]
    );
    for (let i = 1; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const r = radius * irregularity[i];
      ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
    }
    ctx.closePath();
  }

  private drawTearEdges(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number,
    radius: number,
    irregularity: number[],
    time: number
  ) {
    const segments = irregularity.length - 1;

    // Red channel offset (left/up)
    ctx.save();
    ctx.shadowColor = "#ff0033";
    ctx.shadowBlur = 20;
    ctx.strokeStyle = "rgba(255, 0, 51, 0.7)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const r = radius * irregularity[i] + Math.sin(time * 8 + i * 0.5) * 2;
      const x = cx + Math.cos(angle) * r - 3;
      const y = cy + Math.sin(angle) * r - 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // Cyan channel offset (right/down)
    ctx.save();
    ctx.shadowColor = "#00f0ff";
    ctx.shadowBlur = 15;
    ctx.strokeStyle = "rgba(0, 240, 255, 0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const r = radius * irregularity[i] + Math.sin(time * 6 + i * 0.3) * 1.5;
      const x = cx + Math.cos(angle) * r + 3;
      const y = cy + Math.sin(angle) * r + 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // White hot core filament
    ctx.save();
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 10;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const r = radius * irregularity[i];
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  private drawGravitationalLensing(
    ctx: CanvasRenderingContext2D,
    W: number, H: number,
    cx: number, cy: number,
    radius: number,
    strength: number
  ) {
    // Create a subtle distortion effect by drawing radial gradient bands
    const bands = 8;
    for (let i = 0; i < bands; i++) {
      const dist = radius * (0.5 + i * 0.3);
      const alpha = strength * 0.03 * (1 - i / bands);

      const grad = ctx.createRadialGradient(cx, cy, dist * 0.9, cx, cy, dist * 1.1);
      grad.addColorStop(0, `rgba(255, 0, 51, 0)`);
      grad.addColorStop(0.5, `rgba(255, 0, 51, ${alpha})`);
      grad.addColorStop(1, `rgba(255, 0, 51, 0)`);

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════
interface LoaderProps {
  onComplete?: () => void;
}

export default function Loader({ onComplete }: LoaderProps) {
  const { audioEnabled, initAudio, stopLoaderDrones, setProgress: setAudioProgress, triggerTear: triggerAudioTear } = useSuspenseAudio();
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    return () => {
      stopLoaderDrones();
    };
  }, [stopLoaderDrones]);

  const containerRef = useRef<HTMLDivElement>(null);
  const matrixCanvasRef = useRef<HTMLCanvasElement>(null);
  const breachCanvasRef = useRef<HTMLCanvasElement>(null);
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
  const logoRef = useRef<HTMLDivElement>(null);

  const dropsRef = useRef<MicroDrop[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const mouseSmoothRef = useRef({ x: -1000, y: -1000 });
  const breachEngineRef = useRef<BreachEngine | null>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());
  const phaseTimerRef = useRef(0);
  const hasCompletedRef = useRef(false);
  const progressRef = useRef(0);
  const phaseRef = useRef<"void" | "loading" | "converging" | "breaching" | "done">("void");
  const shownLogsRef = useRef<Set<number>>(new Set());
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const voidStartRef = useRef<number>(0);
  const rainFadeRef = useRef(0);
  const hbRingsRef = useRef<{ birth: number }[]>([]);
  const lastHbRef = useRef(0);
  const themeColorRef = useRef("#ff0033");
  const logoScaleRef = useRef(0);
  const logoOpacityRef = useRef(0);

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

  useEffect(() => {
    const matrixCanvas = matrixCanvasRef.current;
    const breachCanvas = breachCanvasRef.current;
    if (!matrixCanvas || !breachCanvas) return;

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

    breachEngineRef.current = new BreachEngine(breachCanvas);
    breachEngineRef.current.resize(W, H);
    breachEngineRef.current.onComplete = () => {
      if (hasCompletedRef.current) return;
      hasCompletedRef.current = true;
      phaseRef.current = "done";

      if (flashRef.current) {
        flashRef.current.style.transition = "opacity 0.8s power2.out";
        flashRef.current.style.opacity = "0";
      }

      if (uiLayerRef.current) {
        uiLayerRef.current.style.opacity = "0";
        uiLayerRef.current.style.display = "none";
      }
      if (bigCounterRef.current) {
        bigCounterRef.current.style.opacity = "0";
        bigCounterRef.current.style.display = "none";
      }

      setTimeout(() => {
        setIsComplete(true);
        onComplete?.();
      }, 1200);
    };

    initDrops(W, H);
    voidStartRef.current = performance.now();

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) mouseRef.current = { x: touch.clientX, y: touch.clientY, active: true };
    };
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    const handleResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      matrixCanvas.width = W * dpr;
      matrixCanvas.height = H * dpr;
      matrixCanvas.style.width = W + "px";
      matrixCanvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      breachEngineRef.current?.resize(W, H);
      initDrops(W, H);
    };
    window.addEventListener("resize", handleResize);

    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const time = now / 1000;

      mouseSmoothRef.current.x += (mouseRef.current.x - mouseSmoothRef.current.x) * 0.1;
      mouseSmoothRef.current.y += (mouseRef.current.y - mouseSmoothRef.current.y) * 0.1;
      const mx = mouseSmoothRef.current.x;
      const my = mouseSmoothRef.current.y;

      // ── VOID PHASE ──
      if (phaseRef.current === "void") {
        const voidElapsed = (now - voidStartRef.current) / 1000;
        ctx.fillStyle = CONFIG.VOID_BLACK;
        ctx.fillRect(0, 0, W, H);

        if (voidElapsed >= 0.5 && voidElapsed < 0.7) {
          const t = (voidElapsed - 0.5) / 0.2;
          const halfWidth = Math.min(Math.pow(2, t * 10), W / 2);
          ctx.save();
          ctx.shadowColor = "#ff0033";
          ctx.shadowBlur = 8 + t * 16;
          ctx.fillStyle = "#ff0033";
          ctx.fillRect(W / 2 - halfWidth, H / 2 - 1, halfWidth * 2, 2);
          ctx.restore();
        } else if (voidElapsed >= 0.7 && voidElapsed < 1.2) {
          const sweepT = (voidElapsed - 0.7) / 0.5;
          const sweepY = sweepT * H;
          for (let sy = 0; sy < sweepY; sy += 4) {
            if (Math.random() < 0.35) {
              ctx.fillStyle = `rgba(255, 0, 51, ${0.01 + Math.random() * 0.03})`;
              ctx.fillRect(0, sy, W, 1);
            }
          }
          ctx.save();
          ctx.shadowColor = "#ff0033";
          ctx.shadowBlur = 25;
          ctx.fillStyle = `rgba(255, 0, 51, ${0.7 + Math.random() * 0.3})`;
          ctx.fillRect(0, sweepY - 2, W, 3);
          ctx.fillStyle = "rgba(255, 100, 120, 0.3)";
          ctx.fillRect(0, sweepY + 3, W, 1);
          ctx.restore();
        } else if (voidElapsed >= 1.2) {
          phaseRef.current = "loading";
          startTimeRef.current = Date.now();
          rainFadeRef.current = 0;
        }

        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // ── PROGRESS LOGIC ──
      if (phaseRef.current === "loading") {
        if (rainFadeRef.current < 1) {
          rainFadeRef.current = Math.min(1, rainFadeRef.current + dt * 1.25);
        }
        const elapsed = Date.now() - startTimeRef.current;
        progressRef.current = Math.min(elapsed / CONFIG.LOAD_DURATION, 1) * 100;

        if (progressRef.current >= 100) {
          progressRef.current = 100;
          phaseRef.current = "converging";
          phaseTimerRef.current = 0;
          if (statusTextRef.current) {
            statusTextRef.current.textContent = "CORE IMPLOSION DETECTED";
          }
          // STAGE 1: IMPLOSION (0.0s - 0.3s) — Core contracts to scale(0.15) over 0.3s with power4.in
          if (logoRef.current) {
            logoRef.current.style.transition = "transform 0.3s cubic-bezier(0.7, 0, 0.84, 0)";
            logoRef.current.style.transform = "scale(0.15)";
            logoRef.current.style.filter = "drop-shadow(0 0 100px rgba(255,0,51,1)) drop-shadow(0 0 200px rgba(0,240,255,0.9))";
          }
        }
      } else if (phaseRef.current === "converging") {
        phaseTimerRef.current += dt;
        for (const d of dropsRef.current) {
          const dx = W / 2 - d.x;
          const dy = H / 2 - d.y;
          d.x += dx * 0.05 * dt * 60;
          d.y += dy * 0.05 * dt * 60;
          d.baseSpeed *= 1.02;
        }

        // STAGE 2: VISUAL SHOCKWAVE DETONATION AT 0.3s
        if (phaseTimerRef.current >= 0.3 && !hasCompletedRef.current) {
          phaseRef.current = "breaching";
          phaseTimerRef.current = 0;
          breachEngineRef.current?.start(); // Canvas renders expanding red organic shockwaves scale(0.15) -> scale(3.0)
          triggerAudioTear(); // 50ms silence gap -> 42Hz sub detonation impact!
        }
      } else if (phaseRef.current === "breaching") {
        phaseTimerRef.current += dt;

        // STAGE 3: BLEND & CINEMATIC TRANSITION (At 0.4s into breach / 0.7s overall)
        if (phaseTimerRef.current >= 0.4 && flashRef.current && flashRef.current.style.opacity !== "1") {
          // Radial lens-bloom flash fades in over 0.2s as shockwaves reach viewport boundaries
          flashRef.current.style.zIndex = "99999";
          flashRef.current.style.transition = "transform 0.5s cubic-bezier(0.0, 0, 0.2, 1), opacity 0.2s ease-out";
          flashRef.current.style.transform = "scale(3)";
          flashRef.current.style.opacity = "1";

          // HUD UI layers smoothly fade out over 0.3s
          if (uiLayerRef.current) {
            uiLayerRef.current.style.transition = "opacity 0.3s ease-out";
            uiLayerRef.current.style.opacity = "0";
          }
          if (bigCounterRef.current) {
            bigCounterRef.current.style.transition = "opacity 0.3s ease-out";
            bigCounterRef.current.style.opacity = "0";
          }
          if (terminalRef.current) {
            terminalRef.current.style.transition = "opacity 0.3s ease-out";
            terminalRef.current.style.opacity = "0";
          }
        }

        // MODULE 3: Immediate reveal 0.3s–0.4s after explosion peak
        if (phaseTimerRef.current >= 0.7 && !hasCompletedRef.current) {
          hasCompletedRef.current = true;
          phaseRef.current = "done";
          if (flashRef.current) {
            flashRef.current.style.transition = "opacity 0.4s ease-out";
            flashRef.current.style.opacity = "0";
          }
          setTimeout(() => {
            setIsComplete(true);
            onComplete?.();
          }, 150); // 150ms buffer as bloom opacity drops to 20%
        }
      }

      // ── UPDATE UI ──
      const currentProgress = progressRef.current;
      setAudioProgress(currentProgress);
      const displayProgress = Math.floor(currentProgress);

      if (phaseRef.current === "loading" && logoRef.current) {
        logoRef.current.style.opacity = Math.min(1, Math.max(0.3, currentProgress / 5)).toString();
      }

      if (progressFillRef.current) {
        progressFillRef.current.style.width = displayProgress + "%";
      }
      if (percentTextRef.current) {
        percentTextRef.current.textContent = displayProgress + "%";
      }
      const s = displayProgress.toString().padStart(3, "0");
      if (counterC1Ref.current) counterC1Ref.current.textContent = s[0];
      if (counterC2Ref.current) counterC2Ref.current.textContent = s[1];
      if (counterC3Ref.current) counterC3Ref.current.textContent = s[2];

      for (const log of LOG_LINES) {
        if (currentProgress >= log.threshold && !shownLogsRef.current.has(log.threshold)) {
          shownLogsRef.current.add(log.threshold);
          if (terminalRef.current) {
            const div = document.createElement("div");
            div.textContent = log.text;
            div.style.opacity = "0";
            div.style.transition = "opacity 0.3s";
            div.style.color = "#ff0033";
            div.style.textShadow = "0 0 8px rgba(255, 0, 51, 0.6)";
            div.style.fontFamily = "var(--font-jetbrains-mono), monospace";
            div.style.fontSize = "11px";
            div.style.letterSpacing = "0.15em";
            div.style.marginBottom = "4px";
            terminalRef.current.appendChild(div);
            requestAnimationFrame(() => { div.style.opacity = "1"; });
            if (terminalRef.current.children.length > 4) {
              terminalRef.current.removeChild(terminalRef.current.firstChild!);
            }
          }
        }
      }

      if (phaseRef.current === "converging" && uiLayerRef.current) {
        const shake = (1 - phaseTimerRef.current / (CONFIG.CONVERGE_DURATION / 1000)) * 3;
        uiLayerRef.current.style.transform =
          `translate(${(Math.random() - 0.5) * shake}px, ${(Math.random() - 0.5) * shake}px)`;
      }

      // ── CLEAR CANVAS ──
      ctx.fillStyle = `rgba(3, 0, 1, ${CONFIG.CLEAR_ALPHA})`;
      ctx.fillRect(0, 0, W, H);

      // ── DRAW DROPS ──
      const _tcHex = parseInt(themeColorRef.current.slice(1), 16);
      const tcR = (_tcHex >> 16) & 255, tcG = (_tcHex >> 8) & 255, tcB = _tcHex & 255;
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

        const breathe = Math.sin(time * 2 + d.phase) * 0.3 + 0.7;
        opacity *= breathe;
        d.y += speed * (dt * 60);

        for (let c = 0; c < d.chars.length; c++) {
          const ch = d.chars[c];
          ch.switchTimer -= dt * 60;
          if (ch.switchTimer <= 0) {
            ch.char = CHAR_POOL[Math.floor(Math.random() * CHAR_POOL.length)];
            ch.switchTimer = 5 + Math.random() * 25;
          }
        }

        if (d.y > H + 20) {
          d.y = -20;
          d.x = Math.random() * W;
        }

        for (let c = 0; c < d.chars.length; c++) {
          const cy = d.y - c * d.fontSize * 1.1;
          if (cy < -10 || cy > H + 10) continue;

          const charOpacity = (c === 0 ? opacity : opacity * (1 - c / d.chars.length) * 0.7) * rainFadeRef.current;
          if (charOpacity < 0.005) continue;

          let r: number, g: number, b: number;
          if (d.layer === 2 && c === 0) {
            r = Math.min(255, 200 + tcR * 0.2 + Math.sin(time * 3) * 55);
            g = Math.min(255, 200 + tcG * 0.2 + Math.sin(time * 3) * 55);
            b = Math.min(255, 200 + tcB * 0.2 + Math.sin(time * 3) * 55);
          } else {
            const intensity = d.layer === 2 ? 1.0 : d.layer === 1 ? 0.7 : 0.31;
            r = tcR * intensity;
            g = tcG * intensity;
            b = tcB * intensity;
          }

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

      // ── HEARTBEAT RING ──
      if (phaseRef.current === "loading" || phaseRef.current === "converging") {
        if (now - lastHbRef.current > 1300) {
          lastHbRef.current = now;
          hbRingsRef.current.push({ birth: now });
        }

        ctx.save();
        for (let ri = hbRingsRef.current.length - 1; ri >= 0; ri--) {
          const ring = hbRingsRef.current[ri];
          const age = (now - ring.birth) / 1000;
          if (age > 1.5) {
            hbRingsRef.current.splice(ri, 1);
            continue;
          }
          const radius = 50 + age * 100;
          const alpha = Math.max(0, 0.5 * (1 - age / 1.5));
          const lineW = Math.max(0.3, 2 - age * 1.3);
          ctx.strokeStyle = `rgba(255, 0, 51, ${alpha})`;
          ctx.lineWidth = lineW;
          ctx.shadowColor = "#ff0033";
          ctx.shadowBlur = 12 * (1 - age / 1.5);
          ctx.beginPath();
          ctx.arc(W / 2, H / 2 - 50, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // ── BREACH ──
      breachEngineRef.current?.update(dt);
      breachEngineRef.current?.draw();

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (isComplete) return null;

  return (
    <div
      ref={containerRef}
      onClick={() => initAudio()}
      className="fixed inset-0 z-[99999] overflow-hidden cursor-pointer"
      style={{ background: CONFIG.VOID_BLACK }}
    >
      {/* Audio Initializer Badge */}
      {!audioEnabled && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            initAudio();
          }}
          className="absolute top-8 left-1/2 -translate-x-1/2 z-[300] pointer-events-auto px-5 py-2.5 bg-red-950/60 border border-[#ff0033]/80 rounded-full text-[11px] tracking-[0.25em] font-mono text-[#ff0033] shadow-[0_0_20px_rgba(255,0,51,0.5)] animate-pulse hover:bg-[#ff0033]/20 transition-all cursor-pointer flex items-center gap-2"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff0033] animate-ping" />
          🔊 CLICK TO INITIALIZE AUDIO ENGINE
        </button>
      )}

      {/* Matrix rain canvas */}
      <canvas
        ref={matrixCanvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ imageRendering: "auto" }}
      />

      {/* Breach overlay canvas */}
      <canvas
        ref={breachCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 100 }}
      />

      {/* STAGE 3: Radial Lens-Bloom Flash Overlay */}
      <div
        ref={flashRef}
        className="fixed inset-0 pointer-events-none rounded-full scale-0 opacity-0"
        style={{
          zIndex: 99999,
          background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,1) 0%, rgba(255,0,51,0.6) 45%, rgba(10,0,2,0) 80%)",
          mixBlendMode: "screen",
          willChange: "transform, opacity",
        }}
      />

      {/* UI Layer */}
      <div
        ref={uiLayerRef}
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{ zIndex: 10 }}
      >
      {/* ═══════════════════════════════════════════════════════════════
      CYBERPUNK "P" LOGO — Singularity Emergence
      ══════════════════════════════════════════════════════════════ */}
        <div
          ref={logoRef}
          className="relative w-[160px] h-[160px] mb-16 flex items-center justify-center logo-breach-container"
          style={{ 
            transform: "scale(1)", 
            opacity: 1,
            zIndex: 150,
            filter: "drop-shadow(0 0 25px rgba(255,0,51,0.8)) drop-shadow(0 0 50px rgba(255,0,51,0.4))"
          }}
        >
          {/* Outer tachyon ring */}
          <div
            className="absolute inset-[-28px] rounded-full border border-[#ff0033]/15 border-t-[#ff0033]/90"
            style={{ 
              animation: "spin 3.5s linear infinite",
              boxShadow: "inset 0 0 20px rgba(255,0,51,0.1), 0 0 30px rgba(255,0,51,0.15)"
            }}
          />
          {/* Middle counter-rotating ring */}
          <div
            className="absolute inset-[-45px] rounded-full border-[0.5px] border-b-[#ff0033]/50 border-t-transparent"
            style={{ 
              animation: "spin-reverse 5.5s linear infinite",
              boxShadow: "0 0 25px rgba(255,0,51,0.1)"
            }}
          />
          {/* Inner data-stream ring */}
          <div
            className="absolute inset-[-62px] rounded-full border-[0.3px] border-l-[#ff0033]/40 border-r-transparent"
            style={{ 
              animation: "spin 7.5s linear infinite",
              boxShadow: "0 0 15px rgba(255,0,51,0.08)"
            }}
          />
          {/* Glitch hex frame */}
          <div
            className="absolute inset-[-8px]"
            style={{
              clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
              border: "1px solid rgba(255,0,51,0.2)",
              animation: "glitch-pulse 2.1s ease-in-out infinite"
            }}
          />
          {/* ═════ THE "P" LETTER ═════ */}
          <div className="relative flex items-center justify-center w-full h-full">
            <span
              className="font-black select-none"
              style={{
                fontSize: "96px",
                fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                color: "#ff0033",
                textShadow: `
                  0 0 10px rgba(255,0,51,0.9),
                  0 0 30px rgba(255,0,51,0.7),
                  0 0 60px rgba(255,0,51,0.4),
                  0 0 100px rgba(255,0,51,0.2),
                  -2px 0 0 rgba(0,240,255,0.5),
                  2px 0 0 rgba(255,0,51,0.5)
                `,
                animation: "p-blink 1.8s ease-in-out infinite, p-flicker 0.15s steps(1) infinite",
                letterSpacing: "-2px",
                lineHeight: 1,
                transform: "translateY(-2px)"
              }}
            >
              P
            </span>
            {/* Subtle scanline overlay on P */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,0,51,0.03) 2px, rgba(255,0,51,0.03) 4px)",
                mixBlendMode: "overlay"
              }}
            />
          </div>
          {/* Corner brackets — cyberpunk frame accents */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#ff0033]/60" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#ff0033]/60" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#ff0033]/60" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#ff0033]/60" />
          {/* Floating data particles around P */}
          <div className="absolute inset-0 pointer-events-none overflow-visible">
            <span className="absolute top-[-10px] left-[20%] text-[7px] text-[#ff0033]/40 font-mono animate-pulse" style={{ animationDelay: "0s" }}>01</span>
            <span className="absolute top-[30%] right-[-12px] text-[6px] text-[#00f0ff]/30 font-mono animate-pulse" style={{ animationDelay: "0.4s" }}>AP</span>
            <span className="absolute bottom-[15%] left-[-8px] text-[7px] text-[#ff0033]/35 font-mono animate-pulse" style={{ animationDelay: "0.8s" }}>◢</span>
            <span className="absolute bottom-[-8px] right-[25%] text-[6px] text-[#ff0033]/30 font-mono animate-pulse" style={{ animationDelay: "1.2s" }}>∴</span>
          </div>
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
        className="fixed bottom-14 left-6 font-mono pointer-events-none"
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

      {/* Cyber HUD Telemetry System */}
      <HUDSystem />

      {/* Interactive Hidden Cyber Terminal CLI */}
      <HiddenTerminal
        onOverride={() => {
          phaseRef.current = "breaching";
          breachEngineRef.current?.start();
        }}
        onThemeChange={(color) => {
          themeColorRef.current = color;
        }}
      />
    </div>
  );
}

```

## File: `src/components/ui/Navbar.tsx`

```typescript
"use client";

import React, { useState } from "react";
import { ArrowUpRight } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="fixed left-0 top-0 z-50 w-full border-b border-white/[0.04] bg-[#050508]/35 px-6 py-4 backdrop-blur-md md:px-12">
      <div className="mx-auto flex max-w-[96rem] items-center justify-between">
        {/* Brand Logo */}
        <div className="flex select-none items-center space-x-3" style={{ animation: "navItemSlideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}>
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#ff1744]/20 bg-[#ff1744]/5 shadow-[0_0_18px_rgba(255,23,68,0.18)]">
            <svg width="30" height="34" viewBox="0 0 40 45" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_10px_var(--electric-blue)]">
              <path d="M5 5H22C28.6274 5 34 10.3726 34 17C34 23.6274 28.6274 29 22 29H13V40" stroke="#ff1744" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13 17H22C23.6569 17 25 15.6569 25 14C25 12.3431 23.6569 11 22 11H13V17Z" fill="#800010" />
            </svg>
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-[0.28em] text-white md:text-sm">POSHAN MS</span>
            <span className="font-mono text-[8px] font-medium uppercase tracking-[0.24em] text-[var(--electric-blue)] text-glow-blue md:text-[9px]">
              Cinematic Portfolio
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center space-x-4" style={{ animation: "navItemSlideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards" }}>
          <a
            href="mailto:siddeshwaraprasanna5@gmail.com"
            className="group flex items-center space-x-1.5 rounded-full border border-[var(--electric-blue)] bg-transparent px-5 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-white shadow-[0_0_16px_rgba(255,23,68,0.2)] transition-all duration-300 hover:border-[var(--hot-pink)] hover:bg-white/[0.02] hover:text-[var(--hot-pink)] hover:shadow-[0_0_18px_rgba(204,17,51,0.24)] md:text-xs"
          >
            <span>LET&apos;S CONNECT</span>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>
    </nav>
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

## File: `src/components/ui/WelcomeText.tsx`

```typescript
"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAudio } from "@/context/AudioContext";

interface WelcomeTextProps {
  onComplete?: () => void;
  layoutMode?: "stacked" | "cinematic-pan";
}

const FULL_TEXT = "WELCOME TO MY PORTFOLIO";
const LINE_1 = "WELCOME TO";
const LINE_2 = "MY PORTFOLIO";
const BOOT_LINES = [
  "// NEURAL LINK ONLINE //",
  "INITIALIZING INTERFACE...",
  "CALIBRATING OPTICAL SENSORS...",
  "ESTABLISHING UPLINK...",
  "REALITY ANCHOR: LOCKED",
];

type Phase = "boot" | "typing" | "surge" | "hold" | "warp";

/* ═══════════════════════════════════════════════════════════════════════
   CINEMATIC TEXT LINE — Isolated Shadow + Chromatic Aberration + Glow
   Each line carries its own layer stack so multiline layouts remain
   perfectly composited without cross-line bleed or clipping.
   ═══════════════════════════════════════════════════════════════════════ */
function CinematicTextLine({
  text,
  isActive,
  showCursor,
  glitchOffset,
  brightness,
  flickerOpacity,
  phase,
}: {
  text: string;
  isActive: boolean;
  showCursor: boolean;
  glitchOffset: { x: number; y: number };
  brightness: number;
  flickerOpacity: number;
  phase: Phase;
}) {
  const fontSize = "clamp(2.5rem, 8.5vw, 8rem)";
  const letterSpacing = "0.18em";
  const lineHeight = 1.1;

  const baseTextShadow = `
    0 0 20px rgba(255,0,51,0.9),
    0 0 50px rgba(255,0,51,0.7),
    0 0 100px rgba(255,0,51,0.45),
    0 0 180px rgba(255,0,51,0.25),
    0 0 300px rgba(255,0,51,0.12)
  `;

  return (
    <div
      className="relative block max-w-[85vw] mx-auto text-center"
      style={{ fontSize, lineHeight, minHeight: "1.15em" }}
    >
      {/* Deep background glow bloom per line */}
      <div
        className="pointer-events-none absolute inset-0 blur-3xl"
        style={{
          background: "radial-gradient(circle, rgba(255,0,51,0.45) 0%, transparent 70%)",
          transform: "scale(2.2)",
          opacity: flickerOpacity,
        }}
      />

      {/* Shadow depth layer */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 select-none whitespace-nowrap font-mono font-black uppercase w-full text-center"
        style={{
          fontSize,
          letterSpacing,
          lineHeight,
          color: "rgba(80, 0, 10, 0.9)",
          transform: `translate3d(${glitchOffset.x - 6}px, ${glitchOffset.y + 4}px, -30px)`,
          textShadow: "0 0 60px rgba(255,0,51,0.3)",
        }}
      >
        {text}
      </span>

      {/* Cyan chromatic aberration layer */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 select-none whitespace-nowrap font-mono font-black uppercase w-full text-center"
        style={{
          fontSize,
          letterSpacing,
          lineHeight,
          color: "rgba(0, 240, 255, 0.35)",
          transform: `translate3d(${glitchOffset.x + 4}px, ${glitchOffset.y - 2}px, 10px)`,
          mixBlendMode: "screen",
          filter: "blur(1.5px)",
        }}
      >
        {text}
      </span>

      {/* Red chromatic aberration layer */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 select-none whitespace-nowrap font-mono font-black uppercase w-full text-center"
        style={{
          fontSize,
          letterSpacing,
          lineHeight,
          color: "rgba(255, 0, 51, 0.45)",
          transform: `translate3d(${glitchOffset.x - 3}px, ${glitchOffset.y + 1}px, 5px)`,
          mixBlendMode: "screen",
          filter: "blur(1px)",
        }}
      >
        {text}
      </span>

      {/* Main visible text */}
      <h1
        className="relative select-none whitespace-nowrap font-mono font-black uppercase text-[#ff0033] w-full text-center"
        style={{
          fontSize,
          letterSpacing,
          lineHeight,
          textShadow: baseTextShadow,
          opacity: flickerOpacity,
          filter: `brightness(${brightness})`,
        }}
      >
        {text}
        {isActive && showCursor && (phase === "typing" || phase === "boot") && (
          <span
            className="ml-3 inline-block align-middle bg-[#ff0033]"
            style={{
              width: "clamp(4px, 0.6vw, 8px)",
              height: "clamp(1.8rem, 5.5vw, 5rem)",
              boxShadow: "0 0 12px rgba(255,0,51,0.9)",
            }}
          />
        )}
      </h1>
    </div>
  );
}

export default function WelcomeText({ onComplete, layoutMode = "stacked" }: WelcomeTextProps) {
  const { initAudio, stopLoaderDrones, playTypingKeystrokeSound, playEnterPunchSound } = useAudio();

  const [phase, setPhase] = useState<Phase>("boot");
  const [displayText, setDisplayText] = useState("");
  const [bootIndex, setBootIndex] = useState(0);
  const [glitchOffset, setGlitchOffset] = useState({ x: 0, y: 0 });
  const [scanlineY, setScanlineY] = useState(-10);
  const [brightness, setBrightness] = useState(1);
  const [showCursor, setShowCursor] = useState(true);
  const [flickerOpacity, setFlickerOpacity] = useState(1);

  // Module 5: 3D Spatial Camera Warp Push-Through state
  const [warpScale, setWarpScale] = useState(1.0);
  const [warpOpacity, setWarpOpacity] = useState(1.0);
  const [warpBlur, setWarpBlur] = useState(0);

  // Cinematic pan state for Option B fallback
  const [panX, setPanX] = useState(0);
  const textWrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const charIndexRef = useRef(0);
  const hasTriggeredCompleteRef = useRef(false);
  const panRafRef = useRef<number>(0);

  useEffect(() => {
    initAudio();
    stopLoaderDrones();
  }, [initAudio, stopLoaderDrones]);

  // ══ PHASE 1: BOOT SEQUENCE ══
  useEffect(() => {
    if (phase !== "boot") return;
    const interval = setInterval(() => {
      setBootIndex((prev) => {
        if (prev >= BOOT_LINES.length - 1) {
          clearInterval(interval);
          setTimeout(() => setPhase("typing"), 300);
          return prev;
        }
        return prev + 1;
      });
    }, 280);
    return () => clearInterval(interval);
  }, [phase]);

  // ══ PHASE 2: CINEMATIC ASMR TYPING ENGINE (MODULE 4) ══
  useEffect(() => {
    if (phase !== "typing") return;

    const typeNext = () => {
      const idx = charIndexRef.current;
      if (idx >= FULL_TEXT.length) {
        playEnterPunchSound();
        setPhase("surge");
        return;
      }

      charIndexRef.current = idx + 1;
      const currentChar = FULL_TEXT[idx];
      const isLastChar = idx === FULL_TEXT.length - 1;
      setDisplayText(FULL_TEXT.slice(0, idx + 1));

      // Module 4: Organic ASMR keystroke audio trigger
      playTypingKeystrokeSound(currentChar, isLastChar);

      let delay = 65 + Math.random() * 45;
      if (currentChar === " ") delay = 160;
      if (idx === 0) delay = 350;

      if (Math.random() < 0.1) {
        setGlitchOffset({ x: (Math.random() - 0.5) * 14, y: (Math.random() - 0.5) * 6 });
        setTimeout(() => setGlitchOffset({ x: 0, y: 0 }), 50);
      }

      setTimeout(typeNext, delay);
    };

    const timer = setTimeout(typeNext, 180);
    return () => clearTimeout(timer);
  }, [phase, playTypingKeystrokeSound, playEnterPunchSound]);

  // ══ OPTION B: Cinematic pan tracking during typing ══
  useEffect(() => {
    if (layoutMode !== "cinematic-pan") return;
    if (phase !== "typing" && phase !== "surge" && phase !== "hold") return;

    const updatePan = () => {
      if (!textWrapperRef.current || !containerRef.current) return;
      const textW = textWrapperRef.current.scrollWidth;
      const containerW = containerRef.current.offsetWidth;
      const cursorIdx = charIndexRef.current;

      const ratio = Math.min(cursorIdx / FULL_TEXT.length, 1);
      const cursorX = textW * ratio;

      let targetPan = containerW / 2 - cursorX;
      const minPan = containerW - textW - 48;
      const maxPan = 48;
      targetPan = Math.max(minPan, Math.min(maxPan, targetPan));

      setPanX(targetPan);
    };

    updatePan();
    window.addEventListener("resize", updatePan);
    return () => window.removeEventListener("resize", updatePan);
  }, [layoutMode, phase]);

  useEffect(() => {
    if (layoutMode !== "cinematic-pan") return;
    if (phase !== "surge" && phase !== "hold") return;

    if (!textWrapperRef.current || !containerRef.current) return;
    const textW = textWrapperRef.current.scrollWidth;
    const containerW = containerRef.current.offsetWidth;

    if (textW <= containerW - 80) {
      setPanX(0);
    } else {
      setPanX((containerW - textW) / 2);
    }
  }, [layoutMode, phase]);

  // ══ PHASE 3: POWER SURGE & LOCK-IN ══
  useEffect(() => {
    if (phase !== "surge") return;

    let frame = 0;
    const surgeInterval = setInterval(() => {
      frame++;
      if (frame <= 3) {
        setBrightness(2.8);
        setFlickerOpacity(0.3 + Math.random() * 0.7);
      } else if (frame <= 8) {
        setBrightness(1.2 + Math.random() * 0.4);
        setFlickerOpacity(0.8 + Math.random() * 0.2);
      } else {
        setBrightness(1);
        setFlickerOpacity(1);
        clearInterval(surgeInterval);
        setPhase("hold");
      }
    }, 70);

    return () => clearInterval(surgeInterval);
  }, [phase]);

  // ══ PHASE 4: STAGE 1 PAUSE (0.4s PAUSE WITH GLOW INTENSITY PULSE) ══
  useEffect(() => {
    if (phase !== "hold") return;
    const timer = setTimeout(() => setPhase("warp"), 400); // Module 5 Stage 1: 0.4s pause
    return () => clearTimeout(timer);
  }, [phase]);

  // ══ PHASE 5: STAGE 2 SPATIAL CAMERA WARP (SCALE 1.0 → 8.0 WITH RADIAL BLUR) ══
  useEffect(() => {
    if (phase !== "warp") return;

    let startTime = performance.now();
    const duration = 600; // 0.6s total warp duration

    const warpLoop = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1, elapsed / duration);

      // power3.in exponential curve: scale 1.0 -> 8.0
      const cubicIn = Math.pow(progress, 3);
      const currentScale = 1.0 + cubicIn * 7.0;
      const currentOpacity = Math.max(0, 1 - Math.pow(progress, 1.5));
      const currentBlur = progress * 20; // radial motion blur 0px -> 20px

      setWarpScale(currentScale);
      setWarpOpacity(currentOpacity);
      setWarpBlur(currentBlur);

      // STAGE 3 HERO REVEAL: Overlap Stage 2 by 0.2s (trigger at progress >= 0.65)
      if (progress >= 0.65 && !hasTriggeredCompleteRef.current) {
        hasTriggeredCompleteRef.current = true;
        onComplete?.();
      }

      if (progress < 1) {
        panRafRef.current = requestAnimationFrame(warpLoop);
      }
    };

    panRafRef.current = requestAnimationFrame(warpLoop);
    return () => cancelAnimationFrame(panRafRef.current);
  }, [phase, onComplete]);

  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => setShowCursor((p) => !p), 530);
    return () => clearInterval(interval);
  }, []);

  // Occasional scanline sweep
  useEffect(() => {
    if (phase === "warp") return;
    let animInterval: ReturnType<typeof setInterval>;
    const interval = setInterval(() => {
      setScanlineY(0);
      animInterval = setInterval(() => {
        setScanlineY((y) => {
          if (y >= 110) {
            clearInterval(animInterval);
            return -10;
          }
          return y + 4;
        });
      }, 16);
    }, 4000 + Math.random() * 3000);
    return () => {
      clearInterval(interval);
      clearInterval(animInterval);
    };
  }, [phase]);

  // Derived display values
  const line1Text = displayText.slice(0, Math.min(displayText.length, LINE_1.length));
  const line2Text = displayText.length > LINE_1.length ? displayText.slice(LINE_1.length) : "";
  const cursorOnLine1 = phase === "typing" && displayText.length < LINE_1.length;
  const cursorOnLine2 = phase === "typing" && displayText.length >= LINE_1.length && displayText.length < FULL_TEXT.length;

  const progressPercent =
    phase === "boot"
      ? Math.round(((bootIndex + 1) / BOOT_LINES.length) * 100)
      : phase === "typing"
      ? Math.round((displayText.length / FULL_TEXT.length) * 100)
      : 100;

  const statusLabel =
    phase === "boot"
      ? `SYSTEM BOOT ${Math.round(((bootIndex + 1) / BOOT_LINES.length) * 100)}%`
      : phase === "typing"
      ? `NEURAL UPLINK ${Math.round((displayText.length / FULL_TEXT.length) * 100)}%`
      : phase === "surge"
      ? "POWER SURGE DETECTED"
      : phase === "hold"
      ? "INTERFACE STABILIZED"
      : "WARPING TO CORE...";

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[99990] flex items-center justify-center overflow-hidden pointer-events-none"
      style={{
        background: "#000000",
        opacity: warpOpacity,
        willChange: "transform, opacity, filter",
      }}
    >
      {/* ═══ CINEMATIC LETTERBOX BARS ═══ */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 z-50 h-[7vh] bg-black" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-50 h-[7vh] bg-black" />

      {/* ═══ FILM GRAIN ═══ */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.09]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }}
      />

      {/* ═══ VIGNETTE ═══ */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 0%, transparent 35%, rgba(255,0,51,0.06) 65%, rgba(0,0,0,0.85) 100%)",
        }}
      />

      {/* ═══ SCANLINES ═══ */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,0,51,0.04) 3px, rgba(255,0,51,0.04) 6px)",
        }}
      />

      {/* ═══ MOVING SCANLINE ═══ */}
      {scanlineY >= 0 && scanlineY <= 100 && (
        <div
          className="pointer-events-none absolute left-0 right-0 h-[2px] bg-[#ff0033]/20"
          style={{ top: `${scanlineY}%`, boxShadow: "0 0 12px rgba(255,0,51,0.4)" }}
        />
      )}

      {/* ═══ TOP BOOT INFO ═══ */}
      <div className="absolute top-[10vh] left-0 right-0 text-center">
        <p className="font-mono text-[9px] uppercase tracking-[0.5em] text-[#ff0033]/40">
          // Neural Interface v2.4.0 // Boot Sequence
        </p>
        {phase === "boot" && (
          <div className="mt-3 flex justify-center">
            <div className="font-mono text-[10px] tracking-widest text-[#ff0033]/60">
              {BOOT_LINES.slice(0, bootIndex + 1).map((line, i) => (
                <div key={i} className="py-0.5" style={{ opacity: i === bootIndex ? 1 : 0.4 }}>
                  &gt; {line}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══ MAIN TEXT CONTAINER (3D SPATIAL CAMERA WARP PUSH-THROUGH) ═══ */}
      <div
        className="relative flex flex-col items-center justify-center px-6 max-w-[85vw] mx-auto text-center"
        style={{
          perspective: "1200px",
          transform:
            layoutMode === "cinematic-pan"
              ? `translateX(${panX}px) scale(${warpScale})`
              : `scale(${warpScale})`,
          filter: `brightness(${brightness}) blur(${warpBlur}px)`,
          transformOrigin: "center center",
          willChange: "transform, filter",
          transition:
            phase === "surge" || phase === "hold"
              ? "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)"
              : undefined,
        }}
      >
        {layoutMode === "stacked" ? (
          <div ref={textWrapperRef} className="flex flex-col items-center gap-1 md:gap-2 max-w-[85vw] mx-auto">
            {/* Line 1: WELCOME TO */}
            <CinematicTextLine
              text={line1Text}
              isActive={cursorOnLine1}
              showCursor={showCursor}
              glitchOffset={glitchOffset}
              brightness={brightness}
              flickerOpacity={flickerOpacity}
              phase={phase}
            />

            {/* Line 2: MY PORTFOLIO — materializes with cinematic entrance */}
            {phase !== "boot" && (
              <div
                style={{
                  opacity: line2Text.length > 0 ? 1 : 0,
                  transform: line2Text.length > 0 ? "translateY(0)" : "translateY(24px)",
                  transition: "opacity 0.5s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <CinematicTextLine
                  text={line2Text || "​"}
                  isActive={cursorOnLine2}
                  showCursor={showCursor}
                  glitchOffset={glitchOffset}
                  brightness={brightness}
                  flickerOpacity={flickerOpacity}
                  phase={phase}
                />
              </div>
            )}
          </div>
        ) : (
          <div ref={textWrapperRef} className="inline-block max-w-[85vw] mx-auto">
            <CinematicTextLine
              text={displayText}
              isActive={phase === "typing" || phase === "boot"}
              showCursor={showCursor}
              glitchOffset={glitchOffset}
              brightness={brightness}
              flickerOpacity={flickerOpacity}
              phase={phase}
            />
          </div>
        )}

        {/* Subtitle */}
        <div
          className="mt-6 md:mt-8 transition-all duration-1000"
          style={{
            opacity: phase === "typing" || phase === "boot" ? 0 : 0.7,
            transform: phase === "typing" || phase === "boot" ? "translateY(12px)" : "translateY(0)",
          }}
        >
          <p
            className="font-mono text-[10px] uppercase tracking-[0.6em] text-white/50"
            style={{ textShadow: "0 0 10px rgba(255,0,51,0.35)" }}
          >
            // Reality Anchor Established
          </p>
        </div>
      </div>

      {/* ═══ BOTTOM PROGRESS / STATUS ═══ */}
      <div className="absolute bottom-[10vh] left-0 right-0 flex flex-col items-center">
        <div className="w-[280px] h-[1px] bg-[#ff0033]/15 relative overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#ff0033]/60 to-[#ff3366]/80"
            style={{
              width: `${progressPercent}%`,
              transition: "width 0.3s ease-out",
              boxShadow: "0 0 8px rgba(255,0,51,0.5)",
            }}
          />
        </div>
        <p className="mt-3 font-mono text-[8px] uppercase tracking-[0.4em] text-[#ff0033]/30">
          {statusLabel}
        </p>
      </div>
    </div>
  );
}
```

## File: `src/context/AudioContext.tsx`

```typescript
"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useSuspenseAudio } from "@/hooks/useSuspenseAudio";

type AudioContextType = ReturnType<typeof useSuspenseAudio>;

const AudioContextInstance = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const audio = useSuspenseAudio();

  return (
    <AudioContextInstance.Provider value={audio}>
      {children}
    </AudioContextInstance.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContextInstance);
  if (!context) {
    // Fallback to hook if outside provider
    return useSuspenseAudio();
  }
  return context;
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

import { useEffect, useCallback, useState } from "react";

/**
 * ═══════════════════════════════════════════════════════════════════════
 * GLOBAL PERSISTENT CINEMATIC AUDIO ENGINE
 *
 * Web Audio API Context is a module-level singleton that persists across
 * all route and component changes (Loader → Detonation → Welcome → Hero).
 *
 * Rules:
 *  1. Loader Phase: Plays CRT boot sound, 30Hz sub rumble, mechanical drones,
 *     matrix rain static, heartbeat pulses, and suction riser.
 *  2. Detonation Blast: Triggers sub-bass drop (30Hz–50Hz), metallic shockwave
 *     shatter, Dune horn stab, and crystal reverb tail.
 *  3. LOADER AUDIO TERMINATION: All loader drones & background loops STOP
 *     completely upon detonation.
 *  4. Welcome Screen: Pitch-black background with ONLY ASMR mechanical keyboard
 *     keystroke sounds (+/- 4% pitch variance, gain variance, spacebar thock,
 *     and terminal lock-in thud). NO background drone bleed.
 * ═══════════════════════════════════════════════════════════════════════
 */

// Module-Level Singleton Nodes
let _ctx: AudioContext | null = null;
let _masterGain: GainNode | null = null;
let _ambientGain: GainNode | null = null;
let _convolver: ConvolverNode | null = null;
let _filter: BiquadFilterNode | null = null;
let _subOsc: OscillatorNode | null = null;
let _droneOsc: OscillatorNode | null = null;
let _droneOsc2: OscillatorNode | null = null;
let _riserOsc: OscillatorNode | null = null;
let _riserGain: GainNode | null = null;
let _noiseNode: AudioBufferSourceNode | null = null;
let _heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let _isInitialized = false;
let _isTearing = false;

// Pre-buffered memory assets for 0ms playback latency
let _keycapNoiseBuffer: AudioBuffer | null = null;

function createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.004));
  }
  return buffer;
}

export function useSuspenseAudio() {
  const [audioEnabled, setAudioEnabled] = useState(_isInitialized);

  // CRT monitor boot sound
  const playCRTBootSound = useCallback((ctx: AudioContext, destination: AudioNode) => {
    const now = ctx.currentTime;
    const hum = ctx.createOscillator();
    hum.type = "sawtooth";
    hum.frequency.setValueAtTime(60, now);
    hum.frequency.exponentialRampToValueAtTime(140, now + 1.2);

    const humFilter = ctx.createBiquadFilter();
    humFilter.type = "lowpass";
    humFilter.frequency.setValueAtTime(250, now);
    humFilter.frequency.exponentialRampToValueAtTime(800, now + 0.8);
    humFilter.frequency.exponentialRampToValueAtTime(150, now + 1.5);

    const humGain = ctx.createGain();
    humGain.gain.setValueAtTime(0.001, now);
    humGain.gain.linearRampToValueAtTime(0.45, now + 0.15);
    humGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    hum.connect(humFilter);
    humFilter.connect(humGain);
    humGain.connect(destination);

    hum.start(now);
    hum.stop(now + 1.5);
  }, []);

  // UI cursor plink sound
  const playCursorPlink = useCallback(() => {
    if (!_ctx || _ctx.state !== "running") return;
    const ctx = _ctx;
    const now = ctx.currentTime;

    const plink = ctx.createOscillator();
    plink.type = "sine";
    const notes = [1046.5, 1318.51, 1567.98, 2093.0];
    const freq = notes[Math.floor(Math.random() * notes.length)];
    plink.frequency.setValueAtTime(freq, now);
    plink.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.1);

    const plinkGain = ctx.createGain();
    plinkGain.gain.setValueAtTime(0.12, now);
    plinkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    plink.connect(plinkGain);
    plink.connect(_masterGain || ctx.destination);

    plink.start(now);
    plink.stop(now + 0.11);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // ORGANIC ASMR TYPING ENGINE (PITCH & GAIN VARIANCE + PRE-BUFFERED)
  // ═══════════════════════════════════════════════════════════════════════
  const playTypingKeystrokeSound = useCallback((char?: string, isFinalChar: boolean = false) => {
    if (!_ctx) return;
    if (_ctx.state === "suspended") {
      _ctx.resume();
    }
    const ctx = _ctx;
    const now = ctx.currentTime;

    // Ensure master gain is open for ASMR typing sounds
    if (_masterGain && _masterGain.gain.value < 0.2) {
      _masterGain.gain.cancelScheduledValues(now);
      _masterGain.gain.setValueAtTime(0.5, now);
    }

    // Organic pitch +/- 4% & volume variance
    const pitchFactor = 0.96 + Math.random() * 0.08;
    const gainFactor = 0.85 + Math.random() * 0.15;

    // Special Spacebar Thock (" ")
    if (char === " ") {
      const spaceThock = ctx.createOscillator();
      spaceThock.type = "sine";
      spaceThock.frequency.setValueAtTime((180 + Math.random() * 20) * pitchFactor, now);
      spaceThock.frequency.exponentialRampToValueAtTime(50, now + 0.07);

      const spaceGain = ctx.createGain();
      spaceGain.gain.setValueAtTime(0.55 * gainFactor, now);
      spaceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

      const dest = _masterGain || ctx.destination;
      spaceThock.connect(spaceGain);
      spaceGain.connect(dest);
      spaceThock.start(now);
      spaceThock.stop(now + 0.08);
      return;
    }

    // Heavy Terminal Lock-in Sound on final character
    if (isFinalChar) {
      const lockThud = ctx.createOscillator();
      lockThud.type = "sine";
      lockThud.frequency.setValueAtTime(200, now);
      lockThud.frequency.exponentialRampToValueAtTime(35, now + 0.2);

      const lockGain = ctx.createGain();
      lockGain.gain.setValueAtTime(0.75, now);
      lockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      const lockSnap = ctx.createOscillator();
      lockSnap.type = "sawtooth";
      lockSnap.frequency.setValueAtTime(3200, now);
      lockSnap.frequency.exponentialRampToValueAtTime(500, now + 0.04);

      const snapFilter = ctx.createBiquadFilter();
      snapFilter.type = "lowpass";
      snapFilter.frequency.setValueAtTime(2000, now);

      const snapGain = ctx.createGain();
      snapGain.gain.setValueAtTime(0.4, now);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      const dest = _masterGain || ctx.destination;
      lockThud.connect(lockGain);
      lockSnap.connect(snapFilter);
      snapFilter.connect(snapGain);
      lockGain.connect(dest);
      snapGain.connect(dest);

      lockThud.start(now);
      lockThud.stop(now + 0.23);
      lockSnap.start(now);
      lockSnap.stop(now + 0.055);
      return;
    }

    // Standard Organic Keystroke
    // 1. Deep Mechanical Thock Body
    const thock = ctx.createOscillator();
    thock.type = "sine";
    const baseFreq = (270 + Math.random() * 60) * pitchFactor;
    thock.frequency.setValueAtTime(baseFreq, now);
    thock.frequency.exponentialRampToValueAtTime(105, now + 0.045);

    const thockGain = ctx.createGain();
    thockGain.gain.setValueAtTime(0.4 * gainFactor, now);
    thockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    // 2. Tactile Switch Snap / Click
    const click = ctx.createOscillator();
    click.type = "triangle";
    click.frequency.setValueAtTime((4400 + Math.random() * 800) * pitchFactor, now);
    click.frequency.exponentialRampToValueAtTime(1300, now + 0.018);

    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.28 * gainFactor, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);

    // 3. Pre-buffered Keycap Bottom-out Noise
    let noiseSrc: AudioBufferSourceNode | null = null;
    let noiseGain: GainNode | null = null;
    if (_keycapNoiseBuffer) {
      noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = _keycapNoiseBuffer;
      noiseSrc.playbackRate.setValueAtTime(pitchFactor, now);

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.setValueAtTime(3400 + Math.random() * 500, now);
      noiseFilter.Q.setValueAtTime(2.2, now);

      noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.22 * gainFactor, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);

      noiseSrc.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
    }

    const destNode = _masterGain || ctx.destination;

    // Stereo Panning
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (panner) {
      panner.pan.setValueAtTime((Math.random() - 0.5) * 0.4, now);
      thock.connect(thockGain);
      click.connect(clickGain);
      thockGain.connect(panner);
      clickGain.connect(panner);
      if (noiseGain) noiseGain.connect(panner);
      panner.connect(destNode);
    } else {
      thock.connect(thockGain);
      click.connect(clickGain);
      thockGain.connect(destNode);
      clickGain.connect(destNode);
      if (noiseGain) noiseGain.connect(destNode);
    }

    thock.start(now);
    thock.stop(now + 0.052);
    click.start(now);
    click.stop(now + 0.027);
    if (noiseSrc) noiseSrc.start(now);
  }, []);

  const playEnterPunchSound = useCallback(() => {
    playTypingKeystrokeSound("O", true);
  }, [playTypingKeystrokeSound]);

  // ═══════════════════════════════════════════════════════════════════════
  // GLOBAL PERSISTENT AUDIO INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════
  const initAudio = useCallback(() => {
    if (_ctx && _ctx.state === "running") {
      setAudioEnabled(true);
      return;
    }
    if (_ctx && _ctx.state === "suspended") {
      _ctx.resume().then(() => setAudioEnabled(true));
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      _ctx = ctx;

      // Pre-buffer keystroke noise asset in memory for 0ms latency
      _keycapNoiseBuffer = createNoiseBuffer(ctx, 0.02);

      const master = ctx.createGain();
      master.gain.setValueAtTime(0.5, ctx.currentTime);
      master.connect(ctx.destination);
      _masterGain = master;

      const ambientBus = ctx.createGain();
      ambientBus.gain.setValueAtTime(1.0, ctx.currentTime);
      ambientBus.connect(master);
      _ambientGain = ambientBus;

      // Convolver Reverb
      const convolver = ctx.createConvolver();
      const reverbLength = ctx.sampleRate * 3.0;
      const reverbBuf = ctx.createBuffer(2, reverbLength, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const data = reverbBuf.getChannelData(ch);
        for (let i = 0; i < reverbLength; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / reverbLength, 2.2) * 0.3;
        }
      }
      convolver.buffer = reverbBuf;
      convolver.connect(master);
      _convolver = convolver;

      playCRTBootSound(ctx, master);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(180, ctx.currentTime);
      filter.Q.setValueAtTime(3.5, ctx.currentTime);
      filter.connect(ambientBus);
      _filter = filter;

      // 30Hz Sub-Bass Chest Rumble
      const sub = ctx.createOscillator();
      sub.type = "sine";
      sub.frequency.setValueAtTime(30, ctx.currentTime);
      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0.4, ctx.currentTime);
      sub.connect(subGain);
      subGain.connect(ambientBus);
      sub.start();
      _subOsc = sub;

      // Mechanical Drones (60Hz & 98Hz)
      const drone = ctx.createOscillator();
      drone.type = "sawtooth";
      drone.frequency.setValueAtTime(60.0, ctx.currentTime);
      drone.connect(filter);
      drone.start();
      _droneOsc = drone;

      const drone2 = ctx.createOscillator();
      drone2.type = "sawtooth";
      drone2.frequency.setValueAtTime(98.0, ctx.currentTime);
      drone2.detune.setValueAtTime(12, ctx.currentTime);
      drone2.connect(filter);
      drone2.start();
      _droneOsc2 = drone2;

      // Anti-Gravity Suction Riser
      const riser = ctx.createOscillator();
      riser.type = "sine";
      riser.frequency.setValueAtTime(100, ctx.currentTime);
      const riserGain = ctx.createGain();
      riserGain.gain.setValueAtTime(0.001, ctx.currentTime);
      riser.connect(riserGain);
      riserGain.connect(ambientBus);
      riser.start();
      _riserOsc = riser;
      _riserGain = riserGain;

      // Matrix Rain Static
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.10;
        b6 = white * 0.115926;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;

      const rainFilter = ctx.createBiquadFilter();
      rainFilter.type = "highpass";
      rainFilter.frequency.setValueAtTime(2500, ctx.currentTime);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.14, ctx.currentTime);

      noise.connect(rainFilter);
      rainFilter.connect(noiseGain);
      noiseGain.connect(master);
      noise.start();
      _noiseNode = noise;

      _isInitialized = true;
      setAudioEnabled(true);

      // Heartbeat pulse (40 BPM)
      const playHeartbeat = () => {
        if (!_ctx || _ctx.state !== "running") return;
        const now = _ctx.currentTime;

        const kick1 = _ctx.createOscillator();
        kick1.type = "sine";
        kick1.frequency.setValueAtTime(90, now);
        kick1.frequency.exponentialRampToValueAtTime(30, now + 0.12);

        const kickGain = _ctx.createGain();
        kickGain.gain.setValueAtTime(0.48, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        kick1.connect(kickGain);
        kickGain.connect(master);
        kick1.start(now);
        kick1.stop(now + 0.16);

        const kick2 = _ctx.createOscillator();
        kick2.type = "sine";
        kick2.frequency.setValueAtTime(75, now + 0.18);
        kick2.frequency.exponentialRampToValueAtTime(25, now + 0.3);

        const kickGain2 = _ctx.createGain();
        kickGain2.gain.setValueAtTime(0.32, now + 0.18);
        kickGain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

        kick2.connect(kickGain2);
        kickGain2.connect(master);
        kick2.start(now + 0.18);
        kick2.stop(now + 0.33);
      };

      _heartbeatTimer = setInterval(playHeartbeat, 1500);

    } catch (err) {
      console.warn("Web Audio initialization error:", err);
    }
  }, [playCRTBootSound]);

  const setProgress = useCallback((progress: number) => {
    if (!_ctx || _ctx.state !== "running") return;
    const ctx = _ctx;
    const norm = Math.min(Math.max(progress / 100, 0), 1);
    const now = ctx.currentTime;

    if (_filter) {
      _filter.frequency.setTargetAtTime(180 + norm * 1400, now, 0.1);
    }
    if (_subOsc) {
      _subOsc.frequency.setTargetAtTime(30 + norm * 20, now, 0.1);
    }
    if (_riserOsc && _riserGain) {
      const riserFreq = 100 + Math.pow(norm, 3.5) * 1200;
      const riserVol = norm > 0.6 ? (norm - 0.6) * 1.8 : 0;
      _riserOsc.frequency.setTargetAtTime(riserFreq, now, 0.05);
      _riserGain.gain.setTargetAtTime(Math.min(0.55, riserVol), now, 0.05);
    }

    if (norm > 0.15 && Math.random() < 0.04) {
      playCursorPlink();
    }
  }, [playCursorPlink]);

  // ═══════════════════════════════════════════════════════════════════════
  // STOP LOADER AMBIENT DRONES & HEARTBEATS
  // Cleanly stops loader hum so Welcome Screen has ZERO background audio leak
  // ═══════════════════════════════════════════════════════════════════════
  const stopLoaderDrones = useCallback(() => {
    if (_heartbeatTimer) {
      clearInterval(_heartbeatTimer);
      _heartbeatTimer = null;
    }
    const now = _ctx ? _ctx.currentTime : 0;
    try { if (_subOsc)   { _subOsc.stop(now);   _subOsc   = null; } } catch {}
    try { if (_droneOsc) { _droneOsc.stop(now); _droneOsc = null; } } catch {}
    try { if (_droneOsc2){ _droneOsc2.stop(now); _droneOsc2= null; } } catch {}
    try { if (_riserOsc) { _riserOsc.stop(now); _riserOsc = null; } } catch {}
    try { if (_noiseNode){ _noiseNode.stop(now);_noiseNode= null; } } catch {}
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // DETONATION IMPACT & LOADER AUDIO TERMINATION
  // ═══════════════════════════════════════════════════════════════════════
  const triggerTear = useCallback(() => {
    if (!_ctx || _isTearing) return;
    _isTearing = true;

    const ctx = _ctx;
    const now = ctx.currentTime;

    try {
      // 1. CLEANLY STOP ALL LOADER AMBIENT DRONES & HEARTBEATS IMMEDIATELY AT DETONATION
      stopLoaderDrones();

      // Ensure master gain is open for detonation SFX & subsequent ASMR typing
      if (_masterGain) {
        _masterGain.gain.cancelScheduledValues(now);
        _masterGain.gain.setValueAtTime(0.5, now);
      }

      const blastTime = now + 0.02;

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-14, blastTime);
      compressor.knee.setValueAtTime(4, blastTime);
      compressor.ratio.setValueAtTime(14, blastTime);
      compressor.attack.setValueAtTime(0.002, blastTime);
      compressor.release.setValueAtTime(0.12, blastTime);
      compressor.connect(ctx.destination);

      const breachMaster = ctx.createGain();
      breachMaster.gain.setValueAtTime(1.0, blastTime);
      breachMaster.gain.exponentialRampToValueAtTime(0.001, blastTime + 1.4);
      breachMaster.connect(compressor);

      // 2. Heavy 30Hz-50Hz Sub-Bass Impact Punch
      const subDrop = ctx.createOscillator();
      subDrop.type = "sine";
      subDrop.frequency.setValueAtTime(160, blastTime);
      subDrop.frequency.exponentialRampToValueAtTime(50, blastTime + 0.05);
      subDrop.frequency.exponentialRampToValueAtTime(30, blastTime + 0.45);

      const subDropGain = ctx.createGain();
      subDropGain.gain.setValueAtTime(1.0, blastTime);
      subDropGain.gain.exponentialRampToValueAtTime(0.001, blastTime + 0.65);

      subDrop.connect(subDropGain);
      subDropGain.connect(breachMaster);
      subDrop.start(blastTime);
      subDrop.stop(blastTime + 0.7);

      // 3. Metallic Shockwave Shatter
      const slash = ctx.createOscillator();
      slash.type = "sawtooth";
      slash.frequency.setValueAtTime(5200, blastTime);
      slash.frequency.exponentialRampToValueAtTime(9800, blastTime + 0.1);
      slash.frequency.exponentialRampToValueAtTime(1400, blastTime + 0.5);

      const slashFilter = ctx.createBiquadFilter();
      slashFilter.type = "highpass";
      slashFilter.frequency.setValueAtTime(2500, blastTime);

      const slashGain = ctx.createGain();
      slashGain.gain.setValueAtTime(0.5, blastTime);
      slashGain.gain.exponentialRampToValueAtTime(0.001, blastTime + 0.55);

      slash.connect(slashFilter);
      slashFilter.connect(slashGain);
      slashGain.connect(breachMaster);
      slash.start(blastTime);
      slash.stop(blastTime + 0.6);

      // 4. Dune Horn Stab
      const horn1 = ctx.createOscillator();
      const horn2 = ctx.createOscillator();
      horn1.type = "sawtooth";
      horn2.type = "sawtooth";

      horn1.frequency.setValueAtTime(110, blastTime);
      horn1.frequency.exponentialRampToValueAtTime(80, blastTime + 0.6);
      horn2.frequency.setValueAtTime(110.8, blastTime);
      horn2.frequency.exponentialRampToValueAtTime(80.4, blastTime + 0.6);

      const hornFilter = ctx.createBiquadFilter();
      hornFilter.type = "lowpass";
      hornFilter.Q.setValueAtTime(5.5, blastTime);
      hornFilter.frequency.setValueAtTime(160, blastTime);
      hornFilter.frequency.exponentialRampToValueAtTime(1800, blastTime + 0.08);
      hornFilter.frequency.exponentialRampToValueAtTime(400, blastTime + 0.5);

      const hornGain = ctx.createGain();
      hornGain.gain.setValueAtTime(0.001, blastTime);
      hornGain.gain.linearRampToValueAtTime(0.65, blastTime + 0.03);
      hornGain.gain.exponentialRampToValueAtTime(0.001, blastTime + 0.8);

      horn1.connect(hornFilter);
      horn2.connect(hornFilter);
      hornFilter.connect(hornGain);
      hornGain.connect(breachMaster);

      horn1.start(blastTime);
      horn2.start(blastTime);
      horn1.stop(blastTime + 0.85);
      horn2.stop(blastTime + 0.85);

      // 5. Crystal Reverb Tail
      const bell1 = ctx.createOscillator();
      const bell2 = ctx.createOscillator();
      bell1.type = "sine";
      bell2.type = "sine";

      bell1.frequency.setValueAtTime(880, blastTime + 0.1);
      bell2.frequency.setValueAtTime(1320, blastTime + 0.12);

      const bellGain = ctx.createGain();
      bellGain.gain.setValueAtTime(0, blastTime + 0.1);
      bellGain.gain.linearRampToValueAtTime(0.25, blastTime + 0.22);
      bellGain.gain.exponentialRampToValueAtTime(0.001, blastTime + 1.1);

      bell1.connect(bellGain);
      bell2.connect(bellGain);
      bellGain.connect(breachMaster);

      bell1.start(blastTime + 0.1);
      bell2.start(blastTime + 0.12);
      bell1.stop(blastTime + 1.2);
      bell2.stop(blastTime + 1.2);

      setTimeout(() => {
        try { compressor.disconnect(); } catch {}
        try { breachMaster.disconnect(); } catch {}
      }, 2000);

    } catch (e) {
      console.warn("Error playing detonation blast sound:", e);
    }
  }, []);

  const stop = useCallback(() => {
    if (_heartbeatTimer) {
      clearInterval(_heartbeatTimer);
      _heartbeatTimer = null;
    }
    if (_ctx) {
      try { _ctx.close(); } catch {}
      _ctx = null;
      _masterGain = null;
      _ambientGain = null;
      _convolver = null;
      _filter = null;
      _subOsc = null;
      _droneOsc = null;
      _droneOsc2 = null;
      _riserOsc = null;
      _riserGain = null;
      _noiseNode = null;
    }
    _isInitialized = false;
    _isTearing = false;
    setAudioEnabled(false);
  }, []);

  useEffect(() => {
    if (_ctx && _ctx.state === "running") {
      setAudioEnabled(true);
    }
    const handleUserGesture = () => {
      initAudio();
      window.removeEventListener("click", handleUserGesture);
      window.removeEventListener("keydown", handleUserGesture);
      window.removeEventListener("touchstart", handleUserGesture);
    };

    if (!_ctx || _ctx.state !== "running") {
      window.addEventListener("click", handleUserGesture);
      window.addEventListener("keydown", handleUserGesture);
      window.addEventListener("touchstart", handleUserGesture);
    }

    return () => {
      window.removeEventListener("click", handleUserGesture);
      window.removeEventListener("keydown", handleUserGesture);
      window.removeEventListener("touchstart", handleUserGesture);
    };
  }, [initAudio]);

  return { audioEnabled, initAudio, stopLoaderDrones, setProgress, triggerTear, stop, playCursorPlink, playTypingKeystrokeSound, playEnterPunchSound };
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

## File: `src/types/postprocessing.d.ts`

```typescript
declare module "@react-three/postprocessing" {
  import React from "react";

  export interface EffectComposerProps {
    children?: React.ReactNode;
    disableNormalPass?: boolean;
    multisampling?: number;
    depthBuffer?: boolean;
  }

  export interface BloomProps {
    ref?: React.Ref<any>;
    intensity?: number;
    radius?: number;
    luminanceThreshold?: number;
    luminanceSmoothing?: number;
    mipmapBlur?: boolean;
  }

  export const EffectComposer: React.FC<EffectComposerProps>;
  export const Bloom: React.FC<BloomProps>;
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

## File: `scratch/cyberpunk_loader_synth.py`

```text
"""
═══════════════════════════════════════════════════════════════════════════
  CYBERPUNK LOADER AUDIO SYNTHESIZER
  ─────────────────────────────────────────────────────────────────────────
  Generates a cinematic 12-second peak-level audio track for the
  "Poshan MS" portfolio loader. 

  FEATURES:
  • 32Hz FM sub-bass with void rumble
  • Detuned sawtooth cyberpunk drone with filter sweep
  • Pink-noise matrix rain (gated digital texture)
  • Cardiac lub-dub heartbeat pulses
  • Heavy 808 impact kicks with sidechain pumping
  • Metallic FM "neon slash" transients
  • Quantum wave frequency sweeps
  • Dimensional breach climax:
      – Void implosion (60Hz→15Hz pitch dive)
      – Shockwave bandpassed noise
      – Crystal bell (440Hz + harmonics, 4s tail)
      – Sub rumble (28Hz physical thump)
      – Dimensional slash (9kHz→800Hz FM sweep)
  • Power surge glitch spikes
  • Telemetry data chirps
  • Convolution reverb + stereo width + mastering limiter

  OUTPUT: 48kHz / 32-bit float (or 16-bit int fallback) stereo WAV
═══════════════════════════════════════════════════════════════════════════
"""

import numpy as np
import math
import os

try:
    from scipy.signal import butter, lfilter, fftconvolve
    from scipy.io import wavfile
    HAS_SCIPY = True
except ImportError:
    HAS_SCIPY = False
    import wave

SAMPLE_RATE = 48000
DURATION = 12.0
N = int(SAMPLE_RATE * DURATION)
t = np.linspace(0, DURATION, N)

def db_to_lin(db): 
    return 10.0 ** (db / 20.0)

def lowpass(signal, cutoff, order=2):
    if not HAS_SCIPY:
        out = np.zeros_like(signal)
        rc = 1.0 / (2.0 * np.pi * max(cutoff, 1.0))
        alpha = (1.0 / SAMPLE_RATE) / (rc + 1.0 / SAMPLE_RATE)
        out[0] = signal[0]
        for i in range(1, len(signal)):
            out[i] = out[i-1] + alpha * (signal[i] - out[i-1])
        return out
    nyq = SAMPLE_RATE / 2.0
    b, a = butter(order, max(0.01, cutoff / nyq), btype='low')
    return lfilter(b, a, signal)

def highpass(signal, cutoff, order=2):
    if not HAS_SCIPY:
        return signal - lowpass(signal, cutoff)
    nyq = SAMPLE_RATE / 2.0
    b, a = butter(order, max(0.01, cutoff / nyq), btype='high')
    return lfilter(b, a, signal)

def bandpass(signal, low, high, order=2):
    if not HAS_SCIPY:
        return highpass(lowpass(signal, high), low)
    nyq = SAMPLE_RATE / 2.0
    b, a = butter(order, [max(0.01, low/nyq), min(0.99, high/nyq)], btype='band')
    return lfilter(b, a, signal)

def pink_noise(n_samples):
    white = np.fft.rfft(np.random.randn(n_samples))
    freqs = np.fft.rfftfreq(n_samples, 1.0 / SAMPLE_RATE)
    freqs[0] = 1.0
    return np.fft.irfft(white / np.sqrt(freqs), n=n_samples)

def stereo_pan(signal, pan):
    angle = (pan + 1.0) * np.pi / 4.0
    return signal * np.cos(angle) * np.sqrt(2.0), signal * np.sin(angle) * np.sqrt(2.0)

def make_kick(start_time, amp=1.0):
    n = int(SAMPLE_RATE * 0.18)
    t_local = np.arange(n) / SAMPLE_RATE
    freq = 150.0 * np.exp(-t_local * 32.0)
    phase = 2.0 * np.pi * np.cumsum(freq) / SAMPLE_RATE
    click = np.exp(-t_local * 250.0) * 0.3
    env = np.exp(-t_local * 16.0)
    sig = (np.sin(phase) + click) * env * amp
    idx = int(start_time * SAMPLE_RATE)
    return idx, min(n, N - idx), sig

def make_heartbeat(start_time, amp=0.5):
    n = int(SAMPLE_RATE * 0.45)
    sig = np.zeros(n)
    t1 = np.arange(int(0.13 * SAMPLE_RATE)) / SAMPLE_RATE
    f1 = 95.0 * np.exp(-t1 * 28.0)
    p1 = 2.0 * np.pi * np.cumsum(f1) / SAMPLE_RATE
    sig[:len(t1)] += np.sin(p1) * np.exp(-t1 * 22.0) * amp
    t2 = np.arange(int(0.11 * SAMPLE_RATE)) / SAMPLE_RATE
    f2 = 78.0 * np.exp(-t2 * 26.0)
    p2 = 2.0 * np.pi * np.cumsum(f2) / SAMPLE_RATE
    off = int(0.19 * SAMPLE_RATE)
    end = min(off + len(t2), n)
    sig[off:end] += np.sin(p2[:end-off]) * np.exp(-t2[:end-off] * 20.0) * amp * 0.65
    idx = int(start_time * SAMPLE_RATE)
    return idx, min(n, N - idx), sig

def make_sub_bass():
    lfo = np.sin(2.0 * np.pi * 0.4 * t)
    freq = 32.0 + 2.5 * lfo
    phase = 2.0 * np.pi * np.cumsum(freq) / SAMPLE_RATE
    sig = np.sin(phase)
    fade = np.ones(N)
    fade[:int(0.6*SAMPLE_RATE)] = np.linspace(0, 1, int(0.6*SAMPLE_RATE))
    return sig * fade * (0.55 + np.exp(-((t - 8.0)**2) * 1.8) * 0.6)

def make_cyber_drone():
    saw = lambda f, p: ((2.0 * np.pi * f * t + p) % (2.0 * np.pi)) / np.pi - 1.0
    drone = (saw(65.4, 0) * 1.0 + saw(98.0, 0.7) * 0.65 + saw(65.4*1.008, 2.1) * 0.45) / 2.1
    brightness = np.interp(t, [0, 2, 5, 8, 10, 12], [0.05, 0.15, 0.55, 1.0, 0.25, 0.1])
    harm = highpass(drone**3, 600)
    return (drone * (1.0 - brightness) + harm * brightness * 2.5) * 0.22

def make_matrix_rain():
    noise = pink_noise(N)
    gate = np.zeros(N)
    block = int(SAMPLE_RATE * 0.005)
    for i in range(0, N, block):
        if np.random.rand() < 0.07:
            end = min(i + block * 3, N)
            gate[i:end] = np.exp(-np.arange(end - i) / (SAMPLE_RATE * 0.008))
    return highpass(noise * gate, 1800) * 0.35

def make_slash(start_time, pan=0.0, amp=0.85):
    n = int(SAMPLE_RATE * 0.09)
    t_local = np.arange(n) / SAMPLE_RATE
    cf = 4200.0 * np.exp(-t_local * 12.0)
    mf = 850.0 * np.exp(-t_local * 18.0)
    mi = 9.0 * np.exp(-t_local * 30.0)
    cp = 2.0 * np.pi * np.cumsum(cf) / SAMPLE_RATE
    mp = 2.0 * np.pi * np.cumsum(mf) / SAMPLE_RATE
    fm = np.sin(cp + mi * np.sin(mp))
    noise = np.random.randn(n) * np.exp(-t_local * 45.0)
    sig = highpass((fm * 0.65 + noise * 0.35) * amp, 1500)
    idx = int(start_time * SAMPLE_RATE)
    l, r = stereo_pan(sig, pan)
    return idx, min(n, N - idx), l, r

def make_whoosh(start_time, amp=0.6, pan=0.0):
    n = int(SAMPLE_RATE * 0.4)
    t_local = np.arange(n) / SAMPLE_RATE
    freq = 350.0 * (35.0 / 350.0) ** (t_local / 0.4)
    phase = 2.0 * np.pi * np.cumsum(freq) / SAMPLE_RATE
    env = np.exp(-t_local * 3.5) * (1.0 - t_local / 0.4) ** 0.5
    sig = bandpass((np.sin(phase) * 0.7 + np.random.randn(n) * 0.5) * env * amp, 80, 2500)
    idx = int(start_time * SAMPLE_RATE)
    l, r = stereo_pan(sig, pan)
    return idx, min(n, N - idx), l, r

def make_breach():
    sig = np.zeros(N)
    idx0 = int(8.0 * SAMPLE_RATE)

    # Void implosion
    n = int(1.6 * SAMPLE_RATE)
    t_loc = np.arange(n) / SAMPLE_RATE
    freq = 60.0 * np.exp(-t_loc * 3.0)
    phase = 2.0 * np.pi * np.cumsum(freq) / SAMPLE_RATE
    sig[idx0:idx0+n] += np.sin(phase) * np.exp(-t_loc * 1.4) * 0.95

    # Shockwave
    n = int(1.3 * SAMPLE_RATE)
    t_loc = np.arange(n) / SAMPLE_RATE
    sig[idx0:idx0+n] += bandpass(np.random.randn(n) * np.exp(-t_loc * 2.8) * 0.85, 300, 2500)[:min(n, N-idx0)]

    # Crystal bell
    t_bell = t - 8.2
    bell = np.zeros(N)
    for fb, ab in [(440, 0.38), (880, 0.24), (1320, 0.14), (1760, 0.08)]:
        pb = 2.0 * np.pi * fb * t_bell + 2.0 * np.pi * np.cumsum(np.sin(2.0*np.pi*5.5*t_bell)*2.0) / SAMPLE_RATE
        bell += np.sin(pb) * np.exp(-t_bell * 0.75) * (t_bell > 0) * ab
    sig += bell

    # Sub rumble
    tr = t - 8.0
    sig += (np.sin(2.0*np.pi*28.0*t) + 0.5*np.sin(2.0*np.pi*56.0*t)) * np.exp(-tr * 0.55) * (tr > 0) * 0.75

    # Dimensional slash
    n = int(0.18 * SAMPLE_RATE)
    t_loc = np.arange(n) / SAMPLE_RATE
    freq = 9000.0 * (800.0 / 9000.0) ** (t_loc / 0.18)
    phase = 2.0 * np.pi * np.cumsum(freq) / SAMPLE_RATE
    env = np.exp(-t_loc * 18.0)
    mi = 12.0 * env
    mod = mi * np.sin(2.0 * np.pi * np.cumsum(1500.0 * np.exp(-t_loc * 10.0)) / SAMPLE_RATE)
    ds = np.sin(phase + mod) * env * 1.1 + np.random.randn(n) * env * 0.35
    sig[idx0:idx0+n] += highpass(ds, 2500)[:min(n, N-idx0)]
    return sig

def make_power_surges():
    sig = np.zeros(N)
    for _ in range(12):
        st = np.random.uniform(5.5, 7.8)
        n = int(np.random.uniform(0.02, 0.06) * SAMPLE_RATE)
        idx = int(st * SAMPLE_RATE)
        if idx + n < N:
            spike = np.random.randn(n) * np.exp(-np.arange(n) / (SAMPLE_RATE * 0.015))
            sig[idx:idx+n] += bandpass(spike, 2000, 8000) * 0.4
    return sig

def make_data_chirps():
    sig = np.zeros(N)
    for ct in [2.5, 3.2, 3.9, 4.6, 5.3, 6.5, 7.1]:
        n = int(0.03 * SAMPLE_RATE)
        idx = int(ct * SAMPLE_RATE)
        if idx + n < N:
            t_loc = np.arange(n) / SAMPLE_RATE
            freq = 2000.0 + np.random.rand() * 3000.0
            sig[idx:idx+n] += np.sin(2.0 * np.pi * freq * t_loc) * np.exp(-t_loc * 60.0) * 0.15
    return sig

def make_reverb_ir(duration=2.5):
    n = int(SAMPLE_RATE * duration)
    ir = np.random.randn(n) * np.exp(-np.linspace(0, 7, n))
    return highpass(lowpass(ir, 5000), 60) / np.max(np.abs(ir))

def apply_reverb(signal, ir, wet=0.3):
    if HAS_SCIPY:
        rev = fftconvolve(signal, ir, mode='full')[:len(signal)]
    else:
        rev = np.convolve(signal, ir, mode='full')[:len(signal)]
    return signal + rev * wet

# ─── MAIN BUILD ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    mix_l = np.zeros(N)
    mix_r = np.zeros(N)

    sub = make_sub_bass()
    mix_l += sub * 0.85; mix_r += sub * 0.85

    drone = make_cyber_drone()
    mix_l += drone * 0.95; mix_r += drone * 1.05

    rain = make_matrix_rain()
    mix_l += rain * 0.9; mix_r += rain * 1.1

    for hb_t in [0.8, 2.1, 3.4, 4.7, 6.0, 7.3, 8.6, 10.0]:
        idx, n, sig = make_heartbeat(hb_t, 0.42)
        if idx < N:
            mix_l[idx:idx+n] += sig[:n]
            mix_r[idx:idx+n] += sig[:n]

    for k_t, k_a in zip([2.0, 4.0, 6.0, 7.5, 8.0], [0.6, 0.6, 0.6, 0.8, 1.3]):
        idx, n, sig = make_kick(k_t, k_a)
        if idx < N:
            mix_l[idx:idx+n] += sig[:n]
            mix_r[idx:idx+n] += sig[:n]

    for s_t, s_p, s_a in [(5.2, -0.85, 0.75), (6.1, 0.85, 0.8), (6.8, -0.4, 0.7), 
                           (7.4, 0.6, 0.85), (8.0, 0.0, 1.0), (8.15, -0.7, 0.6)]:
        idx, n, l_sig, r_sig = make_slash(s_t, s_p, s_a)
        if idx < N:
            mix_l[idx:idx+n] += l_sig[:n]
            mix_r[idx:idx+n] += r_sig[:n]

    for w_t, w_a, w_p in [(4.0, 0.55, -0.5), (5.5, 0.5, 0.6), (7.0, 0.65, -0.3), (8.5, 0.45, 0.4)]:
        idx, n, l_sig, r_sig = make_whoosh(w_t, w_a, w_p)
        if idx < N:
            mix_l[idx:idx+n] += l_sig[:n]
            mix_r[idx:idx+n] += r_sig[:n]

    breach = make_breach()
    mix_l += breach * 0.98; mix_r += breach * 0.98

    surges = make_power_surges()
    mix_l += surges * 0.8; mix_r += surges * 0.8

    chirps = make_data_chirps()
    mix_l += chirps * 0.85; mix_r += chirps * 1.15

    # Sidechain
    sc_env = np.ones(N)
    for k_t in [2.0, 4.0, 6.0, 7.5, 8.0]:
        idx = int(k_t * SAMPLE_RATE)
        if idx < N:
            sc_env[idx:] = np.minimum(sc_env[idx:], np.exp(-np.arange(N-idx) / (SAMPLE_RATE * 0.12)))
    mix_l -= drone * (1.0 - sc_env) * 0.35
    mix_r -= drone * (1.0 - sc_env) * 0.35
    mix_l -= rain * (1.0 - sc_env) * 0.2
    mix_r -= rain * (1.0 - sc_env) * 0.2

    # Stutter
    stutter_mask = np.ones(N)
    for _ in range(20):
        g_start = np.random.uniform(6.0, 8.0)
        g_n = int(np.random.uniform(0.008, 0.025) * SAMPLE_RATE)
        g_idx = int(g_start * SAMPLE_RATE)
        if g_idx + g_n < N:
            stutter_mask[g_idx:g_idx+g_n] = 0.08
    mix_l *= stutter_mask; mix_r *= stutter_mask

    # Reverb
    ir = make_reverb_ir(2.5)
    mix_l = apply_reverb(mix_l, ir, 0.28)
    mix_r = apply_reverb(mix_r, ir, 0.28)

    # Stereo width
    mid = (mix_l + mix_r) / 2.0
    side = (mix_l - mix_r) / 2.0
    if HAS_SCIPY:
        side = lowpass(side, 800) + highpass(side, 800) * 1.5
    mix_l = mid + side
    mix_r = mid - side

    # Master
    mix_l = np.tanh(np.tanh(mix_l * 1.3) * 0.7 + mix_l * 0.3) * 1.15
    mix_r = np.tanh(np.tanh(mix_r * 1.3) * 0.7 + mix_r * 0.3) * 1.15
    peak = max(np.max(np.abs(mix_l)), np.max(np.abs(mix_r)))
    if peak > 0:
        mix_l *= db_to_lin(-0.3) / peak
        mix_r *= db_to_lin(-0.3) / peak

    out_path = "loader_breach_audio.wav"
    if HAS_SCIPY:
        wavfile.write(out_path, SAMPLE_RATE, np.stack([mix_l, mix_r], axis=1).astype(np.float32))
    else:
        frames = np.clip(np.stack([mix_l, mix_r], axis=1), -1.0, 1.0)
        frames_int = (frames * 32767.0).astype(np.int16)
        with wave.open(out_path, 'w') as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(SAMPLE_RATE)
            w.writeframes(frames_int.tobytes())
    print(f"[DONE] Exported: {out_path}")
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
    "lint": "next lint",
    "codebase": "node scratch/generate_codebase_md.js"
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
    "next": "^14.2.0",
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
    "eslint-config-next": "^14.2.0",
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

# Ignore context markdown files
Master_prompt.md
Thinking.md
Previous.MD
Project__codebase.md
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

