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

  // Main grid — medium thickness, visible but not thick
  ctx.strokeStyle = "#ff1744";
  ctx.lineWidth = 1.0;

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

  // Major grid lines — slightly brighter
  ctx.strokeStyle = "#ff3344";
  ctx.lineWidth = 1.6;
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
  tex.repeat.set(16, 16);
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
        mat.map.offset.y = t * 0.015;
      }
    }

    if (ringsRef.current) {
      ringsRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const scale = 1 + Math.sin(t * 1.5 + i * 0.5) * 0.015;
        mesh.scale.set(scale, scale, 1);
      });
    }
  });

  return (
    <group position={[0, -2.5, 0]}>
      {/* SOLID BLACK FLOOR BASE */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial color="#010001" depthWrite={true} />
      </mesh>

      {/* PRIMARY GRID — moderate opacity, normal blending */}
      <mesh
        ref={gridRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
      >
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial
          map={gridTexture}
          transparent
          opacity={0.3}
          blending={THREE.NormalBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* SECONDARY GRID — offset angle for depth perception */}
      <mesh rotation={[-Math.PI / 2, 0.12, 0]} position={[0, 0.003, 0]}>
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial
          map={gridTexture}
          transparent
          opacity={0.15}
          blending={THREE.NormalBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* CONCENTRIC RINGS — restored but dimmer, under laptop only */}
      <group ref={ringsRef} position={[2.5, 0.01, -0.5]}>
        {[1.5, 2.5, 3.5, 5, 7].map((radius, i) => (
          <mesh key={radius} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[radius, radius + 0.06, 128]} />
            <meshBasicMaterial
              color={i % 2 === 0 ? "#ff1744" : "#ff4444"}
              transparent
              opacity={0.1 - i * 0.015}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* GLOWING CIRCLE under laptop — restored, moderate */}
      <mesh position={[2.5, 0.005, -0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[5, 64]} />
        <meshBasicMaterial
          color="#ff1744"
          transparent
          opacity={0.05}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* VERTICAL LIGHT BEAMS — restored, moderate */}
      <mesh position={[8, 2, -5]} rotation={[-Math.PI / 2, 0.05, 0]}>
        <planeGeometry args={[0.06, 60]} />
        <meshBasicMaterial
          color="#ff1744"
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[-7, 2, -8]} rotation={[-Math.PI / 2, -0.05, 0]}>
        <planeGeometry args={[0.04, 50]} />
        <meshBasicMaterial
          color="#800010"
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* HORIZONTAL DATA STREAKS — restored */}
      {[
        [-15, -22, 1, 10, 0.1],
        [-6, -25, 0.7, 7, 0.06],
        [5, -20, 0.8, 8, 0.08],
        [14, -26, 1.1, 11, 0.12],
        [22, -30, 0.6, 6, 0.05],
      ].map(([x, z, w, h, op], i) => (
        <mesh key={i} position={[x as number, 0.03, z as number]} rotation={[-Math.PI / 2, 0, 0]}>
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

      {/* REFLECTION PLANE — very subtle surface sheen */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial
          color="#ff1744"
          transparent
          opacity={0.01}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* NEW: Floor surface glow — subtle red tint on the floor itself */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial
          color="#1a0003"
          transparent
          opacity={0.4}
          blending={THREE.NormalBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* HORIZON FADE — soft black gradient to hide grid at distance */}
      <mesh position={[0, 0.02, -55]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[200, 50]} />
        <meshBasicMaterial
          color="#020001"
          transparent
          opacity={0.6}
          blending={THREE.NormalBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}