"use client";

import { Html, RoundedBox } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { ActFourPhase } from "@/types/actFour";
import type { CardContrastUniforms } from "./StarField";
import { JOURNEY_MILESTONES } from "@/utils/constants";
import {
  ACT_FIVE_CARD_POSITIONS,
  ACT_FIVE_ORIGIN,
  ACT_FIVE_REACTOR_CENTER,
  ACT_FIVE_TIMING,
} from "@/animations/actFiveChoreography";

const PARTICLE_COUNT = 11_000;
const ACT_FIVE_STAR_COUNT = 1_350;
const TETHER_SEGMENTS = 56;
const WORLD_UP = new THREE.Vector3(0, 1, 0);
const TETHER_VERTEX_SHADER = /* glsl */ `
  attribute float aProgress;
  varying float vProgress;
  void main() {
    vProgress = aProgress;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const TETHER_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uStrength;
  varying float vProgress;
  void main() {
    float wave = pow(max(0.0, sin(vProgress * 18.0 - uTime * 2.4)), 9.0);
    float core = 0.12 + wave * 0.86;
    gl_FragColor = vec4(1.0, 0.012 + wave * 0.04, 0.065 + wave * 0.035, core * uStrength);
  }
`;
const CORE_VERTEX_SHADER = /* glsl */ `
  varying vec3 vObjectPosition;
  varying vec3 vViewNormal;
  varying vec3 vViewDirection;
  uniform float uTime;
  vec3 hash33(vec3 p) {
    p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6)));
    return fract(sin(p) * 43758.5453);
  }
  float noise3(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(dot(hash33(i + vec3(0,0,0)) - 0.5, f - vec3(0,0,0)), dot(hash33(i + vec3(1,0,0)) - 0.5, f - vec3(1,0,0)), f.x),
                   mix(dot(hash33(i + vec3(0,1,0)) - 0.5, f - vec3(0,1,0)), dot(hash33(i + vec3(1,1,0)) - 0.5, f - vec3(1,1,0)), f.x), f.y),
               mix(mix(dot(hash33(i + vec3(0,0,1)) - 0.5, f - vec3(0,0,1)), dot(hash33(i + vec3(1,0,1)) - 0.5, f - vec3(1,0,1)), f.x),
                   mix(dot(hash33(i + vec3(0,1,1)) - 0.5, f - vec3(0,1,1)), dot(hash33(i + vec3(1,1,1)) - 0.5, f - vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) {
    float sum = 0.0, amplitude = 0.56;
    for (int octave = 0; octave < 4; octave++) {
      sum += noise3(p) * amplitude;
      p = p * 2.03 + vec3(7.1, 3.7, 5.9);
      amplitude *= 0.5;
    }
    return sum;
  }
  void main() {
    vObjectPosition = position;
    vec3 displaced = position + normal * fbm(position * 2.7 + vec3(0.0, uTime * 0.055, 0.0)) * 0.055;
    vec4 viewPosition = modelViewMatrix * vec4(displaced, 1.0);
    vViewNormal = normalize(normalMatrix * normal);
    vViewDirection = normalize(-viewPosition.xyz);
    gl_Position = projectionMatrix * viewPosition;
  }
`;
const CORE_FRAGMENT_SHADER = /* glsl */ `
  varying vec3 vObjectPosition;
  varying vec3 vViewNormal;
  varying vec3 vViewDirection;
  uniform float uTime;
  uniform float uReveal;
  float hash31(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }
  float valueNoise(vec3 p) {
    vec3 cell = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash31(cell), hash31(cell + vec3(1,0,0)), f.x),
                   mix(hash31(cell + vec3(0,1,0)), hash31(cell + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash31(cell + vec3(0,0,1)), hash31(cell + vec3(1,0,1)), f.x),
                   mix(hash31(cell + vec3(0,1,1)), hash31(cell + vec3(1,1,1)), f.x), f.y), f.z);
  }
  void main() {
    float angle = atan(vObjectPosition.z, vObjectPosition.x);
    vec3 surface = vObjectPosition * 5.2;
    float plateNoise = valueNoise(surface + vec3(0.0, uTime * 0.025, 0.0));
    float plateEdge = abs(plateNoise - 0.5);
    float tectonicSeam = 1.0 - smoothstep(0.025, 0.075, plateEdge);
    float striation = sin(angle * 17.0 + vObjectPosition.y * 13.0 + sin(angle * 4.0) * 1.4);
    float hairline = 1.0 - smoothstep(0.025, 0.11, abs(striation));
    float vein = max(tectonicSeam * 0.82, hairline * 0.32);
    float pulse = 0.72 + 0.28 * sin(uTime * 1.65 + angle * 2.0 + plateNoise * 5.0);
    float plateLight = smoothstep(0.18, 0.82, plateNoise) * 0.055;
    vec3 obsidian = vec3(0.008, 0.00025, 0.0014);
    vec3 volcanic = vec3(0.035, 0.00055, 0.004);
    vec3 magma = vec3(1.0, 0.0025, 0.032) * pulse;
    vec3 color = mix(obsidian, volcanic, plateLight * 5.0);
    color += vec3(plateLight * 0.16, plateLight * 0.008, plateLight * 0.02);
    color = mix(color, magma, vein * 0.96);
    float fresnel = pow(1.0 - abs(dot(normalize(vViewNormal), normalize(vViewDirection))), 4.0);
    color += vec3(0.82, 0.001, 0.022) * fresnel * (0.22 + pulse * 0.3);
    gl_FragColor = vec4(color, uReveal);
  }
`;
const SWARM_VERTEX_SHADER = /* glsl */ `
  attribute float aPhase;
  attribute float aSpeed;
  attribute float aSize;
  attribute float aHeat;
  uniform float uTime;
  uniform float uReveal;
  uniform float uExitProgress;
  uniform vec2 uCardCenter;
  uniform vec2 uCardHalfSize;
  uniform float uCardDim;
  varying vec3 vColor;
  varying float vAlpha;
  varying vec2 vScreenUv;
  void main() {
    vec3 p = position;
    float radius = length(p.xz);
    float angle = uTime * aSpeed * (0.48 + 1.8 / (radius + 1.1));
    float c = cos(angle), s = sin(angle);
    p.xz = mat2(c, -s, s, c) * p.xz;
    // Implode the accretion swarm with a cubic ease, then release the
    // compressed energy outward into the Act VI warp handoff.
    float implosion = pow(clamp(uExitProgress, 0.0, 1.0), 3.0);
    float collapse = smoothstep(0.0, 0.82, uExitProgress);
    float burst = smoothstep(0.72, 1.0, uExitProgress);
    vec2 outward = normalize(p.xz + vec2(0.0001));
    p.xz *= 1.0 - collapse * 0.96 * implosion;
    p.xz += outward * burst * 3.8;
    p.y *= 0.86;
    p.y += sin(uTime * 0.72 + aPhase + radius * 0.6) * 0.11;
    p.x += sin(uTime * 0.31 + aPhase * 1.7 + p.z) * 0.045;
    p.z += cos(uTime * 0.27 + aPhase * 1.3 + p.x) * 0.045;
    p.xz *= 1.0 + sin(uTime * 0.38 + aPhase) * 0.022;
    vec3 ember = vec3(0.22, 0.001, 0.012);
    vec3 hot = vec3(1.0, 0.018, 0.085);
    vec3 amber = vec3(1.0, 0.42, 0.075);
    vec3 starlight = vec3(0.64, 0.79, 1.0);
    vec3 reactorColor = mix(ember, hot, smoothstep(0.34, 0.98, aHeat));
    vec3 transferColor = mix(amber, starlight, smoothstep(0.42, 1.0, uExitProgress));
    vColor = mix(reactorColor, transferColor, smoothstep(0.0, 0.24, uExitProgress));
    vAlpha = (0.54 + 0.46 * sin(uTime * 1.8 + aPhase)) * uReveal * (1.0 - burst * 0.18);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vec4 clipPosition = projectionMatrix * mv;
    gl_Position = clipPosition;
    vScreenUv = clipPosition.xy / clipPosition.w * 0.5 + 0.5;
    gl_PointSize = min(6.0, aSize * (205.0 / max(22.0, -mv.z)));
  }
`;
const SWARM_FRAGMENT_SHADER = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  varying vec2 vScreenUv;
  uniform vec2 uCardCenter;
  uniform vec2 uCardHalfSize;
  uniform float uCardDim;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float glow = 1.0 - smoothstep(0.02, 0.5, d);
    vec2 cardUv = (vScreenUv - uCardCenter) / max(uCardHalfSize, vec2(0.001));
    float cardRadius = length(cardUv);
    float cardMask = 1.0 - smoothstep(0.92, 1.2, cardRadius);
    float contrast = mix(1.0, 0.78, cardMask * uCardDim);
    gl_FragColor = vec4(vColor * (0.75 + glow * 0.8) * contrast, glow * vAlpha * contrast);
  }
