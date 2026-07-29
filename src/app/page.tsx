"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { initScrollCamera } from "@/animations/scrollCamera";
import { start3DPowerUpSequence, PowerUpStage, PowerUpStageValues } from "@/animations/powerUpSequence";
import Loader from "@/components/ui/Loader";
import WelcomeText from "@/components/ui/WelcomeText";
import DashboardHero from "@/components/ui/DashboardHero";
import SocialSidebar from "@/components/ui/SocialSidebar";
import About from "@/components/sections/About";
import Skills from "@/components/sections/Skills";
import Projects from "@/components/sections/Projects";
import Experience from "@/components/sections/Experience";
import Contact from "@/components/sections/Contact";

const Scene = dynamic(() => import("@/components/canvas/Scene"), {
  ssr: false,
  loading: () => null,
});

const SHOW_DEV_RULER = false;

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

export default function Home() {
  const [scrollProgress, setScrollProgress] = useState(0);
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

  const stageScale = useStageScale();
  const scrollControlRef = useRef<{ destroy: () => void } | null>(null);

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
      onStageChange: (stage) => setPowerUpStage(stage),
      onValuesUpdate: (vals) => setPowerUpValues(vals),
      onComplete: () => {
        // All power-up stages complete
      },
    });
  };

  // Initialize scroll camera ONLY after 3D power-up sequence is fully complete
  useEffect(() => {
    if (powerUpStage !== "complete") return;

    scrollControlRef.current = initScrollCamera((progress) => {
      setScrollProgress(progress);
    });

    return () => {
      scrollControlRef.current?.destroy();
      scrollControlRef.current = null;
    };
  }, [powerUpStage]);

  const isPowerUpActive = loaderComplete && powerUpStage !== "complete" && powerUpStage !== "idle";

  return (
    <main className="relative min-h-[500vh] bg-[#000000]">
      {/* LOADER — renders preloader overlay */}
      {!loaderComplete && (
        <Loader onComplete={handleLoaderComplete} />
      )}

      {/* CLEAN WELCOME TEXT — single centered line "Welcome to My Portfolio" on pitch black */}
      {showWelcomeText && (
        <WelcomeText onComplete={handleWelcomeComplete} />
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
          powerUpValues={powerUpValues}
          isPowerUpActive={isPowerUpActive}
        />
      </div>

      {/* Social sidebar — appears when power-up reaches UI stage */}
      {loaderComplete && (
        <div style={{
          opacity: powerUpStage === "ui" || powerUpStage === "complete" ? 1 : 0,
          transition: "opacity 1s ease-out",
        }}>
          <SocialSidebar />
        </div>
      )}

      {/* Dashboard Hero — Station 1 view */}
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

      {/* Content sections — fade in as user scrolls down */}
      <div
        className="relative z-10 -mt-px"
        style={{
          background: "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(10,0,2,0.82) 18%, rgba(10,0,2,0.94) 100%)",
          opacity: powerUpStage === "ui" || powerUpStage === "complete" ? 1 : 0,
          transition: "opacity 1.5s ease-out",
        }}
      >
        <About />
        <Skills />
        <Projects />
        <Experience />
        <Contact />
      </div>

      {/* Dev ruler — hidden by default */}
      {SHOW_DEV_RULER && loaderComplete && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-black/85 border border-red-900/60 text-red-500 px-4 py-2.5 rounded-md font-mono shadow-2xl flex flex-col items-center gap-1.5 min-w-[280px]"
          style={{ backdropFilter: "blur(4px)" }}
        >
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider">
            <span>SCROLL PROGRESS:</span>
            <span className="text-white text-sm font-bold bg-red-950/60 px-1.5 py-0.5 rounded border border-red-800/40">
              {scrollProgress.toFixed(3)}
            </span>
          </div>
          <div className="relative w-full h-5 border-b border-red-950 flex justify-between mt-1">
            <div className="absolute left-0 bottom-0 w-px h-2.5 bg-red-800" />
            <div className="absolute left-1/4 bottom-0 w-px h-1.5 bg-red-950" />
            <div className="absolute left-1/2 bottom-0 w-px h-3.5 bg-red-500 -translate-x-1/2 animate-pulse" />
            <div className="absolute left-3/4 bottom-0 w-px h-1.5 bg-red-950" />
            <div className="absolute right-0 bottom-0 w-px h-2.5 bg-red-800" />
            <div
              className="absolute bottom-0 w-1.5 h-4 bg-red-500 -translate-x-1/2 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
              style={{ left: `${scrollProgress * 100}%` }}
            />
          </div>
          <div className="flex justify-between w-full text-[9px] text-red-800/80 font-bold px-0.5 mt-0.5">
            <span>0.00</span>
            <span>0.25</span>
            <span>0.50</span>
            <span>0.75</span>
            <span>1.00</span>
          </div>
        </div>
      )}
    </main>
  );
}