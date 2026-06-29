"use client";

import React, { useRef } from "react";
import { Text3D } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

type TitleLineProps = {
  text: string;
  size: number;
  y: number;
  magentaBias?: number;
};

const titleFont = "/fonts/cyber.typeface.json";

function TitleLine({ text, size, y, magentaBias = 0 }: TitleLineProps) {
  const textProps = {
    font: titleFont,
    size,
    height: 0.42,
    curveSegments: 20,
    bevelEnabled: true,
    bevelThickness: 0.055,
    bevelSize: 0.028,
    bevelOffset: 0,
    bevelSegments: 7,
  };

  return (
    <group position={[0, y, 0]}>
      <Text3D {...textProps} position={[0.16, -0.16, -0.46]} castShadow receiveShadow>
        {text}
        <meshStandardMaterial
          color="#070a2d"
          emissive="#15105d"
          emissiveIntensity={0.75 + magentaBias * 0.3}
          metalness={0.78}
          roughness={0.28}
        />
      </Text3D>

      <Text3D {...textProps} position={[0.08, -0.08, -0.24]} castShadow receiveShadow>
        {text}
        <meshStandardMaterial
          color={new THREE.Color("#160d58").lerp(new THREE.Color("#ff3ed1"), magentaBias * 0.38)}
          emissive={new THREE.Color("#2f1b8f").lerp(new THREE.Color("#ff3ed1"), magentaBias * 0.35)}
          emissiveIntensity={0.65}
          metalness={0.86}
          roughness={0.2}
        />
      </Text3D>

      <Text3D {...textProps} position={[0, 0, 0]} castShadow receiveShadow>
        {text}
        <meshPhysicalMaterial
          color={new THREE.Color("#2bd9ff").lerp(new THREE.Color("#ff3ed1"), magentaBias * 0.22)}
          emissive={new THREE.Color("#00f5ff").lerp(new THREE.Color("#ff3ed1"), magentaBias * 0.45)}
          emissiveIntensity={1.35}
          metalness={0.74}
          roughness={0.08}
          clearcoat={1}
          clearcoatRoughness={0.04}
          reflectivity={0.95}
          sheen={0.5}
          sheenColor="#d8faff"
          ior={1.45}
        />
      </Text3D>

      <Text3D {...textProps} height={0.035} position={[-0.022, 0.026, 0.45]}>
        {text}
        <meshBasicMaterial color="#d8faff" transparent opacity={0.54} blending={THREE.AdditiveBlending} depthWrite={false} />
      </Text3D>

      <Text3D {...textProps} height={0.035} position={[0.04, -0.02, 0.49]}>
        {text}
        <meshBasicMaterial color="#ff3ed1" transparent opacity={0.24 + magentaBias * 0.14} blending={THREE.AdditiveBlending} depthWrite={false} />
      </Text3D>

      <Text3D {...textProps} height={0.035} position={[-0.045, 0.012, 0.5]}>
        {text}
        <meshBasicMaterial color="#00f5ff" transparent opacity={0.28} blending={THREE.AdditiveBlending} depthWrite={false} />
      </Text3D>
    </group>
  );
}

export default function HeroName3D() {
  const groupRef = useRef<THREE.Group>(null);
  const { width, height } = useThree((state) => state.viewport);

  const posX = -width / 2 + 2.12;
  const posY = height / 2 - 2.82;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (!groupRef.current) return;

    groupRef.current.position.x = posX + state.pointer.x * 0.08;
    groupRef.current.position.y = posY + Math.sin(t * 0.8) * 0.035 + state.pointer.y * 0.035;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, -0.14 + state.pointer.x * 0.035, 0.045);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0.07 - state.pointer.y * 0.03, 0.045);
  });

  return (
    <group ref={groupRef} position={[posX, posY, 1.05]} rotation={[0.07, -0.14, -0.035]} scale={[0.68, 0.68, 0.68]}>
      <pointLight position={[-0.7, 1.0, 2.0]} intensity={7.2} distance={7.5} color="#00f5ff" decay={2} />
      <pointLight position={[3.5, -0.6, 1.4]} intensity={4.7} distance={7} color="#ff3ed1" decay={2} />
      <pointLight position={[1.7, -1.8, 1.8]} intensity={2.8} distance={6.5} color="#2bd9ff" decay={2} />
      <pointLight position={[1.7, 1.2, -1.4]} intensity={2.2} distance={5.5} color="#8a2eff" decay={2} />

      <mesh position={[2.0, -1.12, -0.62]} rotation={[-Math.PI / 2, 0, 0]} scale={[4.6, 1.3, 1]}>
        <circleGeometry args={[1, 96]} />
        <meshBasicMaterial color="#050717" transparent opacity={0.48} depthWrite={false} />
      </mesh>

      <mesh position={[2.0, -1.06, -0.55]} rotation={[-Math.PI / 2, 0, 0]} scale={[4.2, 1.06, 1]}>
        <circleGeometry args={[1, 96]} />
        <meshBasicMaterial color="#00f5ff" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      <mesh position={[2.4, -1.28, -0.5]} rotation={[-Math.PI / 2, 0, 0]} scale={[4.8, 1.4, 1]}>
        <circleGeometry args={[1, 96]} />
        <meshBasicMaterial color="#ff3ed1" transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      <TitleLine text="POSHAN" size={0.92} y={0} />
      <TitleLine text="MS" size={1.22} y={-1.05} magentaBias={0.8} />
    </group>
  );
}
