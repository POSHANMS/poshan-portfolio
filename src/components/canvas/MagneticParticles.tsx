"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMousePosition } from "@/hooks/useMousePosition";

export default function ParticleNetwork() {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const mouse = useMousePosition(0.08);
  const particleCount = 1200; // High-density premium feel

  // We store:
  // - positions: current 3D position
  // - basePositions: initial positions to return to after mouse interaction
  // - velocities: drift speed/direction
  // - sizes: individual particle size factors
  // - phases: for organic twinkle/pulsing
  const { positions, basePositions, velocities, sizes, phases } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const basePos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);
    const sz = new Float32Array(particleCount);
    const ph = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      // Widespread across the viewport to form a gorgeous cosmic atmosphere
      const x = (Math.random() - 0.5) * 36;
      const y = (Math.random() - 0.5) * 20;
      const z = (Math.random() - 0.5) * 12;

      pos[idx] = x;
      pos[idx + 1] = y;
      pos[idx + 2] = z;

      basePos[idx] = x;
      basePos[idx + 1] = y;
      basePos[idx + 2] = z;

      vel[idx] = (Math.random() - 0.5) * 0.005;
      vel[idx + 1] = (Math.random() - 0.5) * 0.005;
      vel[idx + 2] = (Math.random() - 0.5) * 0.002;

      // Larger, prominent sizes that look like glowing energy nodes
      sz[i] = 0.5 + Math.random() * 1.5;
      ph[i] = Math.random() * Math.PI * 2;
    }

    return { positions: pos, basePositions: basePos, velocities: vel, sizes: sz, phases: ph };
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

    const t = state.clock.getElapsedTime();
    materialRef.current.uniforms.uTime.value = t;

    // Map mouse to world space coordinates using global hook (state.pointer doesn't update behind HTML overlays)
    const targetX = mouse.x * 12.0;
    const targetY = mouse.y * 7.5;

    materialRef.current.uniforms.uMouse.value.x = THREE.MathUtils.lerp(
      materialRef.current.uniforms.uMouse.value.x,
      targetX,
      0.08
    );
    materialRef.current.uniforms.uMouse.value.y = THREE.MathUtils.lerp(
      materialRef.current.uniforms.uMouse.value.y,
      targetY,
      0.08
    );

    const mx = materialRef.current.uniforms.uMouse.value.x;
    const my = materialRef.current.uniforms.uMouse.value.y;

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;

      // Organic base drift over time using sine waves
      const windX = Math.sin(t * 0.2 + phases[i]) * 0.002;
      const windY = Math.cos(t * 0.15 + phases[i] * 2.0) * 0.002;

      basePositions[idx] += velocities[idx] + windX;
      basePositions[idx + 1] += velocities[idx + 1] + windY;
      basePositions[idx + 2] += velocities[idx + 2];

      // Wrap base coordinates around boundaries to keep particles on screen
      if (Math.abs(basePositions[idx]) > 18) basePositions[idx] = -basePositions[idx];
      if (Math.abs(basePositions[idx + 1]) > 10) basePositions[idx + 1] = -basePositions[idx + 1];
      if (Math.abs(basePositions[idx + 2]) > 7.5) basePositions[idx + 2] = -basePositions[idx + 2];

      const px = posArray[idx];
      const py = posArray[idx + 1];
      const pz = posArray[idx + 2];

      const dx = mx - px;
      const dy = my - py;
      const dz = -pz;
      const distToMouse = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Fluid repulsion: particles push away and swirl around the mouse
      const maxDist = 12.0;
      if (distToMouse < maxDist && distToMouse > 0.001) {
        const dirX = dx / distToMouse;
        const dirY = dy / distToMouse;
        const dirZ = dz / distToMouse;

        // Tangential orbit vector for fluid swirl
        const tangentX = -dirY;
        const tangentY = dirX;

        // Repulsion force: stronger as the mouse gets closer
        const strength = (maxDist - distToMouse) / maxDist;
        const pushForce = strength * strength * 0.15;
        const swirlForce = strength * 0.08;

        // Push away + swirl
        posArray[idx] -= dirX * pushForce - tangentX * swirlForce;
        posArray[idx + 1] -= dirY * pushForce - tangentY * swirlForce;
        posArray[idx + 2] -= dirZ * pushForce * 0.2;
      }

      // Smoothly return particles back to their baseline drifting positions (spring/lerp effect)
      posArray[idx] = THREE.MathUtils.lerp(posArray[idx], basePositions[idx], 0.04);
      posArray[idx + 1] = THREE.MathUtils.lerp(posArray[idx + 1], basePositions[idx + 1], 0.04);
      posArray[idx + 2] = THREE.MathUtils.lerp(posArray[idx + 2], basePositions[idx + 2], 0.04);
    }

    posAttr.needsUpdate = true;
  });

  // Custom vertex shader with depth-based sizing
  const vertexShader = `
    attribute float aSize;
    attribute float aPhase;
    uniform float uTime;
    varying float vTwinkle;

    void main() {
      // Gentle twinkle scaling factor
      vTwinkle = 0.5 + 0.5 * sin(uTime * 1.5 + aPhase);
      
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Scale points based on depth and individual size factor
      gl_PointSize = aSize * vTwinkle * (26.0 / -mvPosition.z);
    }
  `;

  // Custom fragment shader for premium glowing circular nodes
  const fragmentShader = `
    uniform vec3 uColor;
    varying float vTwinkle;

    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      
      // Soft circular mask
      if (dist > 0.5) discard;
      
      // Radial glow gradient: dense core, soft edges
      float core = smoothstep(0.5, 0.0, dist);
      float glow = smoothstep(0.5, 0.1, dist) * 0.4;
      
      // Vibrant energy color shift
      vec3 color = mix(uColor, vec3(1.0, 0.35, 0.45), smoothstep(0.1, 0.45, coord.x + 0.5));
      
      gl_FragColor = vec4(color, (core + glow) * vTwinkle * 0.82);
    }
  `;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
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
