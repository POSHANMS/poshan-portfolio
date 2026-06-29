"use client";

import React from "react";
import { Grid, MeshReflectorMaterial } from "@react-three/drei";
import * as THREE from "three";

export default function NeonGrid() {
  return (
    <group position={[0, -1.82, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[180, 180]} />
        <MeshReflectorMaterial
          color="#02020a"
          mirror={0.32}
          mixBlur={0.85}
          mixStrength={0.28}
          roughness={0.42}
          metalness={0.32}
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>

      <Grid
        args={[220, 220]}
        position={[0, 0.012, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        cellSize={1.1}
        cellThickness={0.22}
        cellColor="#00d4ff"
        sectionSize={7}
        sectionThickness={0.62}
        sectionColor="#8b5cf6"
        fadeDistance={80}
        fadeStrength={1.1}
        infiniteGrid
      />

      <Grid
        args={[220, 220]}
        position={[0, 0.016, 0]}
        rotation={[-Math.PI / 2, 0.22, 0]}
        cellSize={4.2}
        cellThickness={0.16}
        cellColor="#ff2d78"
        sectionSize={16}
        sectionThickness={0.45}
        sectionColor="#ff2d78"
        fadeDistance={72}
        fadeStrength={1.35}
        infiniteGrid
      />

      {[2.15, 3.2, 4.75, 6.3].map((radius, index) => (
        <mesh key={radius} position={[2.45, 0.025 + index * 0.003, -0.55]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius, radius + 0.045, 160]} />
          <meshBasicMaterial
            color={index % 2 === 0 ? "#00d4ff" : "#ff2d78"}
            transparent
            opacity={0.18 - index * 0.025}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      <mesh position={[7.4, 0.035, -8]} rotation={[-Math.PI / 2, 0.1, -0.07]}>
        <planeGeometry args={[0.06, 34]} />
        <meshBasicMaterial color="#ff2d78" transparent opacity={0.34} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}
