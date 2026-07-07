"use client";

import React from "react";
import { Grid } from "@react-three/drei";
import * as THREE from "three";

export default function NeonGrid() {
  const streaks = [
    [-11.5, -18, 0.75, 7.8, 0.09],
    [-4.2, -21, 0.52, 5.6, 0.06],
    [3.4, -19.5, 0.62, 6.2, 0.07],
    [10.8, -23, 0.88, 8.4, 0.1],
    [18.5, -27, 0.46, 5.2, 0.055],
  ] as const;

  return (
    <group position={[0, -1.82, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]}>
        <planeGeometry args={[220, 220]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.78} depthWrite={false} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
        <planeGeometry args={[220, 220]} />
        <meshBasicMaterial color="#ff1744" transparent opacity={0.018} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
        <planeGeometry args={[220, 220]} />
        <meshBasicMaterial color="#800010" transparent opacity={0.012} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      <group position={[0, 0.055, 0]}>
        <Grid
          args={[220, 220]}
          rotation={[-Math.PI / 2, 0, 0]}
          cellSize={1.1}
          cellThickness={0.05}
          cellColor="#ff1744"
          sectionSize={7}
          sectionThickness={0.09}
          sectionColor="#5a0010"
          fadeDistance={46}
          fadeStrength={1.65}
          infiniteGrid
        />

        <Grid
          args={[220, 220]}
          position={[0, 0.004, 0]}
          rotation={[-Math.PI / 2, 0.22, 0]}
          cellSize={4.2}
          cellThickness={0.038}
          cellColor="#800010"
          sectionSize={16}
          sectionThickness={0.07}
          sectionColor="#800010"
          fadeDistance={42}
          fadeStrength={1.8}
          infiniteGrid
        />
      </group>

      {[2.15, 3.2, 4.75, 6.3].map((radius, index) => (
        <mesh key={radius} position={[2.45, 0.025 + index * 0.003, -0.55]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius, radius + 0.035, 160]} />
          <meshBasicMaterial
            color={index % 2 === 0 ? "#ff1744" : "#800010"}
            transparent
            opacity={(0.14 - index * 0.02) * 0.11}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      {[2.15, 3.2, 4.75, 6.3].map((radius, index) => (
        <mesh key={`ref-${radius}`} position={[2.45, -0.08 - index * 0.003, -0.55]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius, radius + 0.05, 120]} />
          <meshBasicMaterial
            color="#ff1744"
            transparent
            opacity={(0.08 - index * 0.015) * 0.08}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      <mesh position={[7.4, 0.08, -8]} rotation={[-Math.PI / 2, 0.1, -0.07]}>
        <planeGeometry args={[0.045, 34]} />
        <meshBasicMaterial color="#ff1744" transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {streaks.map(([x, z, width, height, opacity]) => (
        <mesh key={`${x}-${z}`} position={[x, 0.09, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial color="#ff1744" transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}
