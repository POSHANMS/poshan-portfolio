"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { RoundedBox } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ACT_FOUR_STAGE_BASIS } from "@/animations/scrollCamera";

const TAU = Math.PI * 2;
const STATION_COUNT = 5;
const MORPH_SECONDS = 0.9;
const GOLD = "#FFBE45";
const CHAMPAGNE = "#FFF2C8";
const CRIMSON = "#D9081E";
const AMBER = "#E0861A";
const STAGE_ANCHOR = ACT_FOUR_STAGE_BASIS.origin.clone()
  .addScaledVector(ACT_FOUR_STAGE_BASIS.right, 5.4)
  .addScaledVector(ACT_FOUR_STAGE_BASIS.up, 1.35)
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
  shaderVaultOpacity: { value: number } | null;
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
    if (b < 0.68) {
      const z = c * 2 - 1;
      const planar = Math.sqrt(Math.max(0.001, 1 - z * z));
      const radius = 2.45 + seeded(index, 29) * 1.2;
      target.set(Math.cos(a) * planar * radius, z * radius, Math.sin(a) * planar * radius);
      return;
    }
    const angle = a + (c - 0.5) * 0.12;
    const radius = 2.58 + seeded(index, 31) * 0.9;
    const orbitalDepth = Math.sin(angle) * radius;
    target.set(
      Math.cos(angle) * radius,
      orbitalDepth * 0.58 + (seeded(index, 37) - 0.5) * 0.13,
      orbitalDepth * 0.78,
    );
    return;
  }

  if (shape === 1) {
    const contourIndex = Math.floor(b * 3);
    const contour = 2.5 + contourIndex * 0.48;
    const ripple = Math.sin(a * 3 + contourIndex * 1.4) * 0.12 + Math.cos(a * 5 - contourIndex) * 0.07;
    const radius = contour + ripple + (c - 0.5) * 0.035;
    target.set(
      Math.cos(a) * radius,
      0.24 * Math.sin(a * 2.0 + contourIndex * 0.7) + 0.12 * Math.sin(contourIndex * 2.4) + (c - 0.5) * 0.11,
      Math.sin(a) * radius,
    );
    return;
  }

  if (shape === 2) {
    if (b < 0.68) {
      const filament = Math.floor(seeded(index, 29) * 7);
      const angle = filament * TAU / 7 + (c - 0.5) * 0.24;
      const radius = 2.75 + seeded(index, 31) * 0.85;
      const rise = (seeded(index, 37) * 2 - 1) * 2.25;
      target.set(Math.cos(angle) * radius, rise, Math.sin(angle) * radius);
    } else {
      const radius = 2.7 + c * 1.0;
      target.set(Math.cos(a) * radius, Math.sin(a * 2.0) * 0.22 + (seeded(index, 41) - 0.5) * 0.16, Math.sin(a) * radius);
    }
    return;
  }

  if (shape === 3) {
    const strand = index % 2 === 0 ? 0 : Math.PI;
    const angle = t * TAU * 2.15 + strand + (b - 0.5) * 0.12;
    const y = (t - 0.5) * 4.8 + (c - 0.5) * 0.16;
    const radius = 2.58 + b * 0.98 + Math.sin(angle * 0.5) * 0.08;
    target.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    return;
  }

  const angle = t * TAU * 2.4 + (b - 0.5) * 0.16;
  const radius = 2.55 + t * 1.08 + (c - 0.5) * 0.12;
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
  varying float vAlpha;
  varying float vParticleSeed;
  varying float vBurst;

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
    float orbitY = burst * (3.2 + aSeed * 2.8);
    float cy = cos(orbitY);
    float sy = sin(orbitY);
    p.xz = mat2(cy, -sy, sy, cy) * p.xz;
    float orbitZ = burst * (0.7 + aSeed * 1.1);
    float cz = cos(orbitZ);
    float sz = sin(orbitZ);
    p.xy = mat2(cz, -sz, sz, cz) * p.xy;
    float radialLength = max(length(p), 0.001);
    p += p / radialLength * burst * (1.8 + aSeed * 2.4);

    float idleAngle = uTime * 0.045 + aSeed * 0.08;
    float idleCos = cos(idleAngle);
    float idleSin = sin(idleAngle);
    p.xz = mat2(idleCos, -idleSin, idleSin, idleCos) * p.xz;

    vec2 cursorDelta = p.xy - uCursorLocal.xy;
    float cursorDistance = length(cursorDelta);
    float cursorInfluence = (1.0 - smoothstep(0.0, 3.0, cursorDistance)) * uCursorStrength;
    vec2 cursorRadial = cursorDelta / max(cursorDistance, 0.001);
    vec2 cursorTangent = vec2(-cursorRadial.y, cursorRadial.x);
    p.xy += cursorRadial * cursorInfluence * 0.38 + cursorTangent * cursorInfluence * (0.62 + aSeed * 0.28);
    p += vec3(0.0, sin(uTime * 0.8 + aSeed * 18.0) * 0.025, 0.0);

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    float restScale = mix(0.62, 1.18, burst);
    float dynamicCap = aSeed > 0.975 ? mix(4.2, 6.8, burst) : mix(3.1, 5.2, burst);
    gl_PointSize = clamp(aSize * restScale * uPixelRatio * (58.0 / max(3.0, -mvPosition.z)), 1.15 * uPixelRatio, dynamicCap * uPixelRatio);
    vParticleColor = aColorMix;
    float mist = 1.0 - smoothstep(0.0, 2.7, length(p));
    vAlpha = mix(0.42, 0.95, clamp(aSeed * 0.72 + (1.0 - mist) * 0.28, 0.0, 1.0));
    vParticleSeed = aSeed;
    vBurst = burst;
  }
