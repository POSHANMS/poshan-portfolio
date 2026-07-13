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
    vec2 uv = vUv;

    // Light source from upper right
    vec2 lightPos = vec2(0.75, 0.7);
    vec2 toLight = lightPos - uv;
    float dist = length(toLight);
    float angle = atan(toLight.y, toLight.x);

    // Ray beams - fewer, dimmer
    float rays = 0.0;
    for (int i = 0; i < 4; i++) {
      float fi = float(i);
      float rayAngle = angle + fi * 0.4 + uTime * 0.03;
      float ray = pow(sin(rayAngle * 6.0 + fi * 2.0) * 0.5 + 0.5, 10.0);
      float rayWidth = 0.015 + fi * 0.004;
      float rayMask = smoothstep(rayWidth, 0.0, abs(ray - 0.5) * 2.0);
      rays += rayMask * (1.0 - dist) * (0.25 - fi * 0.05);
    }

    // Fade with distance from light
    float fade = smoothstep(0.0, 0.8, 1.0 - dist);

    vec3 color = vec3(0.8, 0.05, 0.1) * rays * fade * 0.08;
    float alpha = rays * fade * 0.04;

    gl_FragColor = vec4(color, alpha);
  }
`;

export default function VolumetricRays() {
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
    <mesh position={[5, 5, -20]} renderOrder={-50}>
      <planeGeometry args={[40, 30]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}