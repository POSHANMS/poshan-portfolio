"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Create a proper perspective grid texture
function createGridTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;

  // Transparent background
  ctx.fillStyle = "rgba(0,0,0,0)";
  ctx.fillRect(0, 0, 1024, 1024);

  // Grid lines — fewer, cleaner like reference
  const step = 64; // 16 lines per texture

  // Horizontal lines (perspective — closer together at bottom)
  for (let i = 0; i <= 1024; i += step) {
    const alpha = 0.3 + (i / 1024) * 0.4; // stronger near bottom
    ctx.strokeStyle = `rgba(255, 30, 68, ${alpha})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(1024, i);
    ctx.stroke();
  }

  // Vertical lines
  for (let i = 0; i <= 1024; i += step) {
    const alpha = 0.25 + (Math.abs(i - 512) / 512) * 0.2;
    ctx.strokeStyle = `rgba(255, 30, 68, ${alpha})`;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 1024);
    ctx.stroke();
  }

  // Major lines (every 4th)
  ctx.strokeStyle = "rgba(255, 80, 100, 0.5)";
  ctx.lineWidth = 1.8;
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

  // Add glow dots at intersections
  ctx.fillStyle = "rgba(255, 50, 80, 0.6)";
  for (let x = 0; x <= 1024; x += step) {
    for (let y = 0; y <= 1024; y += step) {
      if (x % (step * 4) === 0 && y % (step * 4) === 0) {
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(20, 20);
  tex.anisotropy = 16;
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
        // Slow drift for living feel
        mat.map.offset.y = t * 0.008;
      }
    }
  });

  return (
    <group position={[0, -2.2, 0]}>
      {/* SOLID BLACK FLOOR BASE — very dark */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial color="#020001" depthWrite={true} />
      </mesh>

      {/* MAIN RED GRID */}
      <mesh
        ref={gridRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
      >
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial
          map={gridTexture}
          transparent
          opacity={0.45}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* REFLECTION PLANE — subtle red tint on floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial
          color="#ff1744"
          transparent
          opacity={0.02}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* HORIZON GLOW — red line at horizon */}
      <mesh position={[0, -2.18, -80]} rotation={[0, 0, 0]}>
        <planeGeometry args={[1000, 0.5]} />
        <meshBasicMaterial
          color="#ff1744"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
