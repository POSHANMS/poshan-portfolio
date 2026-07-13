"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function FloorRings() {
  const ringsRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Group>(null);

  const ringGeometries = useMemo(() => {
    const rings: THREE.BufferGeometry[] = [];
    const radii = [0.8, 1.2, 1.6, 2.0, 2.4, 2.8, 3.2];

    for (const radius of radii) {
      const points: THREE.Vector3[] = [];
      const segments = 128;
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius
        ));
      }
      rings.push(new THREE.BufferGeometry().setFromPoints(points));
    }
    return rings;
  }, []);

  useFrame((state) => {
    if (!ringsRef.current) return;
    const t = state.clock.getElapsedTime();
    
    ringsRef.current.children.forEach((child, i) => {
      const line = child as THREE.Line;
      if (line && line.scale) {
        const scale = 1.0 + Math.sin(t * 0.3 + i * 0.15) * 0.012;
        line.scale.set(scale, scale, scale);
      }
    });

    if (glowRef.current) {
      glowRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshBasicMaterial;
          mat.opacity = 0.05 + Math.sin(t * 1.5 + i * 2.0) * 0.025;
        }
      });
    }
  });

  return (
    <group position={[0.8, -1.90, 0]}>
      <group ref={ringsRef}>
        {ringGeometries.map((geometry, i) => (
          <primitive 
            key={i} 
            object={new THREE.Line(
              geometry, 
              new THREE.LineBasicMaterial({
                color: i % 3 === 0 ? "#880018" : "#55000a",
                transparent: true,
                opacity: Math.max(0.03, 0.14 - i * 0.012),
                blending: THREE.AdditiveBlending,
                depthWrite: false,
              })
            )} 
          />
        ))}
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[2.5, 48]} />
        <meshBasicMaterial
          color="#440008"
          transparent
          opacity={0.05}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <group ref={glowRef}>
        <mesh position={[-1.2, 0.02, 0.8]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.10, 24]} />
          <meshBasicMaterial
            color="#ff1744"
            transparent
            opacity={0.06}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        
        <mesh position={[0.1, 0.02, 1.2]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.08, 24]} />
          <meshBasicMaterial
            color="#cc1133"
            transparent
            opacity={0.05}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        
        <mesh position={[1.4, 0.02, 0.9]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.12, 24]} />
          <meshBasicMaterial
            color="#ff1744"
            transparent
            opacity={0.07}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}