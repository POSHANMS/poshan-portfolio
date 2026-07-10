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
    
    // Contain to center area
    if (r > 0.3) discard;
    
    // 2 rings, slow
    float ring1 = sin(r * 35.0 - uTime * 1.5);
    float ring2 = sin(r * 50.0 - uTime * 2.5 + 2.0);
    
    // Sharp but dim
    float mask1 = smoothstep(0.93, 0.99, ring1) * 0.2;
    float mask2 = smoothstep(0.92, 0.98, ring2) * 0.1;
    
    // Fade from center
    float fade = max(0.0, 1.0 - r * 3.0);
    
    vec3 inner = vec3(0.8, 0.06, 0.12);
    vec3 outer = vec3(0.35, 0.0, 0.04);
    vec3 color = mix(inner, outer, r * 2.0);
    
    float alpha = (mask1 + mask2) * fade * 0.35;
    
    // Core pulse
    float pulse = sin(uTime * 0.6) * 0.5 + 0.5;
    alpha += exp(-r * r * 12.0) * 0.08 * pulse;
    
    if (alpha < 0.01) discard;
    
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
      <planeGeometry args={[10, 10]} /> {/* Moderate size */}
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