`;

const AURA_FRAGMENT_SHADER = `
  uniform float uTime;
  uniform float uVaultOpacity;
  varying vec3 vParticleColor;
  varying float vAlpha;
  varying float vParticleSeed;
  varying float vBurst;
  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float d = length(p) * 2.0;
    if (d > 1.0) discard;
    float core = exp(-d * d * 6.5);
    float halo = exp(-d * d * 2.4) * mix(0.14, 0.36, vBurst);
    float restAlphaMult = mix(0.42, 1.05, vBurst);
    float alpha = clamp((core + halo) * vAlpha * restAlphaMult * uVaultOpacity, 0.0, 1.0);
    gl_FragColor = vec4(vParticleColor * mix(0.88, 1.55, vBurst), alpha);
  }
`;

const OBSIDIAN_VERTEX_SHADER = `
  varying vec3 vViewNormal;
  varying vec3 vViewPosition;
  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = viewPosition.xyz;
    vViewNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const OBSIDIAN_FRAGMENT_SHADER = `
  uniform float uOpacity;
  uniform float uVaultOpacity;
  uniform float uCavity;
  uniform float uFindItPolish;
  uniform float uArchitecture;
  varying vec3 vViewNormal;
  varying vec3 vViewPosition;
  void main() {
    vec3 N = normalize(vViewNormal);
    if (!gl_FrontFacing) N = -N;
    vec3 V = normalize(-vViewPosition);
    vec3 eclipseLight = normalize(vec3(-0.62, -0.38, 0.68));
    vec3 studioLight = normalize(vec3(0.48, 0.72, 0.58));
    float facing = max(dot(N, V), 0.0);
    float goldFacing = max(dot(N, eclipseLight), 0.0);
    float studioFacing = max(dot(N, studioLight), 0.0);
    vec3 H = normalize(studioLight + V);
    float fresnel = pow(1.0 - facing, 3.4);
    float rimBand = smoothstep(0.34, 0.94, fresnel);
    float goldRim = rimBand * (0.08 + goldFacing * 0.9);
    float champagneFresnel = smoothstep(0.7, 0.985, fresnel) * (0.06 + studioFacing * 0.76);
    float champagneSpecular = pow(max(dot(N, H), 0.0), 42.0) * 0.28;
    float diffuse = 0.035 + goldFacing * 0.055 + studioFacing * 0.038;
    float cavityShade = mix(1.0, 0.56, clamp(uCavity * (1.0 - smoothstep(-0.45, 0.35, N.y)), 0.0, 1.0));
    vec3 base = mix(vec3(0.008, 0.007, 0.012), vec3(0.025, 0.022, 0.034), clamp(diffuse * 3.2, 0.0, 1.0)) * cavityShade;
    vec3 color = base
      + vec3(1.0, 0.36, 0.035) * goldRim * 0.58
      + vec3(0.66, 0.018, 0.035) * goldFacing * fresnel * 0.07
      + vec3(0.91, 0.875, 0.812) * (champagneFresnel * 0.3 + champagneSpecular * 0.34);

    // Weight the FindIt sheen to its upper-right contour and the eclipse bounce to its lower-left grazing edge.
    float upperRightMask = smoothstep(-0.42, 0.64, N.x) * smoothstep(-0.5, 0.62, N.y);
    float charcoalSheen = pow(max(dot(N, normalize(vec3(0.52, 0.62, 0.58))), 0.0), 7.0) * upperRightMask;
    float findItGrazing = smoothstep(0.68, 0.995, fresnel) * (0.18 + studioFacing * 0.82);
    float lowerLeftBounce = pow(max(dot(N, normalize(vec3(-0.72, -0.42, 0.55))), 0.0), 1.7) * fresnel;
    vec3 findItSheen = vec3(0.141, 0.133, 0.165) * charcoalSheen * 0.9
      + vec3(0.91, 0.875, 0.812) * findItGrazing * 0.64
      + vec3(1.0, 0.659, 0.18) * lowerLeftBounce * 0.3;
    color += findItSheen * uFindItPolish;

    // Directional weights distinguish warm left walls, satin top caps, and unlit obsidian rear faces.
    float leftFace = max(dot(N, normalize(vec3(-0.78, 0.16, 0.6))), 0.0);
    float capFace = max(dot(N, normalize(vec3(-0.08, 0.92, 0.38))), 0.0);
    vec3 warmFace = mix(vec3(0.369, 0.192, 0.043), vec3(1.0, 0.659, 0.18), smoothstep(0.08, 0.88, goldFacing));
    vec3 satinCap = mix(vec3(0.18, 0.169, 0.208), vec3(0.902, 0.863, 0.796), smoothstep(0.08, 0.9, studioFacing));
    vec3 architecturalColor = vec3(0.008, 0.007, 0.012)
      + warmFace * leftFace * 0.16
      + satinCap * capFace * 0.15
      + vec3(1.0, 0.659, 0.18) * goldRim * leftFace * 0.18
      + vec3(0.902, 0.863, 0.796) * champagneFresnel * capFace * 0.1;
    color = mix(color, architecturalColor, uArchitecture);
    color = clamp(color, vec3(0.0), vec3(1.0));
    gl_FragColor = vec4(color, clamp(uOpacity * uVaultOpacity, 0.0, 1.0));
  }
`;

