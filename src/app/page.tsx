"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { start3DPowerUpSequence, PowerUpStage, PowerUpStageValues } from "@/animations/powerUpSequence";
import { startWormholeSequence, WormholeValues, WormholePhase } from "@/animations/wormholeLaptop";
import Loader from "@/components/ui/Loader";
import WelcomeText from "@/components/ui/WelcomeText";
import DashboardHero from "@/components/ui/DashboardHero";

import CinematicHUD from "@/components/ui/CinematicHUD";

const Scene = dynamic(() => import("@/components/canvas/Scene"), {
  ssr: false,
  loading: () => null,
});

function useStageScale() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => {
      const widthScale = (window.innerWidth - 28) / 1760;
      const heightScale = (window.innerHeight - 112) / 920;
      setScale(Math.min(1, Math.max(0.58, Math.min(widthScale, heightScale))));
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return scale;
}

// Default wormhole values (all at starting positions — invisible)
const DEFAULT_WORMHOLE_VALUES: WormholeValues = {
  gravitationStrength: 0,
  singularityGlow: 0,
  floorWarp: 0,
  riftScale: 0,
  riftRotation: 0,
  riftOpacity: 0,
  laptopEmergence: 0,
  laptopEmergenceY: -2.0,
  laptopTiltX: 55,
  lensDistortion: 0,
  laptopScale: 0,
  laptopY: 0,
  laptopRotationY: -Math.PI / 2 - 0.55,
  landingImpact: 0,
  shockwaveRadius: 0,
  shockwaveOpacity: 0,
  energyRingOpacity: 0,
  ambientTransition: 0,
};

export default function Home() {
  const [loaderComplete, setLoaderComplete] = useState(false);
  const [showWelcomeText, setShowWelcomeText] = useState(false);

  const [powerUpStage, setPowerUpStage] = useState<PowerUpStage>("idle");
  const [powerUpValues, setPowerUpValues] = useState<PowerUpStageValues>({
    sceneOpacity: 0,
    floorOpacity: 0,
    floorFlicker: 1,
    laptopOpacity: 0,
    globeOpacity: 0,
    starsOpacity: 0,
    cubesOpacity: 0,
    uiOpacity: 0,
  });

  // ── Wormhole state ──────────────────────────────────────────────────
  const [wormholePhase, setWormholePhase] = useState<WormholePhase>("idle");
  const [wormholeValues, setWormholeValues] = useState<WormholeValues>(DEFAULT_WORMHOLE_VALUES);

  const [scrollProgress, setScrollProgress] = useState(0);

  // Wheel & touch scroll listener — camera hard-locks at 0.0 until physical scroll input
  useEffect(() => {
    let target = 0;
    let current = 0;
    let rafId = 0;

    const onWheel = (e: WheelEvent) => {
      target = Math.max(0, Math.min(1, target + e.deltaY * 0.0008));
    };

    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      const deltaY = touchStartY - e.touches[0].clientY;
      touchStartY = e.touches[0].clientY;
      target = Math.max(0, Math.min(1, target + deltaY * 0.002));
    };

    const update = () => {
      current += (target - current) * 0.08;
      setScrollProgress(current);
      rafId = requestAnimationFrame(update);
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    rafId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const stageScale = useStageScale();

  // Preloader finished -> start welcome text on 100% pitch-black screen
  const handleLoaderComplete = () => {
    setLoaderComplete(true);
    setShowWelcomeText(true);
    setPowerUpStage("welcome");
  };

  // Welcome text finished & faded out -> start 3D power-up lighting sequence
  const handleWelcomeComplete = () => {
    setShowWelcomeText(false);

    start3DPowerUpSequence({
      onStageChange: (stage) => {
        setPowerUpStage(stage);

        // When power-up reaches laptop stage → fire the wormhole sequence
        if (stage === "laptop") {
          startWormholeSequence({
            onPhaseChange: (phase) => setWormholePhase(phase),
            onValuesUpdate: (vals) => setWormholeValues(vals),
            onComplete: () => {
              // Wormhole done — laptop is now fully materialized
            },
          });
        }
      },
      onValuesUpdate: (vals) => setPowerUpValues(vals),
      onComplete: () => {
        // All power-up stages complete
      },
    });
  };

  const isPowerUpActive = loaderComplete && powerUpStage !== "complete" && powerUpStage !== "idle";

  // Wormhole is active from when gravity phase starts until it completes
  const wormholeActive =
    wormholePhase !== "idle" && wormholePhase !== "complete";

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#000000]">
      {/* LOADER — renders preloader overlay */}
      {!loaderComplete && (
        <Loader onComplete={handleLoaderComplete} />
      )}

      {/* CLEAN WELCOME TEXT — single centered line "Welcome to My Portfolio" on pitch black */}
      {showWelcomeText && (
        <WelcomeText onComplete={handleWelcomeComplete} layoutMode="stacked" />
      )}

      {/* 3D Scene — hidden during welcome text, then lights up stage-by-stage driven by GSAP */}
      <div
        className="fixed inset-0 z-0 h-full w-full pointer-events-none"
        style={{
          opacity: showWelcomeText || powerUpStage === "welcome" ? 0 : powerUpValues.sceneOpacity,
        }}
      >
        <Scene
          scrollProgress={scrollProgress}
          powerUpStage={powerUpStage}
          powerUpValues={powerUpValues}
          isPowerUpActive={isPowerUpActive}
          wormholeValues={wormholeValues}
          wormholeActive={wormholeActive}
          lensDistortion={wormholeValues.lensDistortion}
        />
      </div>



      {/* Dashboard Hero — Station 1 atmospheric overlays */}
      {loaderComplete && (
        <div style={{
          opacity: powerUpStage === "ui" || powerUpStage === "complete" ? 1 : 0,
          transform: powerUpStage === "ui" || powerUpStage === "complete" ? "scale(1)" : "scale(0.95)",
          transition: "opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
          willChange: "transform, opacity",
        }}>
          <DashboardHero scrollProgress={scrollProgress} stageScale={stageScale} />
        </div>
      )}

      {/* Cinematic HUD — film-strip ruler, timecode, corner brackets, REC badge */}
      <CinematicHUD visible={powerUpStage === "ui" || powerUpStage === "complete"} />
    </main>
  );
}