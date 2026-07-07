"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function DeepSpaceGlobe() {
  const globeRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (globeRef.current) {
      globeRef.current.rotation.y = t * 0.08;
      globeRef.current.rotation.x = Math.sin(t * 0.18) * 0.08;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.045;
      ringRef.current.rotation.y = Math.sin(t * 0.12) * 0.12;
    }
  });

  return (
    <group position={[11.2, 5.55, -32]} scale={1.28} renderOrder={-3}>
      <pointLight position={[0, 0, 2.2]} color="#ff1744" intensity={3.2} distance={10} decay={2} />
      <pointLight position={[-2.2, 1.8, 0.5]} color="#ffd6dc" intensity={1.1} distance={7} decay={2} />

      <group ref={globeRef}>
        <mesh>
          <sphereGeometry args={[1.1, 64, 36]} />
          <meshBasicMaterial color="#ff1744" wireframe transparent opacity={0.72} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>

        <mesh scale={[1.015, 1.015, 1.015]}>
          <sphereGeometry args={[1.1, 32, 18]} />
          <meshBasicMaterial color="#800010" wireframe transparent opacity={0.26} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>

        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <sphereGeometry args={[1.105, 48, 16]} />
          <meshBasicMaterial color="#ff1744" wireframe transparent opacity={0.18} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>

        <mesh>
          <sphereGeometry args={[1.02, 48, 24]} />
          <meshBasicMaterial color="#5a0010" transparent opacity={0.028} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      </group>

      <group ref={ringRef} rotation={[0.95, 0.22, -0.28]}>
        {[1.32, 1.58, 1.86].map((radius, index) => (
          <mesh key={radius}>
            <torusGeometry args={[radius, 0.006, 8, 160]} />
            <meshBasicMaterial
              color={index === 1 ? "#ff1744" : "#800010"}
              transparent
              opacity={index === 1 ? 0.42 : 0.24}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      <mesh scale={[1.75, 1.75, 1.75]}>
        <sphereGeometry args={[1.1, 42, 24]} />
        <meshBasicMaterial color="#ff1744" transparent opacity={0.038} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}
