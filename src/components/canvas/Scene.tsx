"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import { CinematicCamera } from "@/animations/scrollCamera";
import { useDeviceSize } from "@/hooks/useDeviceSize";
import NebulaBackground from "./NebulaBackground";
import StarField from "./StarField";
import NeonGrid from "./NeonGrid";
import FloatingLaptop from "./FloatingLaptop";
import TechCubes from "./TechCubes";
import DeepSpaceGlobe from "./DeepSpaceGlobe";
import ParticleNetwork from "./ParticleNetwork";
import FloatingHexParticles from "./FloatingHexParticles";
import PostProcessing from "./PostProcessing";

interface SceneProps {
  scrollProgress: number;
}

export default function Scene({ scrollProgress }: SceneProps) {
  const { deviceTier } = useDeviceSize();
  const isMobile = deviceTier === "mobile";

  return (
    <div className="fixed inset-0 z-0 h-full w-full" style={{ background: "#030001" }}>
      <Canvas
        shadows
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: isMobile ? "default" : "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.85, // Slightly darker for better contrast
        }}
        camera={{
          position: [0, 2.0, 8.5],
          fov: 50,
          near: 0.1,
          far: 300,
        }}
      >
        <CinematicCamera scrollProgress={scrollProgress} />

        <color attach="background" args={["#030001"]} />
        <fog attach="fog" args={["#030001", 40, 120]} />

        <Environment preset="city" background={false} blur={2} />

        {/* Reduced ambient light for darker feel */}
        <ambientLight intensity={0.08} color="#1a0004" />
        <pointLight position={[5, 3, 5]} intensity={3} color="#ff1744" distance={60} decay={2} />
        <pointLight position={[-5, 4, -5]} intensity={2} color="#ff4444" distance={50} decay={2} />
        <pointLight position={[0, -2, 8]} intensity={2} color="#800010" distance={40} decay={2} />
        <pointLight position={[12, 8, -20]} intensity={4} color="#ff1744" distance={80} decay={2} />
        <spotLight position={[3, 6, 4]} angle={0.5} penumbra={0.8} intensity={2} color="#ff1744" distance={50} />

        <Suspense fallback={null}>
          {/* BACKGROUND — clean and minimal */}
          <NebulaBackground />
          <StarField />
          <DeepSpaceGlobe />

          {/* MID LAYER — particles */}
          <ParticleNetwork />
          <FloatingHexParticles />
          <TechCubes />
          <FloatingLaptop />

          {/* FLOOR — anchored grid */}
          <NeonGrid />

          <PostProcessing />
        </Suspense>
      </Canvas>
    </div>
  );
}
