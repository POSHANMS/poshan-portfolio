"use client";

import React from "react";

export default function Home() {
  return (
    <main className="relative min-h-[200vh] bg-[#050508] flex flex-col justify-start pt-32 px-6 overflow-hidden select-none">
      
      {/* Background Matrix/Grid lines just to give visual reference */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(0,212,255,0.02),rgba(0,0,0,0),rgba(255,45,120,0.02))] bg-[length:100%_4px,3px_100%] pointer-events-none opacity-40" />

      {/* Cyberpunk Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Content wrapper */}
      <div className="max-w-4xl mx-auto w-full flex flex-col items-center justify-center text-center mt-20 z-10">
        
        {/* Neon glowing headers */}
        <div className="mb-6 px-4 py-1.5 border border-[var(--electric-blue)]/20 rounded-full bg-glass-dark text-[10px] md:text-xs font-mono text-[var(--electric-blue)] tracking-[0.2em] text-glow-blue uppercase">
          {"// System Boot Sequence Completed"}
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-wider text-white mb-6 uppercase">
          Phase 1: <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--electric-blue)] via-[var(--deep-violet)] to-[var(--hot-pink)] text-glow-blue">Foundation Done</span>
        </h1>
        
        <p className="text-sm md:text-base text-white/60 max-w-xl mb-12 font-medium leading-7">
          The core structure of the cyberpunk experience has been initialized. Moving the mouse will show the custom magnetic cursor trail, and the header features the responsive navigation bar.
        </p>

        {/* Action Button to test hover cursor morphing */}
        <button
          onClick={() => {
            alert("Ready to connect!");
          }}
          className="px-8 py-3 rounded-full border border-[var(--electric-blue)] text-[var(--electric-blue)] text-xs font-bold tracking-widest uppercase hover:bg-[var(--electric-blue)] hover:text-[#050508] transition-all duration-300 shadow-[0_0_15px_rgba(0,212,255,0.15)] hover:shadow-[0_0_25px_var(--electric-blue)]"
        >
          TEST HOVER STYLING
        </button>

        {/* Scroll Reference Indicator */}
        <div className="mt-60 flex flex-col items-center">
          <span className="text-[10px] font-mono text-white/40 tracking-[0.3em] uppercase mb-2">
            Scroll down to test sticky navbar
          </span>
          <div className="w-[1px] h-20 bg-gradient-to-b from-white/20 to-transparent" />
        </div>

      </div>

    </main>
  );
}
