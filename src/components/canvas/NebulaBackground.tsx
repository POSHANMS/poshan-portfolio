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

  // Update uniforms per-frame
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      
      // Lerp mouse coordinates into uMouse uniform for subtle interactivity
      const targetMouseX = state.pointer.x;
      const targetMouseY = state.pointer.y;
      
      materialRef.current.uniforms.uMouse.value.x = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uMouse.value.x,
        targetMouseX,
        0.05
      );
      materialRef.current.uniforms.uMouse.value.y = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uMouse.value.y,
        targetMouseY,
        0.05
      );
    }
  });

  return (
    <mesh position={[0, 0, -12]}>
      {/* Large plane to cover the camera's full frustum at this depth */}
      <planeGeometry args={[35, 20]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={nebulaVertex}
        fragmentShader={nebulaFragment}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={true}
      />
    </mesh>
  );
}
