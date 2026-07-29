"use client";

import { useEffect, useRef, useCallback, useState } from "react";

/**
 * ═══════════════════════════════════════════════════════════════════════
 * CINEMATIC AUDIO SYSTEM — Principal Audio Engineer Edition
 * 
 * Architecture:
 *   [AudioContext]
 *       │
 *       ├── [Ambient Bus] ──→ [Master Gain 0.35] ──→ [Reverb] ──→ [Destination]
 *       │       ↑
 *       │   Sub-bass · Dual Saw Drones · Filtered Wind · Heartbeat
 *       │
 *       └── [Breach Bus] ──→ [Dynamics Compressor] ──→ [Destination]
 *               ↑
 *           Void Implosion · Shockwave · Crystal Shatter ·
 *           Gravitational Whoosh · Singularity Bell · Sub Rumble
 * 
 * ElevenLabs-inspired layers:
 *   1. void_rumble_30hz        → Ambient sub-bass + Breach implosion
 *   2. dimensional_slash_slice → Crystal shatter high-freq
 *   3. shockwave_implosion     → Bandpassed noise shockwave
 *   4. wormhole_gravitational_riser → Whoosh sweep
 *   5. awakening_crystal_bell  → 440Hz + 880Hz harmonic tail
 * ═══════════════════════════════════════════════════════════════════════
 */

