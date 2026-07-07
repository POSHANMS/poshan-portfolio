"use client";

import React, { useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

export default function ImageBackground() {
  // Layer 1 — crimson plexus/constellation baked image (new reference)
  const redTexture = useTexture("/textures/space-bg-red.jpg");
  redTexture.colorSpace = THREE.SRGBColorSpace;

  // Layer 2 — original reference image kept as a faint secondary layer
  const origTexture = useTexture("/Reference/space-bg.jpg");
  origTexture.colorSpace = THREE.SRGBColorSpace;

  const { camera } = useThree();
  const meshRef  = useRef<THREE.Mesh>(null);
  const mesh2Ref = useRef<THREE.Mesh>(null);

  useFrame(() => {
    // Subtle parallax — different speeds for depth layering
    if (meshRef.current) {
      meshRef.current.position.x = camera.position.x * 0.28;
      meshRef.current.position.y = camera.position.y * 0.28 - 0.8;
    }
    if (mesh2Ref.current) {
      mesh2Ref.current.position.x = camera.position.x * 0.18;
      mesh2Ref.current.position.y = camera.position.y * 0.18 - 1.0;
    }
  });

  return (
    <>
      {/* Primary layer — crimson reference image, same plane size as nebula (300×150) so it always fills the frustum */}
      <mesh ref={meshRef} position={[0, -0.8, -78]} renderOrder={-22}>
        <planeGeometry args={[300, 150]} />
        <meshBasicMaterial
          map={redTexture}
          transparent
          opacity={0.55}
          depthWrite={false}
          depthTest={false}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Secondary layer — original reference image at lower opacity for extra star depth */}
      <mesh ref={mesh2Ref} position={[0, -1.0, -82]} renderOrder={-24}>
        <planeGeometry args={[300, 150]} />
        <meshBasicMaterial
          map={origTexture}
          transparent
          opacity={0.12}
          depthWrite={false}
          depthTest={false}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </>
  );
}

useTexture.preload("/textures/space-bg-red.jpg");
useTexture.preload("/Reference/space-bg.jpg");
