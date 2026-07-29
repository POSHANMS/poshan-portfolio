"use client";

import { useEffect, useRef, useCallback, useState } from "react";

/**
 * ═══════════════════════════════════════════════════════════════════════
 * CINEMATIC AUDIO ENGINE — Detonation Blast & Sub-Bass Impact
 * 
 * Timeline Map:
 *   0:00 - 0:02.5 : Ambient dark sci-fi synth drone & 60Hz hum
 *   0:02.5 - 0:03.0: Anti-gravity suction riser sweep
 *   0:03.0 - 0:03.1: 50ms vacuum silence gap (builds extreme tension)
 *   0:03.1         : DETONATION MOMENT — 42Hz sub-bass drop punch,
 *                    metallic shockwave shatter & Dune horn swell
 *   0:03.1 - 0:06.0: Wide stereo atmospheric reverb tail fading over 3s
 * ═══════════════════════════════════════════════════════════════════════
 */

export function useSuspenseAudio() {
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Audio Busses & Nodes
  const masterGainRef = useRef<GainNode | null>(null);
  const convolverRef = useRef<ConvolverNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const subOscRef = useRef<OscillatorNode | null>(null);
  const droneOscRef = useRef<OscillatorNode | null>(null);
  const droneOsc2Ref = useRef<OscillatorNode | null>(null);
  const riserOscRef = useRef<OscillatorNode | null>(null);
  const riserGainRef = useRef<GainNode | null>(null);
  const noiseNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isTearingRef = useRef(false);

  // CRT monitor boot sound
  const playCRTBootSound = useCallback((ctx: AudioContext, destination: AudioNode) => {
    const now = ctx.currentTime;
    const hum = ctx.createOscillator();
    hum.type = "sawtooth";
    hum.frequency.setValueAtTime(60, now);
    hum.frequency.exponentialRampToValueAtTime(140, now + 1.2);

    const humFilter = ctx.createBiquadFilter();
    humFilter.type = "lowpass";
    humFilter.frequency.setValueAtTime(250, now);
    humFilter.frequency.exponentialRampToValueAtTime(800, now + 0.8);
    humFilter.frequency.exponentialRampToValueAtTime(150, now + 1.5);

    const humGain = ctx.createGain();
    humGain.gain.setValueAtTime(0.001, now);
    humGain.gain.linearRampToValueAtTime(0.45, now + 0.15);
    humGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    hum.connect(humFilter);
    humFilter.connect(humGain);
    humGain.connect(destination);

    hum.start(now);
    hum.stop(now + 1.5);
  }, []);

  // UI cursor plink sound
  const playCursorPlink = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state !== "running") return;
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;

    const plink = ctx.createOscillator();
    plink.type = "sine";
    const notes = [1046.50, 1318.51, 1567.98, 2093.00];
    const freq = notes[Math.floor(Math.random() * notes.length)];
    plink.frequency.setValueAtTime(freq, now);
    plink.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.1);

    const plinkGain = ctx.createGain();
    plinkGain.gain.setValueAtTime(0.12, now);
    plinkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    plink.connect(plinkGain);
    plinkGain.connect(masterGainRef.current || ctx.destination);

    plink.start(now);
    plink.stop(now + 0.11);
  }, []);

  // ASMR Cyberpunk Keystroke Sound (Lubed mechanical thock + binaural pan)
  const playTypingKeystrokeSound = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state !== "running") return;
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;

    const thock = ctx.createOscillator();
    thock.type = "sine";
    thock.frequency.setValueAtTime(320 + Math.random() * 80, now);
    thock.frequency.exponentialRampToValueAtTime(140, now + 0.04);

    const thockGain = ctx.createGain();
    thockGain.gain.setValueAtTime(0.18, now);
    thockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    const click = ctx.createOscillator();
    click.type = "triangle";
    click.frequency.setValueAtTime(3500 + Math.random() * 1000, now);
    click.frequency.exponentialRampToValueAtTime(800, now + 0.02);

    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.08, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (panner) {
      panner.pan.setValueAtTime((Math.random() - 0.5) * 0.4, now);
      thock.connect(thockGain);
      click.connect(clickGain);
      thockGain.connect(panner);
      clickGain.connect(panner);
      panner.connect(masterGainRef.current || ctx.destination);
    } else {
      thock.connect(thockGain);
      click.connect(clickGain);
      thockGain.connect(masterGainRef.current || ctx.destination);
      clickGain.connect(masterGainRef.current || ctx.destination);
    }

    thock.start(now);
    thock.stop(now + 0.051);
    click.start(now);
    click.stop(now + 0.026);
  }, []);

  // Enter Lock-in Mechanical Thud
  const playEnterPunchSound = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state !== "running") return;
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;

    const thud = ctx.createOscillator();
    thud.type = "sine";
    thud.frequency.setValueAtTime(140, now);
    thud.frequency.exponentialRampToValueAtTime(40, now + 0.15);

    const thudGain = ctx.createGain();
    thudGain.gain.setValueAtTime(0.45, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    thud.connect(thudGain);
    thudGain.connect(masterGainRef.current || ctx.destination);
    thud.start(now);
    thud.stop(now + 0.21);
  }, []);

  // INIT Audio Context & Ambient Drones
  const initAudio = useCallback(() => {
    if (audioCtxRef.current && audioCtxRef.current.state === "running") return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const master = ctx.createGain();
      master.gain.setValueAtTime(0.38, ctx.currentTime);
      master.connect(ctx.destination);
      masterGainRef.current = master;

      // Stereo Convolver Reverb
      const convolver = ctx.createConvolver();
      const reverbLength = ctx.sampleRate * 3.5;
      const reverbBuffer = ctx.createBuffer(2, reverbLength, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const data = reverbBuffer.getChannelData(ch);
        for (let i = 0; i < reverbLength; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / reverbLength, 2.2) * 0.35;
        }
      }
      convolver.buffer = reverbBuffer;
      convolver.connect(master);
      convolverRef.current = convolver;

      playCRTBootSound(ctx, master);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(180, ctx.currentTime);
      filter.Q.setValueAtTime(3.5, ctx.currentTime);
      filter.connect(master);
      filterRef.current = filter;

      // 30Hz Sub-Bass Chest Rumble
      const sub = ctx.createOscillator();
      sub.type = "sine";
      sub.frequency.setValueAtTime(30, ctx.currentTime);
      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0.45, ctx.currentTime);
      sub.connect(subGain);
      subGain.connect(master);
      sub.start();
      subOscRef.current = sub;

      // Mechanical Drones (60Hz & 98Hz)
      const drone = ctx.createOscillator();
      drone.type = "sawtooth";
      drone.frequency.setValueAtTime(60.0, ctx.currentTime);
      drone.connect(filter);
      drone.start();
      droneOscRef.current = drone;

      const drone2 = ctx.createOscillator();
      drone2.type = "sawtooth";
      drone2.frequency.setValueAtTime(98.0, ctx.currentTime);
      drone2.detune.setValueAtTime(12, ctx.currentTime);
      drone2.connect(filter);
      drone2.start();
      droneOsc2Ref.current = drone2;

      // Anti-Gravity Suction Riser
      const riser = ctx.createOscillator();
      riser.type = "sine";
      riser.frequency.setValueAtTime(100, ctx.currentTime);

      const riserGain = ctx.createGain();
      riserGain.gain.setValueAtTime(0.001, ctx.currentTime);
      riser.connect(riserGain);
      riserGain.connect(master);
      riser.start();
      riserOscRef.current = riser;
      riserGainRef.current = riserGain;

      // Matrix Rain Static
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
        output[i] *= 0.10;
        b6 = white * 0.115926;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;

      const rainFilter = ctx.createBiquadFilter();
      rainFilter.type = "highpass";
      rainFilter.frequency.setValueAtTime(2500, ctx.currentTime);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.14, ctx.currentTime);

      noise.connect(rainFilter);
      rainFilter.connect(noiseGain);
      noiseGain.connect(master);
      noise.start();
      noiseNodeRef.current = noise;

      setAudioEnabled(true);

      // Heartbeat pulse (40 BPM)
      const playHeartbeat = () => {
        if (!audioCtxRef.current || audioCtxRef.current.state !== "running") return;
        const now = audioCtxRef.current.currentTime;

        const kick1 = audioCtxRef.current.createOscillator();
        kick1.type = "sine";
        kick1.frequency.setValueAtTime(90, now);
        kick1.frequency.exponentialRampToValueAtTime(30, now + 0.12);

        const kickGain = audioCtxRef.current.createGain();
        kickGain.gain.setValueAtTime(0.48, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        kick1.connect(kickGain);
        kickGain.connect(master);
        kick1.start(now);
        kick1.stop(now + 0.16);

        const kick2 = audioCtxRef.current.createOscillator();
        kick2.type = "sine";
        kick2.frequency.setValueAtTime(75, now + 0.18);
        kick2.frequency.exponentialRampToValueAtTime(25, now + 0.3);

        const kickGain2 = audioCtxRef.current.createGain();
        kickGain2.gain.setValueAtTime(0.32, now + 0.18);
        kickGain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

        kick2.connect(kickGain2);
        kickGain2.connect(master);
        kick2.start(now + 0.18);
        kick2.stop(now + 0.33);
      };

      heartbeatTimerRef.current = setInterval(playHeartbeat, 1500);

    } catch (err) {
      console.warn("Web Audio initialization error:", err);
    }
  }, [playCRTBootSound]);

  // Modulate suction riser during progress (0% -> 100%)
  const setProgress = useCallback((progress: number) => {
    if (!audioCtxRef.current || audioCtxRef.current.state !== "running") return;
    const ctx = audioCtxRef.current;
    const norm = Math.min(Math.max(progress / 100, 0), 1);
    const now = ctx.currentTime;

    if (filterRef.current) {
      filterRef.current.frequency.setTargetAtTime(180 + norm * 1400, now, 0.1);
    }

    if (subOscRef.current) {
      subOscRef.current.frequency.setTargetAtTime(30 + norm * 20, now, 0.1);
    }

    // Vacuum Riser Accelerates exponentially toward 100%
    if (riserOscRef.current && riserGainRef.current) {
      const riserFreq = 100 + Math.pow(norm, 3.5) * 1200;
      const riserVol = norm > 0.6 ? (norm - 0.6) * 1.8 : 0;
      riserOscRef.current.frequency.setTargetAtTime(riserFreq, now, 0.05);
      riserGainRef.current.gain.setTargetAtTime(Math.min(0.55, riserVol), now, 0.05);
    }

    if (norm > 0.15 && Math.random() < 0.04) {
      playCursorPlink();
    }
  }, [playCursorPlink]);

  // TRIGGER TEAR — 50ms Silence Gap & Detonation Impact
  const triggerTear = useCallback(() => {
    if (!audioCtxRef.current || isTearingRef.current) return;
    isTearingRef.current = true;

    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;

    try {
      // 50ms Ultra-brief Vacuum Silence Gap
      if (masterGainRef.current) {
        masterGainRef.current.gain.cancelScheduledValues(now);
        masterGainRef.current.gain.setValueAtTime(0.001, now);
        masterGainRef.current.gain.linearRampToValueAtTime(0.0001, now + 0.05);
      }

      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }

      // Detonation moment: 50ms after vacuum gap
      const blastTime = now + 0.05;

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-14, blastTime);
      compressor.knee.setValueAtTime(4, blastTime);
      compressor.ratio.setValueAtTime(14, blastTime);
      compressor.attack.setValueAtTime(0.002, blastTime);
      compressor.release.setValueAtTime(0.12, blastTime);
      compressor.connect(ctx.destination);

      const breachMaster = ctx.createGain();
      breachMaster.gain.setValueAtTime(1.0, blastTime);
      breachMaster.gain.exponentialRampToValueAtTime(0.001, blastTime + 4.0);
      breachMaster.connect(compressor);

      // Heavy 42Hz Sub-Bass Impact Punch
      const subDrop = ctx.createOscillator();
      subDrop.type = "sine";
      subDrop.frequency.setValueAtTime(180, blastTime);
      subDrop.frequency.exponentialRampToValueAtTime(42, blastTime + 0.06);
      subDrop.frequency.exponentialRampToValueAtTime(22, blastTime + 1.2);

      const subDropGain = ctx.createGain();
      subDropGain.gain.setValueAtTime(1.0, blastTime);
      subDropGain.gain.exponentialRampToValueAtTime(0.001, blastTime + 3.0);

      subDrop.connect(subDropGain);
      subDropGain.connect(breachMaster);
      subDrop.start(blastTime);
      subDrop.stop(blastTime + 3.1);

      // Metallic Shockwave Shatter
      const slash = ctx.createOscillator();
      slash.type = "sawtooth";
      slash.frequency.setValueAtTime(5200, blastTime);
      slash.frequency.exponentialRampToValueAtTime(9800, blastTime + 0.12);
      slash.frequency.exponentialRampToValueAtTime(1400, blastTime + 0.6);

      const slashFilter = ctx.createBiquadFilter();
      slashFilter.type = "highpass";
      slashFilter.frequency.setValueAtTime(2500, blastTime);

      const slashGain = ctx.createGain();
      slashGain.gain.setValueAtTime(0.50, blastTime);
      slashGain.gain.exponentialRampToValueAtTime(0.001, blastTime + 0.65);

      slash.connect(slashFilter);
      slashFilter.connect(slashGain);
      slashGain.connect(breachMaster);
      slash.start(blastTime);
      slash.stop(blastTime + 0.68);

      // Shockwave Noise Burst
      const shockLen = Math.floor(ctx.sampleRate * 0.5);
      const shockBuf = ctx.createBuffer(1, shockLen, ctx.sampleRate);
      const shockData = shockBuf.getChannelData(0);
      for (let i = 0; i < shockLen; i++) {
        const t = i / shockLen;
        shockData[i] = (Math.random() * 2 - 1) * Math.exp(-t * 5);
      }
      const shockSrc = ctx.createBufferSource();
      shockSrc.buffer = shockBuf;

      const shockFilter = ctx.createBiquadFilter();
      shockFilter.type = "bandpass";
      shockFilter.frequency.setValueAtTime(3200, blastTime);
      shockFilter.frequency.exponentialRampToValueAtTime(300, blastTime + 0.4);
      shockFilter.Q.setValueAtTime(3.0, blastTime);

      const shockGain = ctx.createGain();
      shockGain.gain.setValueAtTime(0.70, blastTime);
      shockGain.gain.exponentialRampToValueAtTime(0.001, blastTime + 0.5);

      shockSrc.connect(shockFilter);
      shockFilter.connect(shockGain);
      shockGain.connect(breachMaster);
      shockSrc.start(blastTime);

      // Dune Horn Swell
      const horn1 = ctx.createOscillator();
      const horn2 = ctx.createOscillator();
      horn1.type = "sawtooth";
      horn2.type = "sawtooth";

      horn1.frequency.setValueAtTime(110, blastTime);
      horn1.frequency.exponentialRampToValueAtTime(55, blastTime + 1.5);
      horn2.frequency.setValueAtTime(110.8, blastTime);
      horn2.frequency.exponentialRampToValueAtTime(55.4, blastTime + 1.5);

      const hornFilter = ctx.createBiquadFilter();
      hornFilter.type = "lowpass";
      hornFilter.Q.setValueAtTime(5.5, blastTime);
      hornFilter.frequency.setValueAtTime(160, blastTime);
      hornFilter.frequency.exponentialRampToValueAtTime(1800, blastTime + 0.1);
      hornFilter.frequency.exponentialRampToValueAtTime(220, blastTime + 2.0);

      const hornGain = ctx.createGain();
      hornGain.gain.setValueAtTime(0.001, blastTime);
      hornGain.gain.linearRampToValueAtTime(0.75, blastTime + 0.03);
      hornGain.gain.exponentialRampToValueAtTime(0.001, blastTime + 3.0);

      horn1.connect(hornFilter);
      horn2.connect(hornFilter);
      hornFilter.connect(hornGain);
      hornGain.connect(breachMaster);

      horn1.start(blastTime);
      horn2.start(blastTime);
      horn1.stop(blastTime + 3.1);
      horn2.stop(blastTime + 3.1);

      // Reverb Tail
      const bell1 = ctx.createOscillator();
      const bell2 = ctx.createOscillator();
      bell1.type = "sine";
      bell2.type = "sine";

      bell1.frequency.setValueAtTime(440, blastTime + 0.12);
      bell2.frequency.setValueAtTime(880, blastTime + 0.16);

      const bellGain = ctx.createGain();
      bellGain.gain.setValueAtTime(0, blastTime + 0.12);
      bellGain.gain.linearRampToValueAtTime(0.35, blastTime + 0.35);
      bellGain.gain.exponentialRampToValueAtTime(0.001, blastTime + 3.5);

      const targetDest = convolverRef.current || breachMaster;
      bell1.connect(bellGain);
      bell2.connect(bellGain);
      bellGain.connect(targetDest);
      hornGain.connect(targetDest);

      bell1.start(blastTime + 0.12);
      bell2.start(blastTime + 0.16);
      bell1.stop(blastTime + 3.6);
      bell2.stop(blastTime + 3.6);

      setTimeout(() => {
        try { compressor.disconnect(); } catch {}
        try { breachMaster.disconnect(); } catch {}
      }, 5000);

    } catch (e) {
      console.warn("Error playing detonation blast sound:", e);
    }
  }, []);

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

  return { audioEnabled, initAudio, setProgress, triggerTear, stop, playCursorPlink, playTypingKeystrokeSound, playEnterPunchSound };
}