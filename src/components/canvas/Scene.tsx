"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import { CinematicCamera } from "@/animations/scrollCamera";
import { useDeviceSize } from "@/hooks/useDeviceSize";
import NebulaBackground from "./NebulaBackground";
import ImageBackground from "./ImageBackground";
import StarField from "./StarField";
import ParticleNetwork from "./ParticleNetwork";
import NeonGrid from "./NeonGrid";
import FloatingLaptop from "./FloatingLaptop";
import TechCubes from "./TechCubes";
import FloorRings from "./FloorRings";
import PostProcessing from "./PostProcessing";

interface SceneProps {
  scrollProgress: number;
}

export default function Scene({ scrollProgress }: SceneProps) {
  const { deviceTier, reducedMotion } = useDeviceSize();
  const isMobile = deviceTier === "mobile";

  return (
    <div className="hero-mobile-soften fixed inset-0 z-0 h-full w-full bg-[#050508]">
      <Canvas
        shadows={false}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: isMobile ? "default" : "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.9,
        }}
        camera={{
          position: [0.15, 2.2, 9.2],
          fov: 45,
          near: 0.1,
          far: 100,
        }}
      >
        <CinematicCamera scrollProgress={scrollProgress} />
        <color attach="background" args={["#000000"]} />
        <fog attach="fog" args={["#010106", 26, 68]} />
        <Environment preset="city" background={false} blur={0.8} />

        <ambientLight intensity={0.14} color="#030612" />
        <pointLight position={[5.5, -1.5, 4.5]} intensity={1.75} color="#00d4ff" distance={30} decay={2} />
        <pointLight position={[-5.8, 5.2, 2.6]} intensity={1.12} color="#ff2d78" distance={28} decay={2} />
        <pointLight position={[0.2, 4.2, -8]} intensity={1.05} color="#8b5cf6" distance={34} decay={2} />

        <Suspense fallback={null}>
          <ImageBackground />
          <NebulaBackground />
          <StarField />
          {!isMobile && !reducedMotion && <ParticleNetwork />}

          <FloatingLaptop />
          {!reducedMotion && <TechCubes />}
          <NeonGrid />
          {!reducedMotion && <FloorRings />}
          <PostProcessing />
        </Suspense>
      </Canvas>
    </div>
  );
}