const RADIAL_GLOW_VERTEX_SHADER = `
  varying vec2 vGlowUv;
  void main() {
    vGlowUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const RADIAL_GLOW_FRAGMENT_SHADER = `
  uniform float uOpacity;
  uniform float uVaultOpacity;
  varying vec2 vGlowUv;
  void main() {
    float radius = length(vGlowUv - 0.5) * 2.0;
    float champagneCore = exp(-radius * radius * 190.0);
    float moltenHalo = exp(-radius * radius * 30.0);
    float emberHalo = exp(-radius * radius * 8.0);
    vec3 color = vec3(1.0, 0.94, 0.72) * champagneCore
      + vec3(1.0, 0.42, 0.055) * moltenHalo * 0.72
      + vec3(0.72, 0.025, 0.018) * emberHalo * 0.32;
    float alpha = clamp((champagneCore * 0.34 + moltenHalo * 0.12 + emberHalo * 0.035) * uOpacity * uVaultOpacity, 0.0, 1.0);
    gl_FragColor = vec4(color, alpha);
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
    float sector = mod(angle + 6.2831853, 6.2831853) / 1.012291;
    float angularFalloff = 1.0 - smoothstep(0.0, 1.0, sector);
    float radialFalloff = 1.0 - smoothstep(0.92, 1.0, radius);
    float alpha = angularFalloff * radialFalloff * 0.65 * uOpacity * uVaultOpacity;
    gl_FragColor = vec4(0.90, 0.018, 0.035, alpha);
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
    sizes[index] = seed > 0.975 ? 1.45 + seeded(index, 59) * 0.45 : 0.45 + seeded(index, 61);
    let colorIndex = 0;
    if (seed > 0.975) colorIndex = 2;
    else if (seed >= 0.55 && seed < 0.77) colorIndex = 1;
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
  const targetAttributes = targets.map((target) => new THREE.BufferAttribute(target, 3));
  geometry.setAttribute("position", targetAttributes[0]);
  for (let shape = 0; shape < STATION_COUNT; shape += 1) {
    geometry.setAttribute(`aPos${shape}`, targetAttributes[shape]);
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
    depthTest: true,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  return { geometry, material };
}

function ObsidianShellMaterial({
  cavity = 0,
  side = THREE.FrontSide,
  findItPolish = false,
  architecture = false,
}: { cavity?: number; side?: THREE.Side; findItPolish?: boolean; architecture?: boolean }) {
  return (
    <shaderMaterial
      uniforms={{
        uOpacity: { value: 1 },
        uVaultOpacity: { value: 1 },
        uCavity: { value: cavity },
        uFindItPolish: { value: findItPolish ? 1 : 0 },
        uArchitecture: { value: architecture ? 1 : 0 },
      }}
      vertexShader={OBSIDIAN_VERTEX_SHADER}
      fragmentShader={OBSIDIAN_FRAGMENT_SHADER}
      transparent
      depthWrite
      side={side}
      toneMapped={false}
    />
  );
}

function GoldLineMaterial({ color = GOLD, opacity = 0.85 }: { color?: string; opacity?: number }) {
  return <meshBasicMaterial color={color} transparent opacity={opacity} toneMapped={false} depthWrite={false} />;
}

function FindItArtifact() {
  const root = useRef<THREE.Group>(null);
  const bowl = useRef<THREE.Group>(null);
  const ringRefs = useRef<(THREE.Mesh | null)[]>([]);
  const sweep = useRef<THREE.Group>(null);
  const tiltQuaternion = useMemo(() => new THREE.Quaternion().setFromEuler(new THREE.Euler(0.49, 0, 0)), []);
  const desiredWorldQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const inverseRootQuaternion = useMemo(() => new THREE.Quaternion(), []);
  useFrame(({ clock, camera }) => {
    const time = clock.getElapsedTime();
    if (root.current) root.current.rotation.y = time * 0.08;
    if (root.current && bowl.current) {
      root.current.updateWorldMatrix(true, false);
      root.current.getWorldQuaternion(inverseRootQuaternion).invert();
      desiredWorldQuaternion.copy(camera.quaternion).multiply(tiltQuaternion);
      bowl.current.quaternion.copy(inverseRootQuaternion).multiply(desiredWorldQuaternion);
    }
    for (let index = 0; index < ringRefs.current.length; index += 1) {
      const ring = ringRefs.current[index];
      if (ring) ring.rotation.z += (index === 1 ? -1 : 1) * 0.0022;
    }
    if (sweep.current) sweep.current.rotation.z = time * 0.42;
  });
  return (
    <group ref={root} frustumCulled={false}>
      <group ref={bowl} scale={1.24} frustumCulled={false}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
          <sphereGeometry args={[2.25, 48, 32, 0, TAU, 0, Math.PI * 0.62]} />
          <ObsidianShellMaterial findItPolish />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
          <sphereGeometry args={[1.98, 48, 32, 0, TAU, 0, Math.PI * 0.62]} />
          <meshBasicMaterial color="#030207" side={THREE.BackSide} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, -2.115 * Math.cos(Math.PI * 0.62)]} frustumCulled={false}>
          <torusGeometry args={[2.115 * Math.sin(Math.PI * 0.62), 0.135, 10, 96]} />
          <ObsidianShellMaterial findItPolish />
        </mesh>
        <mesh position={[0, 0, 0.16]} frustumCulled={false}>
          <sphereGeometry args={[0.62, 32, 24]} />
          <ObsidianShellMaterial cavity={0.22} findItPolish />
        </mesh>
        <mesh position={[0, -0.13, 0.16]} rotation={[Math.PI / 2, 0, 0]} frustumCulled={false}>
          <torusGeometry args={[0.605, 0.018, 6, 96]} />
          <GoldLineMaterial color={CRIMSON} opacity={0.96} />
        </mesh>
        <mesh ref={(node) => { ringRefs.current[0] = node; }} rotation={[0.28, 0.4, 0.16]} frustumCulled={false}>
          <torusGeometry args={[1.22, 0.028, 6, 112]} />
          <GoldLineMaterial color={CHAMPAGNE} opacity={0.62} />
        </mesh>
        <mesh ref={(node) => { ringRefs.current[1] = node; }} rotation={[0.9, 0.2, -0.55]} frustumCulled={false}>
          <torusGeometry args={[1.68, 0.026, 6, 128]} />
          <GoldLineMaterial opacity={0.6} />
        </mesh>
        <mesh ref={(node) => { ringRefs.current[2] = node; }} rotation={[1.15, -0.48, 0.32]} frustumCulled={false}>
          <torusGeometry args={[2.52, 0.022, 6, 144]} />
          <GoldLineMaterial opacity={0.52} />
        </mesh>
        <group ref={sweep} position={[0, 0, 0.22]} frustumCulled={false}>
          <mesh rotation={[0, 0, 4.9]} frustumCulled={false}>
            <circleGeometry args={[1.58, 64, 0, TAU * 58 / 360]} />
            <shaderMaterial
              uniforms={{ uOpacity: { value: 1 }, uVaultOpacity: { value: 1 } }}
              vertexShader={RADAR_SWEEP_VERTEX_SHADER}
              fragmentShader={RADAR_SWEEP_FRAGMENT_SHADER}
              transparent
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              depthTest
              toneMapped={false}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
}

