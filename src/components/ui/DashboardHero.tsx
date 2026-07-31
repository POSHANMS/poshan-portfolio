"use client";

import React from "react";

export default function DashboardHero({
  scrollProgress,
  stageScale,
}: {
  scrollProgress: number;
  stageScale: number;
}) {
  return (
    <section id="home" className="pointer-events-none relative z-10 h-screen w-screen overflow-hidden">
      {/* Atmospheric overlays - ALL ENABLED */}
      <div className="dashboard-haze pointer-events-none absolute inset-0" />
      <div className="dashboard-scanlines pointer-events-none absolute inset-0" />
      <div className="dashboard-depth-lines pointer-events-none absolute inset-0" />
      <div className="dashboard-vignette pointer-events-none absolute inset-0" />
      <div className="dashboard-floor-glow pointer-events-none absolute inset-x-0 bottom-0" />
      <div className="dashboard-horizon-fade pointer-events-none absolute inset-x-0 bottom-0" />
    </section>
  );
}