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
    
    // Very wide cell size for sparse grid
    float cellSize = 5.5;
    vec2 gridCoord = worldXZ / cellSize;
    vec2 gridFract = fract(gridCoord);
    vec2 lineDist = abs(gridFract - 0.5) * 2.0;
    
    // EXTREMELY THIN lines - hairlines
    float lineWidth = 0.003;
    float majorLineWidth = 0.008;
    
    float lineX = 1.0 - smoothstep(lineWidth, lineWidth + 0.005, lineDist.x);
    float lineZ = 1.0 - smoothstep(lineWidth, lineWidth + 0.005, lineDist.y);
    float regularLine = max(lineX, lineZ);
    
    // Major lines every 5 cells
    float majorCellSize = cellSize * 5.0;
    vec2 majorCoord = worldXZ / majorCellSize;
    vec2 majorFract = fract(majorCoord);
    vec2 majorDist = abs(majorFract - 0.5) * 2.0;
    float majorX = 1.0 - smoothstep(majorLineWidth, majorLineWidth + 0.010, majorDist.x);
    float majorZ = 1.0 - smoothstep(majorLineWidth, majorLineWidth + 0.010, majorDist.y);
    float majorLine = max(majorX, majorZ);
    
    // VERY LOW opacity - barely visible
    float gridPattern = max(regularLine * 0.08, majorLine * 0.15);
    
    // Strong horizon fade
    float horizonFade = 1.0 - smoothstep(15.0, 50.0, dist);
    
    // Fade near horizon line
    float heightFade = smoothstep(-0.3, 0.0, vWorldPosition.y + 2.0);
    
    // Very dark, desaturated red
    vec3 regularColor = vec3(0.25, 0.03, 0.06);
    vec3 majorColor = vec3(0.35, 0.05, 0.09);
    
    vec3 color = mix(regularColor, majorColor, majorLine) * gridPattern;
    
    // Minimal glow
    float glow = exp(-min(lineDist.x, lineDist.y) * 10.0) * 0.015;
    color += vec3(0.30, 0.04, 0.08) * glow;
    
    // Very low max alpha
    float alpha = (gridPattern + glow * 0.1) * horizonFade * heightFade;
    alpha = clamp(alpha, 0.0, 0.18);
    
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
      
      {/* Very subtle floor base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[150, 150]} />
        <meshBasicMaterial
          color="#020001"
          transparent
          opacity={0.10}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}