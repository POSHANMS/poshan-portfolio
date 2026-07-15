"use client";

import React, { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const SCREEN_MATERIAL_NAME = "Material.004";

export default function FloatingLaptop() {
  const { scene } = useGLTF("/models/laptop-baked.glb");

  const groupRef = useRef<THREE.Group>(null);
  const bobRef   = useRef<THREE.Group>(null);

  useMemo(() => {
    const darkBody = new THREE.MeshStandardMaterial({
      color:             "#09091a",
      metalness:          0.85,
      roughness:          0.15,
      emissive:          "#1a0a2a",
      emissiveIntensity:  0.25,
    });

    scene.updateMatrixWorld(true);

    scene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;

      mesh.castShadow    = true;
      mesh.receiveShadow = true;

      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat && mat.name === SCREEN_MATERIAL_NAME) {
        mat.toneMapped = false;
        mat.needsUpdate = true;
        return;
      }

      mesh.material = darkBody;
    });
  }, [scene]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (bobRef.current) {
      bobRef.current.position.y = Math.sin(t * 0.85) * 0.15;
    }

    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        -Math.PI / 2 - 0.15 + state.pointer.x * 0.045,
        0.045,
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        0.09 - state.pointer.y * 0.035,
        0.045,
      );
    }
  });

  const { width } = useThree((state) => state.viewport);
  const laptopX   = Math.max(0.8, width * 0.08);

  return (
    <group
      ref={groupRef}
      position={[laptopX, -0.52, -1.34]}
      rotation={[0.09, -Math.PI / 2 - 0.15, -0.03]}
    >
      <group ref={bobRef}>
        <primitive object={scene} scale={1.15} />

        {/* Screen glow plane — commented out, was visually dissecting through the laptop */}
        {/*
        <mesh position={[0.2, 0.78, -0.72]} rotation={[0.05, 0, 0]}>
          <planeGeometry args={[2.2, 1.35]} />
          <meshBasicMaterial
            color="#ff1744"
            transparent
            opacity={0.07}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        */}

        {/* Keyboard glow plane — commented out, was dissecting the keyboard visually */}
        {/*
        <mesh position={[0.36, -0.28, 0.22]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.5, 1.0]} />
          <meshBasicMaterial
            color="#ff1744"
            transparent
            opacity={0.08}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        */}

        {/* 
        <mesh position={[0.32, -0.9, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[2.35, 72]} />
          <meshBasicMaterial
            color="#ff1744"
            transparent
            opacity={0.04}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        <mesh position={[0.0, -1.02, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.25, 2.75, 96]} />
          <meshBasicMaterial
            color="#ff1744"
            transparent
            opacity={0.03}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        */}

        {/* Key light — behind screen, illuminates top edge and screen halo */}
        <pointLight position={[0, 1.8, -1.2]}   intensity={7.5} distance={14} color="#ff1744" decay={2} />
        {/* Fill light — left side, illuminates hinge and left body */}
        <pointLight position={[-2.1, 0.65, 0.45]} intensity={4.5} distance={11} color="#ff1744" decay={2} />
        {/* Under-glow — bottom accent, pink tint */}
        <pointLight position={[0.8, -1.15, 0.95]} intensity={3.5} distance={10} color="#800010" decay={2} />
        {/* Front fill — viewer-facing, softens shadows */}
        <pointLight position={[0, 0.5, 1.5]}      intensity={3.2} distance={10} color="#ff1744" decay={2} />
        {/* General body illumination */}
        <pointLight position={[0, -0.5, 0]} intensity={4.0} distance={10} color="#ff1744" decay={2} />
        {/* Keyboard backlight — low, close to keyboard deck surface, subtle warm glow */}
        <pointLight position={[0.3, -0.15, 0.35]} intensity={3.5} distance={4} color="#ff6680" decay={2} />
        {/* Right-side rim light — catches the right edge of laptop body */}
        <pointLight position={[2.0, 0.3, 0.2]} intensity={2.8} distance={8} color="#ff3355" decay={2} />
      </group>
    </group>
  );
}

useGLTF.preload("/models/laptop-baked.glb");