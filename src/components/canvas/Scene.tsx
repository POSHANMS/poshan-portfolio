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
import NeonGrid from "./NeonGrid";
import FloatingLaptop from "./FloatingLaptop";
import TechCubes from "./TechCubes";
import FloorRings from "./FloorRings";
import DeepSpaceGlobe from "./DeepSpaceGlobe";
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
        shadows
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
        <fog attach="fog" args={["#000000", 10, 62]} />
        <Environment preset="city" background={false} blur={0.8} />

        <ambientLight intensity={0.16} color="#0c0406" />
        <pointLight position={[4.8, 1.4, 4.8]} intensity={2.8} color="#ff1744" distance={34} decay={2} />
        <pointLight position={[3.6, -1.4, 3.2]} intensity={1.8} color="#800010" distance={30} decay={2} />
        <pointLight position={[-4.8, 4.8, 2.6]} intensity={1.4} color="#2a2a30" distance={30} decay={2} />
        <pointLight position={[0.2, 4.2, -8]} intensity={1.2} color="#800010" distance={38} decay={2} />
        <spotLight position={[1.8, 5.8, 5]} angle={0.45} penumbra={0.8} intensity={1.8} color="#ff1744" distance={34} />
        <spotLight position={[5.6, 2.0, 2.4]} angle={0.5} penumbra={0.85} intensity={1.2} color="#3a3a42" distance={28} />

        <Suspense fallback={null}>
          <ImageBackground />
          <NebulaBackground />
          <StarField />
          {!isMobile && !reducedMotion && <DeepSpaceGlobe />}

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