`;

function clamp01(value: number) {
  return THREE.MathUtils.clamp(value, 0, 1);
}

function eased(value: number) {
  return THREE.MathUtils.smoothstep(value, 0, 1);
}

function seed(index: number, salt: number) {
  const value = Math.sin((index + salt) * 91.731) * 43758.5453;
  return value - Math.floor(value);
}

const CARD_CONTENT = [
  {
    eyebrow: "01 // FOUNDATION",
    title: "COMPUTER SCIENCE ENGINEERING",
    body: `${JOURNEY_MILESTONES[0].body} Core systems, algorithms, architecture, and disciplined engineering foundations shape the work.`,
    metrics: ["B.E. CSE '26", "CGPA 8.16", "NAVKIS COLLEGE", "CORE SYSTEMS"],
    telemetry: "VERIFIED // CORE ARCHITECTURE",
  },
  {
    eyebrow: "02 // ARCHITECTURE",
    title: "REAL-TIME FULL-STACK SYSTEMS",
    body: "Real-time full-stack systems built with React, Flask, PostgreSQL, Redis, Socket.io, and JWT, alongside this portfolio's 3D experience in Three.js.",
    metrics: ["PYTHON & FLASK", "REACT & THREE.JS", "POSTGRESQL + REDIS", "JWT + SOCKET.IO"],
    telemetry: "FULL-STACK BUILD // REAL-TIME SERVICES",
  },
  {
    eyebrow: "03 // INTELLIGENCE",
    title: "AGENTIC AI & MACHINE LEARNING",
    body: "Multi-agent MCP architecture like ZaminSaathi, alongside Flask-based ML integration for HealthGPT using Scikit-learn models and evaluation.",
    metrics: ["ZAMINSAATHI MCP", "HEALTHGPT ML", "SCIKIT-LEARN", "MODEL EVALUATION"],
    telemetry: "NEURAL ENGINE: ACTIVE // MULTI-AGENT MCP",
  },
  {
    eyebrow: "04 // EXECUTION",
    title: "SECURITY, HARDWARE & PRACTICE",
    body: "Cyber security, ethical hacking, ESP8266 automated hardware systems, rapid hackathon execution, and 110+ DSA problems. Build and delivery practice includes Docker, GitHub, Vercel, Railway, Render, and Cloudinary.",
    metrics: ["110+ DSA SOLVED", "35+ TRYHACKME", "ESP8266 HARDWARE", "DOCKER & CI/CD"],
    telemetry: "SEC.PROTOCOL: HARDENED // FIELD TESTED",
  },
] as const;

function makeAccretionDisc(count: number) {
  const positions = new Float32Array(count * 3);
  const phase = new Float32Array(count);
  const speed = new Float32Array(count);
  const size = new Float32Array(count);
  const heat = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    const i3 = i * 3;
    const arm = i % 4;
    const isArmParticle = arm !== 3;
    const radius = isArmParticle
      ? 0.62 + Math.pow(seed(i, 5), 0.78) * 6.05
      : 0.9 + Math.sqrt(seed(i, 7)) * 5.72;
    const spiral = seed(i, 11) * Math.PI * 2 + radius * 1.13 + (arm % 3) * (Math.PI * 2 / 3);
    const scatter = (seed(i, 17) - 0.5) * (isArmParticle ? 0.22 + radius * 0.045 : 1.25);
    const theta = spiral + scatter;
    positions[i3] = Math.cos(theta) * radius;
    // Keep the spiral readable while giving the same particle budget enough
    // vertical volume to read as a cloud instead of an edge-on stripe.
    positions[i3 + 1] = (seed(i, 23) - 0.5) * (1.0 + radius * (isArmParticle ? 0.48 : 0.76));
    positions[i3 + 2] = Math.sin(theta) * radius;
    phase[i] = seed(i, 29) * Math.PI * 2;
    speed[i] = 0.22 + seed(i, 31) * 0.22;
    size[i] = 1.25 + seed(i, 37) * 2.7;
    heat[i] = 1 - Math.min(1, radius / 7.0) * 0.68 + seed(i, 41) * 0.2;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
  geometry.setAttribute("aSpeed", new THREE.BufferAttribute(speed, 1));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  geometry.setAttribute("aHeat", new THREE.BufferAttribute(heat, 1));
  return geometry;
}

function makeActFiveStars() {
  const positions = new Float32Array(ACT_FIVE_STAR_COUNT * 3);
  const sizes = new Float32Array(ACT_FIVE_STAR_COUNT);
  const phases = new Float32Array(ACT_FIVE_STAR_COUNT);
  for (let i = 0; i < ACT_FIVE_STAR_COUNT; i += 1) {
    const i3 = i * 3;
    const depth = seed(i, 203);
    positions[i3] = (seed(i, 211) - 0.5) * 54;
    positions[i3 + 1] = (seed(i, 223) - 0.5) * 30;
    positions[i3 + 2] = -14 - depth * 36;
    sizes[i] = 0.65 + Math.pow(seed(i, 227), 3) * 2.2;
    phases[i] = seed(i, 229) * Math.PI * 2;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
  return geometry;
}

const ACT_FIVE_STARS_VERTEX = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  uniform float uTime;
  uniform float uStrength;
  uniform vec2 uCardCenter;
  uniform vec2 uCardHalfSize;
  uniform float uCardDim;
  varying float vAlpha;
  varying vec2 vScreenUv;
  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vec4 clipPosition = projectionMatrix * viewPosition;
    gl_Position = clipPosition;
    vScreenUv = clipPosition.xy / clipPosition.w * 0.5 + 0.5;
    gl_PointSize = min(4.0, aSize * (150.0 / max(18.0, -viewPosition.z)));
    vAlpha = (0.36 + 0.42 * (0.5 + 0.5 * sin(uTime * 0.55 + aPhase))) * uStrength;
  }
`;
const ACT_FIVE_STARS_FRAGMENT = /* glsl */ `
  varying float vAlpha;
  varying vec2 vScreenUv;
  uniform vec2 uCardCenter;
  uniform vec2 uCardHalfSize;
  uniform float uCardDim;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float core = 1.0 - smoothstep(0.0, 0.34, d);
    float halo = 1.0 - smoothstep(0.12, 0.5, d);
    vec2 cardUv = (vScreenUv - uCardCenter) / max(uCardHalfSize, vec2(0.001));
    float cardRadius = length(cardUv);
    float cardMask = 1.0 - smoothstep(0.92, 1.2, cardRadius);
    float contrast = mix(1.0, 0.78, cardMask * uCardDim);
    gl_FragColor = vec4(vec3(0.86, 0.79, 0.78) * (0.8 + core * 0.5) * contrast, (core * 0.72 + halo * 0.2) * vAlpha * contrast);
  }
`;

