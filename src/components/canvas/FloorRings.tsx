"use client";

import React, { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

function makeArc(radius: number, start: number, span: number) {
  const points: THREE.Vector3[] = [];
  for (let index = 0; index <= 40; index += 1) {
    const angle = start + (index / 40) * span;
    points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
  }
  return new THREE.BufferGeometry().setFromPoints(points);
}

export default function FloorRings() {
  const fastTrack = useRef<THREE.Group>(null);
  const slowTrack = useRef<THREE.Group>(null);
  const rippleTrack = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  const laptopX = Math.max(0.8, viewport.width * 0.08);

  const arcs = useMemo(() => {
    const values: THREE.BufferGeometry[] = [];
    for (let index = 0; index < 5; index += 1) {
      values.push(makeArc(1.48, index * ((Math.PI * 2) / 5) + 0.12, Math.PI * 0.29));
    }
    return values;
  }, []);

  const ripples = useMemo(
    () => Array.from({ length: 3 }, () => new THREE.RingGeometry(0.98, 1.005, 96)),
    [],
  );

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (fastTrack.current) fastTrack.current.rotation.y = time * 0.58;
    if (slowTrack.current) slowTrack.current.rotation.y = -time * 0.19;
    rippleTrack.current?.children.forEach((child, index) => {
      const cycle = (time * 0.28 + index * 0.34) % 1;
      const scale = 1.12 + cycle * 1.75;
      child.scale.setScalar(scale);
      const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      material.opacity = (1 - cycle) * 0.22;
    });
  });

  return (
    <group position={[laptopX + 0.18, -2.125, -1.24]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <ringGeometry args={[0.78, 0.83, 128]} />
        <meshBasicMaterial color="#fff1f4" transparent opacity={0.96} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
        <ringGeometry args={[1.02, 1.045, 128]} />
        <meshBasicMaterial color="#ff1744" transparent opacity={0.88} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}>
        <ringGeometry args={[1.72, 1.735, 128]} />
        <meshBasicMaterial color="#ff3355" transparent opacity={0.48} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      <group ref={fastTrack}>
        {arcs.map((geometry, index) => (
          <primitive
            key={index}
            object={new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: "#fff1f4", transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }))}
          />
        ))}
      </group>
      <group ref={slowTrack} rotation={[0, Math.PI / 5, 0]}>
        {arcs.map((geometry, index) => (
          <primitive
            key={index}
            object={new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: "#ff1744", transparent: true, opacity: 0.48, blending: THREE.AdditiveBlending, depthWrite: false }))}
          />
        ))}
      </group>
      <group ref={rippleTrack}>
        {ripples.map((geometry, index) => (
          <mesh key={index} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
            <meshBasicMaterial color="#ff1744" transparent opacity={0.18} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        ))}
      </group>
      <pointLight position={[0, 0.5, 0]} color="#ff1744" intensity={2.4} distance={6.5} decay={2} />
    </group>
  );
}
