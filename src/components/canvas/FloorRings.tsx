"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv - 0.5;
    float r = length(uv);
    
    // HARD CUTOFF - only show very close to center
    if (r > 0.25) discard;
    
    // Just 2 slow rings
    float ring1 = sin(r * 50.0 - uTime * 0.8);
    
    // Very thin, sharp
    float mask1 = smoothstep(0.97, 0.998, ring1) * 0.12;
    
    // Fade out quickly from center
    float fade = max(0.0, 1.0 - r * 4.0);
    
    // Dark red
    vec3 color = vec3(0.5, 0.03, 0.06);
    
    float alpha = mask1 * fade * 0.12;
    
    // Tiny core pulse - very subtle
    float pulse = sin(uTime * 0.5) * 0.5 + 0.5;
    alpha += exp(-r * r * 25.0) * 0.03 * pulse;
    
    if (alpha < 0.005) discard;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

export default function FloorRings() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = React.useMemo(
    () => ({
      uTime: { value: 0.0 },
    }),
    []
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <mesh 
      position={[2.5, -1.82, -0.5]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[4, 4]} /> {/* VERY small - only under laptop */}
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}