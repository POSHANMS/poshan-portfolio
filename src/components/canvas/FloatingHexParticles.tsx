"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function FloatingHexParticles() {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, phases, sizes } = useMemo(() => {
    const count = 200;
    const pos = new Float32Array(count * 3);
    const ph = new Float32Array(count);
    const sz = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * 40;
      pos[i3 + 1] = Math.random() * 15 - 2;
      pos[i3 + 2] = (Math.random() - 0.5) * 30 - 5;
      ph[i] = Math.random() * Math.PI * 2;
      sz[i] = 0.05 + Math.random() * 0.1;
    }

    return { positions: pos, phases: ph, sizes: sz };
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const t = state.clock.getElapsedTime();
    const posAttr = pointsRef.current.geometry.attributes.position;
    const posArray = posAttr.array as Float32Array;

    for (let i = 0; i < 200; i++) {
      const i3 = i * 3;
      // Float upward
      posArray[i3 + 1] += 0.003;
      // Gentle drift
      posArray[i3] += Math.sin(t * 0.5 + phases[i]) * 0.001;
      
      // Reset if too high
      if (posArray[i3 + 1] > 15) {
        posArray[i3 + 1] = -2;
        posArray[i3] = (Math.random() - 0.5) * 40;
        posArray[i3 + 2] = (Math.random() - 0.5) * 30 - 5;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial
        uniforms={{ uTime: { value: 0 } }}
        vertexShader={`
          attribute float aSize;
          attribute float aPhase;
          varying float vAlpha;
          uniform float uTime;
          void main() {
            vAlpha = 0.4 + 0.3 * sin(uTime * 0.8 + aPhase);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = aSize * (40.0 / max(1.0, -mv.z));
          }
        `}
        fragmentShader={`
          varying float vAlpha;
          void main() {
            vec2 uv = gl_PointCoord - 0.5;
            float d = length(uv);
            // Hexagon shape
            float hex = abs(uv.x) * 0.866 + abs(uv.y) * 0.5;
            float shape = 1.0 - smoothstep(0.3, 0.5, hex);
            if (shape < 0.01) discard;
            gl_FragColor = vec4(1.0, 0.15, 0.25, shape * vAlpha * 0.6);
          }
        `}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
