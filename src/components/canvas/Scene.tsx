"use client";

import React, { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import * as THREE from "three";
import { CinematicCamera } from "@/animations/scrollCamera";
import { useDeviceSize } from "@/hooks/useDeviceSize";
import NebulaBackground from "./NebulaBackground";
import StarField from "./StarField";
import NeonGrid from "./NeonGrid";
import FloatingLaptop from "./FloatingLaptop";
import TechCubes from "./TechCubes";
import FloorRings from "./FloorRings";
import DeepSpaceGlobe from "./DeepSpaceGlobe";
import ParticleNetwork from "./ParticleNetwork";
import VolumetricRays from "./VolumetricRays";
import FloatingHexParticles from "./FloatingHexParticles";
import PostProcessing from "./PostProcessing";

// Mouse parallax group
function ParallaxGroup({ children, factor = 1 }: { children: React.ReactNode; factor?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.x = THREE.MathUtils.lerp(
      groupRef.current.position.x,
      mouseRef.current.x * factor,
      0.03
    );
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      mouseRef.current.y * factor * 0.5,
      0.03
    );
  });

  return <group ref={groupRef}>{children}</group>;
}

interface SceneProps {
  scrollProgress: number;
}

export default function Scene({ scrollProgress }: SceneProps) {
  const { deviceTier, reducedMotion } = useDeviceSize();
  const isMobile = deviceTier === "mobile";

  return (
    <div className="fixed inset-0 z-0 h-full w-full" style={{ background: "#050001" }}>
      <Canvas
        shadows
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: isMobile ? "default" : "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.95,
        }}
        camera={{
          position: [0, 2.0, 8.5],
          fov: 50,
          near: 0.1,
          far: 300,
        }}
      >
        <CinematicCamera scrollProgress={scrollProgress} />
        
        <color attach="background" args={["#050001"]} />
        <fog attach="fog" args={["#050001", 30, 100]} />
        
        <Environment preset="city" background={false} blur={2} />

        <ambientLight intensity={0.12} color="#1a0004" />
        <pointLight position={[5, 3, 5]} intensity={4} color="#ff1744" distance={60} decay={2} />
        <pointLight position={[-5, 4, -5]} intensity={2.5} color="#ff4444" distance={50} decay={2} />
        <pointLight position={[0, -2, 8]} intensity={3} color="#800010" distance={40} decay={2} />
        <pointLight position={[12, 8, -20]} intensity={5} color="#ff1744" distance={80} decay={2} />
        <spotLight position={[3, 6, 4]} angle={0.5} penumbra={0.8} intensity={2.5} color="#ff1744" distance={50} />

        <Suspense fallback={null}>
          {/* DEEPEST LAYER — slowest parallax */}
          <ParallaxGroup factor={0.3}>
            <NebulaBackground />
            <StarField />
          </ParallaxGroup>

          {/* MID LAYER */}
          <ParallaxGroup factor={0.6}>
            <DeepSpaceGlobe />
            <VolumetricRays />
          </ParallaxGroup>

          {/* NEAR LAYER — faster parallax */}
          <ParallaxGroup factor={1.0}>
            <ParticleNetwork />
            <FloatingHexParticles />
            <TechCubes />
            <FloatingLaptop />
          </ParallaxGroup>

          {/* FOREGROUND — no parallax (anchored) */}
          <NeonGrid />
          <FloorRings />
          
          <PostProcessing />
        </Suspense>
      </Canvas>
    </div>
  );
}
