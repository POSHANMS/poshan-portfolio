"use client";

import React, { useRef } from "react";
import { Text3D } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const titleFont = "/fonts/cyber.typeface.json";

const textProps = {
  font: titleFont,
  height: 0.30,
  curveSegments: 5,
  bevelEnabled: true,
  bevelThickness: 0.035,
  bevelSize: 0.014,
  bevelOffset: 0,
  bevelSegments: 2,
};

// Single TitleLine — 2 meshes per word: deep shadow + glowing face
function TitleLine({
  text,
  size,
  y,
  isMagenta = false,
}: {
  text: string;
  size: number;
  y: number;
  isMagenta?: boolean;
}) {
  const faceColor = isMagenta ? "#ff2d78" : "#00d4ff";
  const emissive  = isMagenta ? "#cc0060" : "#0090e0";
  const shadowEm  = isMagenta ? "#3a0020" : "#000d30";

  return (
    <group position={[0, y, 0]}>
      {/* Shadow depth layer */}
      <Text3D {...textProps} size={size} position={[0.05, -0.05, -0.28]}>
        {text}
        <meshStandardMaterial
          color="#04051a"
          emissive={shadowEm}
          emissiveIntensity={0.45}
          metalness={0.85}
          roughness={0.45}
        />
      </Text3D>

      {/* Neon front face */}
      <Text3D {...textProps} size={size} position={[0, 0, 0]} castShadow>
        {text}
        <meshStandardMaterial
          color={faceColor}
          emissive={emissive}
          emissiveIntensity={3.8}
          metalness={0.92}
          roughness={0.06}
        />
      </Text3D>
    </group>
  );
}

export default function HeroName3D({ stageScale = 1 }: { stageScale?: number }) {
  const groupRef = useRef<THREE.Group>(null);

  // Mirror the HTML stage-left-copy position in world space.
  // The HTML stage is 1760px wide centred at viewport centre.
  // Left column occupies cols 1-4 (~36% of 1760px → ~634px from left).
  // In 3D at camera fov=45, z=9.2: at scale=1 the left edge is roughly posX = -4.5
  const posX = -4.35 + (1 - stageScale) * 2.2;
  const posY =  2.05 * stageScale;

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      -0.10 + state.pointer.x * 0.055,
      0.05,
    );
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      0.07 - state.pointer.y * 0.055,
      0.05,
    );
    // Gentle bob
    groupRef.current.position.y = posY + Math.sin(t * 1.1) * 0.025;
  });

  const s = 0.62 * stageScale;

  return (
    <group
      ref={groupRef}
      position={[posX, posY, 1.5]}
      rotation={[0.07, -0.10, -0.018]}
      scale={[s, s, s]}
    >
      {/* Key lights to illuminate the neon letters */}
      <pointLight position={[-0.5, 1.2, 2.5]} intensity={2.8} distance={8} color="#00f5ff" decay={2} />
      <pointLight position={[3.2, -0.8, 2.0]} intensity={1.8} distance={7} color="#ff3ed1" decay={2} />

      {/* Floor glow blob */}
      <mesh position={[2.1, -1.55, -0.5]} rotation={[-Math.PI / 2, 0, 0]} scale={[4.4, 1.2, 1]}>
        <circleGeometry args={[1, 48]} />
        <meshBasicMaterial color="#00f5ff" transparent opacity={0.09} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      <TitleLine text="POSHAN" size={0.88} y={0} isMagenta={false} />
      <TitleLine text="MS"     size={1.18} y={-1.22} isMagenta />
    </group>
  );
}
