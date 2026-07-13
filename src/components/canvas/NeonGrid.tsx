"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const gridVertexShader = `
  varying vec3 vWorldPosition;
  varying vec2 vUv;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vUv = uv;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const gridFragmentShader = `
  uniform float uTime;
  varying vec3 vWorldPosition;
  varying vec2 vUv;

  void main() {
    vec2 worldXZ = vWorldPosition.xz;
    float dist = length(worldXZ);
    
    float cellSize = 3.0;
    vec2 gridCoord = worldXZ / cellSize;
    vec2 gridFract = fract(gridCoord);
    vec2 lineDist = abs(gridFract - 0.5) * 2.0;
    
    float lineWidth = 0.015;
    float majorLineWidth = 0.028;
    
    float lineX = 1.0 - smoothstep(lineWidth, lineWidth + 0.015, lineDist.x);
    float lineZ = 1.0 - smoothstep(lineWidth, lineWidth + 0.015, lineDist.y);
    float regularLine = max(lineX, lineZ);
    
    float majorCellSize = cellSize * 5.0;
    vec2 majorCoord = worldXZ / majorCellSize;
    vec2 majorFract = fract(majorCoord);
    vec2 majorDist = abs(majorFract - 0.5) * 2.0;
    float majorX = 1.0 - smoothstep(majorLineWidth, majorLineWidth + 0.022, majorDist.x);
    float majorZ = 1.0 - smoothstep(majorLineWidth, majorLineWidth + 0.022, majorDist.y);
    float majorLine = max(majorX, majorZ);
    
    float gridPattern = max(regularLine * 0.30, majorLine * 0.55);
    
    float horizonFade = 1.0 - smoothstep(25.0, 60.0, dist);
    
    float heightFade = smoothstep(-0.3, 0.3, vWorldPosition.y + 2.0);
    
    vec3 regularColor = vec3(0.55, 0.07, 0.14);
    vec3 majorColor = vec3(0.75, 0.10, 0.20);
    
    vec3 color = mix(regularColor, majorColor, majorLine) * gridPattern;
    
    float glow = exp(-min(lineDist.x, lineDist.y) * 5.0) * 0.04;
    color += vec3(0.7, 0.08, 0.15) * glow;
    
    float alpha = (gridPattern + glow * 0.25) * horizonFade * heightFade;
    alpha = clamp(alpha, 0.0, 0.45);
    
    gl_FragColor = vec4(color, alpha);
  }
`;

export default function NeonGrid() {
  const gridMaterialRef = useRef<THREE.ShaderMaterial>(null);

  const gridUniforms = useMemo(
    () => ({
      uTime: { value: 0.0 },
    }),
    []
  );

  useFrame((state) => {
    if (gridMaterialRef.current) {
      gridMaterialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <group position={[0, -1.90, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[300, 300, 1, 1]} />
        <shaderMaterial
          ref={gridMaterialRef}
          vertexShader={gridVertexShader}
          fragmentShader={gridFragmentShader}
          uniforms={gridUniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[150, 150]} />
        <meshBasicMaterial
          color="#050001"
          transparent
          opacity={0.22}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}