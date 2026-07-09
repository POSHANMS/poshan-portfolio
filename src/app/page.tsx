"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { initScrollCamera } from "@/animations/scrollCamera";
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
  const stageScale = useStageScale();

  useEffect(() => {
    const scrollControl = initScrollCamera((progress) => {
      setScrollProgress(progress);
    });
    return () => {
      if (scrollControl) scrollControl.destroy();
    };
  }, []);

  return (
    <main className="relative min-h-[500vh] bg-[#0a0002]">
      <Scene scrollProgress={scrollProgress} />
      <SocialSidebar />
      <DashboardHero scrollProgress={scrollProgress} stageScale={stageScale} />
      <div className="relative z-10 -mt-px bg-[linear-gradient(180deg,rgba(10,0,2,0.38)_0%,rgba(10,0,2,0.82)_18%,rgba(10,0,2,0.94)_100%)]">
        <About />
        <Skills />
        <Projects />
        <Experience />
        <Contact />
      </div>
      
      {/* Cyberpunk CRT screen texture overlays */}
      <div className="scanlines-overlay" />
      <div className="vignette-overlay" />
      <div className="grain-overlay" />
    </main>
  );
}