function ActFiveStarfield({ strength, cardContrast }: { strength: number; cardContrast: CardContrastUniforms }) {
  const points = useRef<THREE.Points>(null);
  const geometry = useMemo(() => makeActFiveStars(), []);
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uStrength: { value: 0 }, ...cardContrast },
    vertexShader: ACT_FIVE_STARS_VERTEX,
    fragmentShader: ACT_FIVE_STARS_FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  }), [cardContrast]);
  useFrame(({ clock, camera }, delta) => {
    material.uniforms.uTime.value = clock.getElapsedTime();
    material.uniforms.uStrength.value = THREE.MathUtils.damp(material.uniforms.uStrength.value, strength, 5, delta);
    // Reuse the existing stars as a camera-facing deep-space backdrop. This
    // keeps the same GPU/CPU particle cost while covering the full checkpoint frame.
    if (points.current) {
      points.current.position.copy(camera.position);
      points.current.quaternion.copy(camera.quaternion);
    }
  });
  return <points ref={points} geometry={geometry} frustumCulled={false} renderOrder={-2}><primitive object={material} attach="material" /></points>;
}

function ReactorRing({ radius, index, strength }: { radius: number; index: number; strength: number }) {
  const ringRef = useRef<THREE.Group>(null);
  const tickRef = useRef<THREE.InstancedMesh>(null);
  const ringMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const tickGeometry = useMemo(() => new THREE.BoxGeometry(0.022, 0.13, 0.028), []);
  const tickMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ff6b7a", transparent: true, opacity: 0, toneMapped: false }), []);
  useLayoutEffect(() => {
    if (!tickRef.current) return undefined;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 120; i += 1) {
      const angle = (i / 120) * Math.PI * 2;
      dummy.position.set(Math.cos(angle) * (radius + 0.11), Math.sin(angle) * (radius + 0.11), 0);
      dummy.rotation.set(0, 0, angle);
      dummy.scale.set(1, i % 10 === 0 ? 1.9 : 0.62, 1);
      dummy.updateMatrix();
      tickRef.current?.setMatrixAt(i, dummy.matrix);
    }
    if (tickRef.current) tickRef.current.instanceMatrix.needsUpdate = true;
    return undefined;
  }, [radius]);
  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime();
    const energyPulse = 0.9 + Math.sin(time * 1.7 + index * 1.9) * 0.1;
    if (ringRef.current) ringRef.current.rotation.z += (index % 2 === 0 ? 1 : -1) * (0.16 + index * 0.055) * delta;
    tickMaterial.opacity = 0.88 * strength * energyPulse;
    if (ringMaterial.current) ringMaterial.current.opacity = 0.96 * strength * energyPulse;
  });
  return (
    <group ref={ringRef} rotation={[[0.52, 0.08, 0.22], [-0.48, 0.24, -0.32], [0.88, -0.15, 0.12]][index] as [number, number, number]}>
      <mesh>
        <torusGeometry args={[radius, index === 1 ? 0.074 : 0.058, 12, 220]} />
        <meshStandardMaterial color={index === 1 ? "#42121c" : "#291018"} emissive="#5c0014" emissiveIntensity={0.32 + strength * 0.45} metalness={0.9} roughness={0.28} transparent opacity={strength} />
      </mesh>
      <mesh>
        <torusGeometry args={[radius, 0.012, 8, 220]} />
        <meshBasicMaterial ref={ringMaterial} color="#ff1738" transparent opacity={0.96 * strength} toneMapped={false} />
      </mesh>
      <mesh>
        <torusGeometry args={[radius - 0.09, 0.009, 6, 220]} />
        <meshBasicMaterial color="#ff5a68" transparent opacity={0.42 * strength} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <instancedMesh ref={tickRef} args={[tickGeometry, tickMaterial, 120]} />
    </group>
  );
}

