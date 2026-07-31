"use client";

import React, { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useMousePosition } from "@/hooks/useMousePosition";

const SCREEN_MATERIAL_NAME = "Material.004";

export default function FloatingLaptop({ laptopOpacity = 1 }: { laptopOpacity?: number }) {
  const { scene } = useGLTF("/models/laptop-baked.glb");

  const groupRef = useRef<THREE.Group>(null);
  const bobRef   = useRef<THREE.Group>(null);
  const kbLightRef = useRef<THREE.PointLight>(null);
  const mouse = useMousePosition(0.08);

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

    if (kbLightRef.current) {
      const dx = mouse.x - 0.25;
      const dy = mouse.y + 0.15;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const proximity = Math.exp(-dist * dist * 4.0);
      
      kbLightRef.current.intensity = (1.5 + proximity * 5.0) * laptopOpacity;
      kbLightRef.current.distance = 2.5 + proximity * 3.5;
    }
  });

  const { width } = useThree((state) => state.viewport);
  const laptopX   = Math.max(0.8, width * 0.08);

  return (
    <group
      ref={groupRef}
      position={[laptopX, -0.52, -1.34]}
      rotation={[0.09, -Math.PI / 2 - 0.15, -0.03]}
      scale={laptopOpacity * 1.15}
    >
      <group ref={bobRef}>
        <primitive object={scene} />

        {/* Key light — behind screen, illuminates top edge and screen halo */}
        <pointLight position={[0, 1.8, -1.2]} intensity={7.5 * laptopOpacity} distance={14} color="#ff1744" decay={2} />
        {/* Fill light — left side, illuminates hinge and left body */}
        <pointLight position={[-2.1, 0.65, 0.45]} intensity={4.5 * laptopOpacity} distance={11} color="#ff1744" decay={2} />
        {/* Under-glow — bottom accent, pink tint */}
        <pointLight position={[0.8, -1.15, 0.95]} intensity={3.5 * laptopOpacity} distance={10} color="#800010" decay={2} />
        {/* Front fill — viewer-facing, softens shadows */}
        <pointLight position={[0, 0.5, 1.5]} intensity={3.2 * laptopOpacity} distance={10} color="#ff1744" decay={2} />
        {/* General body illumination */}
        <pointLight position={[0, -0.5, 0]} intensity={4.0 * laptopOpacity} distance={10} color="#ff1744" decay={2} />
        {/* Keyboard backlight — low, close to keyboard deck surface */}
        <pointLight ref={kbLightRef} position={[0.3, -0.15, 0.35]} intensity={3.5 * laptopOpacity} distance={4} color="#ff6680" decay={2} />
        {/* Right-side rim light — catches the right edge of laptop body */}
        <pointLight position={[2.0, 0.3, 0.2]} intensity={2.8 * laptopOpacity} distance={8} color="#ff3355" decay={2} />
      </group>
    </group>
  );
}

useGLTF.preload("/models/laptop-baked.glb");