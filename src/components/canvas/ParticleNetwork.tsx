"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function ParticleNetwork() {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const particleCount = 3500; // Was 1800

  const [positions, velocities, sizes] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);
    const sz = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      pos[idx] = (Math.random() - 0.5) * 26;
      pos[idx + 1] = (Math.random() - 0.5) * 16;
      pos[idx + 2] = (Math.random() - 0.5) * 11;
      vel[idx] = (Math.random() - 0.5) * 0.01;
      vel[idx + 1] = (Math.random() - 0.5) * 0.01;
      vel[idx + 2] = (Math.random() - 0.5) * 0.004;
      sz[i] = 0.18 + Math.random() * 0.84;
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
    const targetX = state.pointer.x * 10.5;
    const targetY = state.pointer.y * 6.4;

    materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    materialRef.current.uniforms.uMouse.value.x = THREE.MathUtils.lerp(materialRef.current.uniforms.uMouse.value.x, targetX, 0.09);
    materialRef.current.uniforms.uMouse.value.y = THREE.MathUtils.lerp(materialRef.current.uniforms.uMouse.value.y, targetY, 0.09);

    const mx = materialRef.current.uniforms.uMouse.value.x;
    const my = materialRef.current.uniforms.uMouse.value.y;

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;

      posArray[idx] += velocities[idx];
      posArray[idx + 1] += velocities[idx + 1];
      posArray[idx + 2] += velocities[idx + 2];

      const px = posArray[idx];
      const py = posArray[idx + 1];
      const pz = posArray[idx + 2];

      const dx = mx - px;
      const dy = my - py;
      const dz = -pz;
      const distToMouse = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distToMouse < 12.0 && distToMouse > 0.001) {
        const dirX = dx / distToMouse;
        const dirY = dy / distToMouse;
        const dirZ = dz / distToMouse;

        // Tangential (orbit) force instead of direct pull
        const tangentX = -dirY;
        const tangentY = dirX;

        // Weaker attraction, stronger tangential spread
        const force = (12.0 - distToMouse) * 0.002;
        const drift = (12.0 - distToMouse) * 0.005;

        posArray[idx] += dirX * force + tangentX * drift;
        posArray[idx + 1] += dirY * force + tangentY * drift;
        posArray[idx + 2] += dirZ * force;
      }

      if (Math.abs(posArray[idx]) > 15) posArray[idx] = -posArray[idx];
      if (Math.abs(posArray[idx + 1]) > 9) posArray[idx + 1] = -posArray[idx + 1];
      if (Math.abs(posArray[idx + 2]) > 6.5) posArray[idx + 2] = -posArray[idx + 2];
    }

    posAttr.needsUpdate = true;
  });

  const vertexShader = `
    attribute float aSize;
    uniform float uTime;
    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      gl_PointSize = aSize * (18.0 / -mvPosition.z);
    }
  `;

  const fragmentShader = `
    uniform vec3 uColor;
    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      if (dist > 0.5) discard;
      float alpha = smoothstep(0.5, 0.02, dist);
      vec3 color = mix(uColor, vec3(1.0, 0.3, 0.4), smoothstep(0.1, 0.5, coord.x + 0.5));
      gl_FragColor = vec4(color, alpha * 0.72);
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
