"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import TechCube from "./TechCube";

export default function TechCubes() {
  const lineRef = useRef<THREE.LineSegments>(null);

  const cubes = useMemo(
    () => [
      {
        id: "react",
        position: [-2.5, 1.2, -2.0] as [number, number, number],
        scale: 0.78,
        color: "#ffb0b0",
        glowColor: "#ff1744",
        logoPath: "/icons/react.svg",
      },
      {
        id: "node",
        position: [3.2, 0.8, -3.0] as [number, number, number],
        scale: 0.72,
        color: "#ffaaaa",
        glowColor: "#cc1133",
        logoPath: "/icons/node.svg",
      },
      {
        id: "typescript",
        position: [-1.5, -0.8, 1.5] as [number, number, number],
        scale: 0.52,
        color: "#e8a0a0",
        glowColor: "#800010",
        logoPath: "/icons/typescript.svg",
      },
      {
        id: "next",
        position: [2.8, 2.0, -1.5] as [number, number, number],
        scale: 0.42,
        color: "#f0d0d0",
        glowColor: "#660008",
        logoPath: "/icons/next.svg",
      },
    ],
    []
  );

  const lineGeometry = useMemo(() => {
    const pts = cubes.map((cube) => new THREE.Vector3(...cube.position));
    return new THREE.BufferGeometry().setFromPoints([
      pts[0],
      pts[1],
      pts[1],
      pts[2],
      pts[2],
      pts[3],
      pts[3],
      pts[0],
      pts[0],
      pts[2],
    ]);
  }, [cubes]);

  useFrame((state) => {
    if (!lineRef.current) return;
    const material = lineRef.current.material as THREE.LineBasicMaterial;
    material.opacity = 0.04 + Math.sin(state.clock.getElapsedTime() * 0.8) * 0.02;
  });

  return (
    <group>
      {cubes.map((cube) => (
        <TechCube key={cube.id} {...cube} />
      ))}

      <lineSegments ref={lineRef} geometry={lineGeometry}>
        <lineBasicMaterial color="#800010" transparent opacity={0.03} depthWrite={false} />
      </lineSegments>
    </group>
  );
}