function CoreShader({ strength }: { strength: number }) {
  const coreRef = useRef<THREE.Mesh>(null);
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uReveal: { value: 0 } },
    vertexShader: CORE_VERTEX_SHADER,
    fragmentShader: CORE_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: true,
    toneMapped: false,
  }), []);
  useFrame(({ clock }, delta) => {
    material.uniforms.uTime.value = clock.getElapsedTime();
    material.uniforms.uReveal.value = THREE.MathUtils.damp(material.uniforms.uReveal.value, strength, 6, delta);
    if (coreRef.current) coreRef.current.rotation.y = clock.getElapsedTime() * 0.075;
  });
  return (
    <mesh ref={coreRef}>
      <icosahedronGeometry args={[1.62, 5]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

function AccretionSwarm({ geometry, strength, exitProgress, cardContrast }: { geometry: THREE.BufferGeometry; strength: number; exitProgress: number; cardContrast: CardContrastUniforms }) {
  const pointsRef = useRef<THREE.Points>(null);
  const cloudRef = useRef<THREE.Group>(null);
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uReveal: { value: 0 }, uExitProgress: { value: 0 }, ...cardContrast },
    vertexShader: SWARM_VERTEX_SHADER,
    fragmentShader: SWARM_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  }), [cardContrast]);
  useFrame(({ clock }, delta) => {
    material.uniforms.uTime.value = clock.getElapsedTime();
    material.uniforms.uReveal.value = THREE.MathUtils.damp(material.uniforms.uReveal.value, strength, 6, delta);
    material.uniforms.uExitProgress.value = THREE.MathUtils.damp(material.uniforms.uExitProgress.value, exitProgress, 7.5, delta);
    if (pointsRef.current) pointsRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.07) * 0.06;
  });
  return (
    <group ref={cloudRef} rotation={[0.78, 0.04, -0.14]}>
      <points ref={pointsRef} geometry={geometry} frustumCulled={false} renderOrder={3}><primitive object={material} attach="material" /></points>
    </group>
  );
}

