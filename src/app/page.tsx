"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Lenis from "lenis";
import { start3DPowerUpSequence, PowerUpStage, PowerUpStageValues } from "@/animations/powerUpSequence";
import { startWormholeSequence, WormholeValues, WormholePhase } from "@/animations/wormholeLaptop";
import Loader from "@/components/ui/Loader";
import WelcomeText from "@/components/ui/WelcomeText";
import CinematicHUD from "@/components/ui/CinematicHUD";
import CinematicJourney from "@/components/ui/CinematicJourney";

const Scene = dynamic(() => import("@/components/canvas/Scene"), {
  ssr: false,
  loading: () => null,
});

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

  const [wormholePhase, setWormholePhase] = useState<WormholePhase>("idle");
  const [wormholeValues, setWormholeValues] = useState<WormholeValues>(DEFAULT_WORMHOLE_VALUES);

  const [scrollProgress, setScrollProgress] = useState(0);

  // Scroll progress — derived from window.scrollY through the 680vh hero track.
  // CSS sticky (on the inner element) provides the pinned experience.
  // No GSAP DOM manipulation = no React reconciliation conflict.
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const hero = heroRef.current;
      if (!hero) return;
      // The outer div is 250vh. The pin region is the extra 150vh beyond the viewport.
      const scrollTrack = hero.offsetHeight - window.innerHeight;
      if (scrollTrack <= 0) return;
      const heroTop = hero.getBoundingClientRect().top + window.scrollY;
      const scrolled = Math.max(0, window.scrollY - heroTop);
      const nextProgress = Math.min(1, scrolled / scrollTrack);
      document.documentElement.dataset.storyProgress = nextProgress.toFixed(4);
      setScrollProgress(nextProgress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // seed on mount
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);

    const lenis = new Lenis({
      duration: 1.25,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.82,
      touchMultiplier: 1.08,
    });

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };

    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  const handleLoaderComplete = () => {
    setLoaderComplete(true);
    setShowWelcomeText(true);
    setPowerUpStage("welcome");
  };

  const handleWelcomeComplete = () => {
    setShowWelcomeText(false);

    start3DPowerUpSequence({
      onStageChange: (stage) => {
        setPowerUpStage(stage);
        if (stage === "laptop") {
          startWormholeSequence({
            onPhaseChange: (phase) => setWormholePhase(phase),
            onValuesUpdate: (vals) => setWormholeValues(vals),
            onComplete: () => {},
          });
        }
      },
      onValuesUpdate: (vals) => setPowerUpValues(vals),
      onComplete: () => {},
    });
  };

  const isPowerUpActive = loaderComplete && powerUpStage !== "complete" && powerUpStage !== "idle";
  const wormholeActive = wormholePhase !== "idle" && wormholePhase !== "complete";
  const storyVisible =
    powerUpStage === "laptop" ||
    powerUpStage === "cubes" ||
    powerUpStage === "ui" ||
    powerUpStage === "complete";

  return (
    <main className="relative w-full bg-[#000000]">
      {/* LOADER */}
      {!loaderComplete && <Loader onComplete={handleLoaderComplete} />}

      {/* WELCOME TEXT */}
      {showWelcomeText && (
        <WelcomeText onComplete={handleWelcomeComplete} layoutMode="stacked" />
      )}

      {/* PINNED CINEMATIC TRACK — 680vh outer creates a full story arc.
          Inner sticky div stays fixed at top while user scrolls through it.
          CSS sticky = zero DOM mutation = React-safe. */}
      <div ref={heroRef} className="relative w-full" style={{ height: "680vh" }}>
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          {/* 3D SCENE */}
          <div
            className="absolute inset-0 z-0 pointer-events-auto"
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

          {/* ═══ CHROMATIC ABERRATION OVERLAY (CSS) — vignette now handled by WebGL PostProcessing ═══ */}
          {storyVisible && (
            <div
              className="absolute inset-0 z-[6] pointer-events-none mix-blend-screen"
              style={{
                background: [
                  "radial-gradient(ellipse at 0% 50%, rgba(255,0,60,0.06) 0%, transparent 40%)",
                  "radial-gradient(ellipse at 100% 50%, rgba(0,220,255,0.05) 0%, transparent 40%)",
                  "radial-gradient(ellipse at 50% 0%, rgba(255,0,60,0.04) 0%, transparent 30%)",
                  "radial-gradient(ellipse at 50% 100%, rgba(0,220,255,0.04) 0%, transparent 30%)",
                ].join(", "),
              }}
            />
          )}

          {/* CINEMATIC HUD OVERLAY */}
          <CinematicJourney
            scrollProgress={scrollProgress}
            visible={storyVisible}
          />
          <CinematicHUD
            visible={storyVisible}
            scrollProgress={scrollProgress}
          />
        </div>
      </div>

      <div className="h-screen bg-black" aria-hidden="true" />
    </main>
  );
}
