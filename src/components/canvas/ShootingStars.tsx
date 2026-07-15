"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface StarData {
  pos: THREE.Vector3;
  dir: THREE.Vector3;
  speed: number;
  length: number;
  progress: number;
  delay: number;
  width: number;
}

export default function ShootingStars() {
  const lineRef = useRef<THREE.LineSegments>(null);
  const count = 3;

  // Pool of shooting star parameters
  const stars = useMemo(() => {
    const data: StarData[] = [];
    for (let i = 0; i < count; i++) {
      data.push({
        pos: new THREE.Vector3(),
        dir: new THREE.Vector3(-1.0, -0.4, 0).normalize(), // diagonal trajectory
        speed: 12.0 + Math.random() * 8.0,
        length: 2.0 + Math.random() * 3.0,
        progress: 0,
        delay: Math.random() * 8.0,
        width: 0.8 + Math.random() * 1.5
      });
    }
    return data;
  }, []);

  // Geometry attributes buffers
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 2 * 3); // 2 vertices per star, 3 coords
    const col = new Float32Array(count * 2 * 3); // RGB per vertex
    return [pos, col];
  }, []);

  const resetStar = (star: StarData) => {
    star.pos.set(
      15.0 + Math.random() * 20.0, // start top-right
      6.0 + Math.random() * 8.0,
      -20.0 - Math.random() * 15.0 // far background depth
    );
    star.progress = 0;
    star.delay = 4.0 + Math.random() * 12.0; // random wait time before next streak
    star.speed = 15.0 + Math.random() * 10.0;
    star.length = 3.0 + Math.random() * 4.0;
  };

  useFrame((_, delta) => {
    if (!lineRef.current) return;
    const geo = lineRef.current.geometry;
    const posAttr = geo.attributes.position;
    const colAttr = geo.attributes.color;
    const posArray = posAttr.array as Float32Array;
    const colArray = colAttr.array as Float32Array;

    stars.forEach((star, i) => {
      const idx = i * 6; // 6 values per line (2 vertices * 3 coords)

      if (star.delay > 0) {
        star.delay -= delta;
        // Keep star hidden offscreen when inactive
        posArray[idx] = 0; posArray[idx + 1] = -999; posArray[idx + 2] = 0;
        posArray[idx + 3] = 0; posArray[idx + 4] = -999; posArray[idx + 2] = 0;
        return;
      }

      // Animate streak progress
      star.progress += delta * star.speed;
      const head = star.pos.clone().addScaledVector(star.dir, star.progress);
      const tail = star.pos.clone().addScaledVector(star.dir, Math.max(0, star.progress - star.length));

      // Set line segment vertices
      posArray[idx]     = head.x;
      posArray[idx + 1] = head.y;
      posArray[idx + 2] = head.z;
      
      posArray[idx + 3] = tail.x;
      posArray[idx + 4] = tail.y;
      posArray[idx + 5] = tail.z;

      // Color gradient fade (head is bright white, tail is red-crimson)
      const opacity = Math.sin(Math.min(1.0, star.progress / 5.0) * Math.PI); // fade in/out curve
      
      // Head vertex: white-hot
      colArray[idx]     = 1.0 * opacity;
      colArray[idx + 1] = 0.95 * opacity;
      colArray[idx + 2] = 0.9 * opacity;

      // Tail vertex: fading red-pink
      colArray[idx + 3] = 0.9 * opacity;
      colArray[idx + 4] = 0.05 * opacity;
      colArray[idx + 5] = 0.12 * opacity;

      // Reset when completed
      if (star.progress > 30.0) {
        resetStar(star);
      }
    });

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  });

  return (
    <lineSegments ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <lineBasicMaterial vertexColors transparent opacity={0.65} blending={THREE.AdditiveBlending} depthWrite={false} linewidth={1.5} />
    </lineSegments>
  );
}
