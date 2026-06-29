"use client";

import React from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useAudio } from "@/hooks/useAudio";

export default function AudioToggle({ scrollProgress }: { scrollProgress: number }) {
  const { enabled, toggle } = useAudio(scrollProgress);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={enabled ? "Disable ambient audio" : "Enable ambient audio"}
      className="fixed right-8 top-24 z-30 hidden h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[rgba(10,10,30,0.6)] text-white/70 backdrop-blur-md transition hover:border-[var(--electric-blue)] hover:text-[var(--electric-blue)] hover:shadow-[0_0_18px_rgba(0,212,255,0.18)] md:flex"
    >
      {enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
    </button>
  );
}
