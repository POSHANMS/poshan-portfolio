"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const PARTICLE_COUNT = 20000;
const NEBULA_SIZE = 3.85;
const CLOUD_DEPTH = 0.5;
const GOLDEN_ANGLE = 2.399963229728653;

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function seeded(index: number, offset: number) {
  const value = Math.sin((index + offset) * 78.233) * 24634.6345;
  return value - Math.floor(value);
}

type NebulaSeed = {
  index: number;
  unit: number;
  randA: number;
  randB: number;
  randC: number;
};

/**
 * A direct R3F adaptation of the supplied Rose Nebula field. The cloud itself
 * stays fixed; only the camera makes a restrained cinematic orbit around it.
 */
export default function ActSixWorld({ scrollProgress }: { scrollProgress: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const { geometry, positions, seeds } = useMemo(() => {
    const nextPositions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const nextSeeds: NebulaSeed[] = [];

    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      const randA = seeded(index + 1, 13);
      const randB = seeded(index + 1, 79);
      const randC = seeded(index + 1, 41);
      const unit = index / PARTICLE_COUNT;
      const i3 = index * 3;
      const color = new THREE.Color();

      if (unit < 0.7) {
        const local = unit / 0.7;
        const layerScale = Math.min(6, Math.floor(local * 7)) / 6;
        const along = (local * 7) % 1;
        color.setHSL(0.992 + randC * 0.026, 0.76 + randB * 0.2, 0.17 + Math.pow(Math.sin(Math.PI * along), 0.45) * 0.38 - layerScale * 0.035 - randA * 0.06);
      } else if (unit < 0.84) {
        color.setHSL(0.014 + randC * 0.034, 0.52 + randA * 0.28, 0.56 + (1 - (unit - 0.7) / 0.14) * 0.32);
      } else if (unit < 0.96) {
        color.setHSL(0.99 + randC * 0.025, 0.56 + randA * 0.28, 0.1 + randB * 0.2);
      } else {
        color.setHSL(0.015 + randC * 0.02, 0.14 + randA * 0.26, 0.35 + randB * 0.45);
      }

      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
      nextSeeds.push({ index, unit, randA, randB, randC });
    }

    const nextGeometry = new THREE.BufferGeometry();
    nextGeometry.setAttribute("position", new THREE.BufferAttribute(nextPositions, 3).setUsage(THREE.DynamicDrawUsage));
    nextGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return { geometry: nextGeometry, positions: nextPositions, seeds: nextSeeds };
  }, []);
  const material = useMemo(() => new THREE.PointsMaterial({
    size: 0.032,
    vertexColors: true,
    transparent: true,
    opacity: 0,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  }), []);

  useFrame((state, delta) => {
    const reveal = smoothstep(0.956, 0.965, scrollProgress);
    const time = state.clock.getElapsedTime();
    material.opacity = THREE.MathUtils.damp(material.opacity, reveal * 0.92, 5, delta);

    if (groupRef.current) {
      groupRef.current.visible = reveal > 0.002;
      // A fixed three-quarter view exposes the petals and depth without spinning the field.
      groupRef.current.rotation.set(-Math.PI / 2 + 0.28, 0.12, -0.1);
      groupRef.current.scale.setScalar(THREE.MathUtils.damp(groupRef.current.scale.x, 1.36 + reveal * 0.12, 5, delta));
    }

    if (!pointsRef.current || reveal < 0.001) return;

    seeds.forEach((seed, arrayIndex) => {
      const i3 = arrayIndex * 3;
      const signedA = seed.randA * 2 - 1;
      const signedB = seed.randB * 2 - 1;
      const signedC = seed.randC * 2 - 1;
      let px = 0;
      let py = 0;
      let pz = 0;

      if (seed.unit < 0.7) {
        const local = seed.unit / 0.7;
        const layerPosition = local * 7;
        const layer = Math.min(6, Math.floor(layerPosition));
        const along = layerPosition - layer;
        const layerScale = layer / 6;
        const petalCount = 7 + layer;
        const petal = Math.floor(along * petalCount);
        const petalAlong = along * petalCount - petal;
        const petalArc = Math.sin(Math.PI * petalAlong);
        const breathing = 1 + 0.03 * Math.sin(time * 0.75 + layer * 0.9);
        const baseAngle = (petal / petalCount) * Math.PI * 2 + layer * GOLDEN_ANGLE * 0.34;
        const curlAngle = baseAngle + 1.15 * (petalAlong - 0.18) * (0.75 + layerScale * 0.85) + signedC * 0.032;
        const radialStart = NEBULA_SIZE * (0.08 + layerScale * 0.43);
        const radialGrowth = NEBULA_SIZE * (0.2 + layerScale * 0.22) * petalAlong;
        const radialRipple = NEBULA_SIZE * 0.011 * Math.sin(petalAlong * 13 + layer * 2.1 + time * 0.16);
        const radius = (radialStart + radialGrowth + radialRipple) * breathing;
        const petalWidth = NEBULA_SIZE * (0.025 + layerScale * 0.055) * petalArc * (0.35 + 0.65 * seed.randB);
        const sideOffset = signedA * petalWidth;
        const tangent = curlAngle + Math.PI * 0.5;
        px = Math.cos(curlAngle) * radius + Math.cos(tangent) * sideOffset;
        pz = Math.sin(curlAngle) * radius + Math.sin(tangent) * sideOffset;
        py = signedB * CLOUD_DEPTH * petalArc * (0.35 + layerScale * 0.95) + Math.sin(curlAngle * 3 - time * 0.1 + layer) * CLOUD_DEPTH * 0.08;
      } else if (seed.unit < 0.84) {
        const local = (seed.unit - 0.7) / 0.14;
        const coreRadius = NEBULA_SIZE * 0.16 * Math.pow(local, 0.36);
        const theta = seed.index * GOLDEN_ANGLE;
        const coreY = 1 - 2 * seed.randB;
        const coreRing = Math.sqrt(Math.max(0, 1 - coreY * coreY));
        const pulse = 1 + 0.11 * Math.sin(time * 1.5 + seed.index * 0.013);
        px = Math.cos(theta) * coreRing * coreRadius * pulse;
        py = coreY * coreRadius * pulse;
        pz = Math.sin(theta) * coreRing * coreRadius * pulse;
      } else if (seed.unit < 0.96) {
        const local = (seed.unit - 0.84) / 0.12;
        const haloAngle = seed.index * GOLDEN_ANGLE;
        const haloRadius = NEBULA_SIZE * (0.72 + local * 0.66 + signedA * 0.08);
        const haloWarp = 1 + 0.07 * Math.sin(haloAngle * 5 + time * 0.1) + 0.025 * Math.sin(haloAngle * 11 - time * 0.08);
        px = Math.cos(haloAngle) * haloRadius * haloWarp;
        pz = Math.sin(haloAngle) * haloRadius * haloWarp;
        py = signedB * CLOUD_DEPTH * (1.2 + local * 1.8) + Math.sin(haloAngle * 2 + time * 0.08) * CLOUD_DEPTH * 0.18;
      } else {
        const local = (seed.unit - 0.96) / 0.04;
        const theta = seed.index * GOLDEN_ANGLE;
        const starY = signedB;
        const starRing = Math.sqrt(Math.max(0, 1 - starY * starY));
        const radius = NEBULA_SIZE * (1.25 + local * 1.1 + seed.randA * 0.55);
        px = Math.cos(theta) * starRing * radius;
        py = starY * radius * 0.72;
        pz = Math.sin(theta) * starRing * radius;
      }

      positions[i3] = px;
      positions[i3 + 1] = py;
      positions[i3 + 2] = pz;
    });
    (pointsRef.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  });

  return (
    <group ref={groupRef} position={[0.1, 0.12, -7.6]} scale={0.001}>
      <pointLight color="#ff2038" intensity={2.8} distance={14} decay={2} />
      <pointLight position={[-1.2, 0.5, 1.6]} color="#ffc3b6" intensity={0.72} distance={8} decay={2} />
      <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
    </group>
  );
}
