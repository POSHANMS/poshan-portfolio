"use client";

import React from "react";
import { FileText, ChevronDown } from "lucide-react";

export default function DashboardHero({
  scrollProgress,
  stageScale,
}: {
  scrollProgress: number;
  stageScale: number;
}) {
  // ── 3D Spatial Holographic Projection Calculation ─────────────────
  // 0% -> 50%: HUD projects OUT OF the laptop screen face toward viewer
  //            scale: 0.15 -> 1.0, opacity: 0 -> 1, Z-distance expansion
  // 50% -> 90%: HUD locks in 3D mid-air reading focus
  // 90% -> 100%: HUD panel fades out & floats upward
  let projScale = 0.15;
  let hudOpacity = 0;
  let ctaOpacity = 0;
  let lightBeamOpacity = 0;

  if (scrollProgress <= 0.5) {
    const t = Math.max(0, scrollProgress / 0.5);
    projScale = 0.15 + 0.85 * t;
    hudOpacity = t;
    lightBeamOpacity = Math.sin(t * Math.PI) * 0.7; // Light beam flare cone peaks mid-projection
    ctaOpacity = t > 0.6 ? (t - 0.6) / 0.4 : 0;
  } else if (scrollProgress <= 0.9) {
    projScale = 1.0;
    hudOpacity = 1;
    lightBeamOpacity = 0.15; // Soft residual holographic aura
    ctaOpacity = 1;
  } else {
    const t = (scrollProgress - 0.9) / 0.1;
    projScale = 1.0 + 0.05 * t;
    hudOpacity = 1 - t;
    lightBeamOpacity = 0;
    ctaOpacity = 1 - t;
  }

  return (
    <section id="home" className="pointer-events-none relative z-10 h-screen w-screen overflow-hidden">
      {/* Atmospheric overlays */}
      <div className="dashboard-haze pointer-events-none absolute inset-0" />
      <div className="dashboard-scanlines pointer-events-none absolute inset-0" />
      <div className="dashboard-depth-lines pointer-events-none absolute inset-0" />
      <div className="dashboard-vignette pointer-events-none absolute inset-0" />
      <div className="dashboard-floor-glow pointer-events-none absolute inset-x-0 bottom-0" />
      <div className="dashboard-horizon-fade pointer-events-none absolute inset-x-0 bottom-0" />

      {/* ── Holographic Light Beam Flare Cone (Radiating from screen to glass) ──── */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-200"
        style={{ opacity: lightBeamOpacity }}
      >
        <div
          className="h-[520px] w-[680px] rounded-full blur-[90px]"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(255, 45, 75, 0.35) 0%, rgba(255, 23, 68, 0.12) 50%, rgba(0, 0, 0, 0) 80%)",
            transform: `scale(${projScale})`,
          }}
        />
      </div>

      {/* ── 3D Spatial Holographic Glassmorphism Projection Panel ────────── */}
      <div className="absolute inset-0 flex items-center justify-center p-4 md:p-6" style={{ perspective: "1200px" }}>
        <div
          className="pointer-events-auto relative w-full max-w-2xl overflow-hidden p-6 md:p-8 transition-all duration-300 ease-out"
          style={{
            opacity: hudOpacity,
            transform: `scale(${projScale * stageScale}) translateZ(${(1 - projScale) * -150}px)`,
            transformOrigin: "center center",
            backdropFilter: "blur(28px) saturate(190%)",
            WebkitBackdropFilter: "blur(28px) saturate(190%)",
            background: "rgba(12, 12, 18, 0.55)",
            border: "1px solid rgba(255, 45, 75, 0.35)",
            boxShadow:
              "inset 0 1px 1px rgba(255, 255, 255, 0.18), 0 30px 70px rgba(0, 0, 0, 0.85), 0 0 30px rgba(255, 45, 75, 0.2)",
            borderRadius: "20px",
          }}
        >
          {/* Top Status Header & Vector Icon Buttons */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            {/* Hologram Interface Status Indicator */}
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00ff88] opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#00ff88]"></span>
              </span>
              <span className="font-mono text-xs font-semibold tracking-wider text-[#00ff88]">
                ● HOLOGRAM INTERFACE ONLINE
              </span>
              <span className="ml-2 hidden font-mono text-xs text-white/40 md:inline">
                | SPATIAL PROJECTION
              </span>
            </div>

            {/* Outline Icon Buttons for GitHub, LinkedIn, and CV */}
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/POSHANMS"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub Profile"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#ff2d4d]/35 bg-black/50 text-white/80 transition-all hover:scale-110 hover:border-[#ff2d4d] hover:text-[#ff2d4d] hover:shadow-[0_0_15px_rgba(255,45,77,0.4)]"
              >
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              </a>
              <a
                href="https://linkedin.com/in/poshanms/"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn Profile"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#ff2d4d]/35 bg-black/50 text-white/80 transition-all hover:scale-110 hover:border-[#ff2d4d] hover:text-[#ff2d4d] hover:shadow-[0_0_15px_rgba(255,45,77,0.4)]"
              >
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
              <a
                href="mailto:siddeshwaraprasanna5@gmail.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Download CV"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#ff2d4d]/35 bg-black/50 text-white/80 transition-all hover:scale-110 hover:border-[#ff2d4d] hover:text-[#ff2d4d] hover:shadow-[0_0_15px_rgba(255,45,77,0.4)]"
              >
                <FileText className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Main Title, Subtitle, and Tagline */}
          <div className="mt-5">
            <h1 className="font-sans text-4xl font-extrabold tracking-wider text-white md:text-5xl">
              POSHAN M S
            </h1>
            <h2 className="mt-1.5 font-sans text-base font-semibold text-[#ff2d4d] md:text-lg">
              Full-Stack &amp; AI Developer | Computer Science Engineer
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-white/80">
              &quot;Architecting scalable web platforms, intelligent ML diagnostics, and secure systems.&quot;
            </p>
          </div>

          {/* 2x2 Spatial Badges */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-center rounded-xl border border-[#ff2d4d]/40 bg-[#ff2d4d]/10 px-4 py-2.5 font-mono text-xs font-medium text-[#ff5c77] shadow-[0_0_12px_rgba(255,45,77,0.15)]">
              [ HEALTHGPT: ML Healthcare System ]
            </div>
            <div className="flex items-center rounded-xl border border-[#ff2d4d]/40 bg-[#ff2d4d]/10 px-4 py-2.5 font-mono text-xs font-medium text-[#ff5c77] shadow-[0_0_12px_rgba(255,45,77,0.15)]">
              [ CAMPUS PORTAL: React 18 + Flask + Redis ]
            </div>
            <div className="flex items-center rounded-xl border border-[#ff2d4d]/40 bg-[#ff2d4d]/10 px-4 py-2.5 font-mono text-xs font-medium text-[#ff5c77] shadow-[0_0_12px_rgba(255,45,77,0.15)]">
              [ DSA: 110+ Solved • LeetCode / GFG ]
            </div>
            <div className="flex items-center rounded-xl border border-[#ff2d4d]/40 bg-[#ff2d4d]/10 px-4 py-2.5 font-mono text-xs font-medium text-[#ff5c77] shadow-[0_0_12px_rgba(255,45,77,0.15)]">
              [ CYBERSECURITY: TryHackMe Voyager Rank ]
            </div>
          </div>
        </div>

        {/* Bottom CTA Pulse Indicator */}
        <div
          className="pointer-events-none absolute bottom-10 flex flex-col items-center gap-1 transition-opacity duration-300"
          style={{ opacity: ctaOpacity }}
        >
          <span className="font-mono text-xs tracking-widest text-[#ff2d4d] drop-shadow-[0_0_8px_rgba(255,45,77,0.8)]">
            [ SCROLL TO DIVE INTO CORE SYSTEM ]
          </span>
          <ChevronDown className="h-4 w-4 animate-bounce text-[#ff2d4d]" />
        </div>
      </div>
    </section>
  );
}