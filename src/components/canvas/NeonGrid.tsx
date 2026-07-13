"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const gridVertexShader = `
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  varying float vDist;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vUv = uv;
    vDist = length(worldPosition.xz);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const gridFragmentShader = `
  uniform float uTime;
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  varying float vDist;

  void main() {
    vec2 worldXZ = vWorldPosition.xz;
    float dist = length(worldXZ);
    
    // Cell size for perspective grid
    float cellSize = 4.0;
    vec2 gridCoord = worldXZ / cellSize;
    vec2 gridFract = fract(gridCoord);
    vec2 lineDist = abs(gridFract - 0.5) * 2.0;
    
    // Thin but VISIBLE lines
    float lineWidth = 0.006;
    float majorLineWidth = 0.015;
    
    float lineX = 1.0 - smoothstep(lineWidth, lineWidth + 0.008, lineDist.x);
    float lineZ = 1.0 - smoothstep(lineWidth, lineWidth + 0.008, lineDist.y);
    float regularLine = max(lineX, lineZ);
    
    // Major lines every 5 cells
    float majorCellSize = cellSize * 5.0;
    vec2 majorCoord = worldXZ / majorCellSize;
    vec2 majorFract = fract(majorCoord);
    vec2 majorDist = abs(majorFract - 0.5) * 2.0;
    float majorX = 1.0 - smoothstep(majorLineWidth, majorLineWidth + 0.018, majorDist.x);
    float majorZ = 1.0 - smoothstep(majorLineWidth, majorLineWidth + 0.018, majorDist.y);
    float majorLine = max(majorX, majorZ);
    
    // VISIBLE but elegant opacity
    float gridPattern = max(regularLine * 0.22, majorLine * 0.38);
    
    // Perspective fade - stronger at horizon, visible in foreground
    float horizonFade = 1.0 - smoothstep(18.0, 55.0, dist);
    
    // Height fade for clean horizon
    float heightFade = smoothstep(-0.4, 0.0, vWorldPosition.y + 2.0);
    
    // Dark crimson red - VISIBLE but not bright
    vec3 regularColor = vec3(0.45, 0.06, 0.12);
    vec3 majorColor = vec3(0.60, 0.10, 0.18);
    
    vec3 color = mix(regularColor, majorColor, majorLine) * gridPattern;
    
    // Soft glow on lines
    float glow = exp(-min(lineDist.x, lineDist.y) * 6.0) * 0.025;
    color += vec3(0.55, 0.08, 0.15) * glow;
    
    // Alpha - visible but not overwhelming
    float alpha = (gridPattern + glow * 0.15) * horizonFade * heightFade;
    alpha = clamp(alpha, 0.0, 0.35);
    
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
    <group position={[0, -1.95, 0]}>
      {/* Main grid */}
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
      
      {/* Floor base - subtle dark red tint */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[120, 120]} />
        <meshBasicMaterial
          color="#0a0002"
          transparent
          opacity={0.20}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      {/* Horizon glow band */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -30]}>
        <planeGeometry args={[200, 40]} />
        <meshBasicMaterial
          color="#330008"
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}