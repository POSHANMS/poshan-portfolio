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
  // TOTAL DURATION: ~8.8 seconds of cinematic power-up
  // The portfolio overlay arrives while the world is still forming, so
  // the first complete scene reads as Poshan's hero instead of a hidden boot.
  // ═══════════════════════════════════════════════════════════════

  // ── SCENE FADE-IN (0s → 1.4s) ──
  tl.to(
    values,
    {
      sceneOpacity: 1,
      duration: 1.4,
      ease: "power2.inOut",
      onUpdate: update,
    },
    0
  );

  // ── STAGE 1: FLOOR GRID IGNITION (0.25s → 2.65s) ──
  tl.add(() => callbacks.onStageChange?.("floor"), 0.25);

  tl.to(
    values,
    {
      floorOpacity: 1,
      duration: 2.4,
      ease: "power2.inOut",
      onUpdate: update,
    },
    0.25
  );

  // Electrical flicker: unstable power flow during early boot.
  tl.to(
    values,
    {
      floorFlicker: 0.25,
      duration: 0.08,
      repeat: 7,
      yoyo: true,
      ease: "rough({ template: none, strength: 1.2, points: 16, taper: 'none', randomize: true, clamp: true })",
      onUpdate: update,
    },
    1.05
  );

  // Power stabilizes.
  tl.to(
    values,
    {
      floorFlicker: 1,
      duration: 0.55,
      ease: "power2.out",
      onUpdate: update,
    },
    2.05
  );

  // Brief power surge through the grid.
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
    2.6
  );

  // ── STAGE 2: DEEP STARFIELD EMERGENCE (0.9s → 3.5s) ──
  tl.add(() => callbacks.onStageChange?.("stars"), 0.9);

  tl.to(
    values,
    {
      starsOpacity: 1,
      duration: 2.6,
      ease: "power2.inOut",
      onUpdate: update,
    },
    0.9
  );

  // ── STAGE 3: REACTOR GLOBE WARM-UP (2.4s → 4.6s) ──
  tl.add(() => callbacks.onStageChange?.("globe"), 2.4);

  tl.to(
    values,
    {
      globeOpacity: 1,
      duration: 1.15,
      ease: "power2.inOut",
      onUpdate: update,
    },
    2.4
  );

  // Globe has a short hologram flicker as it fully materializes.
  tl.to(
    values,
    {
      globeOpacity: 0.5,
      duration: 0.05,
      repeat: 5,
      yoyo: true,
      ease: "rough({ strength: 1, points: 8, randomize: true })",
      onUpdate: update,
    },
    3.45
  );

  tl.to(
    values,
    {
      globeOpacity: 1,
      duration: 0.7,
      ease: "power2.out",
      onUpdate: update,
    },
    3.95
  );

  // ── STAGE 4: LAPTOP SMOOTH MATERIALIZATION (4.35s → 5.75s) ──
  tl.add(() => callbacks.onStageChange?.("laptop"), 4.35);

  tl.to(
    values,
    {
      laptopOpacity: 1,
      duration: 1.4,
      ease: "back.out(1.1)",
      onUpdate: update,
    },
    4.35
  );

  // ── STAGE 5: TECH CUBES MATERIALIZE (5.35s → 7.95s) ──
  tl.add(() => callbacks.onStageChange?.("cubes"), 5.35);

  tl.to(
    values,
    {
      cubesOpacity: 1,
      duration: 2.6,
      ease: "power2.inOut",
      onUpdate: update,
    },
    5.35
  );

  // ── STAGE 6: UI OVERLAY & NAVBAR REVEAL (5.1s → 8.8s) ──
  tl.add(() => callbacks.onStageChange?.("ui"), 5.1);

  tl.to(
    values,
    {
      uiOpacity: 1,
      duration: 3.7,
      ease: "power3.out",
      onUpdate: update,
    },
    5.1
  );

  return tl;
}
