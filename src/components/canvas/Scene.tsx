"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { CinematicCamera } from "@/animations/scrollCamera";
import { useDeviceSize } from "@/hooks/useDeviceSize";
import NebulaBackground from "./NebulaBackground";
import StarField from "./StarField";
import ShootingStars from "./ShootingStars";
import DeepSpaceGlobe from "./DeepSpaceGlobe";
import VolumetricRays from "./VolumetricRays";
import MagneticParticles from "./MagneticParticles";
import FloatingHexParticles from "./FloatingHexParticles";
import TechCubes from "./TechCubes";
import FloatingLaptop from "./FloatingLaptop";
import NeonGrid from "./NeonGrid";
import FloorRings from "./FloorRings";
import PostProcessing from "./PostProcessing";

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
        frameloop="always"
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: isMobile ? "default" : "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
        camera={{
          position: [0.5, 0.5, 8],
          fov: 45,
          near: 0.1,
          far: 300,
        }}
      >
        <CinematicCamera scrollProgress={scrollProgress} />

        <color attach="background" args={["#000000"]} />
        
        <ambientLight intensity={0.03} color="#0a0002" />

        <pointLight position={[5, 4, 6]} intensity={2.2} color="#ff1744" distance={70} decay={2} />
        <pointLight position={[-5, 5, -4]} intensity={1.4} color="#ff4444" distance={55} decay={2} />
        <pointLight position={[0, -1, 10]} intensity={1.6} color="#800010" distance={45} decay={2} />
        <pointLight position={[14, 10, -22]} intensity={2.8} color="#ff1744" distance={90} decay={2} />
        <spotLight position={[4, 7, 5]} angle={0.5} penumbra={0.8} intensity={1.4} color="#ff1744" distance={55} />
        
        <pointLight position={[0.8, -1.0, 0]} intensity={2.2} color="#ff1744" distance={14} decay={2} />
        <pointLight position={[-2, -0.3, 2]} intensity={1.0} color="#cc1133" distance={10} decay={2} />
        <pointLight position={[0, -1.5, 5]} intensity={1.5} color="#660010" distance={20} decay={2} />
        
        <pointLight position={[2.5, 1.0, 0.5]} intensity={1.4} color="#ff1744" distance={12} decay={2} />
        <pointLight position={[-1, 1.5, 3]} intensity={0.7} color="#ff8a80" distance={10} decay={2} />
        
        <pointLight position={[0, 8, -30]} intensity={1.0} color="#ff1744" distance={60} decay={2} />
        <pointLight position={[-8, 3, 2]} intensity={0.4} color="#ff3355" distance={30} decay={2} />

        <Suspense fallback={null}>
          <NebulaBackground />
          <StarField />
          <ShootingStars />
          <DeepSpaceGlobe scrollProgress={scrollProgress} />
          <VolumetricRays />
          <MagneticParticles />
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
