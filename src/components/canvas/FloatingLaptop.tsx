"use client";

import React, { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";

export default function FloatingLaptop() {
  const { scene } = useGLTF("/models/laptop.glb");
  const screenTexture = useTexture("/textures/laptop-screen.svg");
  screenTexture.colorSpace = THREE.SRGBColorSpace;
  screenTexture.flipY = true;

  const groupRef = useRef<THREE.Group>(null);
  const bobRef = useRef<THREE.Group>(null);

  useMemo(() => {
    const darkBody = new THREE.MeshStandardMaterial({
      color: "#09091a",
      metalness: 0.92,
      roughness: 0.1,
      emissive: "#06142f",
      emissiveIntensity: 0.16,
    });
    const screenMat = new THREE.MeshBasicMaterial({
      map: screenTexture,
      toneMapped: false,
      side: THREE.DoubleSide,
    });

    scene.updateMatrixWorld(true);
    const screenCandidates: Array<{ mesh: THREE.Mesh; score: number }> = [];

    scene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;

      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const bounds = new THREE.Box3().setFromObject(mesh);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      bounds.getSize(size);
      bounds.getCenter(center);

      const flatness = size.z / Math.max(size.x, size.y, 0.0001);
      const score = size.x * size.y * 1.4 - size.z * 8 + center.y * 2.5 - flatness * 12;

      if (center.y > 0.15 && size.x > 0.2 && size.y > 0.12) {
        screenCandidates.push({ mesh, score });
      }

      mesh.material = darkBody;
    });

    const screenMesh = screenCandidates.sort((a, b) => b.score - a.score)[0]?.mesh;
    if (screenMesh) {
      screenMesh.material = screenMat;
      screenMesh.renderOrder = 3;
    }
  }, [scene, screenTexture]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (bobRef.current) {
      bobRef.current.position.y = Math.sin(t * 0.85) * 0.15;
    }

    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, -Math.PI / 2 - 0.1 + state.pointer.x * 0.06, 0.045);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0.08 - state.pointer.y * 0.045, 0.045);
    }
  });

  const { width } = useThree((state) => state.viewport);
  const laptopX = Math.max(1.35, width * 0.13);

  return (
    <group ref={groupRef} position={[laptopX, 0.55, -1.1]} rotation={[0.08, -Math.PI / 2 - 0.1, -0.035]}>
      <group ref={bobRef}>
        <primitive object={scene} scale={1.36} />

        <pointLight position={[0, 1.8, -1.2]} intensity={5.6} distance={10} color="#00d4ff" decay={2} />
        <pointLight position={[-2.1, 0.65, 0.45]} intensity={3.0} distance={8} color="#00d4ff" decay={2} />
        <pointLight position={[0.8, -1.15, 0.95]} intensity={2.7} distance={7} color="#ff2d78" decay={2} />
        <pointLight position={[0, 0.5, 1.5]} intensity={2.25} distance={7} color="#4488ff" decay={2} />
      </group>

    </group>
  );
}

useGLTF.preload("/models/laptop.glb");