export function useSuspenseAudio() {
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Ambient nodes
  const masterGainRef = useRef<GainNode | null>(null);
  const subOscRef = useRef<OscillatorNode | null>(null);
  const droneOscRef = useRef<OscillatorNode | null>(null);
  const droneOsc2Ref = useRef<OscillatorNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const noiseNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const convolverRef = useRef<ConvolverNode | null>(null);

  // Breach guard to prevent double-trigger
  const isTearingRef = useRef(false);

  // ═════════════════════════════════════════════════════════════════
  // INIT — Ambient cyberpunk soundscape
  // ═════════════════════════════════════════════════════════════════
  const initAudio = useCallback(() => {
    if (audioCtxRef.current && audioCtxRef.current.state === "running") return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      // ── Master Gain ──
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.35, ctx.currentTime);
      master.connect(ctx.destination);
      masterGainRef.current = master;

      // ── Convolution Reverb (Space ambience) ──
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

      // ── Lowpass Filter (Suspense wobble) ──
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(180, ctx.currentTime);
      filter.Q.setValueAtTime(4, ctx.currentTime);
      filter.connect(master);
      filterRef.current = filter;

      // ── Sub-Bass 30Hz Oscillator (Chest Rumble) ──
      const sub = ctx.createOscillator();
      sub.type = "sine";
      sub.frequency.setValueAtTime(32, ctx.currentTime);
      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0.4, ctx.currentTime);
      sub.connect(subGain);
      subGain.connect(master);
      sub.start();
      subOscRef.current = sub;

      // ── Sawtooth Cyberpunk Drone 1 (C2 ≈ 65.4Hz) ──
      const drone = ctx.createOscillator();
      drone.type = "sawtooth";
      drone.frequency.setValueAtTime(65.4, ctx.currentTime);
      drone.connect(filter);
      drone.start();
      droneOscRef.current = drone;

      // ── Detuned Sawtooth Drone 2 (G2 ≈ 98Hz) ──
      const drone2 = ctx.createOscillator();
      drone2.type = "sawtooth";
      drone2.frequency.setValueAtTime(98.0, ctx.currentTime);
      drone2.detune.setValueAtTime(12, ctx.currentTime);
      drone2.connect(filter);
      drone2.start();
      droneOsc2Ref.current = drone2;

      // ── Procedural Pink Noise (Cosmic Wind) ──
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

      // ── Heartbeat Pulse (Every 1.3s → ~46 BPM) ──
      const playHeartbeat = () => {
        if (!audioCtxRef.current || audioCtxRef.current.state !== "running") return;
        const now = audioCtxRef.current.currentTime;

        // Lub-dub double thump
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

  // ═════════════════════════════════════════════════════════════════
  // PROGRESS MODULATION — Tension rises as loader fills
  // ═════════════════════════════════════════════════════════════════
  const setProgress = useCallback((progress: number) => {
    if (!audioCtxRef.current || audioCtxRef.current.state !== "running") return;
    const ctx = audioCtxRef.current;
    const norm = Math.min(Math.max(progress / 100, 0), 1);
    const now = ctx.currentTime;

    // Filter opens from 180Hz → 1200Hz for intense rise
    if (filterRef.current) {
      filterRef.current.frequency.setTargetAtTime(180 + norm * 1020, now, 0.1);
    }

    // Sub-bass pitch increases slightly
    if (subOscRef.current) {
      subOscRef.current.frequency.setTargetAtTime(32 + norm * 20, now, 0.1);
    }

    // Cyber blips on milestones
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

  // ═════════════════════════════════════════════════════════════════
  // TRIGGER TEAR — Cinematic Dimensional Breach (OVERKILL EDITION)
  // 
  // Layer map (all times relative to trigger call):
  //   0.00s ─┬─ Void Implosion      (sub-bass drop, 0.85 gain)
  //          ├─ Shockwave           (bandpassed noise, 0.75 gain)
  //          ├─ Crystal Shatter     (high-freq saw sweep, 0.25 gain)
  //          └─ Sub Rumble Layer    (28Hz physical thump, 0.6 gain)
  //   0.15s ── Gravitational Whoosh (sine sweep, peaks 0.55)
  //   0.40s ── Singularity Bell     (440Hz + 880Hz, peaks 0.35)
  // ═════════════════════════════════════════════════════════════════
  const triggerTear = useCallback(() => {
    if (!audioCtxRef.current || isTearingRef.current) return;
    isTearingRef.current = true;

    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;

    try {
      // ── BREACH BUS: Compressor prevents clipping on 6+ layers ──
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-12, now);
      compressor.knee.setValueAtTime(6, now);
      compressor.ratio.setValueAtTime(12, now);
      compressor.attack.setValueAtTime(0.003, now);
      compressor.release.setValueAtTime(0.1, now);
      compressor.connect(ctx.destination);

      const breachMaster = ctx.createGain();
      breachMaster.gain.setValueAtTime(0.95, now);
      breachMaster.gain.exponentialRampToValueAtTime(0.001, now + 4.5);
      breachMaster.connect(compressor);

      // ═════════════════════════════════════════════════════════════
      // LAYER 1: VOID IMPLOSION (0s – 1.6s)
      // ElevenLabs: "Deep sub-bass rumble, underground dormant engine
      // awakening, 30Hz sine wave, pure low-end bass felt in chest"
      // ═════════════════════════════════════════════════════════════
      const implosion = ctx.createOscillator();
      implosion.type = "sine";
      implosion.frequency.setValueAtTime(60, now);
      implosion.frequency.exponentialRampToValueAtTime(15, now + 1.2);

      const implosionGain = ctx.createGain();
      implosionGain.gain.setValueAtTime(0.85, now);        // IMMEDIATE HIT
      implosionGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

      implosion.connect(implosionGain);
      implosionGain.connect(breachMaster);
      implosion.start(now);
      implosion.stop(now + 1.6);

      // ═════════════════════════════════════════════════════════════
      // LAYER 2: SHOCKWAVE (0s – 1.2s)
      // ElevenLabs: "Cosmic implosion bass drop, digital overload
      // explosion, heavy sub-bass burst with white noise flare"
      // ═════════════════════════════════════════════════════════════
      const shockBufferSize = ctx.sampleRate * 1.2;
      const shockBuffer = ctx.createBuffer(1, shockBufferSize, ctx.sampleRate);
      const shockData = shockBuffer.getChannelData(0);
      for (let i = 0; i < shockBufferSize; i++) {
        const t = i / shockBufferSize;
        // Ringing decay + noise = "spacetime fabric tearing"
        shockData[i] = (Math.random() * 2 - 1) * Math.exp(-t * 4) * (1 + Math.sin(t * 60) * 0.4);
      }

      const shockwave = ctx.createBufferSource();
      shockwave.buffer = shockBuffer;

      const shockFilter = ctx.createBiquadFilter();
      shockFilter.type = "bandpass";
      shockFilter.frequency.setValueAtTime(2500, now);
      shockFilter.frequency.exponentialRampToValueAtTime(600, now + 0.8);
      shockFilter.Q.setValueAtTime(4, now);

      const shockGain = ctx.createGain();
      shockGain.gain.setValueAtTime(0.75, now);           // LOUD
      shockGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

      shockwave.connect(shockFilter);
      shockFilter.connect(shockGain);
      shockGain.connect(breachMaster);
      shockwave.start(now);

      // ═════════════════════════════════════════════════════════════
      // LAYER 3: CRYSTAL SHATTER (0s – 1.0s)
      // ElevenLabs: "Dimensional razor slash, sharp metallic blade
      // cutting through reality, high-frequency friction slice"
      // ═════════════════════════════════════════════════════════════
      const shatter = ctx.createOscillator();
      shatter.type = "sawtooth";
      shatter.frequency.setValueAtTime(4000, now);
      shatter.frequency.exponentialRampToValueAtTime(8000, now + 0.25);
      shatter.frequency.exponentialRampToValueAtTime(2000, now + 0.8);

      const shatterGain = ctx.createGain();
      shatterGain.gain.setValueAtTime(0.25, now);
      shatterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      const shatterFilter = ctx.createBiquadFilter();
      shatterFilter.type = "highpass";
      shatterFilter.frequency.setValueAtTime(2000, now);

      shatter.connect(shatterFilter);
      shatterFilter.connect(shatterGain);
      shatterGain.connect(breachMaster);
      shatter.start(now);
      shatter.stop(now + 1.0);

      // ═════════════════════════════════════════════════════════════
      // LAYER 4: GRAVITATIONAL WHOOSH (0.15s – 2.0s)
      // ElevenLabs: "Interstellar gravitational riser, synth pitch
      // bending upward, energy core overcharging"
      // ═════════════════════════════════════════════════════════════
      const whoosh = ctx.createOscillator();
      whoosh.type = "sine";
      whoosh.frequency.setValueAtTime(80, now + 0.15);
      whoosh.frequency.exponentialRampToValueAtTime(600, now + 0.6);
      whoosh.frequency.exponentialRampToValueAtTime(40, now + 1.8);

      const whooshGain = ctx.createGain();
      whooshGain.gain.setValueAtTime(0, now + 0.15);
      whooshGain.gain.linearRampToValueAtTime(0.55, now + 0.5);
      whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      whoosh.connect(whooshGain);
      whooshGain.connect(breachMaster);
      whoosh.start(now + 0.15);
      whoosh.stop(now + 2.0);

      // ═════════════════════════════════════════════════════════════
      // LAYER 5: SINGULARITY BELL (0.4s – 4.2s)
      // ElevenLabs: "Single crystal bell chime, 440Hz pure tone,
      // ethereal space chime, long lush reverb decay tail"
      // ═════════════════════════════════════════════════════════════
      const bell = ctx.createOscillator();
      bell.type = "sine";
      bell.frequency.setValueAtTime(440, now + 0.4);
      bell.frequency.exponentialRampToValueAtTime(880, now + 1.2);

      const bellGain = ctx.createGain();
      bellGain.gain.setValueAtTime(0, now + 0.4);
      bellGain.gain.linearRampToValueAtTime(0.35, now + 0.7);
      bellGain.gain.exponentialRampToValueAtTime(0.001, now + 4.0);

      // Second harmonic for richness
      const bell2 = ctx.createOscillator();
      bell2.type = "sine";
      bell2.frequency.setValueAtTime(880, now + 0.5);
      bell2.frequency.exponentialRampToValueAtTime(1760, now + 1.5);

      const bell2Gain = ctx.createGain();
      bell2Gain.gain.setValueAtTime(0, now + 0.5);
      bell2Gain.gain.linearRampToValueAtTime(0.18, now + 0.9);
      bell2Gain.gain.exponentialRampToValueAtTime(0.001, now + 3.5);

      // Route through convolver for space reverb if available
      const wetDest = convolverRef.current || breachMaster;

      bell.connect(bellGain);
      bellGain.connect(wetDest);
      bell.start(now + 0.4);
      bell.stop(now + 4.2);

      bell2.connect(bell2Gain);
      bell2Gain.connect(wetDest);
      bell2.start(now + 0.5);
      bell2.stop(now + 3.7);

      // ═════════════════════════════════════════════════════════════
      // LAYER 6: SUB RUMBLE LAYER (0s – 3.2s)
      // Physical chest-thumping layer, 25-32Hz
      // ═════════════════════════════════════════════════════════════
      const subRumble = ctx.createOscillator();
      subRumble.type = "sine";
      subRumble.frequency.setValueAtTime(28, now);
      subRumble.frequency.linearRampToValueAtTime(32, now + 2);

      const subRumbleGain = ctx.createGain();
      subRumbleGain.gain.setValueAtTime(0.6, now);        // PHYSICAL
      subRumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 3);

      const subFilter = ctx.createBiquadFilter();
      subFilter.type = "lowpass";
      subFilter.frequency.setValueAtTime(60, now);

      subRumble.connect(subFilter);
      subFilter.connect(subRumbleGain);
      subRumbleGain.connect(breachMaster);
      subRumble.start(now);
      subRumble.stop(now + 3.2);

      // ═════════════════════════════════════════════════════════════
      // KILL AMBIENT — Don't let drone mask the breach
      // ═════════════════════════════════════════════════════════════
      if (masterGainRef.current) {
        masterGainRef.current.gain.cancelScheduledValues(now);
        masterGainRef.current.gain.setTargetAtTime(0.001, now + 0.2, 0.4);
      }

      // Stop heartbeat immediately
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }

      // Cleanup breach nodes after 6 seconds
      setTimeout(() => {
        try { compressor.disconnect(); } catch {}
        try { breachMaster.disconnect(); } catch {}
      }, 6000);

    } catch (e) {
      console.warn("Error playing breach sound:", e);
    }
  }, []);

  // ═════════════════════════════════════════════════════════════════
  // STOP — Full system shutdown
  // ═════════════════════════════════════════════════════════════════
  const stop = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch {}
    }
    setAudioEnabled(false);
    isTearingRef.current = false;
  }, []);

  // ═════════════════════════════════════════════════════════════════
  // AUTO-INIT on user gesture
  // ═════════════════════════════════════════════════════════════════
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