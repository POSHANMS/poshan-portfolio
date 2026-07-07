"use client";

import React, { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

// ─────────────────────────────────────────────────────────────
// Screen texture is BAKED into laptop-baked.glb as Material.004.
// No runtime CanvasTexture / VideoTexture / CSS3DRenderer needed.
// ─────────────────────────────────────────────────────────────

const SCREEN_MATERIAL_NAME = "Material.004"; // baked screen in GLB

export default function FloatingLaptop() {
  const { scene } = useGLTF("/models/laptop-baked.glb");

  const groupRef = useRef<THREE.Group>(null);
  const bobRef   = useRef<THREE.Group>(null);

  useMemo(() => {
    const darkBody = new THREE.MeshStandardMaterial({
      color:             "#09091a",
      metalness:          0.92,
      roughness:          0.1,
      emissive:          "#06142f",
      emissiveIntensity:  0.16,
    });

    scene.updateMatrixWorld(true);

    scene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;

      mesh.castShadow    = true;
      mesh.receiveShadow = true;

      // Leave the baked screen material untouched — it already has
      // the VS Code texture + emissive glow baked in.
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat && mat.name === SCREEN_MATERIAL_NAME) {
        mat.toneMapped = false; // keep screen colours accurate
        mat.needsUpdate = true;
        return;
      }

      // Everything else gets the dark metallic chassis look.
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
        -Math.PI / 2 - 0.26 + state.pointer.x * 0.045,
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
  const laptopX   = Math.max(1.65, width * 0.145);

  return (
    <group
      ref={groupRef}
      position={[laptopX, 0.04, -1.34]}
      rotation={[0.09, -Math.PI / 2 - 0.26, -0.03]}
    >
      <group ref={bobRef}>
        <primitive object={scene} scale={1.24} />

        {/* Screen back-glow plane */}
        <mesh position={[0.2, 0.78, -0.72]} rotation={[0.05, 0, 0]}>
          <planeGeometry args={[2.2, 1.35]} />
          <meshBasicMaterial
            color="#00f5ff"
            transparent
            opacity={0.16}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Keyboard glow */}
        <mesh position={[0.36, -0.28, 0.22]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.5, 1.0]} />
          <meshBasicMaterial
            color="#2bd9ff"
            transparent
            opacity={0.2}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Floor bounce-light disk */}
        <mesh position={[0.32, -0.9, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[2.35, 72]} />
          <meshBasicMaterial
            color="#ff3ed1"
            transparent
            opacity={0.11}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Concentric platform ring */}
        <mesh position={[0.0, -1.02, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.25, 2.75, 96]} />
          <meshBasicMaterial
            color="#00f5ff"
            transparent
            opacity={0.09}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Lights */}
        <pointLight position={[0, 1.8, -1.2]}   intensity={6.8} distance={12} color="#00f5ff" decay={2} />
        <pointLight position={[-2.1, 0.65, 0.45]} intensity={3.8} distance={9}  color="#2bd9ff" decay={2} />
        <pointLight position={[0.8, -1.15, 0.95]} intensity={3.4} distance={8}  color="#ff3ed1" decay={2} />
        <pointLight position={[0, 0.5, 1.5]}      intensity={2.9} distance={8}  color="#8a2eff" decay={2} />
      </group>
    </group>
  );
}

useGLTF.preload("/models/laptop-baked.glb");
