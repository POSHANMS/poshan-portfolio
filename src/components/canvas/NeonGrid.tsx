"use client";

import React from "react";
import { MeshReflectorMaterial, Grid } from "@react-three/drei";

export default function NeonGrid() {
  return (
    <group>
      
      {/* 1. Reflective Floor Plane */}
      <mesh position={[0, -1.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[50, 50]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={512} // 512 for optimization (good compromise of speed and look)
          mixBlur={1.0}
          mixStrength={0.8}
          roughness={1.0}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#050508" // Base background color
          metalness={0.8}
          mirror={0.7}
        />
      </mesh>

      {/* 2. Infinite Neon Grid Overlay */}
      <Grid
        position={[0, -1.248, 0]}
        args={[40, 40]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#111133" // Subtle navy subdivisions
        sectionSize={2.0}
        sectionThickness={1.0}
        sectionColor="#00d4ff" // Glowing cyan section lines
        fadeDistance={15}
        fadeStrength={1.5}
        infiniteGrid
      />

      {/* 3. Hot Pink Streak Accent on the far right */}
      <mesh position={[5.8, -1.246, -1.0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.04, 15]} />
        <meshBasicMaterial 
          color="#ff2d78" 
          toneMapped={false}
          transparent
          opacity={0.85}
        />
      </mesh>

    </group>
  );
}
