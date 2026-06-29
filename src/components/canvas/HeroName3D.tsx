"use client";

import React, { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Text3D } from "@react-three/drei";
import * as THREE from "three";

export default function HeroName3D() {
  const groupRef = useRef<THREE.Group>(null);
  const { width, height } = useThree((state) => state.viewport);

  // Position responsively: Align with "< Hello, I'm />" X-position and grid Y-position
  const posX = -width / 2 + 2.7;
  const posY = height / 2 - 2.15;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      // Gentle floating and mouse rotation reaction
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, state.pointer.x * 0.08, 0.05);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -state.pointer.y * 0.08, 0.05);
      groupRef.current.position.y = posY + Math.sin(t * 1.2) * 0.03;
    }
  });

  const textProps = {
    font: "/fonts/cyber.typeface.json",
    curveSegments: 16,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.02,
    bevelOffset: 0,
    bevelSegments: 8,
  };

  return (
    <group ref={groupRef} position={[posX, posY, 0]} scale={[0.76, 0.76, 0.76]}>
      {/* ================= POSHAN (Blue/Cyan) ================= */}
      {/* Main Front Neon Mesh */}
      <Text3D {...textProps} size={0.88} height={0.2} position={[0, 0, 0]}>
        POSHAN
        <meshPhysicalMaterial
          color="#00eeff"
          emissive="#00b4ff"
          emissiveIntensity={2.5}
          metalness={0.9}
          roughness={0.05}
          clearcoat={1}
          clearcoatRoughness={0.05}
        />
      </Text3D>

      {/* Inner Deep Glow Core */}
      <Text3D {...textProps} size={0.88} height={0.22} position={[0, 0, -0.02]}>
        POSHAN
        <meshPhysicalMaterial
          color="#ff2d78"
          emissive="#ff2d78"
          emissiveIntensity={1.8}
          roughness={0.1}
          metalness={0.9}
        />
      </Text3D>

      {/* Ambient Halo Behind */}
      <Text3D {...textProps} size={0.88} height={0.25} position={[0.02, -0.02, -0.06]}>
        POSHAN
        <meshBasicMaterial
          color="#00d4ff"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </Text3D>

      {/* ================= MS (Pink/Magenta) ================= */}
      {/* Main Front Neon Mesh */}
      <Text3D {...textProps} size={1.12} height={0.2} position={[0, -1.02, 0]}>
        MS
        <meshPhysicalMaterial
          color="#ff2d78"
          emissive="#ff0088"
          emissiveIntensity={2.8}
          metalness={0.9}
          roughness={0.05}
          clearcoat={1}
          clearcoatRoughness={0.05}
        />
      </Text3D>

      {/* Inner Deep Glow Core */}
      <Text3D {...textProps} size={1.12} height={0.22} position={[0, -1.02, -0.02]}>
        MS
        <meshPhysicalMaterial
          color="#00d4ff"
          emissive="#00d4ff"
          emissiveIntensity={1.8}
          roughness={0.1}
          metalness={0.9}
        />
      </Text3D>

      {/* Ambient Halo Behind */}
      <Text3D {...textProps} size={1.12} height={0.25} position={[-0.02, -1.04, -0.06]}>
        MS
        <meshBasicMaterial
          color="#ff2d78"
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </Text3D>
    </group>
  );
}