function Reactor({ strength, exitProgress, swarmGeometry, cardContrast }: { strength: number; exitProgress: number; swarmGeometry: THREE.BufferGeometry; cardContrast: CardContrastUniforms }) {
  const assembly = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (assembly.current) assembly.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.055) * 0.035;
    if (light.current) light.current.intensity = (2.6 + Math.sin(clock.getElapsedTime() * 1.4) * 0.18) * strength;
  });
  return (
    <group ref={assembly} position={ACT_FIVE_REACTOR_CENTER}>
      <pointLight ref={light} color="#ff1238" intensity={2.6} distance={15} decay={1.8} />
      <pointLight position={[-2.2, 1.4, 2.5]} color="#a8001e" intensity={0.65 * strength} distance={9} decay={2} />
      <CoreShader strength={strength} />
      <AccretionSwarm geometry={swarmGeometry} strength={strength} exitProgress={exitProgress} cardContrast={cardContrast} />
      {[2.35, 3.12, 3.92].map((radius, index) => <ReactorRing key={radius} radius={radius} index={index} strength={strength} />)}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.38, 0.012, 8, 180]} />
        <meshBasicMaterial color="#ff263f" transparent opacity={0.3 * strength} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

function PolarGrid({ strength }: { strength: number }) {
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uStrength: { value: 0 } },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    vertexShader: "varying vec2 vUv; void main(){ vUv=uv*28.0-14.0; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
    fragmentShader: "uniform float uTime; uniform float uStrength; varying vec2 vUv; void main(){ float r=length(vUv); float rings=1.0-smoothstep(0.02,0.08,abs(fract(r*1.35)-0.5)); float a=atan(vUv.y,vUv.x); float spokes=1.0-smoothstep(0.01,0.035,abs(sin(a*36.0))); float pulse=0.88+0.12*sin(uTime*0.5-r*0.35); float edge=1.0-smoothstep(9.0,14.0,r); float alpha=max(rings*0.38,spokes*0.16)*edge*pulse*uStrength*0.26; gl_FragColor=vec4(1.0,0.012,0.08,alpha); }",
  }), []);
  useFrame(({ clock }, delta) => {
    material.uniforms.uTime.value = clock.getElapsedTime();
    material.uniforms.uStrength.value = THREE.MathUtils.damp(material.uniforms.uStrength.value, strength, 6, delta);
  });
  return <mesh position={[ACT_FIVE_REACTOR_CENTER.x, -2.85, ACT_FIVE_REACTOR_CENTER.z]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[28, 28]} /><primitive object={material} attach="material" /></mesh>;
}

