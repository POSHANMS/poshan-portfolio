"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text3D } from "@react-three/drei";
import * as THREE from "three";

export default function HeroName3D() {
  const groupRef = useRef<THREE.Group>(null);
  
  // Material refs for animating the breathing glow
  const matFrontRef = useRef<THREE.MeshStandardMaterial>(null);
  const matSidePoshanRef = useRef<THREE.MeshStandardMaterial>(null);
  const matSideMsRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // 1. Slow glow breath animation (sine wave oscillation)
    const breath = Math.sin(time * 2.0) * 0.5 + 0.5; // Range: [0, 1]
    
    if (matFrontRef.current) {
      matFrontRef.current.emissiveIntensity = 0.4 + breath * 0.4;
    }
    if (matSidePoshanRef.current) {
      matSidePoshanRef.current.emissiveIntensity = 0.6 + breath * 0.6;
    }
    if (matSideMsRef.current) {
      matSideMsRef.current.emissiveIntensity = 0.8 + breath * 0.6;
    }

    // 2. Mouse parallax interactive skew / rotation
    if (groupRef.current) {
      const targetRotationY = state.pointer.x * 0.12;
      const targetRotationX = -state.pointer.y * 0.08;
      
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotationY, 0.05);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotationX, 0.05);
    }
  });

  const textOptions = {
    font: "/fonts/cyber.typeface.json",
    height: 0.35,
    curveSegments: 16,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.02,
    bevelOffset: 0,
    bevelSegments: 5,
  };

  return (
    <group ref={groupRef} position={[-2.3, 0.8, 1.2]} scale={0.8}>
      
      {/* 3D text shadow plane or glowing background light */}
      <pointLight
        position={[0, 0, 1.5]}
        intensity={1.2}
        distance={6}
        color="#00d4ff"
      />

      {/* POSHAN - Top Line */}
      <Text3D
        {...textOptions}
        size={0.9}
        position={[-1.8, 0.6, 0]}
        castShadow
        receiveShadow
      >
        POSHAN
        {/* Index 0: Front face material */}
        <meshStandardMaterial
          ref={matFrontRef}
          color="#00d4ff"
          emissive="#00d4ff"
          emissiveIntensity={0.6}
          roughness={0.15}
          metalness={0.9}
        />
        {/* Index 1: Side / Bevel face material */}
        <meshStandardMaterial
          ref={matSidePoshanRef}
          color="#1a1a6e"
          emissive="#8b5cf6"
          emissiveIntensity={0.8}
          roughness={0.3}
          metalness={0.8}
        />
      </Text3D>

      {/* MS - Bottom Line (Sized larger, slightly pushed forward for perspective wrap) */}
      <Text3D
        {...textOptions}
        size={1.1}
        position={[-0.6, -0.6, 0.2]}
        castShadow
        receiveShadow
      >
        MS
        {/* Index 0: Front face material (Shares the same glowing cyan look) */}
        <meshStandardMaterial
          color="#00d4ff"
          emissive="#00d4ff"
          emissiveIntensity={0.6}
          roughness={0.15}
          metalness={0.9}
        />
        {/* Index 1: Side / Bevel face material (Hot Pink bleed for MS) */}
        <meshStandardMaterial
          ref={matSideMsRef}
          color="#1a1a6e"
          emissive="#ff2d78"
          emissiveIntensity={1.0}
          roughness={0.25}
          metalness={0.85}
        />
      </Text3D>
      
    </group>
  );
}
