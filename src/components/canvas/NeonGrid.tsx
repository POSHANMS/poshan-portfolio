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
    
    float cellSize = 2.0 + dist * 0.06;
    vec2 gridCoord = worldXZ / cellSize;
    vec2 gridFract = fract(gridCoord);
    vec2 lineDist = abs(gridFract - 0.5) * 2.0;
    
    float perspectiveFade = 1.0 - smoothstep(5.0, 30.0, dist);
    float nearFade = smoothstep(0.0, 4.0, dist);
    
    float lineWidth = 0.002 + 0.003 * perspectiveFade;
    float majorLineWidth = 0.006 + 0.008 * perspectiveFade;
    
    float lineX = 1.0 - smoothstep(lineWidth, lineWidth + 0.006, lineDist.x);
    float lineZ = 1.0 - smoothstep(lineWidth, lineWidth + 0.006, lineDist.y);
    float regularLine = max(lineX, lineZ);
    
    float majorCellSize = cellSize * 5.0;
    vec2 majorCoord = worldXZ / majorCellSize;
    vec2 majorFract = fract(majorCoord);
    vec2 majorDist = abs(majorFract - 0.5) * 2.0;
    float majorX = 1.0 - smoothstep(majorLineWidth, majorLineWidth + 0.015, majorDist.x);
    float majorZ = 1.0 - smoothstep(majorLineWidth, majorLineWidth + 0.015, majorDist.y);
    float majorLine = max(majorX, majorZ);
    
    float pulseSpeed = 1.8;
    float pulseX = sin(gridCoord.x * 6.283 + uTime * pulseSpeed) * 0.5 + 0.5;
    float pulseZ = sin(gridCoord.y * 6.283 + uTime * pulseSpeed * 0.7 + 1.5) * 0.5 + 0.5;
    float dataPulse = max(pulseX * lineX, pulseZ * lineZ) * 0.35;
    
    float gridPattern = max(regularLine * 0.10, majorLine * 0.22) * perspectiveFade;
    gridPattern += dataPulse * perspectiveFade;
    
    float nodeGlow = exp(-length(lineDist) * 8.0) * 0.12 * perspectiveFade;
    
    float horizonFade = 1.0 - smoothstep(4.0, 35.0, dist);
    float heightFade = smoothstep(-0.5, 0.0, vWorldPosition.y + 2.0);
    
    float centerGlow = exp(-dist * dist * 0.12) * 0.05;
    
    vec3 baseColor = vec3(0.35, 0.03, 0.08);
    vec3 pulseColor = vec3(0.80, 0.06, 0.15);
    vec3 majorColor = vec3(0.50, 0.04, 0.10);
    vec3 nodeColor = vec3(0.90, 0.08, 0.18);
    
    vec3 color = mix(baseColor, majorColor, majorLine) * gridPattern;
    color += pulseColor * dataPulse * 0.6;
    color += nodeColor * nodeGlow;
    color += vec3(0.60, 0.03, 0.08) * centerGlow;
    color += vec3(0.08, 0.005, 0.015) * horizonFade * 0.4;
    
    float alpha = (gridPattern + nodeGlow * 0.3 + centerGlow) * horizonFade * heightFade * nearFade;
    alpha = clamp(alpha, 0.0, 0.22);
    
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
    <group position={[0, -2.15, 0]}>
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
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshBasicMaterial
          color="#0a0002"
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      <mesh position={[0, -2.14, -25]} rotation={[0, 0, 0]}>
        <planeGeometry args={[100, 0.3]} />
        <meshBasicMaterial
          color="#ff1744"
          transparent
          opacity={0.04}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}