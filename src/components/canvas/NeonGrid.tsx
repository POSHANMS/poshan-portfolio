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
    
    // Cell size
    float cellSize = 4.0;
    vec2 gridCoord = worldXZ / cellSize;
    vec2 gridFract = fract(gridCoord);
    vec2 lineDist = abs(gridFract - 0.5) * 2.0;
    
    // Line widths
    float lineWidth = 0.005;
    float majorLineWidth = 0.012;
    
    float lineX = 1.0 - smoothstep(lineWidth, lineWidth + 0.006, lineDist.x);
    float lineZ = 1.0 - smoothstep(lineWidth, lineWidth + 0.006, lineDist.y);
    float regularLine = max(lineX, lineZ);
    
    // Major lines
    float majorCellSize = cellSize * 5.0;
    vec2 majorCoord = worldXZ / majorCellSize;
    vec2 majorFract = fract(majorCoord);
    vec2 majorDist = abs(majorFract - 0.5) * 2.0;
    float majorX = 1.0 - smoothstep(majorLineWidth, majorLineWidth + 0.015, majorDist.x);
    float majorZ = 1.0 - smoothstep(majorLineWidth, majorLineWidth + 0.015, majorDist.y);
    float majorLine = max(majorX, majorZ);
    
    // DATA FLOW PULSE: traveling dots along grid lines
    float pulseSpeed = 1.5;
    float pulseX = sin(gridCoord.x * 6.28 + uTime * pulseSpeed) * 0.5 + 0.5;
    float pulseZ = sin(gridCoord.y * 6.28 + uTime * pulseSpeed * 0.7) * 0.5 + 0.5;
    float dataPulse = max(pulseX * lineX, pulseZ * lineZ) * 0.4;
    
    // Grid pattern with pulse
    float gridPattern = max(regularLine * 0.18, majorLine * 0.30) + dataPulse;
    
    // NODE GLOW at intersections
    float nodeGlow = exp(-length(lineDist) * 8.0) * 0.15;
    
    // Perspective fade
    float horizonFade = 1.0 - smoothstep(15.0, 50.0, dist);
    float heightFade = smoothstep(-0.4, 0.0, vWorldPosition.y + 2.0);
    
    // Colors: deep crimson with bright pulse
    vec3 baseColor = vec3(0.40, 0.05, 0.10);
    vec3 pulseColor = vec3(0.80, 0.10, 0.20);
    vec3 majorColor = vec3(0.55, 0.08, 0.15);
    
    vec3 color = mix(baseColor, majorColor, majorLine) * gridPattern;
    color += pulseColor * dataPulse;
    color += vec3(0.70, 0.12, 0.20) * nodeGlow;
    
    // Alpha
    float alpha = (gridPattern + nodeGlow * 0.5) * horizonFade * heightFade;
    alpha = clamp(alpha, 0.0, 0.32);
    
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
    </group>
  );
}