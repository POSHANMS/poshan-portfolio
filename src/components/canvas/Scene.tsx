"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
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
import VolumetricRays from "./VolumetricRays";
import FloatingHexParticles from "./FloatingHexParticles";
import PostProcessing from "./PostProcessing";
import FloorRings from "./FloorRings";

interface SceneProps {
  scrollProgress: number;
}

export default function Scene({ scrollProgress }: SceneProps) {
  const { deviceTier } = useDeviceSize();
  const isMobile = deviceTier === "mobile";

  return (
    <div className="fixed inset-0 z-0 h-full w-full" style={{ background: "#000000" }}>
      <Canvas
        shadows
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: isMobile ? "default" : "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.82,
        }}
        camera={{
          position: [0, 2.3, 8.8],
          fov: 48,
          near: 0.1,
          far: 300,
        }}
      >
        <CinematicCamera scrollProgress={scrollProgress} />

        <color attach="background" args={["#000000"]} />
        
        <ambientLight intensity={0.035} color="#0a0002" />
        
        <pointLight position={[5, 3, 5]} intensity={1.8} color="#ff1744" distance={60} decay={2} />
        <pointLight position={[-5, 4, -5]} intensity={1.3} color="#ff4444" distance={50} decay={2} />
        <pointLight position={[0, -2, 8]} intensity={1.3} color="#800010" distance={40} decay={2} />
        <pointLight position={[12, 8, -20]} intensity={2.3} color="#ff1744" distance={80} decay={2} />
        <spotLight position={[3, 6, 4]} angle={0.5} penumbra={0.8} intensity={1.1} color="#ff1744" distance={50} />
        
        <pointLight position={[0.8, -1.5, 0]} intensity={1.8} color="#ff1744" distance={12} decay={2} />

        <Suspense fallback={null}>
          <NebulaBackground />
          <StarField />
          <DeepSpaceGlobe />
          <VolumetricRays />
          <ParticleNetwork />
          <FloatingHexParticles />
          <TechCubes />
          <FloatingLaptop />
          <NeonGrid />
          <FloorRings />

          <PostProcessing />
        </Suspense>
      </Canvas>
    </div>
  );
}