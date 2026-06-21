"use client";

import { useEffect, useState } from "react";

/**
 * Custom hook to track the normalized page scroll progress (0.0 to 1.0)
 * and identify the currently active cinematic scene (1 - 5).
 * 
 * @returns An object containing the current scroll progress and active scene index
 */
export function useScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeScene, setActiveScene] = useState(1);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      
      // Calculate progress normalized between 0.0 and 1.0
      const progress = maxScroll > 0 ? scrollY / maxScroll : 0;
      setScrollProgress(progress);

      // Determine active scene (5 scenes total, split progress into 5 equal ranges)
      // Scene 1: [0.0 - 0.2)
      // Scene 2: [0.2 - 0.4)
      // Scene 3: [0.4 - 0.6)
      // Scene 4: [0.6 - 0.8)
      // Scene 5: [0.8 - 1.0]
      if (progress < 0.2) {
        setActiveScene(1);
      } else if (progress < 0.4) {
        setActiveScene(2);
      } else if (progress < 0.6) {
        setActiveScene(3);
      } else if (progress < 0.8) {
        setActiveScene(4);
      } else {
        setActiveScene(5);
      }
    };

    // Initialize values on mount
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return { progress: scrollProgress, activeScene };
}
