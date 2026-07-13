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
  uniform vec2 uResolution;
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
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.2;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float t = uTime * 0.012;
    vec2 drift = vec2(t, -t * 0.5);

    float n1 = fbm(uv * 1.8 + drift);
    float n2 = fbm(uv * 3.2 - drift * 1.2 + vec2(5.2, 1.3));
    float n3 = fbm(uv * 5.5 + vec2(-t * 0.3, t * 0.4));
    float n4 = fbm(uv * 8.0 + vec2(t * 0.15, -t * 0.25));

    vec2 galaxyUv = uv - vec2(0.72, 0.68);
    float galaxyDist = length(galaxyUv);
    float galaxyAngle = atan(galaxyUv.y, galaxyUv.x);
    float spiral = cos(galaxyAngle * 4.0 + galaxyDist * 12.0 - uTime * 0.08);
    float galaxy = exp(-galaxyDist * galaxyDist * 25.0) * (0.5 + 0.5 * spiral);
    float galaxyArms = exp(-galaxyDist * galaxyDist * 8.0) * pow(spiral * 0.5 + 0.5, 2.0);

    float fog = pow(n1, 2.0) * 0.10 + pow(n2, 2.5) * 0.08 + pow(n3, 3.2) * 0.06 + pow(n4, 4.0) * 0.03;
    fog += galaxy * 0.06 + galaxyArms * 0.04;

    float topMask = smoothstep(0.0, 0.10, uv.y);
    float bottomFade = smoothstep(0.0, 0.50, uv.y);
    float sideFade = smoothstep(0.0, 0.08, uv.x) * smoothstep(1.0, 0.92, uv.x);
    fog *= topMask * bottomFade * sideFade;

    vec3 col1 = vec3(1.0, 0.06, 0.12) * pow(n1, 2.0) * 0.10;
    vec3 col2 = vec3(0.65, 0.02, 0.06) * pow(n2, 2.5) * 0.08;
    vec3 col3 = vec3(0.35, 0.0, 0.03) * pow(n3, 3.2) * 0.06;
    vec3 col4 = vec3(0.22, 0.0, 0.02) * pow(n4, 4.0) * 0.03;
    vec3 col5 = vec3(1.0, 0.10, 0.20) * galaxy * 0.06;
    vec3 col6 = vec3(0.85, 0.06, 0.14) * galaxyArms * 0.04;

    vec3 color = col1 + col2 + col3 + col4 + col5 + col6;

    float horizon = exp(-pow(uv.y - 0.20, 2.0) * 35.0);
    color += vec3(0.70, 0.03, 0.08) * horizon * 0.06;
    
    float upperGlow = exp(-pow(uv.y - 0.70, 2.0) * 12.0) * 0.4;
    color += vec3(0.45, 0.02, 0.05) * upperGlow * 0.04;

    float alpha = clamp(fog * 0.06 + galaxy * 0.03 + galaxyArms * 0.02 + horizon * 0.02, 0.0, 0.08);
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
    <mesh position={[0, 1, -45]} renderOrder={-100}>
      <planeGeometry args={[100, 60]} />
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