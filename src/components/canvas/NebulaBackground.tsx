"use client";

import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import nebulaVertex from "@/shaders/vertex/nebula.vert";
import nebulaFragment from "@/shaders/fragment/nebula.frag";

export default function NebulaBackground() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0.0 },
      uResolution: { value: new THREE.Vector2(size.width, size.height) },
      uMouse: { value: new THREE.Vector2(0, 0) },
    }),
    [size]
  );

  useFrame((state) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();

    materialRef.current.uniforms.uMouse.value.x = THREE.MathUtils.lerp(
      materialRef.current.uniforms.uMouse.value.x,
      state.pointer.x,
      0.04
    );
    materialRef.current.uniforms.uMouse.value.y = THREE.MathUtils.lerp(
      materialRef.current.uniforms.uMouse.value.y,
      state.pointer.y,
      0.04
    );
  });

  return (
    <mesh position={[0, 0, -20]} renderOrder={-10}>
      <planeGeometry args={[300, 150]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={nebulaVertex}
        fragmentShader={nebulaFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.NormalBlending}
        opacity={0.22}
      />
    </mesh>
  );
}
