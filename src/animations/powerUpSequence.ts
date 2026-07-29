"use client";

import gsap from "gsap";

export type PowerUpStage =
  | "idle"
  | "welcome"
  | "floor"
  | "laptop"
  | "globe"
  | "stars"
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
  // TOTAL DURATION: ~18 seconds of cinematic power-up
  // Each stage overlaps with the next for organic flow
  // ═══════════════════════════════════════════════════════════════

  // ── SCENE FADE-IN (0s → 3s) ──
  // Very slow fade from black so the eye adjusts
  tl.to(
    values,
    {
      sceneOpacity: 1,
      duration: 3,
      ease: "power2.inOut",
      onUpdate: update,
    },
    0
  );

  // ── STAGE 1: FLOOR GRID IGNITION (1s → 7s) ──
  // 6 seconds — like a massive server room booting up row by row
  tl.add(() => callbacks.onStageChange?.("floor"), 1);

  tl.to(
    values,
    {
      floorOpacity: 1,
      duration: 6,
      ease: "power2.inOut",
      onUpdate: update,
    },
    1
  );

  // Electrical flicker: unstable power flow during early boot (2s → 5s)
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

  // Power stabilizes (5s → 6.5s)
  tl.to(
    values,
    {
      floorFlicker: 1,
      duration: 1.5,
      ease: "power2.out",
      onUpdate: update,
    },
    5
  );

  // Brief power surge at 6s (like a capacitor discharging into the grid)
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
    6
  );

  // ── STAGE 2: LAPTOP SYSTEM BOOT (5s → 11s) ──
  // 6 seconds — motherboard POST sequence feel
  tl.add(() => callbacks.onStageChange?.("laptop"), 5);

  tl.to(
    values,
    {
      laptopOpacity: 1,
      duration: 6,
      ease: "power2.inOut",
      onUpdate: update,
    },
    5
  );

  // Laptop has its own micro-flicker during BIOS boot (6s → 8s)
  tl.to(
    values,
    {
      laptopOpacity: 0.6,
      duration: 0.06,
      repeat: 8,
      yoyo: true,
      ease: "rough({ strength: 0.8, points: 10, randomize: true })",
      onUpdate: update,
    },
    6.5
  );

  // Screen brightens to full (9s → 10.5s)
  tl.to(
    values,
    {
      laptopOpacity: 1,
      duration: 1.5,
      ease: "power2.out",
      onUpdate: update,
    },
    9
  );

  // ── STAGE 3: WIREFRAME GLOBE ACTIVATION (8s → 14s) ──
  // 6 seconds — holographic projector spinning up
  tl.add(() => callbacks.onStageChange?.("globe"), 8);

  tl.to(
    values,
    {
      globeOpacity: 1,
      duration: 6,
      ease: "power2.inOut",
      onUpdate: update,
    },
    8
  );

  // Globe has a "hologram flicker" as it materializes (10s → 12s)
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
    10
  );

  tl.to(
    values,
    {
      globeOpacity: 1,
      duration: 1,
      ease: "power2.out",
      onUpdate: update,
    },
    12
  );

  // ── STAGE 4: STARS & NEBULA EMERGE (11s → 16s) ──
  // 5 seconds — deep space slowly revealing itself
  tl.add(() => callbacks.onStageChange?.("stars"), 11);

  tl.to(
    values,
    {
      starsOpacity: 1,
      duration: 5,
      ease: "power2.inOut",
      onUpdate: update,
    },
    11
  );

  // ── STAGE 5: TECH CUBES MATERIALIZE (13s → 17s) ──
  // 4 seconds — crystalline objects phasing in
  tl.add(() => callbacks.onStageChange?.("cubes"), 13);

  tl.to(
    values,
    {
      cubesOpacity: 1,
      duration: 4,
      ease: "power2.inOut",
      onUpdate: update,
    },
    13
  );

  // ── STAGE 6: UI OVERLAY & NAVBAR REVEAL (15s → 18s) ──
  // 3 seconds — HUD elements fading in last
  tl.add(() => callbacks.onStageChange?.("ui"), 15);

  tl.to(
    values,
    {
      uiOpacity: 1,
      duration: 3,
      ease: "power3.out",
      onUpdate: update,
    },
    15
  );

  return tl;
}