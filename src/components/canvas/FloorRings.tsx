"use client";

import React, { useMemo, useRef } from "react";
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
    <mesh position={[3.15, -1.9, -0.32]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-8}>
      <planeGeometry args={[5.2, 5.2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={ringsVertex}
        fragmentShader={ringsFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
