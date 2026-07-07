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
    <group position={[5.8, 1.35, -7.6]} scale={1.55}>
      <pointLight position={[0, 0, 1.8]} color="#ff1744" intensity={3.2} distance={8} decay={2} />
      <pointLight position={[-1.8, 1.4, 0.4]} color="#ffd6dc" intensity={0.8} distance={5} decay={2} />

      <group ref={globeRef}>
        <mesh>
          <sphereGeometry args={[1.1, 42, 24]} />
          <meshBasicMaterial color="#ff1744" wireframe transparent opacity={0.34} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>

        <mesh scale={[1.015, 1.015, 1.015]}>
          <sphereGeometry args={[1.1, 42, 24]} />
          <meshBasicMaterial color="#800010" wireframe transparent opacity={0.16} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>

        <mesh>
          <sphereGeometry args={[1.02, 42, 24]} />
          <meshBasicMaterial color="#5a0010" transparent opacity={0.055} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      </group>

      <group ref={ringRef} rotation={[0.95, 0.22, -0.28]}>
        {[1.32, 1.58, 1.86].map((radius, index) => (
          <mesh key={radius}>
            <torusGeometry args={[radius, 0.006, 8, 160]} />
            <meshBasicMaterial
              color={index === 1 ? "#ff1744" : "#800010"}
              transparent
              opacity={index === 1 ? 0.34 : 0.18}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      <mesh scale={[1.75, 1.75, 1.75]}>
        <sphereGeometry args={[1.1, 42, 24]} />
        <meshBasicMaterial color="#ff1744" transparent opacity={0.045} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}
