"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ActFourPhase } from "@/types/actFour";
import { ACT_FOUR_CORE_POSITION, ACT_FOUR_PROJECT_STATIONS } from "@/animations/actFourChoreography";
import ProjectTelemetry from "./ProjectTelemetry";

const WARP_PARTICLE_COUNT = 1_900;
const VAULT_RADIUS = 36;

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function seeded(index: number, salt: number) {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function WarpStreamParticles({ phase, warpCharge }: { phase: ActFourPhase; warpCharge: React.RefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.LineBasicMaterial>(null);
  const startedAt = useRef(0);
  const previousPhase = useRef(phase);
  const { geometry, particles } = useMemo(() => {
    const positions = new Float32Array(WARP_PARTICLE_COUNT * 6);
    const colors = new Float32Array(WARP_PARTICLE_COUNT * 6);
    const seeds = Array.from({ length: WARP_PARTICLE_COUNT }, (_, index) => {
      const angle = seeded(index, 1) * Math.PI * 2;
      const radius = 0.7 + seeded(index, 2) * 0.43;
      const depth = seeded(index, 3);
      const speed = 0.72 + seeded(index, 4) * 0.78;
      const phaseOffset = seeded(index, 5);
      const curve = (seeded(index, 6) - 0.5) * 0.22;
      const tailColor = new THREE.Color("#ff2a4d");
      const headColor = new THREE.Color("#ffffff");
      colors.set([tailColor.r, tailColor.g, tailColor.b, headColor.r, headColor.g, headColor.b], index * 6);
      return { angle, radius, depth, speed, phaseOffset, curve };
    });
    const result = new THREE.BufferGeometry();
    result.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    result.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return { geometry: result, particles: seeds };
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    if (phase !== previousPhase.current) {
      previousPhase.current = phase;
      startedAt.current = time;
    }
    const inCharge = phase === "ready";
    const inFlight = phase === "warping";
    const onExit = phase === "returning";
    const exitProgress = onExit ? clamp((time - startedAt.current) / 1.2) : 0;
    const charge = inCharge ? clamp(warpCharge.current ?? 0) : inFlight ? 1 : onExit ? 0.86 * (1 - smoothstep(0.68, 1, exitProgress)) : 0;
    if (!groupRef.current || !materialRef.current) return;
    groupRef.current.visible = charge > 0.002;
    materialRef.current.opacity = THREE.MathUtils.damp(materialRef.current.opacity, charge * 0.92, 10, delta);
    if (charge <= 0.002) return;

    const camera = state.camera as THREE.PerspectiveCamera;
    const aspect = state.size.width / Math.max(1, state.size.height);
    const position = geometry.getAttribute("position") as THREE.BufferAttribute;
    const halfHeightAt = (depth: number) => Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * depth;
    const tailSpan = (0.025 + 0.115 * charge) * (inFlight ? 1.4 : 1);
    particles.forEach((particle, index) => {
      const travel = (particle.phaseOffset + time * (0.12 + charge * 0.96) * particle.speed) % 1;
      const pathPoint = (age: number) => {
        const depth = THREE.MathUtils.lerp(58, 1.2, age);
        const halfHeight = halfHeightAt(depth);
        const halfWidth = halfHeight * aspect;
        const funnel = Math.pow(age, 1.65);
        const radius = onExit
          ? THREE.MathUtils.lerp(0.13, particle.radius, age)
          : THREE.MathUtils.lerp(particle.radius, 0.12 + seeded(index, 7) * 0.13, funnel);
        const angle = particle.angle + Math.sin(time * 1.1 + particle.phaseOffset * 6.28 + age * 3.2) * particle.curve;
        const drift = Math.sin(time * 0.72 + particle.phaseOffset * 9.0) * 0.035 * charge;
        return new THREE.Vector3(
          Math.cos(angle) * halfWidth * radius + drift * halfWidth,
          Math.sin(angle) * halfHeight * radius + Math.cos(angle * 1.7 + time) * drift * halfHeight,
          -depth,
        );
      };
      const headAge = travel;
      const tailAge = Math.max(0, headAge - tailSpan);
      const tail = pathPoint(tailAge);
      const head = pathPoint(headAge);
      position.setXYZ(index * 2, tail.x, tail.y, tail.z);
      position.setXYZ(index * 2 + 1, head.x, head.y, head.z);
    });
    position.needsUpdate = true;
    groupRef.current.position.copy(camera.position);
    groupRef.current.quaternion.copy(camera.quaternion);
  });

  return (
    <group ref={groupRef} renderOrder={18}>
      <lineSegments geometry={geometry} frustumCulled={false} renderOrder={18}>
        <lineBasicMaterial ref={materialRef} vertexColors transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} depthTest={false} toneMapped={false} />
      </lineSegments>
    </group>
  );
}

function BreachFlash({ phase }: { phase: ActFourPhase }) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const start = useRef(0);
  const previousPhase = useRef(phase);

  useFrame((state) => {
    if (phase !== previousPhase.current) {
      previousPhase.current = phase;
      start.current = state.clock.getElapsedTime();
    }
    if (!groupRef.current || !materialRef.current) return;
    const elapsed = state.clock.getElapsedTime() - start.current;
    const progress = clamp(elapsed / 1.42);
    const flash = phase === "warping"
      ? smoothstep(0.78, 0.9, progress) * (1 - smoothstep(0.94, 1, progress))
      : 0;
    materialRef.current.opacity = flash * 0.74;
    groupRef.current.visible = phase === "warping" && flash > 0.005;
    groupRef.current.position.copy(state.camera.position);
    groupRef.current.quaternion.copy(state.camera.quaternion);
  });

  return (
    <group ref={groupRef} renderOrder={30}>
      <mesh position={[0, 0, -0.55]} frustumCulled={false} renderOrder={30}>
        <planeGeometry args={[30, 20]} />
        <meshBasicMaterial ref={materialRef} color="#fff0f3" transparent opacity={0} depthTest={false} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

const interiorVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const interiorFragmentShader = `
  uniform float uTime;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv - 0.5;
    float polar = atan(p.y, p.x);
    float horizon = exp(-pow(abs(p.y + 0.11 * sin(polar * 3.0 + uTime * 0.06)), 2.0) * 68.0);
    float ribA = pow(max(0.0, sin(vUv.x * 156.0 + sin(vUv.y * 28.0) * 1.8)), 32.0);
    float ribB = pow(max(0.0, sin(vUv.y * 94.0 + cos(vUv.x * 18.0) * 1.4)), 28.0);
    float atmosphere = horizon * 0.14 + (ribA + ribB) * 0.035;
    vec3 voidColor = vec3(0.004, 0.003, 0.008);
    vec3 crimson = vec3(0.12, 0.009, 0.025);
    vec3 color = mix(voidColor, crimson, atmosphere);
    gl_FragColor = vec4(color, uOpacity * (0.68 + atmosphere));
  }
`;

function InteriorVault({ phase }: { phase: ActFourPhase }) {
  const atmosphere = useRef<THREE.ShaderMaterial>(null);
  const shellRef = useRef<THREE.Group>(null);
  const ribsRef = useRef<THREE.MeshBasicMaterial>(null);
  const material = useMemo(() => ({ uTime: { value: 0 }, uOpacity: { value: 0 } }), []);
  const ribMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: "#661125", wireframe: true, transparent: true, opacity: 0, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }), []);
  const visible = phase === "inside" || phase === "returning";

  useFrame((state, delta) => {
    const entering = phase === "inside";
    const fade = entering ? 0.82 : 0;
    if (atmosphere.current) {
      atmosphere.current.uniforms.uTime.value = state.clock.getElapsedTime();
      atmosphere.current.uniforms.uOpacity.value = THREE.MathUtils.damp(atmosphere.current.uniforms.uOpacity.value, fade, entering ? 2.2 : 2.8, delta);
    }
    if (ribsRef.current) ribsRef.current.opacity = THREE.MathUtils.damp(ribsRef.current.opacity, entering ? 0.15 : 0, entering ? 2.2 : 2.8, delta);
    if (shellRef.current) shellRef.current.rotation.y = state.clock.getElapsedTime() * 0.009;
  });

  return (
    <group position={ACT_FOUR_CORE_POSITION} visible={visible}>
      <group ref={shellRef}>
        <mesh renderOrder={-16}>
          <sphereGeometry args={[VAULT_RADIUS, 72, 52]} />
          <meshBasicMaterial color="#060104" side={THREE.BackSide} depthWrite={false} depthTest={false} toneMapped={false} />
        </mesh>
        <mesh renderOrder={-15}>
          <sphereGeometry args={[VAULT_RADIUS - 0.08, 72, 52]} />
          <shaderMaterial ref={atmosphere} vertexShader={interiorVertexShader} fragmentShader={interiorFragmentShader} uniforms={material} transparent side={THREE.BackSide} depthWrite={false} depthTest={false} toneMapped={false} />
        </mesh>
        <mesh renderOrder={-14}>
          <icosahedronGeometry args={[VAULT_RADIUS - 0.4, 3]} />
          <primitive object={ribMaterial} ref={ribsRef} attach="material" />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={-13}>
          <torusGeometry args={[VAULT_RADIUS - 2.0, 0.035, 6, 240]} />
          <meshBasicMaterial color="#7e1428" transparent opacity={phase === "inside" ? 0.16 : 0} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, 0]} renderOrder={-13}>
          <torusGeometry args={[VAULT_RADIUS - 3.0, 0.028, 6, 240]} />
          <meshBasicMaterial color="#3b0d1b" transparent opacity={phase === "inside" ? 0.13 : 0} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

