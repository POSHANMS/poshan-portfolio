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
      globeRef.current.rotation.y = t * 0.06;
      globeRef.current.rotation.x = Math.sin(t * 0.15) * 0.06;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.035;
      ringRef.current.rotation.y = Math.sin(t * 0.1) * 0.1;
    }
  });

  // Positioned upper right like reference image - closer and more visible
  return (
    <group position={[10, 6, -20]} scale={1.8} renderOrder={-8}>
      <pointLight position={[0, 0, 2.2]} color="#ff1744" intensity={2.0} distance={15} decay={2} />
      <pointLight position={[-2.2, 1.8, 0.5]} color="#ff8a80" intensity={0.5} distance={10} decay={2} />

      <group ref={globeRef}>
        {/* Main wireframe sphere */}
        <mesh>
          <sphereGeometry args={[1.1, 64, 36]} />
          <meshBasicMaterial color="#ff1744" wireframe transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>

        {/* Secondary wireframe */}
        <mesh scale={[1.015, 1.015, 1.015]}>
          <sphereGeometry args={[1.1, 32, 18]} />
          <meshBasicMaterial color="#ff4444" wireframe transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>

        {/* Equator ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <sphereGeometry args={[1.105, 48, 16]} />
          <meshBasicMaterial color="#ff1744" wireframe transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>

        {/* Inner glow sphere */}
        <mesh>
          <sphereGeometry args={[1.02, 48, 24]} />
          <meshBasicMaterial color="#800010" transparent opacity={0.04} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      </group>

      {/* Orbital rings */}
      <group ref={ringRef} rotation={[0.95, 0.22, -0.28]}>
        {[1.32, 1.58, 1.86, 2.2].map((radius, index) => (
          <mesh key={radius}>
            <torusGeometry args={[radius, 0.008, 8, 160]} />
            <meshBasicMaterial
              color={index === 1 ? "#ff1744" : "#ff4444"}
              transparent
              opacity={index === 1 ? 0.22 : 0.12}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* Outer atmosphere glow */}
      <mesh scale={[1.75, 1.75, 1.75]}>
        <sphereGeometry args={[1.1, 42, 24]} />
        <meshBasicMaterial color="#ff1744" transparent opacity={0.03} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}