const TOPOGRAPHIC_RADII = [2.15, 1.82, 1.49, 1.17, 0.87, 0.58] as const;

function createTopographicContour(layer: number, radius: number) {
  const sides = layer % 2 === 0 ? 8 : 7;
  const shape = new THREE.Shape();
  for (let vertex = 0; vertex < sides; vertex += 1) {
    const angle = vertex / sides * TAU + layer * 0.11;
    const irregularity = 0.91 + 0.055 * Math.sin(vertex * 2.7 + layer * 1.8) + 0.035 * Math.cos(vertex * 4.1 - layer);
    const x = Math.cos(angle) * radius * irregularity;
    const y = Math.sin(angle) * radius * irregularity * (0.88 + 0.035 * Math.sin(layer * 1.7));
    if (vertex === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

function ZaminSaathiArtifact() {
  const root = useRef<THREE.Group>(null);
  const orbitNodes = useRef<(THREE.Group | null)[]>([]);
  const orbitalTracks = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime();
    if (root.current) {
      root.current.rotation.y = time * 0.055;
      root.current.rotation.x = Math.sin(time * 0.12) * 0.018;
    }
    for (let index = 0; index < orbitalTracks.current.length; index += 1) {
      const track = orbitalTracks.current[index];
      if (track) track.rotation.y = time * (index % 2 === 0 ? 0.035 : -0.028);
    }
    for (let index = 0; index < orbitNodes.current.length; index += 1) {
      const node = orbitNodes.current[index];
      if (!node) continue;
      const angle = time * (0.2 + index * 0.025) + index * TAU / 3;
      const radius = 2.45 + index * 0.12;
      node.position.set(Math.cos(angle) * radius, 0.08 + Math.sin(angle * 1.4) * 0.48, Math.sin(angle) * radius);
      node.rotation.y = angle * 0.7;
      node.rotation.x = angle * 0.22;
    }
  });
  return (
    <group ref={root} scale={1.24} frustumCulled={false}>
      <group rotation={[0.419, 0.0, 0]} frustumCulled={false}>
        <mesh position={[0, -1.12, 0]} frustumCulled={false}>
          <cylinderGeometry args={[1.84, 1.92, 0.22, 10, 1]} />
          <ObsidianShellMaterial />
        </mesh>
        <mesh position={[0, -1.005, 0]} rotation={[Math.PI / 2, 0, 0]} frustumCulled={false}>
          <torusGeometry args={[1.86, 0.012, 4, 112]} /><GoldLineMaterial opacity={0.88} />
        </mesh>
        {TOPOGRAPHIC_RADII.map((radius, index) => {
          const layerY = -0.84 + index * 0.34;
          return (
            <group key={index} position={[0, layerY, 0]} rotation={[0, index * 0.13, 0]} frustumCulled={false}>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.13, 0]} frustumCulled={false}>
                <extrudeGeometry args={[createTopographicContour(index, radius), { depth: 0.26, steps: 1, bevelEnabled: true, bevelThickness: 0.045, bevelSize: 0.055, bevelSegments: 1 }]} />
                <ObsidianShellMaterial />
              </mesh>
              <mesh position={[0, 0.143, 0]} rotation={[Math.PI / 2, 0, 0]} frustumCulled={false}>
                <torusGeometry args={[radius * 0.94, 0.009, 4, 96]} />
                <GoldLineMaterial opacity={0.76 - index * 0.045} />
              </mesh>
            </group>
          );
        })}
        <mesh position={[0, 1.32, 0]} frustumCulled={false}>
          <cylinderGeometry args={[0.008, 0.014, 0.72, 6, 1]} />
          <meshBasicMaterial color={CRIMSON} transparent opacity={0.82} toneMapped={false} depthWrite={false} />
        </mesh>
        {[0, 1, 2].map((index) => (
          <mesh key={`track-${index}`} ref={(node) => { orbitalTracks.current[index] = node; }} position={[0, 0.12 + index * 0.14, 0]} rotation={index === 0 ? [0.82, 0.28, 0.5] : index === 1 ? [1.12, -0.38, 0.95] : [0.54, 0.82, -0.44]} frustumCulled={false}>
            <torusGeometry args={[2.33 + index * 0.13, 0.007, 4, 112]} />
            <GoldLineMaterial color={index === 1 ? CRIMSON : CHAMPAGNE} opacity={index === 1 ? 0.46 : 0.32} />
          </mesh>
        ))}
        {[0, 1, 2].map((index) => (
          <group key={`node-${index}`} ref={(node) => { orbitNodes.current[index] = node; }} frustumCulled={false}>
            <mesh frustumCulled={false}><octahedronGeometry args={[0.115, 0]} /><meshBasicMaterial color={index === 1 ? CRIMSON : CHAMPAGNE} toneMapped={false} /></mesh>
            <pointLight color={index === 1 ? CRIMSON : GOLD} intensity={0.42} distance={1.2} decay={2} />
          </group>
        ))}
      </group>
    </group>
  );
}

