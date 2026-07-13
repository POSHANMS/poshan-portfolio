"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function FloorRings() {
  const ringsRef = useRef<THREE.Group>(null);
  const energyRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Group>(null);
  const secondaryRingsRef = useRef<THREE.Group>(null);

  const ringGeometries = useMemo(() => {
    const rings: THREE.BufferGeometry[] = [];
    const radii = [0.4, 0.8, 1.3, 1.9, 2.6, 3.4, 4.3, 5.3, 6.4, 7.7];

    for (const radius of radii) {
      const points: THREE.Vector3[] = [];
      const segments = Math.max(80, Math.floor(radius * 40));
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

  const secondaryRingGeometries = useMemo(() => {
    const rings: THREE.BufferGeometry[] = [];
    const radii = [0.6, 1.05, 1.55, 2.2, 2.9, 3.8, 4.8, 5.8, 7.0];

    for (const radius of radii) {
      const points: THREE.Vector3[] = [];
      const segments = Math.max(64, Math.floor(radius * 32));
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

  const energyGeometries = useMemo(() => {
    const segments: THREE.BufferGeometry[] = [];
    const radii = [0.8, 1.5, 2.4, 3.5, 4.7, 6.1, 7.4];
    
    for (const radius of radii) {
      const points: THREE.Vector3[] = [];
      const arcLength = Math.PI * 0.5;
      const segments_count = 48;
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

  const rippleGeometries = useMemo(() => {
    const ripples: THREE.BufferGeometry[] = [];
    for (let r = 0; r < 6; r++) {
      const points: THREE.Vector3[] = [];
      const segments = 160;
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)));
      }
      ripples.push(new THREE.BufferGeometry().setFromPoints(points));
    }
    return ripples;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    if (ringsRef.current) {
      ringsRef.current.children.forEach((child, i) => {
        const line = child as THREE.Line;
        if (line && line.scale) {
          const heartbeat = 1.0 + Math.sin(t * 0.5 + i * 0.35) * 0.015;
          line.scale.set(heartbeat, heartbeat, heartbeat);
        }
        if (line.material) {
          const mat = line.material as THREE.LineBasicMaterial;
          const baseOpacity = Math.max(0.06, 0.18 - i * 0.01);
          mat.opacity = baseOpacity + Math.sin(t * 0.35 + i * 0.7) * 0.04;
        }
      });
    }

    if (secondaryRingsRef.current) {
      secondaryRingsRef.current.children.forEach((child, i) => {
        const line = child as THREE.Line;
        if (line.material) {
          const mat = line.material as THREE.LineBasicMaterial;
          mat.opacity = 0.06 + Math.sin(t * 0.6 + i * 1.0) * 0.03;
        }
      });
    }

    if (energyRef.current) {
      energyRef.current.children.forEach((child, i) => {
        const line = child as THREE.Line;
        if (line) {
          const speed = 0.35 + i * 0.12;
          line.rotation.y = t * speed + i * 1.8;
        }
        if (line.material) {
          const mat = line.material as THREE.LineBasicMaterial;
          mat.opacity = 0.35 + Math.sin(t * 2.5 + i * 2.0) * 0.15;
        }
      });
    }

    if (glowRef.current) {
      glowRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshBasicMaterial;
          const pulse = Math.sin(t * 0.4 + i * 1.2) * 0.5 + 0.5;
          mat.opacity = 0.04 + pulse * 0.08;
          const scale = 1.0 + pulse * 0.6;
          mesh.scale.set(scale, scale, scale);
        }
      });
    }
  });

  return (
    <group position={[0.8, -2.12, 0]}>
      <group ref={ringsRef}>
        {ringGeometries.map((geometry, i) => (
          <primitive 
            key={`ring-${i}`}
            object={new THREE.Line(
              geometry, 
              new THREE.LineBasicMaterial({
                color: i % 4 === 0 ? "#ff1744" : i % 3 === 0 ? "#ff3355" : "#cc1133",
                transparent: true,
                opacity: Math.max(0.06, 0.18 - i * 0.01),
                blending: THREE.AdditiveBlending,
                depthWrite: false,
              })
            )} 
          />
        ))}
      </group>

      <group ref={secondaryRingsRef}>
        {secondaryRingGeometries.map((geometry, i) => (
          <primitive 
            key={`secondary-${i}`}
            object={new THREE.Line(
              geometry, 
              new THREE.LineBasicMaterial({
                color: "#880022",
                transparent: true,
                opacity: 0.06,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
              })
            )} 
          />
        ))}
      </group>

      <group ref={energyRef}>
        {energyGeometries.map((geometry, i) => (
          <primitive
            key={`energy-${i}`}
            object={new THREE.Line(
              geometry,
              new THREE.LineBasicMaterial({
                color: i % 2 === 0 ? "#ff1744" : "#ff6688",
                transparent: true,
                opacity: 0.35,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
              })
            )}
          />
        ))}
      </group>

      <group ref={glowRef}>
        {rippleGeometries.map((_, i) => (
          <mesh key={`ripple-${i}`} rotation={[-Math.PI / 2, 0, 0]} scale={[0.4 + i * 1.3, 0.4 + i * 1.3, 1]}>
            <ringGeometry args={[0.97, 1.0, 128]} />
            <meshBasicMaterial
              color="#ff1744"
              transparent
              opacity={0.04}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[3.5, 64]} />
        <meshBasicMaterial
          color="#ff1744"
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <circleGeometry args={[1.2, 48]} />
        <meshBasicMaterial
          color="#ff4466"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <pointLight position={[0, 0.5, 0]} intensity={3.0} color="#ff1744" distance={10} decay={2} />

      {[
        [-1.5, 0.02, 1.0],
        [0.2, 0.02, 1.8],
        [1.6, 0.02, 0.6],
        [-0.8, 0.02, -0.5],
        [2.2, 0.02, 1.5],
        [-2.0, 0.02, 0.3],
        [1.0, 0.02, -1.0],
        [-1.2, 0.02, 2.0],
      ].map((pos, i) => (
        <mesh key={`node-${i}`} position={pos as [number, number, number]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.05 + (i % 3) * 0.01, 24]} />
          <meshBasicMaterial
            color={i % 2 === 0 ? "#ff1744" : "#ff4466"}
            transparent
            opacity={0.08}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}