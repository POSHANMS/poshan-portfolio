"use client";

import React, { useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

export default function ImageBackground() {
  const texture = useTexture("/Reference/space-bg.jpg");
  texture.colorSpace = THREE.SRGBColorSpace;
  
  const { camera } = useThree();
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  // We place the image far back at z = -80.
  // The distance from camera (z=8.5) to plane is 88.5
  // We need to scale the plane so it fills the screen perfectly.
  // A standard way is to make it slightly larger so parallax doesn't show edges.

  useFrame(() => {
    if (meshRef.current) {
      // Subtle parallax effect based on camera position
      meshRef.current.position.x = camera.position.x * 0.35;
      meshRef.current.position.y = camera.position.y * 0.35 - 1.15;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, -1.15, -80]} renderOrder={-20}>
      <planeGeometry args={[190, 108]} />
      <meshBasicMaterial 
        ref={materialRef} 
        map={texture} 
        depthWrite={false}
        depthTest={false}
        toneMapped={false} 
      />
    </mesh>
  );
}

useTexture.preload("/Reference/space-bg.jpg");
