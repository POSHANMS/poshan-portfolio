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

export default function Home() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const scrollControl = initScrollCamera((progress) => {
      setScrollProgress(progress);
    });
    return () => {
      if (scrollControl) scrollControl.destroy();
    };
  }, []);

  return (
    <main className="relative min-h-[500vh] bg-[#050508]">
      <Scene scrollProgress={scrollProgress} />
      <SocialSidebar />
      <DashboardHero scrollProgress={scrollProgress} />
      <div className="relative z-10 -mt-px bg-[linear-gradient(180deg,rgba(5,5,8,0.38)_0%,rgba(5,5,8,0.82)_18%,rgba(5,5,8,0.94)_100%)]">
        <About />
        <Skills />
        <Projects />
        <Experience />
        <Contact />
      </div>
    </main>
  );
}
