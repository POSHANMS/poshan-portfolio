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
    const radii = [0.5, 0.9, 1.4, 2.0, 2.7, 3.5, 4.4, 5.4, 6.5, 7.8];

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

  const secondaryRingGeometries = useMemo(() => {
    const rings: THREE.BufferGeometry[] = [];
    const radii = [0.7, 1.15, 1.7, 2.35, 3.1, 4.0, 5.0, 6.0, 7.2];

    for (const radius of radii) {
      const points: THREE.Vector3[] = [];
      const segments = Math.max(48, Math.floor(radius * 24));
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
    const radii = [0.9, 1.6, 2.5, 3.6, 4.8, 6.2, 7.5];
    
    for (const radius of radii) {
      const points: THREE.Vector3[] = [];
      const arcLength = Math.PI * 0.4;
      const segments_count = 40;
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
    for (let r = 0; r < 5; r++) {
      const points: THREE.Vector3[] = [];
      const segments = 128;
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
          const heartbeat = 1.0 + Math.sin(t * 0.6 + i * 0.4) * 0.02;
          line.scale.set(heartbeat, heartbeat, heartbeat);
        }
        if (line.material) {
          const mat = line.material as THREE.LineBasicMaterial;
          const baseOpacity = Math.max(0.03, 0.12 - i * 0.008);
          mat.opacity = baseOpacity + Math.sin(t * 0.4 + i * 0.8) * 0.025;
        }
      });
    }

    if (secondaryRingsRef.current) {
      secondaryRingsRef.current.children.forEach((child, i) => {
        const line = child as THREE.Line;
        if (line.material) {
          const mat = line.material as THREE.LineBasicMaterial;
          mat.opacity = 0.04 + Math.sin(t * 0.8 + i * 1.2) * 0.02;
        }
      });
    }

    if (energyRef.current) {
      energyRef.current.children.forEach((child, i) => {
        const line = child as THREE.Line;
        if (line) {
          const speed = 0.4 + i * 0.15;
          line.rotation.y = t * speed + i * 2.0;
        }
        if (line.material) {
          const mat = line.material as THREE.LineBasicMaterial;
          mat.opacity = 0.2 + Math.sin(t * 3.0 + i * 2.5) * 0.12;
        }
      });
    }

    if (glowRef.current) {
      glowRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshBasicMaterial;
          const pulse = Math.sin(t * 0.5 + i * 1.5) * 0.5 + 0.5;
          mat.opacity = 0.03 + pulse * 0.06;
          const scale = 1.0 + pulse * 0.5;
          mesh.scale.set(scale, scale, scale);
        }
      });
    }
  });

  return (
    <group position={[0.8, -2.13, 0]}>
      <group ref={ringsRef}>
        {ringGeometries.map((geometry, i) => (
          <primitive 
            key={`ring-${i}`}
            object={new THREE.Line(
              geometry, 
              new THREE.LineBasicMaterial({
                color: i % 4 === 0 ? "#ff1744" : i % 3 === 0 ? "#cc1133" : "#660010",
                transparent: true,
                opacity: Math.max(0.03, 0.12 - i * 0.008),
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
                color: "#440008",
                transparent: true,
                opacity: 0.04,
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
                color: i % 2 === 0 ? "#ff1744" : "#ff3355",
                transparent: true,
                opacity: 0.2,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
              })
            )}
          />
        ))}
      </group>

      <group ref={glowRef}>
        {rippleGeometries.map((_, i) => (
          <mesh key={`ripple-${i}`} rotation={[-Math.PI / 2, 0, 0]} scale={[0.5 + i * 1.5, 0.5 + i * 1.5, 1]}>
            <ringGeometry args={[0.95, 1.0, 96]} />
            <meshBasicMaterial
              color="#ff1744"
              transparent
              opacity={0.03}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[3.0, 64]} />
        <meshBasicMaterial
          color="#ff1744"
          transparent
          opacity={0.06}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <circleGeometry args={[1.0, 48]} />
        <meshBasicMaterial
          color="#ff3355"
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {[
        [-1.5, 0.02, 1.0],
        [0.2, 0.02, 1.8],
        [1.6, 0.02, 0.6],
        [-0.8, 0.02, -0.5],
        [2.2, 0.02, 1.5],
        [-2.0, 0.02, 0.3],
      ].map((pos, i) => (
        <mesh key={`node-${i}`} position={pos as [number, number, number]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.04 + i * 0.005, 24]} />
          <meshBasicMaterial
            color={i % 2 === 0 ? "#ff1744" : "#ff3355"}
            transparent
            opacity={0.05}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}