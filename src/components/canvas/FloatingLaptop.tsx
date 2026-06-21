"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";

export default function FloatingLaptop() {
  // Load the laptop GLTF model
  const { scene } = useGLTF("/models/laptop.glb");
  
  // Load the generated VS Code screen texture
  const screenTexture = useTexture("/textures/laptop-screen.png");
  screenTexture.colorSpace = THREE.SRGBColorSpace;
  // Next.js/Three textures are flipped by default relative to GLTF standard
  screenTexture.flipY = false;

  const groupRef = useRef<THREE.Group>(null);
  const laptopRef = useRef<THREE.Group>(null);

  // Traverse the GLTF scene once to apply custom materials and textures
  useMemo(() => {
    scene.traverse((child) => {
      const node = child as THREE.Mesh;
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;

        const matName = node.material ? (node.material as THREE.Material).name.toLowerCase() : "";
        const nodeName = node.name.toLowerCase();

        // Check if this mesh represents the screen display
        if (
          nodeName.includes("screen") || 
          nodeName.includes("display") || 
          nodeName.includes("monitor") ||
          matName.includes("screen") ||
          matName.includes("display")
        ) {
          // Replace with glowing screen texture
          node.material = new THREE.MeshBasicMaterial({
            map: screenTexture,
            toneMapped: false,
          });
        } else {
          // Recolor chassis to dark metallic body
          node.material = new THREE.MeshStandardMaterial({
            color: new THREE.Color("#070710"),
            metalness: 0.95,
            roughness: 0.15,
            envMapIntensity: 1.5,
          });
        }
      }
    });
  }, [scene, screenTexture]);

  // Animate floating bob and mouse-reactive tilt
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // 1. Bobbing animation (Sine wave)
    if (laptopRef.current) {
      laptopRef.current.position.y = Math.sin(time * 1.2) * 0.12;
    }

    // 2. Mouse interactive tilt rotation
    if (groupRef.current) {
      const targetRotY = -0.5 + state.pointer.x * 0.18; // base -30deg + mouse delta
      const targetRotX = 0.18 - state.pointer.y * 0.12;  // base 10deg + mouse delta
      
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.05);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.05);
    }
  });

  return (
    <group ref={groupRef} position={[0.7, 0.0, -0.8]} rotation={[0.18, -0.5, 0]}>
      
      {/* Floating Laptop Mesh */}
      <group ref={laptopRef}>
        <primitive object={scene} scale={1.2} />

        {/* Electric Blue neon screen halo rim light */}
        <pointLight
          position={[0, 0.8, -0.6]}
          intensity={2.8}
          distance={5}
          color="#00d4ff"
          castShadow
        />

        {/* Hot Pink bottom edge accent bleed */}
        <pointLight
          position={[0, -0.4, 0.3]}
          intensity={1.0}
          distance={3}
          color="#ff2d78"
        />
      </group>

      {/* Glowing platform pedestal sitting directly under the laptop */}
      <mesh position={[0, -1.3, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[1.7, 1.8, 0.06, 32]} />
        <meshPhysicalMaterial
          color="#121226"
          emissive="#00d4ff"
          emissiveIntensity={0.3}
          roughness={0.2}
          metalness={0.8}
          transmission={0.6}
          thickness={0.5}
        />
      </mesh>
      
      {/* Glowing base rim edge */}
      <mesh position={[0, -1.26, 0]}>
        <torusGeometry args={[1.75, 0.015, 8, 48]} />
        <meshBasicMaterial color="#ff2d78" toneMapped={false} />
      </mesh>

    </group>
  );
}

// Pre-load the asset to prevent pop-in
useGLTF.preload("/models/laptop.glb");
