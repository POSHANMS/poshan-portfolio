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