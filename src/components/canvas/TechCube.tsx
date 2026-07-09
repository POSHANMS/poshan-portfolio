"use client";

import React, { useMemo, useRef, useState } from "react";
import { RoundedBox, MeshTransmissionMaterial, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface TechCubeProps {
  position: [number, number, number];
  scale?: number;
  color: string;
  glowColor: string;
  logoPath: string;
}

export default function TechCube({ position, scale = 1, color, glowColor, logoPath }: TechCubeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const [hovered, setHovered] = useState(false);
  const logoTex = useTexture(logoPath);
  logoTex.colorSpace = THREE.SRGBColorSpace;

  const glow = new THREE.Color(glowColor);
  const edgeGeometry = useMemo(() => new THREE.BoxGeometry(1.08, 1.08, 1.08), []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    groupRef.current.position.y = position[1] + Math.sin(t * 0.62 + position[0] * 0.5) * 0.13;
    groupRef.current.rotation.y += hovered ? 0.055 : 0.006;
    groupRef.current.rotation.x += hovered ? 0.028 : 0.0035;
    groupRef.current.rotation.z += hovered ? 0.016 : 0.002;

    if (lightRef.current) {
      const pulse = Math.sin(t * 2.2 + position[0]) * 0.5 + 0.5;
      lightRef.current.intensity = hovered ? 10.5 + pulse * 3.6 : 6.6 + pulse * 2.2;
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      scale={scale}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <pointLight ref={lightRef} color={glowColor} intensity={5.2} distance={5.6} decay={2} />

      <mesh scale={[1.1, 1.1, 1.1]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color={glowColor} transparent opacity={hovered ? 0.11 : 0.045} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      <lineSegments scale={[1.08, 1.08, 1.08]}>
        <edgesGeometry args={[edgeGeometry]} />
        <lineBasicMaterial color={glowColor} transparent opacity={hovered ? 0.48 : 0.28} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>

      <RoundedBox args={[1, 1, 1]} radius={0.075} smoothness={6} castShadow>
        <mesh>
          <boxGeometry args={[0.94, 0.94, 0.94]} />
          <meshBasicMaterial color={color} transparent opacity={0.16} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        <MeshTransmissionMaterial
          color={new THREE.Color(color).lerp(new THREE.Color("#f7fbff"), 0.72)}
          transmission={1}
          thickness={0.08}
          roughness={0.012}
          metalness={0}
          ior={1.24}
          chromaticAberration={0.011}
          anisotropicBlur={0}
          distortion={0}
          distortionScale={0}
          temporalDistortion={0}
          attenuationColor={new THREE.Color(color).lerp(new THREE.Color("#f0fbff"), 0.35)}
          attenuationDistance={0.95}
          emissive={glow}
          emissiveIntensity={hovered ? 0.52 : 0.28}
          envMapIntensity={2.35}
          side={THREE.FrontSide}
        />
      </RoundedBox>

      <lineSegments>
        <edgesGeometry args={[edgeGeometry]} />
        <lineBasicMaterial color="#ffd6dc" transparent opacity={hovered ? 0.5 : 0.28} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>

      <mesh position={[0, 0, 0.535]}>
        <planeGeometry args={[0.68, 0.68]} />
        <meshBasicMaterial map={logoTex} transparent opacity={0.42} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      <mesh position={[0, 0, -0.535]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.68, 0.68]} />
        <meshBasicMaterial map={logoTex} transparent opacity={0.12} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      <mesh position={[0, 0.535, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.48, 0.515, 4]} />
        <meshBasicMaterial color={glowColor} toneMapped={false} transparent opacity={hovered ? 0.16 : 0.08} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      <mesh position={[0, -0.535, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.48, 0.515, 4]} />
        <meshBasicMaterial color={glowColor} toneMapped={false} transparent opacity={hovered ? 0.1 : 0.05} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      <mesh position={[0, -0.78, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.28, 1.28, 1]}>
        <circleGeometry args={[0.72, 48]} />
        <meshBasicMaterial color={glowColor} toneMapped={false} transparent opacity={hovered ? 0.15 : 0.075} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}
