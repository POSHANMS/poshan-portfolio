"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type ConstellationNode = {
  x: number;
  y: number;
  z: number;
  color: THREE.Color;
};

export default function StarField() {
  const ambientStarsRef = useRef<THREE.Points>(null);
  const galaxyStarsRef = useRef<THREE.Points>(null);
  const constellationRef = useRef<THREE.LineSegments>(null);

  const [ambientPositions, ambientColors, ambientSizes] = useMemo(() => {
    const count = 2000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const palette = [
      new THREE.Color("#ffffff"),
      new THREE.Color("#00d4ff"),
      new THREE.Color("#8b5cf6"),
      new THREE.Color("#ff2d78"),
      new THREE.Color("#00ff88"),
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const color = palette[Math.floor(Math.random() * palette.length)];
      positions[i3] = (Math.random() - 0.5) * 150;
      positions[i3 + 1] = Math.random() * 72 - 3;
      positions[i3 + 2] = (Math.random() - 0.5) * 92 - 26;
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
      sizes[i] = 0.06 + Math.random() * 0.3;
    }

    return [positions, colors, sizes];
  }, []);

  const [galaxyPositions, galaxyColors] = useMemo(() => {
    const count = 600;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const cyan = new THREE.Color("#00d4ff");
    const violet = new THREE.Color("#8b5cf6");
    const pink = new THREE.Color("#ff2d78");

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const radius = Math.pow(Math.random(), 0.58) * 11;
      const arm = Math.random() > 0.5 ? 0 : Math.PI;
      const angle = radius * 0.58 + arm + (Math.random() - 0.5) * 0.8;
      const color = i % 3 === 0 ? pink : i % 3 === 1 ? violet : cyan;

      positions[i3] = 21 + Math.cos(angle) * radius * 1.45;
      positions[i3 + 1] = 20 + Math.sin(angle) * radius * 0.55;
      positions[i3 + 2] = -48 + (Math.random() - 0.5) * 7;
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    return [positions, colors];
  }, []);

  const [constellationGeometry, nodeGeometry] = useMemo(() => {
    const nodes: ConstellationNode[] = [];
    const nodeCount = 100;
    const colors = [
      new THREE.Color("#00d4ff"),
      new THREE.Color("#8b5cf6"),
      new THREE.Color("#ff2d78"),
      new THREE.Color("#00ff88"),
      new THREE.Color("#f0f0f0"),
    ];

    for (let i = 0; i < nodeCount; i++) {
      const cluster = Math.random();
      const denseRight = cluster > 0.58;
      nodes.push({
        x: denseRight ? 14 + Math.random() * 38 : (Math.random() - 0.5) * 108,
        y: denseRight ? 5 + Math.random() * 34 : 2 + Math.random() * 40,
        z: denseRight ? -38 + Math.random() * 18 : -52 + Math.random() * 34,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const linePositions: number[] = [];
    const lineColors: number[] = [];
    const nodePositions: number[] = [];
    const nodeColors: number[] = [];
    const maxDistance = 8.6;

    for (let i = 0; i < nodes.length; i++) {
      const n1 = nodes[i];
      nodePositions.push(n1.x, n1.y, n1.z);
      nodeColors.push(n1.color.r, n1.color.g, n1.color.b);

      let connections = 0;
      for (let j = i + 1; j < nodes.length; j++) {
        const n2 = nodes[j];
        const dx = n1.x - n2.x;
        const dy = n1.y - n2.y;
        const dz = n1.z - n2.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distance < maxDistance && connections < 2 && Math.random() > 0.22) {
          linePositions.push(n1.x, n1.y, n1.z, n2.x, n2.y, n2.z);
          lineColors.push(n1.color.r, n1.color.g, n1.color.b, n2.color.r, n2.color.g, n2.color.b);
          connections += 1;
        }
      }
    }

    const lines = new THREE.BufferGeometry();
    lines.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
    lines.setAttribute("color", new THREE.Float32BufferAttribute(lineColors, 3));

    const points = new THREE.BufferGeometry();
    points.setAttribute("position", new THREE.Float32BufferAttribute(nodePositions, 3));
    points.setAttribute("color", new THREE.Float32BufferAttribute(nodeColors, 3));

    return [lines, points];
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ambientStarsRef.current) ambientStarsRef.current.rotation.y = t * 0.006;
    if (galaxyStarsRef.current) galaxyStarsRef.current.rotation.z = Math.sin(t * 0.08) * 0.025;
    if (constellationRef.current) {
      const material = constellationRef.current.material as THREE.LineBasicMaterial;
      material.opacity = 0.12 + Math.sin(t * 0.9) * 0.035;
    }
  });

  return (
    <group>
      <points ref={ambientStarsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[ambientPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[ambientColors, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[ambientSizes, 1]} />
        </bufferGeometry>
        <pointsMaterial size={0.1} vertexColors transparent opacity={0.76} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>

      <points ref={galaxyStarsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[galaxyPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[galaxyColors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.18} vertexColors transparent opacity={0.74} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>

      <lineSegments ref={constellationRef} geometry={constellationGeometry}>
        <lineBasicMaterial vertexColors transparent opacity={0.14} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>

      <points geometry={nodeGeometry}>
        <pointsMaterial size={0.18} vertexColors transparent opacity={0.78} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
    </group>
  );
}
