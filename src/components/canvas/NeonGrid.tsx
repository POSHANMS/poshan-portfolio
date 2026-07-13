"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const gridVertexShader = `
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  varying float vDist;
  varying float vDepth;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vUv = uv;
    vDist = length(worldPosition.xz);
    
    vec4 viewPosition = viewMatrix * worldPosition;
    vDepth = -viewPosition.z;
    
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const gridFragmentShader = `
  uniform float uTime;
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  varying float vDist;
  varying float vDepth;

  void main() {
    vec2 worldXZ = vWorldPosition.xz;
    float dist = length(worldXZ);
    
    float cellSize = 2.5 + dist * 0.08;
    vec2 gridCoord = worldXZ / cellSize;
    vec2 gridFract = fract(gridCoord);
    vec2 lineDist = abs(gridFract - 0.5) * 2.0;
    
    float perspectiveFade = 1.0 - smoothstep(8.0, 35.0, dist);
    float lineWidth = 0.003 + 0.004 * perspectiveFade;
    float majorLineWidth = 0.008 + 0.012 * perspectiveFade;
    
    float lineX = 1.0 - smoothstep(lineWidth, lineWidth + 0.008, lineDist.x);
    float lineZ = 1.0 - smoothstep(lineWidth, lineWidth + 0.008, lineDist.y);
    float regularLine = max(lineX, lineZ);
    
    float majorCellSize = cellSize * 5.0;
    vec2 majorCoord = worldXZ / majorCellSize;
    vec2 majorFract = fract(majorCoord);
    vec2 majorDist = abs(majorFract - 0.5) * 2.0;
    float majorX = 1.0 - smoothstep(majorLineWidth, majorLineWidth + 0.02, majorDist.x);
    float majorZ = 1.0 - smoothstep(majorLineWidth, majorLineWidth + 0.02, majorDist.y);
    float majorLine = max(majorX, majorZ);
    
    float pulseSpeed = 2.0;
    float pulseX = sin(gridCoord.x * 6.283 + uTime * pulseSpeed) * 0.5 + 0.5;
    float pulseZ = sin(gridCoord.y * 6.283 + uTime * pulseSpeed * 0.7 + 1.5) * 0.5 + 0.5;
    float dataPulse = max(pulseX * lineX, pulseZ * lineZ) * 0.5;
    
    float slowPulse = sin(gridCoord.x * 3.14 + uTime * 0.5) * sin(gridCoord.y * 3.14 + uTime * 0.3) * 0.5 + 0.5;
    
    float gridPattern = max(regularLine * 0.15, majorLine * 0.35) * perspectiveFade;
    gridPattern += dataPulse * perspectiveFade;
    
    float nodeGlow = exp(-length(lineDist) * 6.0) * 0.2 * perspectiveFade;
    
    float horizonFade = 1.0 - smoothstep(5.0, 40.0, dist);
    float nearFade = smoothstep(0.0, 3.0, dist);
    
    float heightFade = smoothstep(-0.5, 0.0, vWorldPosition.y + 2.0);
    
    float centerGlow = exp(-dist * dist * 0.15) * 0.08;
    
    vec3 baseColor = vec3(0.50, 0.04, 0.10);
    vec3 pulseColor = vec3(1.0, 0.08, 0.20);
    vec3 majorColor = vec3(0.70, 0.06, 0.15);
    vec3 nodeColor = vec3(1.0, 0.12, 0.25);
    
    vec3 color = mix(baseColor, majorColor, majorLine) * gridPattern;
    color += pulseColor * dataPulse * 0.8;
    color += nodeColor * nodeGlow;
    color += vec3(0.80, 0.05, 0.12) * centerGlow;
    
    color += vec3(0.15, 0.01, 0.03) * horizonFade * 0.3;
    
    float alpha = (gridPattern + nodeGlow * 0.5 + centerGlow) * horizonFade * heightFade * nearFade;
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
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshBasicMaterial
          color="#1a0004"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      <mesh position={[0, -2.14, -30]} rotation={[0, 0, 0]}>
        <planeGeometry args={[120, 0.5]} />
        <meshBasicMaterial
          color="#ff1744"
          transparent
          opacity={0.06}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}