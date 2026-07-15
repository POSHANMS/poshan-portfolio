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

// Set to true to show the fixed developer scroll progress indicator at the bottom center
const SHOW_DEV_RULER = true;

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

      {SHOW_DEV_RULER && (
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
          {/* ruler bar */}
          <div className="relative w-full h-5 border-b border-red-950 flex justify-between mt-1">
            {/* tick marks */}
            <div className="absolute left-0 bottom-0 w-px h-2.5 bg-red-800" title="0.0"></div>
            <div className="absolute left-1/4 bottom-0 w-px h-1.5 bg-red-950" title="0.25"></div>
            <div className="absolute left-1/2 bottom-0 w-px h-3.5 bg-red-500 -translate-x-1/2 animate-pulse" title="0.5"></div>
            <div className="absolute left-3/4 bottom-0 w-px h-1.5 bg-red-950" title="0.75"></div>
            <div className="absolute right-0 bottom-0 w-px h-2.5 bg-red-800" title="1.0"></div>
            {/* progress indicator handle */}
            <div 
              className="absolute bottom-0 w-1.5 h-4 bg-red-500 -translate-x-1/2 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
              style={{ left: `${scrollProgress * 100}%` }}
            ></div>
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
