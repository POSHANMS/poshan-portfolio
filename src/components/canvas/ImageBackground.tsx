"use client";

import React, { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

export default function ImageBackground() {
  const texture = useTexture("/Reference/space-bg-red.jpg");
  texture.colorSpace = THREE.SRGBColorSpace;

  const { camera } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.position.x = camera.position.x * 0.12;
    meshRef.current.position.y = camera.position.y * 0.08 - 0.6;
  });

  return (
    <mesh ref={meshRef} position={[0, -0.6, -72]} renderOrder={-30}>
      <planeGeometry args={[300, 168]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.92}
        depthWrite={false}
        depthTest={false}
        fog={false}
        toneMapped={false}
        blending={THREE.NormalBlending}
      />
    </mesh>
  );
}

useTexture.preload("/Reference/space-bg-red.jpg");
