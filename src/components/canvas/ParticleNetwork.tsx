"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function ParticleNetwork() {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const particleCount = 800; // Reduced from 3500

  const [positions, velocities, sizes] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);
    const sz = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      // Spread in upper area, not on floor
      pos[idx] = (Math.random() - 0.5) * 30;
      pos[idx + 1] = Math.random() * 12 + 1;
      pos[idx + 2] = (Math.random() - 0.5) * 20 - 5;

      // Very slow drift
      vel[idx] = (Math.random() - 0.5) * 0.003;
      vel[idx + 1] = (Math.random() - 0.5) * 0.002;
      vel[idx + 2] = (Math.random() - 0.5) * 0.001;

      sz[i] = 0.12 + Math.random() * 0.35;
    }

    return [pos, vel, sz];
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uColor: { value: new THREE.Color("#ff1744") },
    }),
    []
  );

  useFrame((state) => {
    if (!pointsRef.current || !materialRef.current) return;

    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position;
    const posArray = posAttr.array as Float32Array;

    materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;

      posArray[idx] += velocities[idx];
      posArray[idx + 1] += velocities[idx + 1];
      posArray[idx + 2] += velocities[idx + 2];

      // Wrap around boundaries
      if (Math.abs(posArray[idx]) > 18) posArray[idx] *= -0.9;
      if (posArray[idx + 1] > 16 || posArray[idx + 1] < 0.5) velocities[idx + 1] *= -1;
      if (Math.abs(posArray[idx + 2]) > 15) posArray[idx + 2] *= -0.9;
    }

    posAttr.needsUpdate = true;
  });

  const vertexShader = `
    attribute float aSize;
    uniform float uTime;
    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      gl_PointSize = aSize * (16.0 / -mvPosition.z);
    }
  `;

  const fragmentShader = `
    uniform vec3 uColor;
    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      if (dist > 0.5) discard;
      float alpha = smoothstep(0.5, 0.0, dist);
      gl_FragColor = vec4(uColor, alpha * 0.55);
    }
  `;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
