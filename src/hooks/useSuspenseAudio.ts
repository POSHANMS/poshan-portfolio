"use client";

import { useEffect, useRef, useCallback } from "react";

export function useSuspenseAudio() {
  const startedRef = useRef(false);
  const synthRef = useRef<any>(null);
  const noiseRef = useRef<any>(null);
  const filterRef = useRef<any>(null);
  const lfoRef = useRef<any>(null);

  const start = useCallback(async () => {
    if (startedRef.current) return;
    try {
      const tone = await import("tone");
      
      // Start Tone audio context
      await tone.start();

      // Low Drone Filter
      const filter = new tone.Filter(200, "lowpass").toDestination();
      filterRef.current = filter;
      
      // Suspenseful low synth drone
      const synth = new tone.PolySynth(tone.Synth, {
        oscillator: { type: "fatsawtooth" },
        envelope: { attack: 3, decay: 1, sustain: 1, release: 4 },
      }).connect(filter);
      synth.volume.value = -20;
      synthRef.current = synth;
      
      // LFO to modulate filter frequency for suspense wobble
      const lfo = new tone.LFO(0.12, 80, 320).connect(filter.frequency);
      lfoRef.current = lfo;
      
      // Pink noise for cosmic atmospheric wind
      const noise = new tone.Noise("pink").connect(filter);
      noise.volume.value = -32;
      noiseRef.current = noise;

      // Play notes
      synth.triggerAttack(["C2", "G1", "D2"]);
      lfo.start();
      noise.start();
      startedRef.current = true;
    } catch (err) {
      console.warn("Suspense audio failed to initialize:", err);
    }
  }, []);

  const setProgress = useCallback((progress: number) => {
    if (!startedRef.current) return;
    try {
      const norm = progress / 100;
      
      // Accelerate LFO wobble as load progress completes (from 0.12Hz up to 2.2Hz)
      if (lfoRef.current) {
        lfoRef.current.frequency.rampTo(0.12 + norm * 2.05, 0.15);
      }
      
      // Open filter cutoff to make the sound brighter and more intense (from 200Hz up to 650Hz)
      if (filterRef.current) {
        filterRef.current.frequency.rampTo(200 + norm * 450, 0.15);
      }
      
      // Slowly swell the volume of the drone and noise to build climax
      if (synthRef.current) {
        synthRef.current.volume.rampTo(-20 + norm * 6, 0.15);
      }
      if (noiseRef.current) {
        noiseRef.current.volume.rampTo(-32 + norm * 7, 0.15);
      }
    } catch (err) {}
  }, []);

  const triggerTear = useCallback(async () => {
    try {
      const tone = await import("tone");
      
      // Sub-bass drop (portal tearing sound)
      const drop = new tone.MembraneSynth().toDestination();
      drop.volume.value = 2;
      drop.triggerAttackRelease("C1", "1n");
      
      // White noise burst for the crack explosion
      const burst = new tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.005, decay: 0.5, sustain: 0 },
      }).toDestination();
      burst.volume.value = -4;
      burst.triggerAttackRelease("1n");

      // Stop the suspense background drone
      if (synthRef.current) {
        synthRef.current.releaseAll();
      }
      if (noiseRef.current) {
        noiseRef.current.stop();
      }
      if (lfoRef.current) {
        lfoRef.current.stop();
      }
    } catch (err) {
      console.warn("Tear SFX failed to play:", err);
    }
  }, []);

  const stop = useCallback(() => {
    if (synthRef.current) {
      try { synthRef.current.releaseAll(); } catch {}
    }
    if (noiseRef.current) {
      try { noiseRef.current.stop(); } catch {}
    }
    if (lfoRef.current) {
      try { lfoRef.current.stop(); } catch {}
    }
    startedRef.current = false;
  }, []);

  useEffect(() => {
    // Attempt automatic start, and hook to interaction to bypass browser audio policies
    const handleInteraction = () => {
      start();
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("mousemove", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };

    window.addEventListener("click", handleInteraction);
    window.addEventListener("mousemove", handleInteraction);
    window.addEventListener("keydown", handleInteraction);

    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("mousemove", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
      stop();
    };
  }, [start, stop]);

  return { start, setProgress, triggerTear, stop };
}
