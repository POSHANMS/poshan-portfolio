"use client";

import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const nebulaVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const nebulaFragmentShader = `
  uniform float uTime;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float t = uTime * 0.008;

    // Very subtle drift
    vec2 drift = vec2(t, -t * 0.3);

    float n1 = fbm(uv * 1.8 + drift);
    float n2 = fbm(uv * 3.0 - drift * 0.8 + vec2(5.2, 1.3));

    // Subtle galaxy swirl upper right — VERY REDUCED
    vec2 galaxyUv = uv - vec2(0.75, 0.72);
    float galaxyDist = length(galaxyUv);
    float galaxyAngle = atan(galaxyUv.y, galaxyUv.x);
    float spiral = cos(galaxyAngle * 2.0 + galaxyDist * 8.0 - uTime * 0.05);
    float galaxy = exp(-galaxyDist * galaxyDist * 25.0) * (0.5 + 0.5 * spiral);

    // Minimal fog — just enough for depth
    float fog = pow(n1, 3.0) * 0.15 + pow(n2, 4.0) * 0.1;
    fog += galaxy * 0.15;

    // Fade at bottom to not interfere with floor
    float bottomFade = smoothstep(0.0, 0.35, uv.y);
    float topFade = smoothstep(1.0, 0.85, uv.y);
    fog *= bottomFade * topFade;

    // Dark red colors — subtle
    vec3 col1 = vec3(0.6, 0.02, 0.05) * pow(n1, 3.0) * 0.25;
    vec3 col2 = vec3(0.35, 0.0, 0.02) * pow(n2, 4.0) * 0.15;
    vec3 col3 = vec3(0.5, 0.05, 0.1) * galaxy * 0.2;

    vec3 color = col1 + col2 + col3;

    // Very subtle horizon line
    float horizon = exp(-pow(uv.y - 0.28, 2.0) * 60.0);
    color += vec3(0.4, 0.01, 0.03) * horizon * 0.08;

    // VERY LOW alpha — background should be mostly transparent/black
    float alpha = clamp(fog * 0.12 + galaxy * 0.08 + horizon * 0.04, 0.0, 0.18);
    alpha *= smoothstep(0.0, 0.08, uv.y);

    gl_FragColor = vec4(color, alpha);
  }
`;

export default function NebulaBackground() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0.0 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
    }),
    [size]
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <mesh position={[0, 5, -40]} renderOrder={-100}>
      <planeGeometry args={[120, 70]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={nebulaVertexShader}
        fragmentShader={nebulaFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
