"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import starsVertex from "@/shaders/vertex/stars.vert";
import starsFragment from "@/shaders/fragment/stars.frag";

export default function StarField() {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const starCount = 2500;

  // Generate star positions and random seed attributes
  const [positions, randoms] = useMemo(() => {
    const pos = new Float32Array(starCount * 3);
    const rand = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const idx = i * 3;
      
      // 60% wide distribution, 40% clustered in the top-right galaxy swirl
      if (Math.random() > 0.4) {
        // Uniform distribution box
        pos[idx] = (Math.random() - 0.5) * 32;     // X: [-16, 16]
        pos[idx + 1] = (Math.random() - 0.5) * 18; // Y: [-9, 9]
        pos[idx + 2] = -5 - Math.random() * 15;    // Z: [-5, -20]
      } else {
        // Spiral cluster around top-right galaxy center [7.0, 4.5, -9.0]
        const angle = Math.random() * Math.PI * 2;
        // Concentrate points closer to center using square root
        const radius = Math.sqrt(Math.random()) * 4.0;
        
        pos[idx] = 7.0 + Math.cos(angle) * radius + (Math.random() - 0.5) * 1.5;
        pos[idx + 1] = 4.5 + Math.sin(angle) * radius + (Math.random() - 0.5) * 1.5;
        pos[idx + 2] = -9.0 + (Math.random() - 0.5) * 3.0;
      }

      rand[i] = Math.random();
    }

    return [pos, rand];
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0.0 },
      uSize: { value: 2.8 },
    }),
    []
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-aRandom"
          args={[randoms, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={starsVertex}
        fragmentShader={starsFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
