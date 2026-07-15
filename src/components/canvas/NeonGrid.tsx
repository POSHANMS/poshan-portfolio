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
    
    // Gravitational warp towards the laptop base position
    vec2 center = vec2(0.8, -1.24);
    vec2 toCenter = worldPosition.xz - center;
    float distToCenter = length(toCenter);
    
    // Smooth grid deformation
    float warp = exp(-distToCenter * distToCenter * 0.08) * 0.65;
    worldPosition.xz -= normalize(toCenter) * warp * min(distToCenter, 4.0);
    
    vWorldPosition = worldPosition.xyz;
    vUv = uv;
    vDist = length(worldPosition.xz);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const gridFragmentShader = `
  uniform float uTime;
  uniform vec3 uMouseFloor;
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
    
    // Visible but refined grid lines
    float lineWidth = 0.014 * perspectiveFade;
    float majorLineWidth = 0.028 * perspectiveFade;
    
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
    
    float gridPattern = max(regularLine * 0.25, majorLine * 0.50) * perspectiveFade;
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
    
    // Add mouse glow highlight to grid lines
    float distToMouseFloor = length(vWorldPosition - uMouseFloor);
    float mouseFloorGlow = exp(-distToMouseFloor * distToMouseFloor * 0.18) * 0.45;
    color += vec3(1.0, 0.18, 0.28) * mouseFloorGlow * (regularLine + majorLine * 1.5) * perspectiveFade;
    
    float alpha = (gridPattern + nodeGlow * 0.35 + centerGlow) * horizonFade * heightFade;
    alpha += mouseFloorGlow * 0.40 * perspectiveFade;
    alpha = clamp(alpha, 0.0, 0.65);
    
    gl_FragColor = vec4(color, alpha);
  }
`;

import { useMousePosition } from "@/hooks/useMousePosition";

export default function NeonGrid() {
  const gridMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const mouse = useMousePosition(0.08);

  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 2.14), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const mouseVec = useMemo(() => new THREE.Vector2(), []);
  const intersection = useMemo(() => new THREE.Vector3(), []);

  const gridUniforms = useMemo(
    () => ({
      uTime: { value: 0.0 },
      uMouseFloor: { value: new THREE.Vector3(0, 0, 0) },
    }),
    []
  );

  useFrame((state) => {
    if (gridMaterialRef.current) {
      gridMaterialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();

      // Raycast cursor onto floor plane to get world intersection coordinate
      mouseVec.set(mouse.x, mouse.y);
      raycaster.setFromCamera(mouseVec, state.camera);
      if (raycaster.ray.intersectPlane(plane, intersection)) {
        gridMaterialRef.current.uniforms.uMouseFloor.value.copy(intersection);
      }
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