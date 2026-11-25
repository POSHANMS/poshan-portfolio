"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { RoundedBox } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ACT_FOUR_STAGE_BASIS } from "@/animations/scrollCamera";

const TAU = Math.PI * 2;
const STATION_COUNT = 5;
const MORPH_SECONDS = 0.9;
const OBSIDIAN = "#0D0C12";
const GOLD = "#FFBE45";
const CHAMPAGNE = "#FFF2C8";
const CRIMSON = "#D9081E";
const AMBER = "#E0861A";
const STAGE_ANCHOR = ACT_FOUR_STAGE_BASIS.origin.clone()
  .addScaledVector(ACT_FOUR_STAGE_BASIS.right, 5.4)
  .addScaledVector(ACT_FOUR_STAGE_BASIS.up, 0.55)
  .addScaledVector(ACT_FOUR_STAGE_BASIS.forward, 14.5);
const KEY_LIGHT_INTENSITIES = [18, 5.5, 6.5] as const;

type OpacityRef = React.RefObject<number>;
type ParticleResources = { geometry: THREE.BufferGeometry; material: THREE.ShaderMaterial };
type MaterialSnapshot = {
  station: number;
  material: THREE.Material;
  opacity: number;
  transparent: boolean;
  depthWrite: boolean;
  emissiveIntensity: number | null;
  shaderOpacity: { value: number } | null;
};
type LightSnapshot = { station: number; light: THREE.PointLight; intensity: number };

function seeded(index: number, salt: number) {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453123;
  return value - Math.floor(value);
}