function DataEmbers({ phase }: { phase: ActFourPhase }) {
  const points = useRef<THREE.Points>(null);
  const material = useRef<THREE.PointsMaterial>(null);
  const { positions, basePositions, phases, colors } = useMemo(() => {
    const count = 1_050;
    const positionArray = new Float32Array(count * 3);
    const base = new Float32Array(count * 3);
    const colorArray = new Float32Array(count * 3);
    const phaseArray = new Float32Array(count);
    const ember = new THREE.Color("#ff3154");
    const gold = new THREE.Color("#ffae55");
    for (let index = 0; index < count; index += 1) {
      const y = seeded(index, 20) * 2 - 1;
      const angle = seeded(index, 21) * Math.PI * 2;
      const radius = 19 + seeded(index, 22) * 14;
      const horizontal = Math.sqrt(1 - y * y);
      const i3 = index * 3;
      base[i3] = Math.cos(angle) * horizontal * radius;
      base[i3 + 1] = y * radius;
      base[i3 + 2] = Math.sin(angle) * horizontal * radius;
      positionArray.set([base[i3], base[i3 + 1], base[i3 + 2]], i3);
      const color = ember.clone().lerp(gold, seeded(index, 23) * 0.42);
      colorArray.set([color.r, color.g, color.b], i3);
      phaseArray[index] = seeded(index, 24) * Math.PI * 2;
    }
    return { positions: positionArray, basePositions: base, phases: phaseArray, colors: colorArray };
  }, []);

  useFrame((state, delta) => {
    const active = phase === "inside";
    if (material.current) material.current.opacity = THREE.MathUtils.damp(material.current.opacity, active ? 0.46 : 0, 2.8, delta);
    if (!points.current) return;
    const attribute = points.current.geometry.getAttribute("position") as THREE.BufferAttribute;
    const time = state.clock.getElapsedTime();
    for (let index = 0; index < phases.length; index += 1) {
      const i3 = index * 3;
      const x = basePositions[i3];
      const y = basePositions[i3 + 1];
      const z = basePositions[i3 + 2];
      const phaseOffset = phases[index];
      // Curl-like drift: each ember's velocity is a smooth, divergence-free
      // sinusoidal curl sampled from its stable 3D position.
      const curlX = Math.sin(y * 0.13 + time * 0.19 + phaseOffset) - Math.cos(z * 0.11 - time * 0.13);
      const curlY = Math.sin(z * 0.12 + time * 0.16) - Math.cos(x * 0.1 + time * 0.18 + phaseOffset);
      const curlZ = Math.sin(x * 0.11 - time * 0.14 + phaseOffset) - Math.cos(y * 0.12 + time * 0.17);
      attribute.setXYZ(index, x + curlX * 0.42, y + curlY * 0.42, z + curlZ * 0.42);
    }
    attribute.needsUpdate = true;
  });

  return (
    <points ref={points} position={ACT_FOUR_CORE_POSITION} visible={phase === "inside" || phase === "returning"}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} usage={THREE.DynamicDrawUsage} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial ref={material} size={0.065} vertexColors transparent opacity={0} depthWrite={false} sizeAttenuation blending={THREE.AdditiveBlending} toneMapped={false} />
    </points>
  );
}

