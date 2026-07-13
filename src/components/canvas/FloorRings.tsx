"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function FloorRings() {
  const ringsRef = useRef<THREE.Group>(null);
  const energyRef = useRef<THREE.Group>(null);
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

  // Energy segment geometries - partial arcs that travel
  const energyGeometries = useMemo(() => {
    const segments: THREE.BufferGeometry[] = [];
    const radii = [0.8, 1.2, 1.6, 2.0, 2.4, 2.8, 3.2];
    
    for (const radius of radii) {
      const points: THREE.Vector3[] = [];
      const arcLength = Math.PI * 0.3; // 54 degree arc
      const segments_count = 32;
      for (let i = 0; i <= segments_count; i++) {
        const angle = (i / segments_count) * arcLength;
        points.push(new THREE.Vector3(
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius
        ));
      }
      segments.push(new THREE.BufferGeometry().setFromPoints(points));
    }
    return segments;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    if (!ringsRef.current) return;
    
    // Base rings pulse
    ringsRef.current.children.forEach((child, i) => {
      const line = child as THREE.Line;
      if (line && line.scale) {
        const heartbeat = 1.0 + Math.sin(t * 0.8 + i * 0.3) * 0.015;
        line.scale.set(heartbeat, heartbeat, heartbeat);
      }
      if (line.material) {
        const mat = line.material as THREE.LineBasicMaterial;
        mat.opacity = Math.max(0.02, 0.06 - i * 0.005 + Math.sin(t * 0.5 + i) * 0.015);
      }
    });

    // Energy segments rotate around rings
    if (energyRef.current) {
      energyRef.current.children.forEach((child, i) => {
        const line = child as THREE.Line;
        if (line) {
          const speed = 0.3 + i * 0.1;
          line.rotation.y = t * speed + i * 1.5;
        }
        if (line.material) {
          const mat = line.material as THREE.LineBasicMaterial;
          mat.opacity = 0.15 + Math.sin(t * 2.0 + i * 2.5) * 0.08;
        }
      });
    }

    // Glow spots pulse with heartbeat
    if (glowRef.current) {
      glowRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshBasicMaterial;
          const pulse = Math.sin(t * 1.2 + i * 2.0) * 0.5 + 0.5;
          mat.opacity = 0.02 + pulse * 0.04;
          // Scale pulse
          const scale = 1.0 + pulse * 0.3;
          mesh.scale.set(scale, scale, scale);
        }
      });
    }
  });

  return (
    <group position={[0.8, -1.95, 0]}>
      {/* Base rings */}
      <group ref={ringsRef}>
        {ringGeometries.map((geometry, i) => (
          <primitive 
            key={`ring-${i}`}
            object={new THREE.Line(
              geometry, 
              new THREE.LineBasicMaterial({
                color: i % 3 === 0 ? "#660010" : "#440008",
                transparent: true,
                opacity: Math.max(0.02, 0.06 - i * 0.005),
                blending: THREE.AdditiveBlending,
                depthWrite: false,
              })
            )} 
          />
        ))}
      </group>

      {/* Traveling energy segments */}
      <group ref={energyRef}>
        {energyGeometries.map((geometry, i) => (
          <primitive
            key={`energy-${i}`}
            object={new THREE.Line(
              geometry,
              new THREE.LineBasicMaterial({
                color: "#ff1744",
                transparent: true,
                opacity: 0.15,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                linewidth: 2,
              })
            )}
          />
        ))}
      </group>

      {/* Center glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[2.5, 48]} />
        <meshBasicMaterial
          color="#220004"
          transparent
          opacity={0.04}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Pulsing energy nodes */}
      <group ref={glowRef}>
        <mesh position={[-1.2, 0.02, 0.8]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.04, 24]} />
          <meshBasicMaterial
            color="#ff1744"
            transparent
            opacity={0.04}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        
        <mesh position={[0.1, 0.02, 1.2]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.03, 24]} />
          <meshBasicMaterial
            color="#ff3355"
            transparent
            opacity={0.03}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        
        <mesh position={[1.4, 0.02, 0.9]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.05, 24]} />
          <meshBasicMaterial
            color="#ff1744"
            transparent
            opacity={0.04}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}