const HOSTEL_TOWERS = [
  [-0.84, -0.78, 0.46, 1.65, 0.44], [0, -0.82, 0.52, 2.45, 0.5], [0.84, -0.78, 0.42, 1.55, 0.42],
  [-0.86, 0, 0.5, 2.0, 0.48], [0, 0, 0.42, 1.15, 0.42], [0.88, 0, 0.52, 2.95, 0.52],
  [-0.82, 0.78, 0.4, 1.35, 0.42], [0, 0.82, 0.54, 2.5, 0.5], [0.82, 0.78, 0.44, 1.75, 0.46],
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
    <group ref={root} scale={1.24} frustumCulled={false}>
      <group rotation={[0.279253, 0.593412, 0]} frustumCulled={false}>
        <mesh position={[0, -0.94, 0]} frustumCulled={false}>
          <cylinderGeometry args={[1.72, 1.82, 0.24, 10, 1]} />
          <ObsidianShellMaterial />
        </mesh>
        <mesh position={[0, -0.812, 0]} rotation={[Math.PI / 2, 0, 0]} frustumCulled={false}>
          <torusGeometry args={[1.76, 0.012, 4, 112]} /><GoldLineMaterial opacity={0.86} />
        </mesh>
        {HOSTEL_TOWERS.map(([x, z, width, height, depth], index) => (
          <group key={index} position={[x, -0.82 + height / 2, z]} frustumCulled={false}>
            <RoundedBox args={[width, height, depth]} radius={0.055} smoothness={3} frustumCulled={false}>
              <ObsidianShellMaterial architecture />
            </RoundedBox>
            {index === 1 || index === 5 || index === 7 ? (
              <mesh position={[-width * 0.46, 0, depth / 2 + 0.012]} frustumCulled={false}>
                <boxGeometry args={[0.009, height * 0.76, 0.01]} />
                <GoldLineMaterial color={index === 5 ? CHAMPAGNE : GOLD} opacity={0.68} />
              </mesh>
            ) : null}
          </group>
        ))}
        <mesh ref={core} position={[0.04, 0.43, 0.04]} frustumCulled={false}>
          <octahedronGeometry args={[0.29, 0]} />
          <meshBasicMaterial color={CRIMSON} toneMapped={false} />
        </mesh>
        <pointLight position={[0.04, 0.43, 0.04]} color={CRIMSON} intensity={0.58} distance={2.8} decay={2} />
        <mesh position={[0.04, 0.52, 0.1]} rotation={[0.82, 0.34, 0.22]} frustumCulled={false}>
          <torusGeometry args={[1.74, 0.012, 5, 128]} />
          <GoldLineMaterial color={GOLD} opacity={0.62} />
        </mesh>
      </group>
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
      <mesh frustumCulled={false}><icosahedronGeometry args={[1.15, 1]} /><ObsidianShellMaterial cavity={0.32} /></mesh>
      <mesh scale={1.012} frustumCulled={false}><icosahedronGeometry args={[1.15, 1]} /><meshBasicMaterial color={GOLD} wireframe transparent opacity={0.6} toneMapped={false} depthWrite={false} /></mesh>
      <mesh ref={(node) => { rings.current[0] = node; }} rotation={[0.55, 0.35, 0.2]} frustumCulled={false}>
        <torusGeometry args={[1.85, 0.018, 5, 112]} /><GoldLineMaterial color={CHAMPAGNE} />
      </mesh>
      <mesh ref={(node) => { rings.current[1] = node; }} rotation={[1.05, -0.42, 0.62]} frustumCulled={false}>
        <torusGeometry args={[2.25, 0.016, 5, 128]} /><GoldLineMaterial />
      </mesh>
      {Array.from({ length: 8 }, (_, index) => (
        <mesh key={index} ref={(node) => { beads.current[index] = node; }} frustumCulled={false}>
          <octahedronGeometry args={[0.09, 0]} />
          <meshBasicMaterial color={index % 3 === 0 ? "#FF4350" : "#FFF4D2"} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function NoteFlashArtifact() {
  const root = useRef<THREE.Group>(null);
  const shards = useRef<(THREE.Group | null)[]>([]);
  const core = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Mesh>(null);
  const inverseRootQuaternion = useMemo(() => new THREE.Quaternion(), []);
  useFrame(({ clock, camera }) => {
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
    if (glow.current && root.current) {
      root.current.getWorldQuaternion(inverseRootQuaternion).invert();
      glow.current.quaternion.copy(camera.quaternion).premultiply(inverseRootQuaternion);
    }
  });
  return (
    <group ref={root} frustumCulled={false}>
      <group ref={core} frustumCulled={false}>
        <mesh frustumCulled={false}>
          <sphereGeometry args={[0.19, 24, 18]} />
          <meshBasicMaterial color="#FF8C1A" toneMapped={false} />
        </mesh>
        <mesh frustumCulled={false}>
          <sphereGeometry args={[0.072, 20, 14]} />
          <meshBasicMaterial color={CHAMPAGNE} toneMapped={false} />
        </mesh>
      </group>
      <mesh ref={glow} scale={2.8} frustumCulled={false} renderOrder={11}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          uniforms={{ uOpacity: { value: 1 }, uVaultOpacity: { value: 1 } }}
          vertexShader={RADIAL_GLOW_VERTEX_SHADER}
          fragmentShader={RADIAL_GLOW_FRAGMENT_SHADER}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
          toneMapped={false}
        />
      </mesh>
      <pointLight position={[0, 0, 0]} color={GOLD} intensity={0.26} distance={2.6} decay={2} />
      {Array.from({ length: 9 }, (_, index) => (
        <group key={index} ref={(node) => { shards.current[index] = node; }} frustumCulled={false}>
          <RoundedBox args={[0.85, 1.25, 0.06]} radius={0.035} smoothness={2} frustumCulled={false}>
            <ObsidianShellMaterial />
          </RoundedBox>
          <mesh position={[0, 0.64, 0]} frustumCulled={false}><boxGeometry args={[0.76, 0.01, 0.012]} /><GoldLineMaterial color={index === 2 || index === 7 ? CRIMSON : GOLD} opacity={0.74} /></mesh>
          <mesh position={[0, -0.64, 0]} frustumCulled={false}><boxGeometry args={[0.76, 0.01, 0.012]} /><GoldLineMaterial opacity={0.74} /></mesh>
          <mesh position={[-0.42, 0, 0]} frustumCulled={false}><boxGeometry args={[0.01, 1.25, 0.012]} /><GoldLineMaterial color={index === 2 || index === 7 ? CRIMSON : CHAMPAGNE} opacity={0.74} /></mesh>
          <mesh position={[0.42, 0, 0]} frustumCulled={false}><boxGeometry args={[0.01, 1.25, 0.012]} /><GoldLineMaterial opacity={0.74} /></mesh>
          <mesh position={[0, 0.19, 0.04]} frustumCulled={false}><boxGeometry args={[0.45, 0.01, 0.008]} /><GoldLineMaterial color={CHAMPAGNE} opacity={0.42} /></mesh>
          <mesh position={[0, 0.05, 0.04]} frustumCulled={false}><boxGeometry args={[0.34, 0.008, 0.008]} /><GoldLineMaterial opacity={0.28} /></mesh>
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
        if (object instanceof THREE.Mesh) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          const transparentAccent = materials.some((material) => material.transparent
            && !(material instanceof THREE.ShaderMaterial && "uCavity" in material.uniforms));
          object.renderOrder = transparentAccent ? 11 : 10;
          for (let index = 0; index < materials.length; index += 1) {
            const material = materials[index];
            const emissiveIntensity = material instanceof THREE.MeshStandardMaterial ? material.emissiveIntensity : null;
            const shaderOpacity = material instanceof THREE.ShaderMaterial
              ? material.uniforms.uOpacity as { value: number } | undefined
              : undefined;
            const shaderVaultOpacity = material instanceof THREE.ShaderMaterial
              ? material.uniforms.uVaultOpacity as { value: number } | undefined
              : undefined;
            materialSnapshots.current.push({
              station,
              material,
              opacity: material.opacity,
              transparent: material.transparent,
              depthWrite: material.depthWrite,
              emissiveIntensity,
              shaderOpacity: shaderOpacity ?? null,
              shaderVaultOpacity: shaderVaultOpacity ?? null,
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
        if (entry.shaderVaultOpacity) entry.shaderVaultOpacity.value = 1;
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
      entry.material.opacity = entry.opacity * stationWeight * opacity;
      entry.material.transparent = effectiveWeight < 0.999;
      entry.material.depthWrite = effectiveWeight > 0.96 ? entry.depthWrite : false;
      if (entry.emissiveIntensity !== null && entry.material instanceof THREE.MeshStandardMaterial) {
        entry.material.emissiveIntensity = entry.emissiveIntensity * stationWeight * opacity;
      }
      if (entry.shaderOpacity) entry.shaderOpacity.value = stationWeight;
      if (entry.shaderVaultOpacity) entry.shaderVaultOpacity.value = opacity;
    }
    for (let index = 0; index < lightSnapshots.current.length; index += 1) {
      const entry = lightSnapshots.current[index];
      entry.light.intensity = entry.intensity * stationWeights.current[entry.station] * opacity;
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

      {auraResources && <points geometry={auraResources.geometry} material={auraResources.material} frustumCulled={false} renderOrder={12} dispose={null} />}
    </group>
  );
}

export default ActFourSculptures;