function HolographicMonitor({ index, projectIndex }: { index: number; projectIndex: number }) {
  const group = useRef<THREE.Group>(null);
  const slab = useRef<THREE.MeshPhysicalMaterial>(null);
  const rail = useRef<THREE.MeshBasicMaterial>(null);
  const activeFloat = useRef(projectIndex);
  const desired = useRef(0.1);
  const frameColor = index === 2 ? "#ff8d55" : index === 1 ? "#b58cff" : index === 3 ? "#7dffcf" : index === 4 ? "#ffbd70" : "#62dfff";

  useFrame((state, delta) => {
    if (!group.current) return;
    activeFloat.current = THREE.MathUtils.damp(activeFloat.current, projectIndex, 5.8, delta);
    const distance = Math.abs(index - activeFloat.current);
    const targetOpacity = 1 - Math.min(distance * 0.94, 0.97);
    desired.current = THREE.MathUtils.damp(desired.current, targetOpacity, 5.2, delta);
    group.current.visible = distance < 1.65;
    group.current.scale.setScalar(THREE.MathUtils.damp(group.current.scale.x, 0.84 + desired.current * 0.16, 6, delta));
    group.current.position.y = ACT_FOUR_PROJECT_STATIONS[index].y + Math.sin(state.clock.getElapsedTime() * 0.58 + index) * 0.035;
    if (slab.current) slab.current.opacity = THREE.MathUtils.damp(slab.current.opacity, 0.035 + desired.current * 0.22, 5, delta);
    if (rail.current) rail.current.opacity = THREE.MathUtils.damp(rail.current.opacity, 0.08 + desired.current * 0.65, 5, delta);
  });

  return (
    <group
      ref={group}
      position={ACT_FOUR_PROJECT_STATIONS[index]}
      rotation={[0, -THREE.MathUtils.degToRad(8), 0]}
      scale={0.84}
    >
      <mesh>
        <boxGeometry args={[5.52, 3.35, 0.2]} />
        <meshPhysicalMaterial ref={slab} color="#0a1019" transparent opacity={0.16} roughness={0.26} metalness={0.62} clearcoat={0.9} clearcoatRoughness={0.18} depthWrite={false} />
      </mesh>
      <ProjectTelemetry projectIndex={index} active={Math.abs(index - projectIndex) < 0.5} />
      <mesh position={[0, 0, 0.145]}>
        <planeGeometry args={[5.22, 3.08]} />
        <meshBasicMaterial color="#9adfff" wireframe transparent opacity={0.045} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={[0, 1.61, 0.15]}>
        <boxGeometry args={[5.42, 0.018, 0.026]} />
        <meshBasicMaterial ref={rail} color={frameColor} transparent opacity={0.48} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={[0, -1.61, 0.15]}>
        <boxGeometry args={[5.42, 0.018, 0.026]} />
        <meshBasicMaterial color="#ff3357" transparent opacity={0.38} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={[-2.69, 0, 0.15]}>
        <boxGeometry args={[0.018, 3.22, 0.026]} />
        <meshBasicMaterial color={frameColor} transparent opacity={0.42} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={[2.69, 0, 0.15]}>
        <boxGeometry args={[0.018, 3.22, 0.026]} />
        <meshBasicMaterial color={frameColor} transparent opacity={0.42} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={[-2.48, 1.42, 0.17]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.24, 0.025, 0.03]} />
        <meshBasicMaterial color="#fff0f3" transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={[2.48, -1.42, 0.17]}>
        <boxGeometry args={[0.24, 0.025, 0.03]} />
        <meshBasicMaterial color="#fff0f3" transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

function ProjectStations({ phase, projectIndex }: { phase: ActFourPhase; projectIndex: number }) {
  const root = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!root.current) return;
    root.current.visible = phase === "inside" || phase === "returning";
    root.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.1) * 0.008;
    root.current.scale.setScalar(THREE.MathUtils.damp(root.current.scale.x, phase === "inside" ? 1 : 0.001, 4.5, delta));
  });

  return (
    <group ref={root} scale={0.001}>
      {ACT_FOUR_PROJECT_STATIONS.map((_, index) => (
        <HolographicMonitor key={index} index={index} projectIndex={projectIndex} />
      ))}
    </group>
  );
}

function ActFourWorld({ phase, projectIndex, warpCharge }: { phase: ActFourPhase; projectIndex: number; warpCharge: React.RefObject<number> }) {
  return (
    <group>
      <WarpStreamParticles phase={phase} warpCharge={warpCharge} />
      <BreachFlash phase={phase} />
      <InteriorVault phase={phase} />
      <DataEmbers phase={phase} />
      <ProjectStations phase={phase} projectIndex={projectIndex} />
    </group>
  );
}

export default ActFourWorld;
