"use client";

import React, { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface ActOneHoloFXProps {
  scrollProgress: number;
  powerUpStage?: string;
  laptopOpacity?: number;
}

const COLUMN_COUNT = 18;

function createBinaryTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 80;
  canvas.height = 768;
  const context = canvas.getContext("2d");
  if (!context) return new THREE.CanvasTexture(canvas);

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.textAlign = "center";
  context.font = "bold 26px monospace";
  for (let index = 0; index < 29; index += 1) {
    const lead = index < 2;
    context.fillStyle = lead ? "rgba(255,245,247,0.98)" : `rgba(255,${75 + (index % 4) * 22},${105 + (index % 3) * 18},${0.70 - index * 0.021})`;
    context.fillText(String((index * 7 + 3) % 2), 40, 30 + index * 26);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export default function ActOneHoloFX({
  scrollProgress,
  powerUpStage = "complete",
  laptopOpacity = 1,
}: ActOneHoloFXProps) {
  const rainRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  const laptopX = Math.max(0.8, viewport.width * 0.08);

  const binaryTexture = useMemo(createBinaryTexture, []);

  const columns = useMemo(
    () => Array.from({ length: COLUMN_COUNT }, (_, index) => ({
      x: -3.3 + (index / (COLUMN_COUNT - 1)) * 6.6 + ((index % 3) - 1) * 0.075,
      z: -1.9 - (index % 4) * 0.38,
      speed: 0.25 + (index % 5) * 0.038,
      offset: (index * 0.173) % 1,
      opacity: 0.28 + (index % 4) * 0.07,
    })),
    [],
  );

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const active = scrollProgress < 0.17 && (powerUpStage === "ui" || powerUpStage === "complete" || laptopOpacity > 0.48);
    if (rainRef.current) {
      rainRef.current.visible = active;
      rainRef.current.children.forEach((child, index) => {
        const column = columns[index];
        child.position.y = ((time * column.speed + column.offset) % 1) * 2.1 - 0.75;
      });
    }
  });

  if (scrollProgress >= 0.18) return null;

  return (
    <group position={[laptopX, -0.52, -1.14]}>
      <group ref={rainRef} position={[0, 0.25, -0.8]}>
        {columns.map((column, index) => (
          <mesh key={index} position={[column.x, 0, column.z]}>
            <planeGeometry args={[0.2, 3.1]} />
            <meshBasicMaterial map={binaryTexture} transparent opacity={column.opacity} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
