"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import ringsVertex from "@/shaders/vertex/rings.vert";
import ringsFragment from "@/shaders/fragment/rings.frag";

export default function FloorRings() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0.0 },
    }),
    []
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    // Pushed flat onto the grid floor underneath the laptop pedestal base
    <mesh position={[0.7, -1.24, -0.8]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[4.5, 4.5]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={ringsVertex}
        fragmentShader={ringsFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