function smooth01(value: number) {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function pointOnShape(shape: number, index: number, count: number, target: THREE.Vector3) {
  const a = seeded(index, 11) * TAU;
  const b = seeded(index, 17);
  const c = seeded(index, 23);
  const t = index / Math.max(1, count - 1);

  if (shape === 0) {
    const lane = index % 10;
    const radius = lane < 4 ? 1.72 + b * 0.42 : lane < 8 ? 2.22 + b * 0.34 : 1.55 + b * 0.78;
    const angle = lane >= 8 ? -1.35 + b * 2.7 : a;
    const tilt = lane < 4 ? 0.28 : lane < 8 ? -0.42 : 0.68;
    target.set(Math.cos(angle) * radius, Math.sin(angle) * radius * Math.cos(tilt), Math.sin(angle) * radius * Math.sin(tilt));
    return;
  }

  if (shape === 1) {
    const contour = 0.82 + Math.floor(b * 7) * 0.23;
    const ripple = Math.sin(a * 3 + contour * 1.8) * 0.15 + Math.cos(a * 5 - contour) * 0.08;
    const radius = contour + ripple;
    target.set(Math.cos(a) * radius, 0.34 * Math.sin(a * 2.2) + 0.18 * Math.sin(contour * 3) + (c - 0.5) * 0.12, Math.sin(a) * radius);
    return;
  }

  if (shape === 2) {
    if (b < 0.78) {
      const axis = Math.floor(seeded(index, 29) * 3);
      const sideA = seeded(index, 31) < 0.5 ? -1.9 : 1.9;
      const sideB = seeded(index, 37) < 0.5 ? -1.9 : 1.9;
      const along = (c * 2 - 1) * 1.9;
      if (axis === 0) target.set(along, sideA, sideB);
      else if (axis === 1) target.set(sideA, along, sideB);
      else target.set(sideA, sideB, along);
    } else {
      const radius = 0.45 + c * 1.35;
      target.set(Math.cos(a) * radius, -1.8 + seeded(index, 41) * 3.8, Math.sin(a) * radius);
    }
    return;
  }

  if (shape === 3) {
    const strand = index % 2 === 0 ? 0 : Math.PI;
    const angle = t * TAU * 3.2 + strand;
    const y = (b * 2 - 1) * 2.16;
    const radius = Math.sqrt(Math.max(0.05, 2.3 * 2.3 - y * y));
    target.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    return;
  }

  const angle = t * TAU * 3.15 + (b - 0.5) * 0.5;
  const radius = 0.48 + t * 1.62 + (c - 0.5) * 0.18;
  target.set(Math.cos(angle) * radius, (t - 0.5) * 4.35, Math.sin(angle) * radius);
}

function chooseParticleCount(width: number, cores: number) {
  if (width < 768) return 4500;
  if (width >= 1280 && cores >= 6) return 12000;
  return 8000;
}

const AURA_VERTEX_SHADER = `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uMorphProgress;
  uniform float uCursorStrength;
  uniform float uVaultOpacity;
  uniform int uFromIndex;
  uniform int uToIndex;
  uniform vec3 uCursorLocal;
  attribute vec3 aPos0;
  attribute vec3 aPos1;
  attribute vec3 aPos2;
  attribute vec3 aPos3;
  attribute vec3 aPos4;
  attribute float aSeed;
  attribute float aSize;
  attribute vec3 aColorMix;
  varying vec3 vParticleColor;
  varying float vParticleAlpha;
  varying float vParticleSeed;

  vec3 readTarget(int index) {
    if (index == 0) return aPos0;
    if (index == 1) return aPos1;
    if (index == 2) return aPos2;
    if (index == 3) return aPos3;
    return aPos4;
  }

  void main() {
    float progress = clamp(uMorphProgress, 0.0, 1.0);
    vec3 p = mix(readTarget(uFromIndex), readTarget(uToIndex), progress * progress * (3.0 - 2.0 * progress));
    float burst = sin(progress * 3.14159265);
    float orbitY = burst * (2.6 + aSeed * 2.2);
    float cy = cos(orbitY);
    float sy = sin(orbitY);
    p.xz = mat2(cy, -sy, sy, cy) * p.xz;
    float orbitZ = burst * (0.55 + aSeed * 0.9);
    float cz = cos(orbitZ);
    float sz = sin(orbitZ);
    p.xy = mat2(cz, -sz, sz, cz) * p.xy;
    float radialLength = max(length(p), 0.001);
    p += p / radialLength * burst * (1.4 + aSeed * 1.8);

    vec2 cursorDelta = p.xy - uCursorLocal.xy;
    float cursorDistance = length(cursorDelta);
    float cursorInfluence = (1.0 - smoothstep(0.0, 2.6, cursorDistance)) * uCursorStrength;
    vec2 cursorRadial = cursorDelta / max(cursorDistance, 0.001);
    vec2 cursorTangent = vec2(-cursorRadial.y, cursorRadial.x);
    p.xy += cursorRadial * cursorInfluence * 0.22 + cursorTangent * cursorInfluence * (0.32 + aSeed * 0.18);
    p += vec3(0.0, sin(uTime * 0.8 + aSeed * 18.0) * 0.025, 0.0);

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    float sizeCap = aSeed > 0.98 ? 4.4 : 3.6;
    gl_PointSize = clamp(aSize * uPixelRatio * (38.0 / max(3.0, -mvPosition.z)), 1.15 * uPixelRatio, sizeCap * uPixelRatio);
    vParticleColor = aColorMix;
    vParticleAlpha = (0.48 + 0.42 * aSeed) * uVaultOpacity;
    vParticleSeed = aSeed;
  }
`;

const AURA_FRAGMENT_SHADER = `
  uniform float uTime;
  varying vec3 vParticleColor;
  varying float vParticleAlpha;
  varying float vParticleSeed;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float core = exp(-d * d * 7.0);
    float twinkle = 0.84 + 0.16 * sin(uTime * (1.1 + vParticleSeed * 2.2) + vParticleSeed * 64.0);
    float alpha = clamp(core * twinkle * vParticleAlpha, 0.0, 1.0);
    gl_FragColor = vec4(vParticleColor, alpha);
  }
`;

const RADAR_SWEEP_VERTEX_SHADER = `
  varying vec2 vSweepUv;
  void main() {
    vSweepUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const RADAR_SWEEP_FRAGMENT_SHADER = `
  uniform float uOpacity;
  uniform float uVaultOpacity;
  varying vec2 vSweepUv;
  void main() {
    vec2 centered = (vSweepUv - 0.5) * 2.0;
    float radius = length(centered);
    float angle = atan(centered.y, centered.x);
    float angularFeather = smoothstep(0.02, 0.22, angle)
      * (1.0 - smoothstep(0.72, 0.98, angle));
    float radialFeather = smoothstep(0.04, 0.20, radius)
      * (1.0 - smoothstep(0.88, 1.0, radius));
    float alpha = angularFeather * radialFeather * 0.34 * uOpacity * uVaultOpacity;
    gl_FragColor = vec4(0.85, 0.025, 0.055, alpha);
  }
`;

function makeParticleResources(count: number, pixelRatio: number): ParticleResources {
  const targets = [0, 1, 2, 3, 4].map(() => new Float32Array(count * 3));
  const seeds = new Float32Array(count);
  const sizes = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  const palette = [new THREE.Color(GOLD), new THREE.Color(AMBER), new THREE.Color(CHAMPAGNE), new THREE.Color(CRIMSON)];
  const target = new THREE.Vector3();

  for (let index = 0; index < count; index += 1) {
    const seed = seeded(index, 53);
    seeds[index] = seed;
    sizes[index] = seed > 0.98 ? 1.85 + seeded(index, 59) * 0.55 : 0.45 + seeded(index, 61);
    let colorIndex = 0;
    if (seed >= 0.55 && seed < 0.77) colorIndex = 1;
    else if (seed >= 0.77 && seed < 0.92) colorIndex = 2;
    else if (seed >= 0.92) colorIndex = 3;
    const color = palette[colorIndex];
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
    for (let shape = 0; shape < STATION_COUNT; shape += 1) {
      pointOnShape(shape, index, count, target);
      const offset = index * 3;
      targets[shape][offset] = target.x;
      targets[shape][offset + 1] = target.y;
      targets[shape][offset + 2] = target.z;
    }
  }

  const geometry = new THREE.BufferGeometry();
  for (let shape = 0; shape < STATION_COUNT; shape += 1) {
    geometry.setAttribute(`aPos${shape}`, new THREE.BufferAttribute(targets[shape], 3));
  }
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aColorMix", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: pixelRatio },
      uMorphProgress: { value: 1 },
      uCursorStrength: { value: 0 },
      uVaultOpacity: { value: 1 },
      uFromIndex: { value: 0 },
      uToIndex: { value: 0 },
      uCursorLocal: { value: new THREE.Vector3() },
    },
    vertexShader: AURA_VERTEX_SHADER,
    fragmentShader: AURA_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  return { geometry, material };
}

function ObsidianShellMaterial({ emissive = "#1B1007", intensity = 0.08 }: { emissive?: string; intensity?: number }) {
  return <meshStandardMaterial color={OBSIDIAN} roughness={0.34} metalness={0.78} envMapIntensity={0.8} emissive={emissive} emissiveIntensity={intensity} transparent depthWrite />;
}

function GoldLineMaterial({ color = GOLD, opacity = 0.85 }: { color?: string; opacity?: number }) {
  return <meshBasicMaterial color={color} transparent opacity={opacity} toneMapped={false} depthWrite={false} />;
}

function FindItArtifact() {
  const root = useRef<THREE.Group>(null);
  const ringRefs = useRef<(THREE.Mesh | null)[]>([]);
  const sweep = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    if (root.current) root.current.rotation.y = time * 0.08;
    for (let index = 0; index < ringRefs.current.length; index += 1) {
      const ring = ringRefs.current[index];
      if (ring) ring.rotation.z += (index === 1 ? -1 : 1) * 0.0022;
    }
    if (sweep.current) sweep.current.rotation.z = time * 0.42;
  });
  return (
    <group ref={root} frustumCulled={false}>
      <mesh rotation={[Math.PI / 2, 0, 0]} frustumCulled={false}>
        <sphereGeometry args={[2.05, 28, 18, 0, TAU, 0, Math.PI * 0.62]} />
        <ObsidianShellMaterial intensity={0.12} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={0.92} frustumCulled={false}>
        <torusGeometry args={[2.02, 0.085, 8, 64, Math.PI * 1.42]} />
        <ObsidianShellMaterial intensity={0.16} />
      </mesh>
      <mesh position={[0, 0, 0.16]} frustumCulled={false}>
        <sphereGeometry args={[0.58, 20, 16]} />
        <ObsidianShellMaterial emissive="#1A080C" intensity={0.12} />
      </mesh>
      <mesh position={[0, 0, 0.16]} frustumCulled={false}>
        <torusGeometry args={[0.585, 0.014, 5, 80]} />
        <GoldLineMaterial color={CRIMSON} opacity={0.96} />
      </mesh>
      <mesh ref={(node) => { ringRefs.current[0] = node; }} rotation={[0.28, 0.4, 0.16]} frustumCulled={false}>
        <torusGeometry args={[1.15, 0.022, 5, 96]} />
        <GoldLineMaterial color={CHAMPAGNE} />
      </mesh>
      <mesh ref={(node) => { ringRefs.current[1] = node; }} rotation={[0.9, 0.2, -0.55]} frustumCulled={false}>
        <torusGeometry args={[1.55, 0.02, 5, 112]} />
        <GoldLineMaterial />
      </mesh>
      <mesh ref={(node) => { ringRefs.current[2] = node; }} rotation={[1.15, -0.48, 0.32]} frustumCulled={false}>
        <torusGeometry args={[2.28, 0.018, 5, 128]} />
        <GoldLineMaterial color={CHAMPAGNE} opacity={0.72} />
      </mesh>
      <group ref={sweep} position={[0, 0, 0.22]} frustumCulled={false}>
        <mesh rotation={[0, 0, -0.03]} frustumCulled={false}>
          <circleGeometry args={[0.98, 36, 0, Math.PI * 0.31]} />
          <shaderMaterial
            uniforms={{ uOpacity: { value: 1 }, uVaultOpacity: { value: 1 } }}
            vertexShader={RADAR_SWEEP_VERTEX_SHADER}
            fragmentShader={RADAR_SWEEP_FRAGMENT_SHADER}
            transparent
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh rotation={[0, 0, 0]} frustumCulled={false}>
          <torusGeometry args={[0.96, 0.009, 4, 72, Math.PI * 0.31]} />
          <GoldLineMaterial color={CRIMSON} opacity={0.58} />
        </mesh>
      </group>
    </group>
  );
}

function ZaminSaathiArtifact() {
  const root = useRef<THREE.Group>(null);
  const orbitNodes = useRef<(THREE.Group | null)[]>([]);
  const terrainRadii = [1.62, 1.4, 1.18, 0.96, 0.72];
  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime();
    if (root.current) {
      root.current.rotation.y = Math.sin(time * 0.22) * 0.08;
      root.current.rotation.x = Math.sin(time * 0.16) * 0.035;
    }
    for (let index = 0; index < orbitNodes.current.length; index += 1) {
      const node = orbitNodes.current[index];
      if (!node) continue;
      const angle = time * (0.28 + index * 0.035) + index * TAU / 3;
      node.position.set(Math.cos(angle) * 2.05, 0.2 + Math.sin(angle * 1.7) * 0.35, Math.sin(angle) * 2.05);
      node.rotation.y += delta * 0.7;
    }
  });
  return (
    <group ref={root} frustumCulled={false}>
      {terrainRadii.map((radius, index) => (
        <group key={index} position={[0, -0.72 + index * 0.34, 0]} rotation={[0, index * 0.16, 0]} frustumCulled={false}>
          <mesh frustumCulled={false}>
            <cylinderGeometry args={[radius - 0.12, radius, 0.24, 28]} />
            <ObsidianShellMaterial intensity={0.06} />
          </mesh>
          <mesh position={[0, 0.125, 0]} rotation={[Math.PI / 2, 0, 0]} frustumCulled={false}>
            <torusGeometry args={[radius - 0.04, 0.014, 4, 88]} />
            <GoldLineMaterial opacity={0.82 - index * 0.07} />
          </mesh>
        </group>
      ))}
      {[0, 1, 2].map((index) => (
        <mesh key={index} position={[0, -0.9 + index * 0.74, 0]} rotation={[Math.PI / 2, 0, index * 0.55]} frustumCulled={false}>
          <torusGeometry args={[1.92 + index * 0.11, 0.006, 4, 104]} />
          <GoldLineMaterial opacity={0.38} />
        </mesh>
      ))}
      {[0, 1, 2].map((index) => (
        <group key={`node-${index}`} ref={(node) => { orbitNodes.current[index] = node; }} frustumCulled={false}>
          <mesh frustumCulled={false}><octahedronGeometry args={[0.12, 0]} /><meshBasicMaterial color={index === 1 ? CRIMSON : CHAMPAGNE} toneMapped={false} /></mesh>
          <pointLight color={index === 1 ? CRIMSON : GOLD} intensity={0.35} distance={1.2} decay={2} />
        </group>
      ))}
    </group>
  );
}

const HOSTEL_TOWERS = [
  [-1.42, -0.65, 0.38, 1.65, 0.42], [-0.88, -0.72, 0.44, 2.3, 0.46], [-0.3, -0.78, 0.46, 1.82, 0.48],
  [0.32, -0.64, 0.42, 2.55, 0.44], [0.92, -0.72, 0.4, 1.95, 0.45], [1.43, -0.62, 0.34, 1.48, 0.4],
  [-1.05, 0.1, 0.43, 1.38, 0.42], [-0.35, 0.18, 0.5, 1.9, 0.48], [0.62, 0.16, 0.46, 1.55, 0.45],
] as const;

function HostelArtifact() {
  const root = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime();
    if (root.current) {
      root.current.rotation.y = THREE.MathUtils.damp(root.current.rotation.y, Math.sin(time * 0.13) * 0.07, 2, delta);
      root.current.rotation.x = Math.sin(time * 0.11) * 0.025;
    }
    if (core.current) core.current.scale.setScalar(1 + Math.sin(time * TAU) * 0.055);
  });
  return (
    <group ref={root} frustumCulled={false}>
      {HOSTEL_TOWERS.map(([x, z, width, height, depth], index) => (
        <group key={index} position={[x, -0.42 + height / 2, z]} frustumCulled={false}>
          <mesh frustumCulled={false}>
            <boxGeometry args={[width, height, depth]} />
            <ObsidianShellMaterial intensity={0.035} />
          </mesh>
          <mesh position={[0, 0, depth / 2 + 0.006]} frustumCulled={false}>
            <boxGeometry args={[width * 0.035, height * 0.92, 0.012]} />
            <GoldLineMaterial opacity={0.72} />
          </mesh>
          <mesh position={[0, height * 0.28, depth / 2 + 0.012]} frustumCulled={false}>
            <boxGeometry args={[width * 0.56, 0.025, 0.012]} />
            <meshBasicMaterial color={index === 4 ? CRIMSON : GOLD} transparent opacity={0.72} toneMapped={false} depthWrite={false} />
          </mesh>
        </group>
      ))}
      <mesh ref={core} position={[0, 0.32, 0]} frustumCulled={false}>
        <octahedronGeometry args={[0.38, 0]} />
        <meshStandardMaterial color="#1B080D" emissive={CRIMSON} emissiveIntensity={0.45} roughness={0.28} metalness={0.62} transparent depthWrite />
      </mesh>
      {[1.45, 1.95, 2.28].map((radius, index) => (
        <mesh key={radius} position={[0, -0.4 + index * 0.18, 0]} rotation={[Math.PI / 2, 0.25 * index, 0.2 * index]} frustumCulled={false}>
          <torusGeometry args={[radius, index === 1 ? 0.012 : 0.008, 4, 96]} />
          <GoldLineMaterial color={index === 2 ? CHAMPAGNE : GOLD} opacity={0.68} />
        </mesh>
      ))}
    </group>
  );
}

function HealthArtifact() {
  const root = useRef<THREE.Group>(null);
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const beads = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime();
    if (root.current) root.current.rotation.y = time * 0.075;
    for (let index = 0; index < rings.current.length; index += 1) {
      const ring = rings.current[index];
      if (ring) ring.rotation.z += delta * (index === 0 ? 0.12 : -0.09);
    }
    const pulse = 0.94 + 0.06 * (0.5 + 0.5 * Math.sin(time * TAU));
    for (let index = 0; index < beads.current.length; index += 1) {
      const bead = beads.current[index];
      if (!bead) continue;
      const angle = time * 0.46 + index * TAU / beads.current.length;
      const radius = index % 2 === 0 ? 1.85 : 2.25;
      bead.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.52, Math.sin(angle) * radius * 0.74);
      bead.scale.setScalar(pulse * (index % 3 === 0 ? 1.12 : 0.86));
    }
  });
  return (
    <group ref={root} frustumCulled={false}>
      <mesh frustumCulled={false}><icosahedronGeometry args={[1.15, 1]} /><ObsidianShellMaterial emissive="#10120F" intensity={0.14} /></mesh>
      <mesh scale={1.012} frustumCulled={false}><icosahedronGeometry args={[1.15, 1]} /><meshBasicMaterial color={GOLD} wireframe transparent opacity={0.6} toneMapped={false} depthWrite={false} /></mesh>
      <mesh ref={(node) => { rings.current[0] = node; }} rotation={[0.55, 0.35, 0.2]} frustumCulled={false}>
        <torusGeometry args={[1.85, 0.018, 5, 112]} /><GoldLineMaterial color={CHAMPAGNE} />
      </mesh>
      <mesh ref={(node) => { rings.current[1] = node; }} rotation={[1.05, -0.42, 0.62]} frustumCulled={false}>
        <torusGeometry args={[2.25, 0.016, 5, 128]} /><GoldLineMaterial />
      </mesh>
      {Array.from({ length: 8 }, (_, index) => (
        <mesh key={index} ref={(node) => { beads.current[index] = node; }} frustumCulled={false}>
          <octahedronGeometry args={[0.075, 0]} />
          <meshBasicMaterial color={index % 3 === 0 ? CRIMSON : CHAMPAGNE} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function NoteFlashArtifact() {
  const root = useRef<THREE.Group>(null);
  const shards = useRef<(THREE.Group | null)[]>([]);
  const core = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    if (root.current) root.current.rotation.y = time * 0.075;
    for (let index = 0; index < shards.current.length; index += 1) {
      const shard = shards.current[index];
      if (!shard) continue;
      const t = index / 9;
      const angle = time * 0.22 + t * TAU * 1.35;
      const radius = 1.28 + t * 0.48;
      shard.position.set(Math.cos(angle) * radius, (t - 0.5) * 3.5 + Math.sin(angle * 1.4) * 0.12, Math.sin(angle) * radius);
      shard.lookAt(shard.position.x * 2.2, shard.position.y * 1.8, shard.position.z * 2.2);
      shard.rotateY(0.12);
    }
    if (core.current) core.current.scale.setScalar(0.94 + 0.06 * (0.5 + 0.5 * Math.sin(time * 1.4)));
  });
  return (
    <group ref={root} frustumCulled={false}>
      <mesh ref={core} frustumCulled={false}>
        <icosahedronGeometry args={[0.34, 1]} />
        <meshBasicMaterial color={CHAMPAGNE} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0, 0]} color={GOLD} intensity={0.55} distance={3.8} decay={2} />
      {Array.from({ length: 9 }, (_, index) => (
        <group key={index} ref={(node) => { shards.current[index] = node; }} frustumCulled={false}>
          <RoundedBox args={[0.85, 1.25, 0.06]} radius={0.035} smoothness={2} frustumCulled={false}>
            <meshStandardMaterial color={OBSIDIAN} emissive="#17100A" emissiveIntensity={0.05} roughness={0.28} metalness={0.74} transparent depthWrite />
          </RoundedBox>
          <mesh position={[0, 0.64, 0]} frustumCulled={false}><boxGeometry args={[0.76, 0.018, 0.018]} /><GoldLineMaterial color={index === 2 || index === 7 ? CRIMSON : GOLD} /></mesh>
          <mesh position={[0, -0.64, 0]} frustumCulled={false}><boxGeometry args={[0.76, 0.018, 0.018]} /><GoldLineMaterial /></mesh>
          <mesh position={[-0.42, 0, 0]} frustumCulled={false}><boxGeometry args={[0.018, 1.25, 0.018]} /><GoldLineMaterial color={index === 2 || index === 7 ? CRIMSON : CHAMPAGNE} /></mesh>
          <mesh position={[0.42, 0, 0]} frustumCulled={false}><boxGeometry args={[0.018, 1.25, 0.018]} /><GoldLineMaterial /></mesh>
          <mesh position={[0, 0.19, 0.04]} frustumCulled={false}><boxGeometry args={[0.45, 0.018, 0.012]} /><GoldLineMaterial color={CHAMPAGNE} opacity={0.5} /></mesh>
          <mesh position={[0, 0.05, 0.04]} frustumCulled={false}><boxGeometry args={[0.34, 0.012, 0.012]} /><GoldLineMaterial opacity={0.34} /></mesh>
        </group>
      ))}
    </group>
  );
}

function ActFourSculptures({ projectIndex, vaultOpacityRef }: { projectIndex: number; vaultOpacityRef: OpacityRef }) {
  const anchor = useRef<THREE.Group>(null);
  const stationRefs = useRef<(THREE.Group | null)[]>([]);
  const stationWeights = useRef(new Float32Array(STATION_COUNT));
  const materialSnapshots = useRef<MaterialSnapshot[]>([]);
  const lightSnapshots = useRef<LightSnapshot[]>([]);
  const transition = useRef({ from: THREE.MathUtils.clamp(projectIndex, 0, STATION_COUNT - 1), to: THREE.MathUtils.clamp(projectIndex, 0, STATION_COUNT - 1), startedAt: 0, active: false, initialized: false });
  const keyLights = useRef<(THREE.PointLight | null)[]>([]);
  const auraRef = useRef<ParticleResources | null>(null);
  const [auraResources, setAuraResources] = useState<ParticleResources | null>(null);
  const { camera, clock, gl, pointer, raycaster, size } = useThree();
  const viewportWidth = useRef(size.width);
  const anchorBase = useMemo(() => STAGE_ANCHOR.clone(), []);
  const anchorWorld = useMemo(() => new THREE.Vector3(), []);
  const cameraNormal = useMemo(() => new THREE.Vector3(), []);
  const cursorWorld = useMemo(() => new THREE.Vector3(), []);
  const cursorLocal = useMemo(() => new THREE.Vector3(), []);
  const inverseAnchorQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const cursorPlane = useMemo(() => new THREE.Plane(), []);
  const lastPointer = useMemo(() => new THREE.Vector2(Number.NaN, Number.NaN), []);
  const cursorStrength = useRef(0);
  const pointerActiveAt = useRef(0);

  useLayoutEffect(() => {
    materialSnapshots.current = [];
    lightSnapshots.current = [];
    for (let station = 0; station < STATION_COUNT; station += 1) {
      const group = stationRefs.current[station];
      if (!group) continue;
      group.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (let index = 0; index < materials.length; index += 1) {
            const material = materials[index];
            const emissiveIntensity = material instanceof THREE.MeshStandardMaterial ? material.emissiveIntensity : null;
            const shaderOpacity = material instanceof THREE.ShaderMaterial
              ? material.uniforms.uOpacity as { value: number } | undefined
              : undefined;
            materialSnapshots.current.push({
              station,
              material,
              opacity: material.opacity,
              transparent: material.transparent,
              depthWrite: material.depthWrite,
              emissiveIntensity,
              shaderOpacity: shaderOpacity ?? null,
            });
            material.transparent = true;
          }
        }
        if (object instanceof THREE.PointLight) lightSnapshots.current.push({ station, light: object, intensity: object.intensity });
      });
    }
    return () => {
      for (let index = 0; index < materialSnapshots.current.length; index += 1) {
        const entry = materialSnapshots.current[index];
        entry.material.opacity = entry.opacity;
        entry.material.transparent = entry.transparent;
        entry.material.depthWrite = entry.depthWrite;
        if (entry.emissiveIntensity !== null && entry.material instanceof THREE.MeshStandardMaterial) {
          entry.material.emissiveIntensity = entry.emissiveIntensity;
        }
        if (entry.shaderOpacity) entry.shaderOpacity.value = 1;
      }
      materialSnapshots.current = [];
      lightSnapshots.current = [];
    };
  }, []);

  useLayoutEffect(() => {
    const requested = THREE.MathUtils.clamp(Math.round(projectIndex), 0, STATION_COUNT - 1);
    const current = transition.current;
    const time = clock.getElapsedTime();
    if (!current.initialized) {
      current.from = requested;
      current.to = requested;
      current.active = false;
      current.initialized = true;
      for (let station = 0; station < STATION_COUNT; station += 1) {
        const group = stationRefs.current[station];
        if (group) {
          group.visible = station === requested;
          group.scale.setScalar(station === requested ? 1 : 0.001);
        }
      }
      return;
    }
    const progress = current.active ? THREE.MathUtils.clamp((time - current.startedAt) / MORPH_SECONDS, 0, 1) : 1;
    if (requested !== current.to) {
      current.from = current.active && progress < 0.5 ? current.from : current.to;
      current.to = requested;
      current.startedAt = time;
      current.active = true;
      for (let station = 0; station < STATION_COUNT; station += 1) {
        const group = stationRefs.current[station];
        if (group) group.visible = station === current.from || station === current.to;
      }
    }
  }, [clock, projectIndex]);

  useEffect(() => {
    const cores = typeof navigator === "undefined" ? 4 : navigator.hardwareConcurrency || 4;
    const count = chooseParticleCount(viewportWidth.current, cores);
    const resources = makeParticleResources(count, Math.min(gl.getPixelRatio(), 1.5));
    auraRef.current = resources;
    setAuraResources(resources);
    return () => {
      auraRef.current = null;
      resources.geometry.dispose();
      resources.material.dispose();
    };
  }, [gl]);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    const currentTransition = transition.current;
    const progress = currentTransition.active ? THREE.MathUtils.clamp((time - currentTransition.startedAt) / MORPH_SECONDS, 0, 1) : 1;
    if (currentTransition.active && progress >= 1) {
      currentTransition.active = false;
      currentTransition.from = currentTransition.to;
    }

    for (let station = 0; station < STATION_COUNT; station += 1) {
      let weight = 0;
      let scale = 0.001;
      if (!currentTransition.active) {
        weight = station === currentTransition.to ? 1 : 0;
        scale = station === currentTransition.to ? 1 : 0.001;
      } else if (station === currentTransition.from) {
        const outgoing = smooth01(progress / 0.42);
        weight = 1 - outgoing;
        scale = Math.max(0.001, 1 - outgoing);
      } else if (station === currentTransition.to) {
        const incoming = smooth01((progress - 0.35) / 0.65);
        weight = incoming;
        scale = 0.01 + 0.99 * incoming;
      }
      stationWeights.current[station] = weight;
      const group = stationRefs.current[station];
      if (group) {
        group.visible = weight > 0.001;
        group.scale.setScalar(scale);
        const outgoingSpin = currentTransition.active && station === currentTransition.from
          ? smooth01(progress / 0.42) * 1.4
          : 0;
        const incomingSpin = currentTransition.active && station === currentTransition.to
          ? (1 - smooth01((progress - 0.35) / 0.65)) * 0.48
          : 0;
        group.rotation.x = THREE.MathUtils.damp(group.rotation.x, pointer.y * -0.12 + outgoingSpin * 0.12, 2.8, delta);
        group.rotation.y = THREE.MathUtils.damp(group.rotation.y, Math.sin(time * 0.14 + station) * 0.025 + pointer.x * 0.15 + outgoingSpin + incomingSpin, 2.8, delta);
      }
    }

    const opacity = THREE.MathUtils.clamp(vaultOpacityRef.current, 0, 1);
    for (let index = 0; index < materialSnapshots.current.length; index += 1) {
      const entry = materialSnapshots.current[index];
      const stationWeight = stationWeights.current[entry.station];
      const effectiveWeight = stationWeight * opacity;
      entry.material.opacity = entry.opacity * stationWeight;
      entry.material.transparent = true;
      entry.material.depthWrite = effectiveWeight > 0.995 ? entry.depthWrite : false;
      if (entry.emissiveIntensity !== null && entry.material instanceof THREE.MeshStandardMaterial) {
        entry.material.emissiveIntensity = entry.emissiveIntensity * stationWeight;
      }
      if (entry.shaderOpacity) entry.shaderOpacity.value = stationWeight;
    }
    for (let index = 0; index < lightSnapshots.current.length; index += 1) {
      const entry = lightSnapshots.current[index];
      entry.light.intensity = entry.intensity * stationWeights.current[entry.station];
    }
    for (let index = 0; index < keyLights.current.length; index += 1) {
      const light = keyLights.current[index];
      if (light) light.intensity = KEY_LIGHT_INTENSITIES[index] * opacity;
    }

    if (anchor.current) {
      anchor.current.position.copy(anchorBase).addScaledVector(ACT_FOUR_STAGE_BASIS.up, Math.sin(time * 1.05) * 0.14);
      anchor.current.rotation.y = THREE.MathUtils.damp(anchor.current.rotation.y, time * 0.035 + pointer.x * 0.12, 2.2, delta);
      anchor.current.rotation.x = THREE.MathUtils.damp(anchor.current.rotation.x, pointer.y * -0.12, 2.2, delta);
    }

    let moved = false;
    if (Math.abs(pointer.x - lastPointer.x) > 0.001 || Math.abs(pointer.y - lastPointer.y) > 0.001) {
      lastPointer.set(pointer.x, pointer.y);
      pointerActiveAt.current = time;
      moved = true;
    }
    if (anchor.current) {
      anchor.current.getWorldPosition(anchorWorld);
      camera.getWorldDirection(cameraNormal);
      cursorPlane.setFromNormalAndCoplanarPoint(cameraNormal, anchorWorld);
      if (raycaster.ray.intersectPlane(cursorPlane, cursorWorld)
        && Number.isFinite(cursorWorld.x) && Number.isFinite(cursorWorld.y) && Number.isFinite(cursorWorld.z)) {
        cursorLocal.copy(cursorWorld).sub(anchorWorld);
        anchor.current.getWorldQuaternion(inverseAnchorQuaternion).invert();
        cursorLocal.applyQuaternion(inverseAnchorQuaternion);
        const targetStrength = moved || time - pointerActiveAt.current < 0.55 ? 1 : 0;
        cursorStrength.current += (targetStrength - cursorStrength.current) * (1 - Math.exp(-delta * 4.5));
      } else {
        cursorStrength.current += (0 - cursorStrength.current) * (1 - Math.exp(-delta * 4.5));
      }
    }

    const aura = auraRef.current;
    if (aura) {
      const uniforms = aura.material.uniforms;
      uniforms.uTime.value = time;
      uniforms.uPixelRatio.value = Math.min(gl.getPixelRatio(), 1.5);
      uniforms.uMorphProgress.value = progress;
      uniforms.uFromIndex.value = currentTransition.from;
      uniforms.uToIndex.value = currentTransition.to;
      uniforms.uVaultOpacity.value = opacity;
      uniforms.uCursorLocal.value.copy(cursorLocal);
      uniforms.uCursorStrength.value = cursorStrength.current;
    }
  });

  return (
    <group ref={anchor} position={STAGE_ANCHOR} frustumCulled={false}>
      <pointLight ref={(node) => { keyLights.current[0] = node; }} position={[-6.5, -2.0, -1.5]} color="#FF9E2C" intensity={18} distance={18} decay={1.6} castShadow={false} />
      <pointLight ref={(node) => { keyLights.current[1] = node; }} position={[-2.5, -3.2, 2.5]} color="#C90E1D" intensity={5.5} distance={12} decay={1.8} castShadow={false} />
      <pointLight ref={(node) => { keyLights.current[2] = node; }} position={[4.5, 5.0, 3.5]} color="#E6DCCB" intensity={6.5} distance={16} decay={1.6} castShadow={false} />

      <group ref={(node) => { stationRefs.current[0] = node; }} visible={false} frustumCulled={false}><FindItArtifact /></group>
      <group ref={(node) => { stationRefs.current[1] = node; }} visible={false} frustumCulled={false}><ZaminSaathiArtifact /></group>
      <group ref={(node) => { stationRefs.current[2] = node; }} visible={false} frustumCulled={false}><HostelArtifact /></group>
      <group ref={(node) => { stationRefs.current[3] = node; }} visible={false} frustumCulled={false}><HealthArtifact /></group>
      <group ref={(node) => { stationRefs.current[4] = node; }} visible={false} frustumCulled={false}><NoteFlashArtifact /></group>

      {auraResources && <points geometry={auraResources.geometry} material={auraResources.material} frustumCulled={false} renderOrder={8} dispose={null} />}
    </group>
  );
}

export default ActFourSculptures;
