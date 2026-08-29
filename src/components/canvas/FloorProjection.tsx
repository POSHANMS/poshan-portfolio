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