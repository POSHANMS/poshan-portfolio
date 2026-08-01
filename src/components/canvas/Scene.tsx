"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { CinematicCamera } from "@/animations/scrollCamera";
import { useDeviceSize } from "@/hooks/useDeviceSize";
import { PowerUpStageValues } from "@/animations/powerUpSequence";
import { WormholeValues } from "@/animations/wormholeLaptop";
import NebulaBackground from "./NebulaBackground";
import StarField from "./StarField";
import ShootingStars from "./ShootingStars";
import DeepSpaceGlobe from "./DeepSpaceGlobe";
import VolumetricRays from "./VolumetricRays";
import MagneticParticles from "./MagneticParticles";
import FloatingHexParticles from "./FloatingHexParticles";
import TechCubes from "./TechCubes";
import FloatingLaptop from "./FloatingLaptop";
import WormholeLaptopEntry from "./WormholeLaptopEntry";
import NeonGrid from "./NeonGrid";
import FloorRings from "./FloorRings";
import PostProcessing from "./PostProcessing";

interface SceneProps {
  scrollProgress: number;
  powerUpValues?: PowerUpStageValues;
  isPowerUpActive?: boolean;
  wormholeValues?: WormholeValues;
  wormholeActive?: boolean;
  lensDistortion?: number;
}

function SceneLights({ powerUpValues, isPowerUpActive }: { powerUpValues?: PowerUpStageValues; isPowerUpActive?: boolean }) {
  // Smooth multipliers — direct JSX calculation, no useFrame mutation hacks
  const s = isPowerUpActive && powerUpValues ? powerUpValues.sceneOpacity : 1;
  const f = isPowerUpActive && powerUpValues ? powerUpValues.floorOpacity : 1;
  const fl = isPowerUpActive && powerUpValues ? powerUpValues.floorFlicker : 1;
  const l = isPowerUpActive && powerUpValues ? powerUpValues.laptopOpacity : 1;
  const st = isPowerUpActive && powerUpValues ? powerUpValues.starsOpacity : 1;
  const c = isPowerUpActive && powerUpValues ? powerUpValues.cubesOpacity : 1;
  const g = isPowerUpActive && powerUpValues ? powerUpValues.globeOpacity : 1;

  return (
    <>
      <ambientLight intensity={0.03 * s} color="#0a0002" />

      {/* General scene lights */}
      <pointLight position={[5, 4, 6]} intensity={2.2 * s} color="#ff1744" distance={70} decay={2} />
      <pointLight position={[-5, 5, -4]} intensity={1.4 * s} color="#ff4444" distance={55} decay={2} />
      <pointLight position={[0, -1, 10]} intensity={1.6 * s} color="#800010" distance={45} decay={2} />
      <pointLight position={[14, 10, -22]} intensity={2.8 * st} color="#ff1744" distance={90} decay={2} />
      <spotLight position={[4, 7, 5]} angle={0.5} penumbra={0.8} intensity={1.4 * s} color="#ff1744" distance={55} />

      {/* Floor grid lights */}
      <pointLight position={[0.8, -1.0, 0]} intensity={2.2 * f * fl} color="#ff1744" distance={14} decay={2} />
      <pointLight position={[-2, -0.3, 2]} intensity={1.0 * f * fl} color="#cc1133" distance={10} decay={2} />
      <pointLight position={[0, -1.5, 5]} intensity={1.5 * f * fl} color="#660010" distance={20} decay={2} />

      {/* Laptop area lights */}
      <pointLight position={[2.5, 1.0, 0.5]} intensity={1.4 * l} color="#ff1744" distance={12} decay={2} />
      <pointLight position={[-1, 1.5, 3]} intensity={0.7 * l} color="#ff8a80" distance={10} decay={2} />

      {/* Background / star lights */}
      <pointLight position={[0, 8, -30]} intensity={1.0 * st} color="#ff1744" distance={60} decay={2} />
      <pointLight position={[-8, 3, 2]} intensity={0.4 * st} color="#ff3355" distance={30} decay={2} />

      {/* Globe accent light — casts real-time reflections on the floor */}
      <pointLight position={[4.5, 2.5, -8]} intensity={3.5 * g} color="#ff1744" distance={25} decay={2} />
      <pointLight position={[4.5, 0.5, -8]} intensity={2.0 * g} color="#800010" distance={20} decay={2} />

      {/* Cube accent light */}
      <pointLight position={[-1, 2, -2]} intensity={0.8 * c} color="#ff1744" distance={15} decay={2} />
    </>
  );
}

export default function Scene({
  scrollProgress,
  powerUpValues,
  isPowerUpActive,
  wormholeValues,
  wormholeActive = false,
  lensDistortion = 0,
}: SceneProps) {
  const { deviceTier } = useDeviceSize();
  const isMobile = deviceTier === "mobile";

  const showFloor = !isPowerUpActive || (powerUpValues && powerUpValues.floorOpacity > 0.0001);
  const showGlobe = !isPowerUpActive || (powerUpValues && powerUpValues.globeOpacity > 0.0001);
  const showStars = !isPowerUpActive || (powerUpValues && powerUpValues.starsOpacity > 0.0001);
  const showCubes = !isPowerUpActive || (powerUpValues && powerUpValues.cubesOpacity > 0.0001);

  // Laptop is visible when wormhole is active OR when laptopOpacity > 0
  const showLaptop =
    wormholeActive ||
    !isPowerUpActive ||
    (powerUpValues && powerUpValues.laptopOpacity > 0.0001);

  const floorOpacity = powerUpValues?.floorOpacity ?? 1;
  const starsOpacity = powerUpValues?.starsOpacity ?? 1;
  const globeOpacity = powerUpValues?.globeOpacity ?? 1;
  const laptopOpacity = powerUpValues?.laptopOpacity ?? 1;
  const cubesOpacity = powerUpValues?.cubesOpacity ?? 1;

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
        <CinematicCamera scrollProgress={scrollProgress} lensDistortion={lensDistortion} />

        <color attach="background" args={["#000000"]} />

        <SceneLights powerUpValues={powerUpValues} isPowerUpActive={isPowerUpActive} />

        <Suspense fallback={null}>
          <group visible={showStars}>
            <NebulaBackground />
            <StarField starsOpacity={starsOpacity} />
            <ShootingStars />
          </group>

          <group visible={showGlobe}>
            <DeepSpaceGlobe scrollProgress={scrollProgress} globeOpacity={globeOpacity} />
          </group>

          <VolumetricRays />
          <MagneticParticles />
          <FloatingHexParticles />

          <group visible={showCubes}>
            <TechCubes cubesOpacity={cubesOpacity} />
          </group>

          {/* Wormhole entry effects — only renders when active */}
          {wormholeActive && wormholeValues && (
            <WormholeLaptopEntry
              wormholeValues={wormholeValues}
              isActive={wormholeActive}
            />
          )}

          <group visible={!!showLaptop}>
            <FloatingLaptop
              laptopOpacity={laptopOpacity}
              wormholeValues={wormholeValues}
              wormholeActive={wormholeActive}
            />
          </group>

          <group visible={showFloor}>
            <NeonGrid floorOpacity={floorOpacity} />
            <FloorRings />
          </group>

          <PostProcessing />
        </Suspense>
      </Canvas>
    </div>
  );
}
