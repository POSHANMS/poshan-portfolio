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
