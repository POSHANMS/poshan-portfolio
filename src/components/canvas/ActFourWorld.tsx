"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ActFourPhase } from "@/types/actFour";
import { PROJECTS } from "@/utils/constants";

const CORE_POSITION: [number, number, number] = [4.5, 2.5, -8];

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

const livingWorldVertex = `
  varying vec3 vPosition;
  varying vec2 vUv;
  void main() {
    vPosition = position;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const livingWorldFragment = `
  uniform float uTime;
  uniform float uOpacity;
  varying vec3 vPosition;
  varying vec2 vUv;

  void main() {
    float waveA = sin(vPosition.x * 0.48 + uTime * 0.34);
    float waveB = cos(vPosition.y * 0.8 - uTime * 0.27);
    float waveC = sin((vPosition.z + vPosition.x * 0.7) * 0.54 + uTime * 0.22);
    float current = waveA * 0.36 + waveB * 0.3 + waveC * 0.24;
    float flow = sin((vUv.y * 16.0 + current * 1.6) - uTime * 0.38) * 0.5 + 0.5;
    float ribbons = smoothstep(0.38, 0.74, flow);
    float bloom = smoothstep(0.48, 0.98, sin((vUv.x * 8.0 - vUv.y * 5.0) + uTime * 0.2) * 0.5 + 0.5);
    vec3 voidColor = vec3(0.035, 0.0005, 0.006);
    vec3 ember = vec3(0.50, 0.004, 0.040);
    vec3 crimson = vec3(0.96, 0.020, 0.105);
    vec3 rose = vec3(1.0, 0.24, 0.34);
    vec3 color = mix(voidColor, ember, 0.48 + current * 0.18);
    color = mix(color, crimson, ribbons * 0.56);
    color = mix(color, rose, bloom * ribbons * 0.18);
    gl_FragColor = vec4(color, uOpacity);
  }