function MonolithCard({ index, focus, opacity, progress }: { index: number; focus: number; opacity: number; progress: number }) {
  const card = CARD_CONTENT[index];
  return (
    <Html transform center distanceFactor={3.2} position={[0, 0, 0.18]} zIndexRange={[120, 0]}>
      <article
        className="relative flex h-[344px] w-[min(544px,82vw)] flex-col overflow-hidden rounded-[5px] border px-7 py-5 text-left text-white"
        style={{
          backgroundColor: "rgba(31,25,30,.78)",
          backgroundImage: "linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.028) 1px,transparent 1px),linear-gradient(118deg,rgba(255,255,255,.16) 0%,transparent 34%,rgba(255,255,255,.065) 49%,transparent 66%),linear-gradient(135deg,rgba(255,255,255,.1),rgba(230,238,248,.025) 52%,rgba(255,255,255,.08))",
          backgroundSize: "26px 26px,26px 26px,100% 100%,100% 100%",
          backdropFilter: "blur(14px) saturate(125%)",
          WebkitBackdropFilter: "blur(14px) saturate(125%)",
          opacity,
          borderColor: `rgba(255,255,255,${0.54 + focus * 0.34})`,
          boxShadow: `0 30px 82px rgba(0,0,0,.42),inset 0 0 0 1px rgba(255,255,255,.16),inset 0 1px 0 rgba(255,255,255,.82),inset 0 -1px 0 rgba(255,255,255,.12),0 0 ${14 + focus * 32}px rgba(255,24,56,${0.08 + focus * 0.23})`,
          transition: "opacity 220ms linear,border-color 280ms ease,box-shadow 280ms ease",
        }}
      >
        <div className="act-five-glass-sheen act-five-glass-sheen-active pointer-events-none absolute inset-y-0 left-0" aria-hidden="true" />
        <div className="act-five-holo-scanlines pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="act-five-holo-flicker pointer-events-none absolute inset-0" aria-hidden="true" />
        <header className="relative z-[2] flex items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.22em] text-white [text-shadow:0_1px_8px_rgba(0,0,0,.9)]">
          <span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-[#ff1738] shadow-[0_0_12px_#ff2446]" />{card.eyebrow}</span>
          <span className="shrink-0 text-white/90">ACT V // FIELD NOTES</span>
        </header>
        <h3 className="relative z-[2] mt-5 max-w-[440px] text-[clamp(22px,2vw,28px)] font-black uppercase leading-[1.05] tracking-[-0.025em] text-white [text-shadow:0_2px_10px_rgba(0,0,0,.92),0_0_22px_rgba(0,0,0,.55)]">{card.title}</h3>
        <p className="relative z-[2] mt-4 max-w-[470px] text-[14px] leading-[1.55] text-white [text-shadow:0_1px_8px_rgba(0,0,0,.96)]">{card.body}</p>
        <ul className="relative z-[2] mt-4 grid grid-cols-2 gap-2" aria-label={`${card.eyebrow} milestone metrics`}>
          {card.metrics.map((metric) => <li key={metric} className="w-fit max-w-full rounded-sm border border-white/50 bg-[rgba(255,255,255,.12)] px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-white [text-shadow:0_1px_5px_rgba(0,0,0,.9)] shadow-[inset_0_1px_0_rgba(255,255,255,.48),0_2px_8px_rgba(0,0,0,.12)]">{metric}</li>)}
        </ul>
        <footer className="relative z-[2] mt-auto border-t border-white/40 pt-3 font-mono text-[9px] uppercase tracking-[0.13em] text-white [text-shadow:0_1px_7px_rgba(0,0,0,.95)]">
          <div className="mb-2 flex items-center justify-between gap-4">
            <span className="min-w-0 truncate"><b className="mr-2 text-[#ff536a]">SYS.STATUS</b>{card.telemetry}</span>
            <strong className="shrink-0 rounded-sm border border-white/60 bg-[rgba(255,255,255,.14)] px-2 py-1 text-[12px] tracking-[0.18em] text-white shadow-[0_0_12px_rgba(255,23,56,.2)]">0{index + 1} / 04</strong>
          </div>
          <div className="flex h-[3px] gap-[3px]" aria-hidden="true">{Array.from({ length: 32 }, (_, tick) => <i key={tick} className="flex-1" style={{ background: tick / 32 < progress ? "#ff2446" : "rgba(255,36,70,.18)", boxShadow: tick / 32 < progress && focus > 0.5 ? "0 0 6px rgba(255,36,70,.75)" : "none" }} />)}</div>
        </footer>
      </article>
    </Html>
  );
}

const CARD_RIM_VERTEX = /* glsl */ `
  varying vec3 vNormalView;
  varying vec3 vViewDirection;
  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vNormalView = normalize(normalMatrix * normal);
    vViewDirection = normalize(-viewPosition.xyz);
    gl_Position = projectionMatrix * viewPosition;
  }
`;
const CARD_RIM_FRAGMENT = /* glsl */ `
  uniform float uFocus;
  uniform float uOpacity;
  varying vec3 vNormalView;
  varying vec3 vViewDirection;
  void main() {
    float fresnel = pow(1.0 - abs(dot(normalize(vNormalView), normalize(vViewDirection))), 3.2);
    float rim = smoothstep(0.16, 0.94, fresnel);
    gl_FragColor = vec4(1.0, 0.008, 0.035, rim * uOpacity * (0.08 + uFocus * 0.52));
  }
`;

function MonolithRim({ focus, opacity }: { focus: number; opacity: number }) {
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uFocus: { value: 0 }, uOpacity: { value: 0 } },
    vertexShader: CARD_RIM_VERTEX,
    fragmentShader: CARD_RIM_FRAGMENT,
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  }), []);
  useFrame((_, delta) => {
    material.uniforms.uFocus.value = THREE.MathUtils.damp(material.uniforms.uFocus.value, focus, 6, delta);
    material.uniforms.uOpacity.value = THREE.MathUtils.damp(material.uniforms.uOpacity.value, opacity, 6, delta);
  });
  return (
    <RoundedBox args={[3.43, 2.18, 0.34]} radius={0.09} smoothness={8} scale={1.006} renderOrder={2}>
      <primitive object={material} attach="material" />
    </RoundedBox>
  );
}

