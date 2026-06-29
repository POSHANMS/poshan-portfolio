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
        position: [-1.95, 2.35, -0.35] as [number, number, number],
        scale: 0.72,
        color: "#95f4ff",
        glowColor: "#00d4ff",
        logoPath: "/icons/react.svg",
      },
      {
        id: "node",
        position: [4.95, 2.8, -0.68] as [number, number, number],
        scale: 0.62,
        color: "#b5ffd1",
        glowColor: "#68a063",
        logoPath: "/icons/node.svg",
      },
      {
        id: "typescript",
        position: [5.35, 0.45, 0.18] as [number, number, number],
        scale: 0.58,
        color: "#9bc7ff",
        glowColor: "#3178c6",
        logoPath: "/icons/typescript.svg",
      },
      {
        id: "next",
        position: [1.75, -0.88, 0.85] as [number, number, number],
        scale: 0.5,
        color: "#eef9ff",
        glowColor: "#f0f0f0",
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
    material.opacity = 0.06 + Math.sin(state.clock.getElapsedTime() * 0.8) * 0.03;
  });

  return (
    <group>
      {cubes.map((cube) => (
        <TechCube key={cube.id} {...cube} />
      ))}

      <lineSegments ref={lineRef} geometry={lineGeometry}>
        <lineBasicMaterial color="#67e8f9" transparent opacity={0.04} depthWrite={false} />
      </lineSegments>
    </group>
  );
}
