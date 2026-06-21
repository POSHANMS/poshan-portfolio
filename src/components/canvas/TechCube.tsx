"use client";

import React, { useRef, useState } from "react";
import { useFrame, ThreeEvent } from "@react-three/fiber";
import { RoundedBox, MeshTransmissionMaterial, useTexture } from "@react-three/drei";
import { RigidBody, RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";

interface TechCubeProps {
  color: string;
  glowColor: string;
  logoPath: string;
  scale: number;
  position: [number, number, number];
}

export default function TechCube({ color, glowColor, logoPath, scale, position }: TechCubeProps) {
  const rbRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  
  const [isHovered, setIsHovered] = useState(false);
  const logoTexture = useTexture(logoPath);

  // Slow idle rotation + hover spin animation
  useFrame((state, delta) => {
    if (meshRef.current) {
      const spinSpeed = isHovered ? 4.5 : 0.4;
      meshRef.current.rotation.x += spinSpeed * delta;
      meshRef.current.rotation.y += (spinSpeed * 1.5) * delta;
    }

    // Animate point light intensity breathing on hover
    if (lightRef.current) {
      const time = state.clock.getElapsedTime();
      const baseIntensity = isHovered ? 4.0 : 1.5;
      const pulse = Math.sin(time * 6.0) * (isHovered ? 0.8 : 0.2);
      lightRef.current.intensity = baseIntensity + pulse;
    }
  });

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsHovered(true);
    
    // Morph cursor
    document.body.style.cursor = "none";
    
    // Apply Rapier physics impulse to bounce the cube upward
    if (rbRef.current) {
      rbRef.current.applyImpulse({ x: 0, y: 1.5 * scale, z: 0 }, true);
      // Give it a random spin kick
      rbRef.current.applyTorqueImpulse({
        x: (Math.random() - 0.5) * 0.25 * scale,
        y: (Math.random() - 0.5) * 0.25 * scale,
        z: (Math.random() - 0.5) * 0.25 * scale
      }, true);
    }
  };

  const handlePointerOut = () => {
    setIsHovered(false);
  };

  return (
    <RigidBody
      ref={rbRef}
      position={position}
      colliders="cuboid"
      // Prevent gravity from pulling the cubes down, keeping them floating in space
      gravityScale={0}
      linearDamping={1.5}
      angularDamping={1.5}
    >
      <group
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        scale={scale}
      >
        
        {/* Core Glass Cube */}
        <mesh ref={meshRef}>
          <RoundedBox args={[1, 1, 1]} radius={0.12} smoothness={4}>
            {/* Real glass refraction material */}
            <MeshTransmissionMaterial
              transmission={1.0}
              thickness={0.4}
              roughness={0.05}
              chromaticAberration={0.06}
              anisotropy={0.2}
              distortion={0.25}
              distortionScale={0.4}
              temporalDistortion={0.1}
              color={isHovered ? glowColor : "#ffffff"}
            />
          </RoundedBox>

          {/* Emissive Decal Plane inside the glass cube */}
          <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
            <planeGeometry args={[0.55, 0.55]} />
            <meshBasicMaterial
              map={logoTexture}
              transparent={true}
              opacity={isHovered ? 0.95 : 0.65}
              color={new THREE.Color(color)}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
        </mesh>

        {/* Emissive neon pointlight inside the cube */}
        <pointLight
          ref={lightRef}
          color={glowColor}
          intensity={1.5}
          distance={4}
          decay={1.8}
        />
        
      </group>
    </RigidBody>
  );
}
