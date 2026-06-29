"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createAmbientAudio, type AmbientAudioController } from "@/lib/audio";

export function useAudio(scrollProgress: number) {
  const controllerRef = useRef<AmbientAudioController | null>(null);
  const [enabled, setEnabled] = useState(false);

  const toggle = useCallback(async () => {
    if (!controllerRef.current) {
      controllerRef.current = createAmbientAudio();
    }

    if (enabled) {
      controllerRef.current.stop();
      setEnabled(false);
      return;
    }

    await controllerRef.current.start();
    setEnabled(true);
  }, [enabled]);

  useEffect(() => {
    controllerRef.current?.setIntensity(scrollProgress);
  }, [scrollProgress]);

  useEffect(() => {
    const handleVisibility = () => {
      if (!controllerRef.current) return;
      controllerRef.current.setMuted(document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      controllerRef.current?.dispose();
      controllerRef.current = null;
    };
  }, []);

  return { enabled, toggle };
}