function Monolith({
  index,
  focus,
  opacity,
  progress,
  scrollProgress,
  groupRef,
}: {
  index: number;
  focus: number;
  opacity: number;
  progress: number;
  scrollProgress: number;
  groupRef: (node: THREE.Group | null) => void;
}) {
  const position = ACT_FIVE_CARD_POSITIONS[index];
  const group = useRef<THREE.Group>(null);
  const quaternion = useRef(new THREE.Quaternion());
  const targetQuaternion = useRef(new THREE.Quaternion());
  const offsetQuaternion = useRef(new THREE.Quaternion());
  const radial = useMemo(() => new THREE.Vector3(position.x, 0, position.z).normalize(), [position]);
  const targetPosition = useMemo(() => new THREE.Vector3(), []);
  const exitSlide = index === 3
    ? THREE.MathUtils.smoothstep(scrollProgress, ACT_FIVE_TIMING.cameraExitStart, ACT_FIVE_TIMING.sceneExit)
    : 0;
  const bracketGeometry = useMemo(() => {
    const pts = [
      [-1.68,1.02,-1.46,1.02],[-1.68,1.02,-1.68,.8],[1.68,1.02,1.46,1.02],[1.68,1.02,1.68,.8],
      [-1.68,-1.02,-1.46,-1.02],[-1.68,-1.02,-1.68,-.8],[1.68,-1.02,1.46,-1.02],[1.68,-1.02,1.68,-.8],
    ];
    const values: number[] = [];
    pts.forEach(([x1,y1,x2,y2]) => values.push(x1,y1,.17,x2,y2,.17));
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(values, 3));
    return geometry;
  }, []);

  useFrame(({ camera, pointer }, delta) => {
    if (!group.current) return;
    group.current.up.set(0, 1, 0);
    quaternion.current.copy(group.current.quaternion);
    group.current.lookAt(camera.position);
    targetQuaternion.current.copy(group.current.quaternion);
    // The +0.18-radian cockpit wrap keeps the right edge presented toward camera.
    offsetQuaternion.current.setFromAxisAngle(WORLD_UP, 0.18 + pointer.x * 0.025);
    targetQuaternion.current.multiply(offsetQuaternion.current);
    group.current.quaternion.copy(quaternion.current).slerp(targetQuaternion.current, 1 - Math.exp(-8.5 * delta));
    targetPosition.copy(position).addScaledVector(radial, (1 - focus) * 2.2);
    // Retract the final card inward as the camera leaves, keeping its glass
    // edge safely on-screen until the card fades completely into the handoff.
    targetPosition.x -= exitSlide * 1.65;
    group.current.position.lerp(targetPosition, 1 - Math.exp(-7 * delta));
    // Keep the HTML glass panel inside the frame while the camera sweeps close
    // to it during orbital transfers; at each checkpoint stop it returns to
    // its authored scale and reading distance.
    const cameraDistance = camera.position.distanceTo(group.current.getWorldPosition(targetPosition));
    const distanceScale = THREE.MathUtils.clamp(cameraDistance / 5.2, 0.72, 1);
    const targetScale = THREE.MathUtils.lerp(0.86, 1, focus) * distanceScale;
    const scale = THREE.MathUtils.damp(group.current.scale.x, targetScale, 8, delta);
    group.current.scale.setScalar(scale);
  });

  return (
    <group ref={(node) => { group.current = node; groupRef(node); }} position={position}>
      <MonolithRim focus={focus} opacity={opacity} />
      <RoundedBox args={[3.4, 2.15, 0.32]} radius={0.09} smoothness={8}>
        <meshPhysicalMaterial color="#f0f4f8" transmission={0.94} roughness={0.12} ior={1.5} thickness={1.5} attenuationColor="#f1dce1" attenuationDistance={3.2} metalness={0.015} clearcoat={1} clearcoatRoughness={0.08} transparent opacity={opacity} depthWrite={focus > 0.2} />
      </RoundedBox>
      <lineSegments geometry={bracketGeometry}><lineBasicMaterial color="#ff2446" transparent opacity={opacity} toneMapped={false} /></lineSegments>
      {[
        [-1.58,1.02,.22,.04],[-1.68,.92,.04,.2],[1.58,1.02,.22,.04],[1.68,.92,.04,.2],
        [-1.58,-1.02,.22,.04],[-1.68,-.92,.04,.2],[1.58,-1.02,.22,.04],[1.68,-.92,.04,.2],
      ].map(([x,y,w,h], corner) => <mesh key={corner} position={[x,y,.17]}><boxGeometry args={[w,h,.035]} /><meshBasicMaterial color="#ff2446" transparent opacity={opacity} toneMapped={false} /></mesh>)}
      <MonolithCard index={index} focus={focus} opacity={opacity} progress={progress} />
    </group>
  );
}

function EnergyTether({ cardRef, strength }: { cardRef: React.RefObject<THREE.Group | null>; strength: number }) {
  const geometry = useMemo(() => {
    const value = new THREE.BufferGeometry();
    const positions = new Float32Array((TETHER_SEGMENTS + 1) * 3);
    const progress = new Float32Array(TETHER_SEGMENTS + 1);
    for (let i = 0; i <= TETHER_SEGMENTS; i += 1) progress[i] = i / TETHER_SEGMENTS;
    value.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    value.setAttribute("aProgress", new THREE.BufferAttribute(progress, 1));
    return value;
  }, []);
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uStrength: { value: 0 } },
    vertexShader: TETHER_VERTEX_SHADER,
    fragmentShader: TETHER_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  }), []);
  const beam = useMemo(() => new THREE.Line(geometry, material), [geometry, material]);
  const curve = useMemo(() => new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]), []);
  useFrame(({ clock }, delta) => {
    const card = cardRef.current;
    if (!card) return;
    const end = new THREE.Vector3(-1.74, 0, 0).applyQuaternion(card.quaternion).add(card.position);
    const start = ACT_FIVE_REACTOR_CENTER.clone();
    const middle = start.clone().lerp(end, 0.58).add(new THREE.Vector3(0, 0.55, 0));
    curve.points[0].copy(start);
    curve.points[1].copy(middle);
    curve.points[2].copy(end);
    const position = geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i <= TETHER_SEGMENTS; i += 1) {
      const point = curve.getPoint(i / TETHER_SEGMENTS);
      position.setXYZ(i, point.x, point.y, point.z);
    }
    position.needsUpdate = true;
    geometry.computeBoundingSphere();
    material.uniforms.uTime.value = clock.getElapsedTime();
    material.uniforms.uStrength.value = THREE.MathUtils.damp(material.uniforms.uStrength.value, strength, 6, delta);
  });
  return <primitive object={beam} renderOrder={4} />;
}

