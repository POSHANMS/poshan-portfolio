"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import NebulaBackground from "./NebulaBackground";
import StarField from "./StarField";
import HeroName3D from "./HeroName3D";
import FloatingLaptop from "./FloatingLaptop";
import TechCubes from "./TechCubes";
import ParticleNetwork from "./ParticleNetwork";
import FloorRings from "./FloorRings";
import NeonGrid from "./NeonGrid";
import PostProcessing from "./PostProcessing";

export default function Scene() {
  return (
    <div className="fixed inset-0 w-full h-full z-0 select-none pointer-events-none bg-[#050508]">
      <Canvas
        shadows
        gl={{ 
          antialias: true, 
          alpha: false, 
          powerPreference: "high-performance",
          logarithmicDepthBuffer: true // fixes depth fighting on reflective floor
        }}
        camera={{
          position: [0, 0.8, 9.5],
          fov: 50,
          near: 0.1,
          far: 50,
        }}
      >
        <color attach="background" args={["#050508"]} />
        <fog attach="fog" args={["#050508", 8, 20]} />

        {/* Ambient base lighting */}
        <ambientLight intensity={0.4} />
        
        {/* Soft fill directional light */}
        <directionalLight
          position={[5, 10, 5]}
          intensity={0.6}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.0001}
        />

        {/* R3F elements wrap */}
        <Suspense fallback={null}>
          {/* Layer 1: Nebula background plane running GLSL shader */}
          <NebulaBackground />

          {/* Layer 2: Starfield particle network */}
          <StarField />

          {/* Layer 3: Main interactive elements */}
          <group position={[0, 0, 0]}>
            {/* Holographic 3D extruded title */}
            <HeroName3D />

            {/* floating metallic laptop */}
            <FloatingLaptop />

            {/* Rounded glass tech cubes connected with glow lines */}
            <TechCubes />

            {/* Interactive mouse particle network */}
            <ParticleNetwork />

            {/* Pulsing base ring underneath laptop */}
            <FloorRings />
          </group>

          {/* Reflective cyber grid floor */}
          <NeonGrid />

          {/* Render effects: Bloom, DOF, Chromatic Aberration */}
          <PostProcessing />
        </Suspense>
      </Canvas>
    </div>
  );
}
