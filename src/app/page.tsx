"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { initScrollCamera } from "@/animations/scrollCamera";

// Dynamically import WebGL Scene to prevent SSR errors (Canvas relies on browser window APIs)
const Scene = dynamic(() => import("@/components/canvas/Scene"), {
  ssr: false,
  loading: () => null,
});

export default function Home() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const scrollControl = initScrollCamera((progress) => {
      setScrollProgress(progress);
    });

    return () => {
      if (scrollControl) {
        scrollControl.destroy();
      }
    };
  }, []);

  return (
    <main className="relative min-h-[150vh] bg-[#050508] overflow-hidden select-none">
      
      {/* 3D WebGL Scene background (fixed underneath overlay UI) */}
      <Scene scrollProgress={scrollProgress} />

      {/* HTML Overlay Section (Passes pointer events to the canvas behind) */}
      <div className="relative z-10 max-w-4xl mx-auto w-full flex flex-col items-center justify-center text-center pt-48 px-6 pointer-events-none">
        
        {/* Glowing badge */}
        <div className="mb-6 px-4 py-1.5 border border-[var(--electric-blue)]/20 rounded-full bg-glass-dark text-[10px] md:text-xs font-mono text-[var(--electric-blue)] tracking-[0.2em] text-glow-blue uppercase">
          {"// WebGL Render Engine Online"}
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-wider text-white mb-6 uppercase">
          Phase 2: <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--electric-blue)] via-[var(--deep-violet)] to-[var(--hot-pink)] text-glow-blue">WebGL Active</span>
        </h1>
        
        <p className="text-sm md:text-base text-white/60 max-w-xl mb-12 font-medium leading-7">
          All WebGL elements are running: the volumetric nebula background, twinkling stars, extruded 3D typography, floating laptop with glowing screen, glass tech cubes with inner SVG decals, and the reflective grid floor.
        </p>

        {/* Interactive Button to verify pointer-events-auto works on top of WebGL */}
        <button
          onClick={() => {
            alert("WebGL interaction and overlay HUD are fully linked!");
          }}
          className="pointer-events-auto px-8 py-3 rounded-full border border-[var(--electric-blue)] text-[var(--electric-blue)] text-xs font-bold tracking-widest uppercase hover:bg-[var(--electric-blue)] hover:text-[#050508] transition-all duration-300 shadow-[0_0_15px_rgba(0,212,255,0.15)] hover:shadow-[0_0_25px_var(--electric-blue)]"
        >
          VERIFY HUD LINK
        </button>

        {/* Scroll Indicator helper */}
        <div className="mt-52 flex flex-col items-center">
          <span className="text-[10px] font-mono text-white/40 tracking-[0.3em] uppercase mb-2">
            Scroll to verify grid floor reflections
          </span>
          <div className="w-[1px] h-20 bg-gradient-to-b from-white/20 to-transparent" />
        </div>

      </div>

    </main>
  );
}
