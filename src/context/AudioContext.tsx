"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useSuspenseAudio } from "@/hooks/useSuspenseAudio";

type AudioContextType = ReturnType<typeof useSuspenseAudio>;

const AudioContextInstance = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const audio = useSuspenseAudio();

  return (
    <AudioContextInstance.Provider value={audio}>
      {children}
    </AudioContextInstance.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContextInstance);
  if (!context) {
    throw new Error("useAudio must be used within AudioProvider");
  }
  return context;
}
