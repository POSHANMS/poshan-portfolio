"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const globeVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const globeFragmentShader = `
  uniform float uTime;
  uniform float uSpeed;
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    // Hologram grid lines
    vec2 gridDensity = vec2(48.0, 24.0);
    vec2 gridUv = fract(vUv * gridDensity);
    vec2 gridLines = smoothstep(0.06, 0.0, abs(gridUv - 0.5));
    float gridPattern = max(gridLines.x, gridLines.y);

    // Sliding scanlines
    float scanline = sin(vUv.y * 110.0 - uTime * uSpeed * 6.0) * 0.5 + 0.5;

    // Fresnel rim glow
    float fresnel = pow(1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.5);

    vec3 col = uColor;
    if (gridPattern > 0.01) {
      col = mix(col, vec3(1.0, 0.5, 0.6), gridPattern * 0.5);
    }

    float alpha = uOpacity * (gridPattern * 0.6 + 0.15) * (0.7 + 0.3 * scanline);
    alpha += fresnel * 0.35 * (0.8 + 0.2 * scanline);

    gl_FragColor = vec4(col, alpha);
  }
`;

interface DeepSpaceGlobeProps {
  scrollProgress: number;
}

export default function DeepSpaceGlobe({ scrollProgress }: DeepSpaceGlobeProps) {
  const globeRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Group>(null);

  const mainShaderRef = useRef<THREE.ShaderMaterial>(null);
  const secondShaderRef = useRef<THREE.ShaderMaterial>(null);

  const mainUniforms = useMemo(
    () => ({
      uTime: { value: 0.0 },
      uSpeed: { value: 0.8 },
      uColor: { value: new THREE.Color("#ff1744") },
      uOpacity: { value: 0.45 },
    }),
    []
  );

  const secondUniforms = useMemo(
    () => ({
      uTime: { value: 0.0 },
      uSpeed: { value: 1.4 },
      uColor: { value: new THREE.Color("#ff4444") },
      uOpacity: { value: 0.28 },
    }),
    []
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (mainShaderRef.current) mainShaderRef.current.uniforms.uTime.value = t;
    if (secondShaderRef.current) secondShaderRef.current.uniforms.uTime.value = t;

    // Spin speeds up dynamically when scrolling
    if (globeRef.current) {
      globeRef.current.rotation.y = t * 0.08 + scrollProgress * 0.95;
      globeRef.current.rotation.x = Math.sin(t * 0.15) * 0.06;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.035 + scrollProgress * 0.45;
      ringRef.current.rotation.y = Math.sin(t * 0.1) * 0.1;
    }
  });

  return (
    <group position={[4.5, 2.5, -8]} scale={2.2} renderOrder={-8}>
      <pointLight position={[0, 0, 2.2]} color="#ff1744" intensity={2.0} distance={15} decay={2} />
      <pointLight position={[-2.2, 1.8, 0.5]} color="#ff8a80" intensity={0.5} distance={10} decay={2} />

      <group ref={globeRef}>
        {/* Main wireframe hologram sphere */}
        <mesh>
          <sphereGeometry args={[1.1, 64, 36]} />
          <shaderMaterial
            ref={mainShaderRef}
            vertexShader={globeVertexShader}
            fragmentShader={globeFragmentShader}
            uniforms={mainUniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Secondary inner hologram sphere */}
        <mesh scale={[1.015, 1.015, 1.015]}>
          <sphereGeometry args={[1.1, 32, 18]} />
          <shaderMaterial
            ref={secondShaderRef}
            vertexShader={globeVertexShader}
            fragmentShader={globeFragmentShader}
            uniforms={secondUniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Equator ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <sphereGeometry args={[1.105, 48, 16]} />
          <meshBasicMaterial color="#ff1744" wireframe transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>

        {/* Inner glow sphere */}
        <mesh>
          <sphereGeometry args={[1.02, 48, 24]} />
          <meshBasicMaterial color="#800010" transparent opacity={0.04} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      </group>

      {/* Orbital rings */}
      <group ref={ringRef} rotation={[0.95, 0.22, -0.28]}>
        {[1.32, 1.58, 1.86, 2.2].map((radius, index) => (
          <mesh key={radius}>
            <torusGeometry args={[radius, 0.008, 8, 160]} />
            <meshBasicMaterial
              color={index === 1 ? "#ff1744" : "#ff4444"}
              transparent
              opacity={index === 1 ? 0.22 : 0.12}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* Outer atmosphere glow */}
      <mesh scale={[1.75, 1.75, 1.75]}>
        <sphereGeometry args={[1.1, 42, 24]} />
        <meshBasicMaterial color="#ff1744" transparent opacity={0.03} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}