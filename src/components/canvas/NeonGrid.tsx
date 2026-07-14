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
    
    // Crisp grid cells, size = 2.0 units
    float cellSize = 2.0;
    vec2 gridCoord = worldXZ / cellSize;
    vec2 gridFract = fract(gridCoord);
    vec2 lineDist = abs(gridFract - 0.5) * 2.0;
    
    float perspectiveFade = 1.0 - smoothstep(12.0, 50.0, dist);
    
    // Very thin hairline grid lines
    float lineWidth = 0.008 * perspectiveFade;
    float majorLineWidth = 0.018 * perspectiveFade;
    
    float lineX = 1.0 - smoothstep(lineWidth, lineWidth + 0.004, lineDist.x);
    float lineZ = 1.0 - smoothstep(lineWidth, lineWidth + 0.004, lineDist.y);
    float regularLine = max(lineX, lineZ);
    
    // Major lines every 5 cells
    float majorCellSize = cellSize * 5.0;
    vec2 majorCoord = worldXZ / majorCellSize;
    vec2 majorFract = fract(majorCoord);
    vec2 majorDist = abs(majorFract - 0.5) * 2.0;
    float majorX = 1.0 - smoothstep(majorLineWidth, majorLineWidth + 0.008, majorDist.x);
    float majorZ = 1.0 - smoothstep(majorLineWidth, majorLineWidth + 0.008, majorDist.y);
    float majorLine = max(majorX, majorZ);
    
    // Pulse animation lines
    float pulseSpeed = 1.5;
    float pulseX = sin(gridCoord.x * 6.283 + uTime * pulseSpeed) * 0.5 + 0.5;
    float pulseZ = sin(gridCoord.y * 6.283 + uTime * pulseSpeed * 0.7 + 1.0) * 0.5 + 0.5;
    float dataPulse = max(pulseX * lineX, pulseZ * lineZ) * 0.22;
    
    float gridPattern = max(regularLine * 0.15, majorLine * 0.35) * perspectiveFade;
    gridPattern += dataPulse * perspectiveFade;
    
    float nodeGlow = exp(-length(lineDist) * 9.0) * 0.06 * perspectiveFade;
    
    float horizonFade = 1.0 - smoothstep(5.0, 40.0, dist);
    float heightFade = smoothstep(-0.5, 0.0, vWorldPosition.y + 2.2);
    
    float centerGlow = exp(-dist * dist * 0.08) * 0.04;
    
    vec3 baseColor = vec3(0.35, 0.03, 0.08);
    vec3 pulseColor = vec3(0.80, 0.06, 0.15);
    vec3 majorColor = vec3(0.50, 0.04, 0.10);
    vec3 nodeColor = vec3(0.90, 0.08, 0.18);
    
    vec3 color = mix(baseColor, majorColor, majorLine) * gridPattern;
    color += pulseColor * dataPulse * 0.5;
    color += nodeColor * nodeGlow;
    color += vec3(0.60, 0.03, 0.08) * centerGlow;
    color += vec3(0.08, 0.005, 0.015) * horizonFade * 0.3;
    
    float alpha = (gridPattern + nodeGlow * 0.25 + centerGlow) * horizonFade * heightFade;
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
    <group position={[0, -2.14, 0]}>
      {/* Primary Grid Mesh */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[200, 200, 1, 1]} />
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
      
      {/* Dark background base floor plane to prevent lookthrough */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial
          color="#020001"
          transparent
          opacity={0.35}
          depthWrite={false}
        />
      </mesh>
      
      {/* Horizon Accent line */}
      <mesh position={[0, 0.01, -30]} rotation={[0, 0, 0]}>
        <planeGeometry args={[120, 0.2]} />
        <meshBasicMaterial
          color="#ff1744"
          transparent
          opacity={0.03}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}