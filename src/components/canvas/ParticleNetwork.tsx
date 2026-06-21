"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function ParticleNetwork() {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const particleCount = 1800;

  // Initialize random particle positions and velocities
  const [positions, velocities, sizes] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);
    const sz = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      // Position range: X: [-10, 10], Y: [-6, 6], Z: [-5, 5]
      pos[idx] = (Math.random() - 0.5) * 20;
      pos[idx + 1] = (Math.random() - 0.5) * 12;
      pos[idx + 2] = (Math.random() - 0.5) * 10;

      // Small velocity offsets
      vel[idx] = (Math.random() - 0.5) * 0.02;
      vel[idx + 1] = (Math.random() - 0.5) * 0.02;
      vel[idx + 2] = (Math.random() - 0.5) * 0.02;

      // Variable node sizes
      sz[i] = 1.0 + Math.random() * 2.5;
    }

    return [pos, vel, sz];
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0.0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uColor: { value: new THREE.Color("#00d4ff") }, // Electric Blue particles
    }),
    []
  );

  // Update particle positions (ambient drift + cursor influence) in the frame loop
  useFrame((state) => {
    if (!pointsRef.current || !materialRef.current) return;

    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position;
    const posArray = posAttr.array as Float32Array;
    
    const time = state.clock.getElapsedTime();
    materialRef.current.uniforms.uTime.value = time;

    // Smooth LERP mouse coordinates
    const targetX = state.pointer.x * 10; // scale to scene width
    const targetY = state.pointer.y * 6;  // scale to scene height
    
    materialRef.current.uniforms.uMouse.value.x = THREE.MathUtils.lerp(
      materialRef.current.uniforms.uMouse.value.x,
      targetX,
      0.05
    );
    materialRef.current.uniforms.uMouse.value.y = THREE.MathUtils.lerp(
      materialRef.current.uniforms.uMouse.value.y,
      targetY,
      0.05
    );

    const mousePos = new THREE.Vector3(
      materialRef.current.uniforms.uMouse.value.x,
      materialRef.current.uniforms.uMouse.value.y,
      0
    );

    // Apply drift and mouse gravity/cluster attraction in JavaScript (CPU side) for simplicity and physics precision
    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      
      // Basic drift
      posArray[idx] += velocities[idx];
      posArray[idx + 1] += velocities[idx + 1];
      posArray[idx + 2] += velocities[idx + 2];

      // Mouse attraction: pull points within a 4-unit radius towards the mouse position
      const p = new THREE.Vector3(posArray[idx], posArray[idx + 1], posArray[idx + 2]);
      const distToMouse = p.distanceTo(mousePos);

      if (distToMouse < 4.0) {
        // Compute direction vector
        const dir = new THREE.Vector3().subVectors(mousePos, p).normalize();
        // Force is stronger closer to center
        const force = (4.0 - distToMouse) * 0.008;
        
        posArray[idx] += dir.x * force;
        posArray[idx + 1] += dir.y * force;
        posArray[idx + 2] += dir.z * force;
      }

      // Re-boundary wrapping if points drift too far
      if (Math.abs(posArray[idx]) > 12) posArray[idx] = -posArray[idx];
      if (Math.abs(posArray[idx + 1]) > 7) posArray[idx + 1] = -posArray[idx + 1];
      if (Math.abs(posArray[idx + 2]) > 6) posArray[idx + 2] = -posArray[idx + 2];
    }

    posAttr.needsUpdate = true;
  });

  // Custom shader code embedded for Points rendering
  const vertexShader = `
    uniform float uTime;
    attribute float aSize;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      gl_PointSize = aSize * (150.0 / -mvPosition.z);
    }
  `;

  const fragmentShader = `
    uniform vec3 uColor;
    varying vec2 vUv;
    void main() {
      // Circle shape mask
      vec2 coord = gl_PointCoord - vec2(0.5);
      if (length(coord) > 0.5) discard;
      float alpha = smoothstep(0.5, 0.1, length(coord));
      
      // Neon bright core, fading out
      gl_FragColor = vec4(uColor, alpha * 0.8);
    }
  `;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-aSize"
          args={[sizes, 1]}
        />
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
