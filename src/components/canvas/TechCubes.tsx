"use client";

import React, { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import TechCube from "./TechCube";

// ═══════════════════════════════════════════════════════════════════════
// ORBITAL CONFIG — 4 cubes, different radii / heights / speeds = NO COLLISION
// ═══════════════════════════════════════════════════════════════════════
const ORBIT_CONFIG = [
  {
    color: "#ff1744",
    glowColor: "#ff4444",
    logoPath: "/icons/react.svg",
    radius: 3.5,
    phase: 0,
    yOffset: 1.4,
    selfRot: { x: 0.0015, y: 0.003, z: 0.001 },
    scale: 0.765,
  },
  {
    color: "#ff1744",
    glowColor: "#ff3355",
    logoPath: "/icons/node.svg",
    radius: 4.2,
    phase: Math.PI / 2,
    yOffset: 2.0,
    selfRot: { x: 0.0025, y: 0.002, z: 0.001 },
    scale: 0.684,
  },
  {
    color: "#ff1744",
    glowColor: "#ff5566",
    logoPath: "/icons/typescript.svg",
    radius: 3.8,
    phase: Math.PI,
    yOffset: -0.4,
    selfRot: { x: 0.002, y: 0.0035, z: 0.0015 },
    scale: 0.612,
  },
  {
    color: "#ff1744",
    glowColor: "#ff2244",
    logoPath: "/icons/mongodb.svg",
    radius: 4.6,
    phase: (3 * Math.PI) / 2,
    yOffset: -1.0,
    selfRot: { x: 0.001, y: 0.0025, z: 0.0015 },
    scale: 0.648,
  },
];

export default function TechCubes({ cubesOpacity = 1 }: { cubesOpacity?: number }) {
  const orbitRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();

  // Laptop world position (must match FloatingLaptop exactly)
  const laptopX = Math.max(0.8, viewport.width * 0.08);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (orbitRef.current) {
      // Faster orbital revolution around laptop
      orbitRef.current.rotation.y = t * 0.075;
      // Organic wobble so orbit isn't mechanically stiff
      orbitRef.current.rotation.z = Math.sin(t * 0.08) * 0.04;
      orbitRef.current.rotation.x = Math.cos(t * 0.06) * 0.03;
    }
  });

  return (
    <group position={[laptopX, -0.52, -1.34]}>
      {/* Orbit plane slightly tilted for cinematic depth */}
      <group rotation={[0.12, 0, 0.08]}>
        <group ref={orbitRef}>
          {ORBIT_CONFIG.map((cfg, i) => (
            <group
              key={i}
              position={[
                Math.cos(cfg.phase) * cfg.radius,
                cfg.yOffset,
                Math.sin(cfg.phase) * cfg.radius,
              ]}
            >
              <TechCube
                position={[0, 0, 0]}
                scale={cfg.scale}
                color={cfg.color}
                glowColor={cfg.glowColor}
                logoPath={cfg.logoPath}
                cubesOpacity={cubesOpacity}
                selfRot={cfg.selfRot}
                orbitIndex={i}
              />
            </group>
          ))}
        </group>
      </group>
    </group>
  );
}