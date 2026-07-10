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
    
    // Very tight containment
    if (r > 0.2) discard;
    
    // Single slow ring
    float ring1 = sin(r * 40.0 - uTime * 1.0);
    
    // Very thin, very dim
    float mask1 = smoothstep(0.96, 0.999, ring1) * 0.15;
    
    // Quick fade
    float fade = max(0.0, 1.0 - r * 5.0);
    
    vec3 color = vec3(0.6, 0.04, 0.08);
    
    float alpha = mask1 * fade * 0.2;
    
    // Tiny core
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
      <planeGeometry args={[5, 5]} /> {/* Very small */}
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