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
    
    // Multiple expanding ring waves - slower, fewer
    float ring1 = sin(r * 30.0 - uTime * 2.0);     // Was 35, 3.0
    float ring2 = sin(r * 45.0 - uTime * 3.5 + 2.0); // Was 50, 5.0
    float ring3 = sin(r * 20.0 - uTime * 1.5 + 4.0); // Was 25, 2.0
    
    // Sharp rings - slightly softer
    float mask1 = smoothstep(0.92, 0.98, ring1);      // Was 0.9, 0.98
    float mask2 = smoothstep(0.90, 0.96, ring2) * 0.5; // Was 0.88, 0.96, 0.6
    float mask3 = smoothstep(0.94, 0.99, ring3) * 0.3; // Was 0.92, 0.99, 0.4
    
    // Fade outward - stronger fade
    float fade = max(0.0, 1.0 - r * 2.0); // Was 1.5
    
    // Darker colors
    vec3 inner = vec3(0.9, 0.06, 0.12);  // Was 1.0, 0.08, 0.15
    vec3 outer = vec3(0.4, 0.0, 0.04);   // Was 0.5, 0.0, 0.05
    vec3 color = mix(inner, outer, r * 2.0);
    
    float alpha = (mask1 + mask2 + mask3) * fade * 0.45; // Was 0.7
    
    // Core glow - dimmer
    alpha += exp(-r * r * 8.0) * 0.2; // Was 6.0, 0.3
    
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
      <planeGeometry args={[18, 18]} />
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