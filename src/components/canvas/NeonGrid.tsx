"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const vertexShader = `
  uniform float uTime;
  varying vec3 vWorld;
  varying float vEdgeMotion;

  void main() {
    vec3 displaced = position;
    // The mesh is an XY plane rotated onto the floor. Its visible floor axes
    // are therefore local X and negative local Y, not local XZ.
    vec2 floorPosition = vec2(position.x, -position.y);
    vec2 landingZone = vec2(0.8, 3.85);
    float radius = length(floorPosition - landingZone);
    // The landing zone stays legible, while the surrounding floor behaves like
    // a slow gravitational fabric rather than a perfectly flat sheet.
    float edge = smoothstep(3.2, 13.5, radius);
    float terrain = sin(floorPosition.x * 0.18 + floorPosition.y * 0.1 + uTime * 0.2) * 0.68;
    terrain += cos(floorPosition.y * 0.23 - floorPosition.x * 0.1 - uTime * 0.16) * 0.5;
    terrain += sin(radius * 0.58 - uTime * 0.14) * 0.26;
    // Local Z maps to world Y after the plane rotation, forming the fabric.
    displaced.z += terrain * edge;

    vec4 worldPosition = modelMatrix * vec4(displaced, 1.0);
    vWorld = worldPosition.xyz;
    vEdgeMotion = edge;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform float uReveal;
  varying vec3 vWorld;
  varying float vEdgeMotion;

  float gridLine(float coordinate, float cellSize, float width) {
    float cell = abs(fract(coordinate / cellSize + 0.5) - 0.5);
    float antiAlias = max(fwidth(coordinate / cellSize) * 0.56, 0.001);
    return 1.0 - smoothstep(width, width + antiAlias, cell);
  }

  void main() {
    vec2 plane = vWorld.xz;
    float range = length(plane - vec2(0.0, -5.0));
    float distanceFade = 1.0 - smoothstep(2.5, 46.0, range);

    float minor = max(gridLine(plane.x, 1.02, 0.008), gridLine(plane.y, 1.02, 0.008));
    float major = max(gridLine(plane.x, 5.1, 0.009), gridLine(plane.y, 5.1, 0.009));

    // A narrow power band travels across a fixed topology.
    float wave = sin(plane.x * 0.54 + plane.y * 0.7 - uTime * 1.25) * 0.5 + 0.5;
    float signal = smoothstep(0.91, 1.0, wave) * max(minor, major);
    float junctions = minor * max(gridLine(plane.x, 5.1, 0.018), gridLine(plane.y, 5.1, 0.018));

    float intensity = minor * 0.16 + major * 0.11 + signal * 0.15 + junctions * 0.05;
    vec3 crimson = vec3(0.44, 0.001, 0.009);
    vec3 hotSignal = vec3(0.76, 0.018, 0.04);
    vec3 color = crimson * (minor * 0.9 + major * 0.72);
    color += hotSignal * signal;
    color += vec3(0.18, 0.005, 0.024) * vEdgeMotion * 0.25;

    float alpha = intensity * distanceFade * uReveal;
    gl_FragColor = vec4(color, alpha);
  }
`;

/**
 * The Act I floor mirrors the video reference: a sparse red grid with a calm
 * centre, a soft moving perimeter, and a signal travelling through the lines.
 */
export default function NeonGrid({ floorOpacity = 1 }: { floorOpacity?: number }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uReveal: { value: 1 },
  }), []);

  useFrame((state) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    materialRef.current.uniforms.uReveal.value = THREE.MathUtils.clamp(floorOpacity, 0, 1);
  });

  return (
    <group position={[0, -2.13, -5]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[88, 88, 220, 220]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.NormalBlending}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.012, 0]}>
        <planeGeometry args={[96, 96]} />
        <meshBasicMaterial color="#020001" transparent opacity={0.48} depthWrite={false} />
      </mesh>
    </group>
  );
}
