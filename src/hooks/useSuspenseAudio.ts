"use client";

import { useEffect, useRef, useCallback, useState } from "react";

export function useSuspenseAudio() {
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Audio Nodes
  const masterGainRef = useRef<GainNode | null>(null);
  const subOscRef = useRef<OscillatorNode | null>(null);
  const droneOscRef = useRef<OscillatorNode | null>(null);
  const droneOsc2Ref = useRef<OscillatorNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const noiseNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const convolverRef = useRef<ConvolverNode | null>(null);

  // Initialize Web Audio Context on explicit user interaction
  const initAudio = useCallback(() => {
    if (audioCtxRef.current && audioCtxRef.current.state === "running") return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      // Master Gain
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.35, ctx.currentTime);
      master.connect(ctx.destination);
      masterGainRef.current = master;

      // Convolution reverb for space ambience
      const convolver = ctx.createConvolver();
      const reverbLength = ctx.sampleRate * 3;
      const reverbBuffer = ctx.createBuffer(2, reverbLength, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const data = reverbBuffer.getChannelData(ch);
        for (let i = 0; i < reverbLength; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / reverbLength, 3) * 0.3;
        }
      }
      convolver.buffer = reverbBuffer;
      convolver.connect(master);
      convolverRef.current = convolver;

      // Lowpass Filter for suspense wobble
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(180, ctx.currentTime);
      filter.Q.setValueAtTime(4, ctx.currentTime);
      filter.connect(master);
      filterRef.current = filter;

      // Sub-Bass 30Hz Oscillator (Chest Rumble)
      const sub = ctx.createOscillator();
      sub.type = "sine";
      sub.frequency.setValueAtTime(32, ctx.currentTime);
      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0.4, ctx.currentTime);
      sub.connect(subGain);
      subGain.connect(master);
      sub.start();
      subOscRef.current = sub;

      // Sawtooth Cyberpunk Drone 1 (C2 - 65.4Hz)
      const drone = ctx.createOscillator();
      drone.type = "sawtooth";
      drone.frequency.setValueAtTime(65.4, ctx.currentTime);
      drone.connect(filter);
      drone.start();
      droneOscRef.current = drone;

      // Detuned Sawtooth Cyberpunk Drone 2 (G2 - 98Hz)
      const drone2 = ctx.createOscillator();
      drone2.type = "sawtooth";
      drone2.frequency.setValueAtTime(98.0, ctx.currentTime);
      drone2.detune.setValueAtTime(12, ctx.currentTime);
      drone2.connect(filter);
      drone2.start();
      droneOsc2Ref.current = drone2;

      // Procedural Noise Generator (Cosmic Atmospheric Wind)
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11;
        b6 = white * 0.115926;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.18, ctx.currentTime);
      noise.connect(noiseGain);
      noiseGain.connect(filter);
      noise.start();
      noiseNodeRef.current = noise;

      setAudioEnabled(true);

      // Start Heartbeat Pulse (Every 1.3s -> 46 BPM)
      const playHeartbeat = () => {
        if (!audioCtxRef.current || audioCtxRef.current.state !== "running") return;
        const now = audioCtxRef.current.currentTime;

        // Double heartbeat thump (lub-dub)
        const kick1 = audioCtxRef.current.createOscillator();
        kick1.type = "sine";
        kick1.frequency.setValueAtTime(90, now);
        kick1.frequency.exponentialRampToValueAtTime(30, now + 0.12);

        const kickGain = audioCtxRef.current.createGain();
        kickGain.gain.setValueAtTime(0.5, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        kick1.connect(kickGain);
        kickGain.connect(master);
        kick1.start(now);
        kick1.stop(now + 0.16);

        // Second pulse 0.18s later
        const kick2 = audioCtxRef.current.createOscillator();
        kick2.type = "sine";
        kick2.frequency.setValueAtTime(75, now + 0.18);
        kick2.frequency.exponentialRampToValueAtTime(25, now + 0.3);

        const kickGain2 = audioCtxRef.current.createGain();
        kickGain2.gain.setValueAtTime(0.35, now + 0.18);
        kickGain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

        kick2.connect(kickGain2);
        kickGain2.connect(master);
        kick2.start(now + 0.18);
        kick2.stop(now + 0.33);
      };

      heartbeatTimerRef.current = setInterval(playHeartbeat, 1300);

    } catch (err) {
      console.warn("Web Audio initialization error:", err);
    }
  }, []);

  // Update audio parameters in real time as progress increases (0 -> 100)
  const setProgress = useCallback((progress: number) => {
    if (!audioCtxRef.current || audioCtxRef.current.state !== "running") return;
    const ctx = audioCtxRef.current;
    const norm = Math.min(Math.max(progress / 100, 0), 1);
    const now = ctx.currentTime;

    // Filter frequency opens up from 180Hz to 1200Hz for intense rise
    if (filterRef.current) {
      filterRef.current.frequency.setTargetAtTime(180 + norm * 1020, now, 0.1);
    }

    // Sub-bass pitch increases slightly
    if (subOscRef.current) {
      subOscRef.current.frequency.setTargetAtTime(32 + norm * 20, now, 0.1);
    }

    // Play cyber blip note on milestones
    if (norm > 0.2 && Math.random() < 0.05) {
      const blip = ctx.createOscillator();
      blip.type = "sine";
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25];
      const freq = notes[Math.floor(Math.random() * notes.length)];
      blip.frequency.setValueAtTime(freq, now);

      const blipGain = ctx.createGain();
      blipGain.gain.setValueAtTime(0.08 * norm, now);
      blipGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      blip.connect(blipGain);
      blipGain.connect(masterGainRef.current || ctx.destination);
      blip.start(now);
      blip.stop(now + 0.11);
    }
  }, []);

  // Trigger cinematic dimensional breach sound
  const triggerTear = useCallback(() => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;

    try {
      // 1. Massive Sub-Bass Drop (Singularity collapse)
      const singularity = ctx.createOscillator();
      singularity.type = "sine";
      singularity.frequency.setValueAtTime(200, now);
      singularity.frequency.exponentialRampToValueAtTime(15, now + 1.2);

      const singularityGain = ctx.createGain();
      singularityGain.gain.setValueAtTime(1.2, now);
      singularityGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

      singularity.connect(singularityGain);
      singularityGain.connect(ctx.destination);
      singularity.start(now);
      singularity.stop(now + 1.6);

      // 2. White Noise Shockwave (Spacetime fabric tearing)
      const bufferSize = ctx.sampleRate * 1.0;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const t = i / bufferSize;
        data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 3) * (1 + Math.sin(t * 50) * 0.3);
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.8, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

      // Bandpass filter for "tear" frequency
      const tearFilter = ctx.createBiquadFilter();
      tearFilter.type = "bandpass";
      tearFilter.frequency.setValueAtTime(3000, now);
      tearFilter.frequency.exponentialRampToValueAtTime(800, now + 0.8);
      tearFilter.Q.setValueAtTime(5, now);

      noise.connect(tearFilter);
      tearFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);

      // 3. Crystal shatter high frequencies
      const shatter = ctx.createOscillator();
      shatter.type = "sawtooth";
      shatter.frequency.setValueAtTime(4000, now);
      shatter.frequency.exponentialRampToValueAtTime(8000, now + 0.3);
      shatter.frequency.exponentialRampToValueAtTime(2000, now + 0.8);

      const shatterGain = ctx.createGain();
      shatterGain.gain.setValueAtTime(0.15, now);
      shatterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      const shatterFilter = ctx.createBiquadFilter();
      shatterFilter.type = "highpass";
      shatterFilter.frequency.setValueAtTime(2000, now);

      shatter.connect(shatterFilter);
      shatterFilter.connect(shatterGain);
      shatterGain.connect(ctx.destination);
      shatter.start(now);
      shatter.stop(now + 1.0);

      // 4. Dimensional "whoosh" as breach opens
      const whoosh = ctx.createOscillator();
      whoosh.type = "sine";
      whoosh.frequency.setValueAtTime(80, now + 0.2);
      whoosh.frequency.exponentialRampToValueAtTime(600, now + 0.6);
      whoosh.frequency.exponentialRampToValueAtTime(40, now + 1.5);

      const whooshGain = ctx.createGain();
      whooshGain.gain.setValueAtTime(0, now + 0.2);
      whooshGain.gain.linearRampToValueAtTime(0.4, now + 0.5);
      whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

      whoosh.connect(whooshGain);
      whooshGain.connect(ctx.destination);
      whoosh.start(now + 0.2);
      whoosh.stop(now + 1.6);

      // 5. Stop background drone gradually
      if (masterGainRef.current) {
        masterGainRef.current.gain.setTargetAtTime(0.001, now + 0.5, 0.8);
      }
    } catch (e) {
      console.warn("Error playing breach sound:", e);
    }
  }, []);

  const stop = useCallback(() => {
    if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch {}
    }
    setAudioEnabled(false);
  }, []);

  useEffect(() => {
    const handleUserGesture = () => {
      initAudio();
      window.removeEventListener("click", handleUserGesture);
      window.removeEventListener("keydown", handleUserGesture);
      window.removeEventListener("touchstart", handleUserGesture);
    };

    window.addEventListener("click", handleUserGesture);
    window.addEventListener("keydown", handleUserGesture);
    window.addEventListener("touchstart", handleUserGesture);

    return () => {
      window.removeEventListener("click", handleUserGesture);
      window.removeEventListener("keydown", handleUserGesture);
      window.removeEventListener("touchstart", handleUserGesture);
      stop();
    };
  }, [initAudio, stop]);

  return { audioEnabled, initAudio, setProgress, triggerTear, stop };
}