"use client";

import React, { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import TechCube from "./TechCube";

type CubeRole = "INTERFACE" | "RUNTIME" | "SYSTEMS" | "DATA";

const CUBE_CONFIG: {
  color: string;
  glowColor: string;
  logoPath: string;
  radius: number;
  phase: number;
  yOffset: number;
  scale: number;
  role: CubeRole;
  vaultPosition: [number, number, number];
  selfRot: { x: number; y: number; z: number };
}[] = [
  { color: "#ff1744", glowColor: "#ff4444", logoPath: "/icons/react.svg", radius: 3.5, phase: 0, yOffset: 1.4, scale: 0.82, role: "INTERFACE", vaultPosition: [-2.18, 1.25, -3.2], selfRot: { x: 0.0015, y: 0.003, z: 0.001 } },
  { color: "#ff1744", glowColor: "#ff3355", logoPath: "/icons/node.svg", radius: 4.2, phase: Math.PI / 2, yOffset: 2.0, scale: 0.74, role: "RUNTIME", vaultPosition: [2.18, 1.25, -3.2], selfRot: { x: 0.0025, y: 0.002, z: 0.001 } },
  { color: "#ff1744", glowColor: "#ff5566", logoPath: "/icons/typescript.svg", radius: 3.8, phase: Math.PI, yOffset: -0.4, scale: 0.67, role: "SYSTEMS", vaultPosition: [-2.18, -1.15, -3.2], selfRot: { x: 0.002, y: 0.0035, z: 0.0015 } },
  { color: "#ff1744", glowColor: "#ff2244", logoPath: "/icons/mongodb.svg", radius: 4.6, phase: (3 * Math.PI) / 2, yOffset: -1.0, scale: 0.71, role: "DATA", vaultPosition: [2.18, -1.15, -3.2], selfRot: { x: 0.001, y: 0.0025, z: 0.0015 } },
];

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function VaultBeacon({ strength }: { strength: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.MeshBasicMaterial>(null);
  const haloRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.visible = strength > 0.005;
      groupRef.current.rotation.y = t * 0.18;
      groupRef.current.scale.setScalar(0.7 + strength * 0.32 + Math.sin(t * 2.1) * strength * 0.025);
    }
    if (coreRef.current) coreRef.current.opacity = strength * (0.62 + Math.sin(t * 2.6) * 0.1);
    if (haloRef.current) haloRef.current.opacity = strength * 0.09;
  });

  return (
    <group ref={groupRef} position={[0, 0.05, -3.9]} visible={false}>
      <mesh rotation={[0.25, 0.35, 0]}>
        <octahedronGeometry args={[0.24, 2]} />
        <meshBasicMaterial ref={coreRef} color="#fff5f6" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh scale={2.9}>
        <sphereGeometry args={[0.23, 32, 32]} />
        <meshBasicMaterial ref={haloRef} color="#ff1744" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

export default function TechCubes({ cubesOpacity = 1, scrollProgress = 0 }: { cubesOpacity?: number; scrollProgress?: number }) {
  const cubeRefs = useRef<THREE.Group[]>([]);
  const hoverFieldFrame = useRef(0);
  const { viewport } = useThree();
  const laptopX = Math.max(0.8, viewport.width * 0.08);
  const vaultStrength = smoothstep(0.55, 0.625, scrollProgress) * (1 - smoothstep(0.805, 0.85, scrollProgress));
  const exitStrength = smoothstep(0.805, 0.87, scrollProgress);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    CUBE_CONFIG.forEach((config, index) => {
      const cube = cubeRefs.current[index];
      if (!cube) return;

      const orbitAngle = t * 0.075 + config.phase;
      const orbit = new THREE.Vector3(
        laptopX + Math.cos(orbitAngle) * config.radius,
        -0.52 + config.yOffset + Math.sin(t * 0.6 + index) * 0.14,
        -1.34 + Math.sin(orbitAngle) * config.radius,
      );
      const vault = new THREE.Vector3(...config.vaultPosition);
      vault.x += Math.sin(t * 0.52 + index * 1.8) * 0.07;
      vault.y += Math.cos(t * 0.68 + index * 1.25) * 0.08;
      const target = orbit.clone().lerp(vault, vaultStrength).lerp(orbit, exitStrength);

      cube.position.lerp(target, 0.075);
      cube.rotation.z = THREE.MathUtils.lerp(cube.rotation.z, vaultStrength * (index < 2 ? -0.035 : 0.035), 0.05);
      cube.scale.setScalar(config.scale * cubesOpacity * (1 + Math.sin(t * 1.9 + index) * vaultStrength * 0.025));
    });

    // Keep the DOM hover fields attached to the rendered cube centers. This
    // follows the actual camera and world transforms instead of guessing with
    // viewport coordinates.
    hoverFieldFrame.current += 1;
    if (typeof window !== "undefined" && hoverFieldFrame.current % 4 === 0) {
      const targets = CUBE_CONFIG.flatMap((config, index) => {
        const cube = cubeRefs.current[index];
        if (!cube) return [];

        cube.updateWorldMatrix(true, false);
        const screenPosition = cube.getWorldPosition(new THREE.Vector3()).project(state.camera);
        return [{
          role: config.role,
          x: (screenPosition.x * 0.5 + 0.5) * 100,
          y: (-screenPosition.y * 0.5 + 0.5) * 100,
        }];
      });

      window.dispatchEvent(new CustomEvent("cube-vault-targets", { detail: { targets } }));
    }
  });

  return (
    <group>
      {CUBE_CONFIG.map((config, index) => (
        <group key={config.role} ref={(group) => { if (group) cubeRefs.current[index] = group; }}>
          <TechCube
            position={[0, 0, 0]}
            scale={1}
            color={config.color}
            glowColor={config.glowColor}
            logoPath={config.logoPath}
            cubesOpacity={cubesOpacity}
            selfRot={config.selfRot}
            orbitIndex={index}
            onHoverChange={(hovered) => {
              if (typeof window === "undefined") return;
              window.dispatchEvent(new CustomEvent("cube-relay-hover", { detail: { role: hovered ? config.role : null } }));
            }}
          />
        </group>
      ))}
      <VaultBeacon strength={vaultStrength * cubesOpacity} />
    </group>
  );
}
