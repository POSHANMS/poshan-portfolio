"use client";

import React from "react";
import { Grid } from "@react-three/drei";
import * as THREE from "three";

export default function NeonGrid() {
  return (
    <group position={[0, -1.82, 0]}>

      {/* ── Reflective dark base plane ────────────────────────────────────
          Sits at Y = -0.12, clearly BELOW the Grid lines (Y = 0.012 / 0.016)
          to avoid z-fighting. Uses a custom shader-style dark chrome look:
          two additive glow layers fake the "reflection" of grid lines. ── */}

      {/* Base dark chrome surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial
          color="#020205"
          metalness={0.88}
          roughness={0.18}
          envMapIntensity={0.6}
          depthWrite={false}
        />
      </mesh>

      {/* Fake reflection glow — crimson grid reflection (additive, upward fade) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial
          color="#ff1744"
          transparent
          opacity={0.028}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Fake reflection glow — deep burgundy secondary (softer spread) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial
          color="#800010"
          transparent
          opacity={0.018}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* ── Primary grid — tight crimson cells ─────────────────────────── */}
      <Grid
        args={[220, 220]}
        position={[0, 0.012, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        cellSize={1.1}
        cellThickness={0.35}
        cellColor="#ff1744"
        sectionSize={7}
        sectionThickness={0.55}
        sectionColor="#5a0010"
        fadeDistance={32}
        fadeStrength={1.1}
        infiniteGrid
      />

      {/* ── Secondary grid — rotated burgundy overlay ───────────────────── */}
      <Grid
        args={[220, 220]}
        position={[0, 0.016, 0]}
        rotation={[-Math.PI / 2, 0.22, 0]}
        cellSize={4.2}
        cellThickness={0.22}
        cellColor="#800010"
        sectionSize={16}
        sectionThickness={0.38}
        sectionColor="#800010"
        fadeDistance={28}
        fadeStrength={1.2}
        infiniteGrid
      />

      {/* ── Concentric floor rings under the laptop ─────────────────────── */}
      {[2.15, 3.2, 4.75, 6.3].map((radius, index) => (
        <mesh key={radius} position={[2.45, 0.025 + index * 0.003, -0.55]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius, radius + 0.045, 160]} />
          <meshBasicMaterial
            color={index % 2 === 0 ? "#ff1744" : "#800010"}
            transparent
            opacity={(0.18 - index * 0.025) * 0.11}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* ── Reflected ring glow beneath the laptop (fake reflection) ────── */}
      {[2.15, 3.2, 4.75, 6.3].map((radius, index) => (
        <mesh key={`ref-${radius}`} position={[2.45, -0.08 - index * 0.003, -0.55]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius, radius + 0.06, 120]} />
          <meshBasicMaterial
            color="#ff1744"
            transparent
            opacity={(0.10 - index * 0.02) * 0.08}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* ── Hot-crimson accent streak — far right edge ───────────────────── */}
      <mesh position={[7.4, 0.035, -8]} rotation={[-Math.PI / 2, 0.1, -0.07]}>
        <planeGeometry args={[0.06, 34]} />
        <meshBasicMaterial color="#ff1744" transparent opacity={0.34} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

    </group>
  );
}
