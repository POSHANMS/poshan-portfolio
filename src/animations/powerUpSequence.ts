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