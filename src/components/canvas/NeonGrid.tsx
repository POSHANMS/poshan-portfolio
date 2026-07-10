"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function createGridTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, 1024, 1024);

  ctx.strokeStyle = "#ff1744";
  ctx.lineWidth = 1.5;

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

  ctx.strokeStyle = "#ff4444";
  ctx.lineWidth = 2;
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
  tex.repeat.set(30, 30);
  return tex;
}

export default function NeonGrid() {
  const gridRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Group>(null);

  const gridTexture = useMemo(() => createGridTexture(), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (gridRef.current) {
      const mat = gridRef.current.material as THREE.MeshBasicMaterial;
      if (mat.map) {
        mat.map.offset.y = t * 0.02;
      }
    }

    if (ringsRef.current) {
      ringsRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const scale = 1 + Math.sin(t * 2 + i * 0.5) * 0.02;
        mesh.scale.set(scale, scale, 1);
      });
    }
  });

  return (
    <group position={[0, -2.0, 0]}>
      {/* SOLID BLACK FLOOR BASE */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial color="#030001" depthWrite={true} />
      </mesh>

      {/* RED GRID */}
      <mesh
        ref={gridRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
      >
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial
          map={gridTexture}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* SECONDARY GRID */}
      <mesh rotation={[-Math.PI / 2, 0.2, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial
          map={gridTexture}
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* CONCENTRIC RINGS under laptop */}
      <group ref={ringsRef} position={[2.5, 0.02, -0.5]}>
        {[1.5, 2.5, 3.5, 5, 7, 9, 12].map((radius, i) => (
          <mesh key={radius} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[radius, radius + 0.08, 128]} />
            <meshBasicMaterial
              color={i % 2 === 0 ? "#ff1744" : "#ff6b6b"}
              transparent
              opacity={0.2 - i * 0.02}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* GLOWING CIRCLE under laptop */}
      <mesh position={[2.5, 0.01, -0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[6, 64]} />
        <meshBasicMaterial
          color="#ff1744"
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* VERTICAL LIGHT BEAMS */}
      <mesh position={[8, 2, -5]} rotation={[-Math.PI / 2, 0.05, 0]}>
        <planeGeometry args={[0.08, 60]} />
        <meshBasicMaterial
          color="#ff1744"
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[-7, 2, -8]} rotation={[-Math.PI / 2, -0.05, 0]}>
        <planeGeometry args={[0.05, 50]} />
        <meshBasicMaterial
          color="#800010"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* HORIZONTAL DATA STREAKS */}
      {[
        [-15, -22, 1, 10, 0.12],
        [-6, -25, 0.7, 7, 0.08],
        [5, -20, 0.8, 8, 0.1],
        [14, -26, 1.1, 11, 0.14],
        [22, -30, 0.6, 6, 0.07],
      ].map(([x, z, w, h, op], i) => (
        <mesh key={i} position={[x as number, 0.05, z as number]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w as number, h as number]} />
          <meshBasicMaterial
            color="#ff1744"
            transparent
            opacity={op as number}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* REFLECTION PLANE */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]}>
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial
          color="#ff1744"
          transparent
          opacity={0.015}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}