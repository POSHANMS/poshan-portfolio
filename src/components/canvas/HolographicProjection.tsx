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