export default function ActFiveWorld({ scrollProgress, actFourPhase, cardContrast, particleCount = PARTICLE_COUNT }: { scrollProgress: number; actFourPhase: ActFourPhase; cardContrast: CardContrastUniforms; particleCount?: number }) {
  const { camera } = useThree();
  const cards = useRef<(THREE.Group | null)[]>([null, null, null, null]);
  const swarmGeometry = useMemo(() => makeAccretionDisc(particleCount), [particleCount]);
  const projectedCenter = useMemo(() => new THREE.Vector3(), []);
  const projectedEdge = useMemo(() => new THREE.Vector3(), []);
  const cardWorld = useMemo(() => new THREE.Vector3(), []);
  const cardRight = useMemo(() => new THREE.Vector3(), []);
  const cardUp = useMemo(() => new THREE.Vector3(), []);
  const cardWorldQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const active = actFourPhase === "act5";
  const reveal = THREE.MathUtils.smoothstep(scrollProgress, ACT_FIVE_TIMING.revealInStart, ACT_FIVE_TIMING.revealInEnd)
    * (1 - THREE.MathUtils.smoothstep(scrollProgress, ACT_FIVE_TIMING.cameraExitStart, ACT_FIVE_TIMING.sceneExit));
  const local = clamp01((scrollProgress - ACT_FIVE_TIMING.cameraStart) / (ACT_FIVE_TIMING.sceneExit - ACT_FIVE_TIMING.cameraStart));
  const exitProgress = THREE.MathUtils.smoothstep(local, 0.68, 1.0);
  const transferStarts = [0.12, 0.29, 0.46];
  const checkpointEnds = [0.17, 0.34, 0.51];
  const weights: number[] = [0, 0, 0, 0];
  let activeIndex = 0;
  if (local >= 0.68) {
    activeIndex = 3;
    weights[3] = 1;
  } else {
    for (let index = 0; index < 3; index += 1) {
      const start = transferStarts[index];
      const end = checkpointEnds[index];
      if (local < start) {
        weights[index] = 1;
        activeIndex = index;
        break;
      }
      if (local >= start && local < end) {
        const blend = eased(clamp01((local - start) / (end - start)));
        weights[index] = 1 - blend;
        weights[index + 1] = blend;
        activeIndex = blend < 0.5 ? index : index + 1;
        break;
      }
    }
    if (local >= checkpointEnds[2]) {
      weights[3] = 1;
      activeIndex = 3;
    }
  }
  if (!active) {
    for (let index = 0; index < 4; index += 1) weights[index] = 0;
  }
  const focusStrength = weights[activeIndex] * reveal * (active ? 1 : 0);

  useFrame((_, delta) => {
    const card = cards.current[activeIndex];
    if (card && active && reveal > 0.08) {
      card.getWorldPosition(cardWorld);
      card.getWorldQuaternion(cardWorldQuaternion);
      projectedCenter.copy(cardWorld).project(camera);
      cardRight.set(1, 0, 0).applyQuaternion(cardWorldQuaternion).multiplyScalar(2.02 * card.scale.x);
      cardUp.set(0, 1, 0).applyQuaternion(cardWorldQuaternion).multiplyScalar(1.28 * card.scale.y);
      projectedEdge.copy(cardWorld).add(cardRight).project(camera);
      const halfWidth = Math.abs(projectedEdge.x - projectedCenter.x) + 0.012;
      projectedEdge.copy(cardWorld).add(cardUp).project(camera);
      const halfHeight = Math.abs(projectedEdge.y - projectedCenter.y) + 0.018;
      cardContrast.uCardCenter.value.set(projectedCenter.x * 0.5 + 0.5, projectedCenter.y * 0.5 + 0.5);
      cardContrast.uCardHalfSize.value.set(halfWidth, halfHeight);
    }
    cardContrast.uCardDim.value = THREE.MathUtils.damp(cardContrast.uCardDim.value, active && reveal > 0.08 ? focusStrength : 0, 5.5, delta);
  });

  return (
    <>
      <ActFiveStarfield strength={reveal * (active ? 1 : 0)} cardContrast={cardContrast} />
      <group position={ACT_FIVE_ORIGIN} visible={active && reveal > 0.001}>
      <PolarGrid strength={reveal * (active ? 1 : 0)} />
      <Reactor strength={reveal * (active ? 1 : 0)} exitProgress={exitProgress} swarmGeometry={swarmGeometry} cardContrast={cardContrast} />
      {CARD_CONTENT.map((_, index) => {
        const focus = weights[index] * (active ? 1 : 0);
        const opacity = reveal * (active ? 0.012 + focus * 0.988 : 0);
        return (
          <Monolith
            key={index}
            index={index}
            focus={focus}
            opacity={opacity}
            progress={activeIndex === index ? clamp01((local - (index * 0.17)) / 0.12) : 0}
            scrollProgress={scrollProgress}
            groupRef={(node) => { cards.current[index] = node; }}
          />
        );
      })}
      <EnergyTether cardRef={{ current: cards.current[activeIndex] }} strength={focusStrength} />
      </group>
    </>
  );
}
