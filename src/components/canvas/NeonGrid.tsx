"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function createGridTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;

  // TRANSPARENT background
  ctx.clearRect(0, 0, 1024, 1024);

  // HAIRLINE thin — reference has very thin lines
  ctx.strokeStyle = "#ff1744";
  ctx.lineWidth = 0.5;

  const step = 128;
  for (let i = 0; i <= 1024; i += step) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 1024);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(1024, i);
    ctx.stroke();
  }

  // Major lines — slightly more visible but still thin
  ctx.strokeStyle = "#ff3344";
  ctx.lineWidth = 0.8;
  for (let i = 0; i <= 1024; i += step * 4) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 1024);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(1024, i);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 14);
  return tex;
}

export default function NeonGrid() {
  const gridRef = useRef<THREE.Mesh>(null);

  const gridTexture = useMemo(() => createGridTexture(), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (gridRef.current) {
      const mat = gridRef.current.material as THREE.MeshBasicMaterial;
      if (mat.map) {
        mat.map.offset.y = t * 0.008;
      }
    }
  });

  return (
    <group position={[0, -2.5, 0]}>
      {/* SOLID BLACK FLOOR BASE */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial color="#010001" depthWrite={true} />
      </mesh>

      {/* PRIMARY GRID */}
      <mesh
        ref={gridRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
      >
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial
          map={gridTexture}
          transparent
          opacity={0.25}
          blending={THREE.NormalBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* SECONDARY GRID — offset for depth */}
      <mesh rotation={[-Math.PI / 2, 0.15, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial
          map={gridTexture}
          transparent
          opacity={0.12}
          blending={THREE.NormalBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* GLOWING CIRCLE under laptop — dimmer */}
      <mesh position={[2.5, 0.005, -0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.5, 64]} />
        <meshBasicMaterial
          color="#ff1744"
          transparent
          opacity={0.02}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* HORIZON GLOW — subtle red line */}
      <mesh position={[0, 0.02, -60]} rotation={[0, 0, 0]}>
        <planeGeometry args={[400, 0.4]} />
        <meshBasicMaterial
          color="#ff1744"
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* HORIZON FADE — hide grid at distance */}
      <mesh position={[0, 0.02, -50]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[200, 60]} />
        <meshBasicMaterial
          color="#020001"
          transparent
          opacity={0.7}
          blending={THREE.NormalBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}