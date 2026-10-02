"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { ActFourPhase } from "@/types/actFour";

const PARTICLE_COUNT = 9400;
const SATURN_POSITION: [number, number, number] = [7.5, 0.72, -5.0];

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function seeded(index: number, offset: number) {
  const value = Math.sin((index + offset) * 91.731) * 43758.5453;
  return value - Math.floor(value);
}

type ParticleSeed = {
  isRing: boolean;
  angle: number;
  phi: number;
  radius: number;
  ringRadius: number;
  ringHeight: number;
  speed: number;
  color: THREE.Color;
};

export default function ActFiveWorld({
  scrollProgress,
  actFourPhase,
}: {
  scrollProgress: number;
  actFourPhase: ActFourPhase;
}) {
  const rootRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const cloud = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const palette = ["#b8143b", "#ea3159", "#ff7590", "#f6c1cc", "#408da3"];
    const seeds: ParticleSeed[] = [];

    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      const color = new THREE.Color(palette[index % palette.length]);
      seeds.push({
        isRing: index < PARTICLE_COUNT * 0.52,
        angle: seeded(index, 3) * Math.PI * 2,
        phi: Math.acos(1 - seeded(index, 11) * 2),
        radius: 1.42 + seeded(index, 17) * 0.28,
        ringRadius: 2.12 + seeded(index, 23) * 1.48,
        ringHeight: (seeded(index, 29) - 0.5) * 0.12,
        speed: 0.1 + seeded(index, 31) * 0.22,
        color,
      });
      const i3 = index * 3;
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return { geometry, positions, seeds };
  }, []);
  const material = useMemo(() => new THREE.PointsMaterial({
    size: 0.038,
    vertexColors: true,
    transparent: true,
    opacity: 0,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  }), []);

  useFrame((state, delta) => {
    const reveal = smoothstep(0.902, 0.922, scrollProgress) * (1 - smoothstep(0.997, 0.999, scrollProgress));
    const active = actFourPhase !== "inside" && actFourPhase !== "warping";
    const visibility = active ? reveal : 0;
    const time = state.clock.getElapsedTime();

    if (rootRef.current) {
      rootRef.current.visible = visibility > 0.002;
      rootRef.current.scale.setScalar(THREE.MathUtils.damp(rootRef.current.scale.x, 1.55 + visibility * 0.28, 5.2, delta));
      rootRef.current.rotation.y = time * (0.05 + visibility * 0.05);
      rootRef.current.rotation.z = 0;
    }

    material.opacity = THREE.MathUtils.damp(material.opacity, visibility * 0.8, 6, delta);
    if (!pointsRef.current || visibility < 0.001) return;

    cloud.seeds.forEach((seed, index) => {
      const i3 = index * 3;
      if (seed.isRing) {
        // The whole ring shares one orbital speed so it stays a precise ellipse.
        const angle = seed.angle + time * 0.16;
        const orbitRadius = seed.ringRadius + Math.sin(seed.angle * 9 + time * 0.38) * 0.024;
        const x = Math.cos(angle) * orbitRadius;
        const z = Math.sin(angle) * orbitRadius;
        cloud.positions[i3] = x;
        cloud.positions[i3 + 1] = seed.ringHeight - z * 0.48;
        cloud.positions[i3 + 2] = seed.ringHeight * 0.48 + z * 0.88;
      } else {
        const theta = seed.angle + time * (0.1 + seed.speed * 0.25);
        const sinPhi = Math.sin(seed.phi);
        const radius = seed.radius + Math.sin(time * 0.55 + seed.phi * 12) * 0.026;
        cloud.positions[i3] = Math.cos(theta) * sinPhi * radius;
        cloud.positions[i3 + 1] = Math.cos(seed.phi) * radius;
        cloud.positions[i3 + 2] = Math.sin(theta) * sinPhi * radius;
      }
    });
    (pointsRef.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  });

  return (
    <group ref={rootRef} position={SATURN_POSITION} scale={1.55}>
      <mesh>
        <sphereGeometry args={[1.62, 36, 36]} />
        <meshBasicMaterial color="#b8143b" transparent opacity={0.1} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <pointLight color="#ff1744" intensity={1.35} distance={12} decay={2} />
      <pointLight position={[0.15, 0.45, 1.1]} color="#ffd5de" intensity={0.5} distance={8} decay={2} />
      <pointLight position={[-1.8, 0, 0.4]} color="#408da3" intensity={0.15} distance={6} decay={2} />
      <points ref={pointsRef} geometry={cloud.geometry} material={material} frustumCulled={false} />
    </group>
  );
}
