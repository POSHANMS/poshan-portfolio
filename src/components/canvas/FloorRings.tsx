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
    
    // Only show rings very close to center
    if (r > 0.35) discard;
    
    // Very few rings, very slow
    float ring1 = sin(r * 40.0 - uTime * 1.0);
    
    // Very sharp, thin
    float mask1 = smoothstep(0.96, 0.995, ring1) * 0.15;
    
    // Fade out quickly
    float fade = max(0.0, 1.0 - r * 3.0);
    
    // Dark red
    vec3 color = vec3(0.6, 0.03, 0.08);
    
    float alpha = mask1 * fade * 0.15;
    
    // Tiny core glow
    alpha += exp(-r * r * 20.0) * 0.04;
    
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
      <planeGeometry args={[8, 8]} />
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