"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Much simpler — just stars, no constellation lines
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export default function StarField() {
  const starsRef = useRef<THREE.Points>(null);

  const { positions, colors, sizes, phases } = useMemo(() => {
    const rand = seededRandom(42);
    const count = 1200; // Reduced from 5000
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const ph = new Float32Array(count);

    // Red-tinted star palette
    const palette = [
      new THREE.Color(1.0, 0.95, 0.95),
      new THREE.Color(1.0, 0.85, 0.85),
      new THREE.Color(1.0, 0.7, 0.7),
      new THREE.Color(1.0, 0.5, 0.5),
      new THREE.Color(1.0, 0.3, 0.35),
      new THREE.Color(0.9, 0.4, 0.45),
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Spread stars across sky, avoid floor area
      pos[i3] = (rand() - 0.5) * 80;
      pos[i3 + 1] = rand() * 25 + 2; // Above floor
      pos[i3 + 2] = -10 - rand() * 70;

      const color = palette[Math.floor(rand() * palette.length)];
      col[i3] = color.r;
      col[i3 + 1] = color.g;
      col[i3 + 2] = color.b;

      const r = rand();
      if (r > 0.985) sz[i] = 12 + rand() * 8;      // bright stars
      else if (r > 0.92) sz[i] = 5 + rand() * 4;   // medium
      else if (r > 0.75) sz[i] = 2 + rand() * 2;   // small
      else sz[i] = 0.8 + rand() * 1.2;              // tiny

      ph[i] = rand() * Math.PI * 2;
    }

    return { positions: pos, colors: col, sizes: sz, phases: ph };
  }, []);

  // Simple circular star shader
  const starMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        attribute float aSize;
        attribute float aPhase;
        varying float vAlpha;
        uniform float uTime;
        void main() {
          float twinkle = 0.6 + 0.4 * sin(uTime * 0.8 + aPhase);
          vAlpha = twinkle;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = aSize;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float d = length(uv);
          float core = smoothstep(0.5, 0.0, d);
          float glow = smoothstep(0.5, 0.15, d) * 0.3;
          if (core + glow < 0.01) discard;
          gl_FragColor = vec4(1.0, 0.85, 0.85, (core + glow) * vAlpha * 0.7);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    starMaterial.uniforms.uTime.value = t;
    if (starsRef.current) starsRef.current.rotation.y = t * 0.0003;
  });

  return (
    <group>
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
          <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        </bufferGeometry>
        <primitive object={starMaterial} attach="material" />
      </points>
    </group>
  );
}