`;

function WarpSpeedTunnel({ phase }: { phase: ActFourPhase }) {
  const materialRef = useRef<THREE.LineBasicMaterial>(null);
  const tunnelRef = useRef<THREE.Group>(null);
  const { geometry, seeds } = useMemo(() => {
    const random = (index: number) => {
      const value = Math.sin(index * 198.17) * 43758.5453;
      return value - Math.floor(value);
    };
    const count = 900;
    const positions = new Float32Array(count * 6);
    const colors = new Float32Array(count * 6);
    const seedData: { angle: number; radius: number; depth: number; length: number; speed: number }[] = [];
    for (let index = 0; index < count; index += 1) {
      const angle = random(index) * Math.PI * 2;
      const radius = 0.22 + random(index + 31) * 1.22;
      const depth = 3 + random(index + 62) * 76;
      seedData.push({ angle, radius, depth, length: 0.35 + random(index + 93) * 1.8, speed: 0.7 + random(index + 124) * 1.8 });
      const color = index % 5 === 0 ? new THREE.Color("#fff5f6") : new THREE.Color(index % 2 === 0 ? "#ff2048" : "#ff8aa0");
      colors.set([color.r, color.g, color.b, color.r, color.g, color.b], index * 6);
    }
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    lineGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return { geometry: lineGeometry, seeds: seedData };
  }, []);

  useFrame((state, delta) => {
    const warping = phase === "warping" ? 1 : 0;
    const attr = geometry.getAttribute("position") as THREE.BufferAttribute;
    const time = state.clock.getElapsedTime();

    seeds.forEach((seed, index) => {
      const distance = 3 + ((seed.depth - time * seed.speed * (0.6 + warping * 36) + index * 0.43) % 78 + 78) % 78;
      const z = -distance;
      const spread = seed.radius * (0.16 + distance * 0.31);
      const x = Math.cos(seed.angle) * spread;
      const y = Math.sin(seed.angle) * spread * 0.62;
      const stretch = seed.length * (1 + warping * 54);
      attr.setXYZ(index * 2, x, y, z);
      attr.setXYZ(index * 2 + 1, x * 1.12, y * 1.12, z - stretch);
    });
    attr.needsUpdate = true;

    if (materialRef.current) {
      materialRef.current.opacity = THREE.MathUtils.damp(materialRef.current.opacity, warping ? 1 : 0, 13, delta);
    }
    if (tunnelRef.current) {
      tunnelRef.current.position.copy(state.camera.position);
      tunnelRef.current.quaternion.copy(state.camera.quaternion);
    }
  });

  return (
    <group ref={tunnelRef} renderOrder={12}>
      <lineSegments geometry={geometry} frustumCulled={false} renderOrder={12}>
        <lineBasicMaterial ref={materialRef} vertexColors transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} depthTest={false} />
      </lineSegments>
    </group>
  );
}

function LivingCore({ phase }: { phase: ActFourPhase }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const veilRef = useRef<THREE.MeshBasicMaterial>(null);
  const coreRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    // The interior is a self-contained destination. It clears before the exterior world returns.
    const active = phase === "inside";
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      materialRef.current.uniforms.uOpacity.value = THREE.MathUtils.damp(materialRef.current.uniforms.uOpacity.value, active ? 1 : 0, 8, delta);
    }
    if (veilRef.current) {
      veilRef.current.opacity = THREE.MathUtils.damp(veilRef.current.opacity, active ? 0.34 : 0, 8, delta);
    }
    if (coreRef.current) coreRef.current.rotation.y += delta * 0.028;
  });

  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uOpacity: { value: 0 } }), []);

  return (
    <group position={CORE_POSITION} visible={phase === "inside"}>
      <group ref={coreRef}>
        <mesh renderOrder={-11} scale={[1.01, 0.77, 1.01]}>
          <sphereGeometry args={[13, 64, 40]} />
          <meshBasicMaterial ref={veilRef} color="#310008" transparent opacity={0} side={THREE.BackSide} depthWrite={false} depthTest={false} />
        </mesh>
        <mesh renderOrder={-10} scale={[1, 0.76, 1]}>
          <sphereGeometry args={[13, 64, 40]} />
          <shaderMaterial ref={materialRef} vertexShader={livingWorldVertex} fragmentShader={livingWorldFragment} uniforms={uniforms} transparent side={THREE.BackSide} depthWrite={false} depthTest={false} />
        </mesh>
      </group>
    </group>
  );
}

function createProjectTexture(projectIndex: number) {
  const project = PROJECTS[projectIndex];
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 640;
  const context = canvas.getContext("2d");
  if (!context) return new THREE.CanvasTexture(canvas);

  const colors = [["#3a0011", "#ff1744", "#ff95a6"], ["#120015", "#bb176d", "#ff5a75"], ["#220008", "#d53122", "#ff9a5b"], ["#14060c", "#9b0a48", "#ff4778"], ["#09020d", "#5a126f", "#fb4c83"]] as const;
  const [base, signal, glow] = colors[projectIndex % colors.length];
  const background = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  background.addColorStop(0, "#050508");
  background.addColorStop(0.52, base);
  background.addColorStop(1, "#090106");
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const radial = context.createRadialGradient(canvas.width * 0.68, canvas.height * 0.42, 10, canvas.width * 0.68, canvas.height * 0.42, canvas.width * 0.54);
  radial.addColorStop(0, glow);
  radial.addColorStop(0.22, signal + "b0");
  radial.addColorStop(1, "transparent");
  context.fillStyle = radial;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.save();
  context.translate(canvas.width * 0.68, canvas.height * 0.45);
  context.rotate(-0.16 + projectIndex * 0.06);
  context.strokeStyle = glow;
  context.lineWidth = 4;
  context.shadowColor = signal;
  context.shadowBlur = 24;
  context.strokeRect(-185, -145, 370, 290);
  context.lineWidth = 1;
  context.strokeRect(-158, -118, 316, 236);
  context.restore();

  context.fillStyle = "rgba(255,248,250,0.96)";
  context.font = "700 76px Arial";
  context.fillText(project.name.toUpperCase(), 62, 148);
  context.fillStyle = glow;
  context.font = "600 24px monospace";
  context.fillText(project.subtitle.toUpperCase(), 66, 192);
  context.fillStyle = "rgba(255,235,239,0.82)";
  context.font = "18px monospace";
  project.stack.slice(0, 4).forEach((item, index) => context.fillText(`// ${item}`, 68, 314 + index * 42));
  context.fillStyle = signal;
  context.fillRect(68, 360 + project.stack.slice(0, 4).length * 42, 245, 3);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function OrbitProjectCard({ index, activeFloat }: { index: number; activeFloat: number }) {
  const project = PROJECTS[index];
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const glassRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const texture = useMemo(() => (typeof document === "undefined" ? null : createProjectTexture(index)), [index]);
  const displayOffset = useRef(index - activeFloat);
  const targetOffset = index - activeFloat;

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    // The previous and next project plates share a short orbital handoff instead
    // of blinking between indices. This keeps the journey readable at any speed.
    displayOffset.current = THREE.MathUtils.damp(displayOffset.current, targetOffset, 5.2, delta);
    const offset = displayOffset.current;
    const absoluteOffset = Math.abs(offset);
    const x = offset * 7.2;
    const z = -5.15 + absoluteOffset * 0.82;
    const y = Math.sin(offset * Math.PI) * 0.14;
    const opacity = clamp(1 - smoothstep(0.12, 1.1, absoluteOffset), 0, 1);

    groupRef.current.visible = opacity > 0.008;
    groupRef.current.position.lerp(new THREE.Vector3(x, y + Math.sin(state.clock.getElapsedTime() * 0.8 + index) * 0.07, z), 1 - Math.exp(-delta * 6));
    groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, -offset * 0.13, 6, delta);
    const scale = 1.08 - Math.min(absoluteOffset * 0.12, 0.18);
    groupRef.current.scale.setScalar(THREE.MathUtils.damp(groupRef.current.scale.x, scale, 6, delta));
    if (materialRef.current) materialRef.current.opacity = THREE.MathUtils.damp(materialRef.current.opacity, opacity * 0.88, 6, delta);
    if (glassRef.current) glassRef.current.opacity = THREE.MathUtils.damp(glassRef.current.opacity, opacity * 0.22, 6, delta);
  });

  return (
    <group ref={groupRef} position={[targetOffset * 7.2, 0, -5.15]}>
      <mesh position={[0, 0, -0.03]}>
        <planeGeometry args={[5.85, 3.94]} />
        <meshPhysicalMaterial ref={glassRef} color="#ff5c73" transparent opacity={0.1} transmission={0.18} roughness={0.16} metalness={0.12} clearcoat={1} clearcoatRoughness={0.08} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <planeGeometry args={[5.25, 3.45]} />
        <meshBasicMaterial ref={materialRef} map={texture} transparent opacity={0.1} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, 0.015]}>
        <planeGeometry args={[5.25, 3.45]} />
        <meshBasicMaterial color="#ffb0bd" wireframe transparent opacity={0.18} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh position={[2.18, -1.3, 0.06]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.36, 0.36, 0.025]} />
        <meshBasicMaterial color="#fff4f5" transparent opacity={0.78} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

function ProjectOrbit({ phase, projectIndex }: { phase: ActFourPhase; projectIndex: number }) {
  const rootRef = useRef<THREE.Group>(null);
  const activeFloat = projectIndex;

  useFrame((state, delta) => {
    if (!rootRef.current) return;
    const active = phase === "inside";
    const targetScale = active ? 1 : 0.001;
    rootRef.current.scale.setScalar(THREE.MathUtils.damp(rootRef.current.scale.x, targetScale, 7, delta));
    rootRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.12) * 0.035;
  });

  return (
    <group ref={rootRef} position={CORE_POSITION} scale={0.001} visible={phase === "inside"}>
      {PROJECTS.map((_, index) => <OrbitProjectCard key={PROJECTS[index].name} index={index} activeFloat={activeFloat} />)}
    </group>
  );
}

export default function ActFourWorld({ phase, projectIndex }: { phase: ActFourPhase; projectIndex: number }) {
  return (
    <group>
      <LivingCore phase={phase} />
      <ProjectOrbit phase={phase} projectIndex={projectIndex} />
    </group>
  );
}
