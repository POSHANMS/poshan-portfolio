"use client";

import { useEffect, useCallback, useState } from "react";

/**
 * ═══════════════════════════════════════════════════════════════════════
 * GLOBAL PERSISTENT CINEMATIC AUDIO ENGINE
 *
 * Web Audio API Context is a module-level singleton that persists across
 * all route and component changes (Loader → Detonation → Welcome → Hero).
 *
 * Rules:
 *  1. Loader Phase: Plays CRT boot sound, 30Hz sub rumble, mechanical drones,
 *     matrix rain static, heartbeat pulses, and suction riser.
 *  2. Detonation Blast: Triggers sub-bass drop (30Hz–50Hz), metallic shockwave
 *     shatter, Dune horn stab, and crystal reverb tail.
 *  3. LOADER AUDIO TERMINATION: All loader drones & background loops STOP
 *     completely upon detonation.
 *  4. Welcome Screen: Pitch-black background with ONLY ASMR mechanical keyboard
 *     keystroke sounds (+/- 4% pitch variance, gain variance, spacebar thock,
 *     and terminal lock-in thud). NO background drone bleed.
 * ═══════════════════════════════════════════════════════════════════════
 */

// Module-Level Singleton Nodes
let _ctx: AudioContext | null = null;
let _masterGain: GainNode | null = null;
let _ambientGain: GainNode | null = null;
let _convolver: ConvolverNode | null = null;
let _filter: BiquadFilterNode | null = null;
let _subOsc: OscillatorNode | null = null;
let _droneOsc: OscillatorNode | null = null;
let _droneOsc2: OscillatorNode | null = null;
let _riserOsc: OscillatorNode | null = null;
let _riserGain: GainNode | null = null;
let _noiseNode: AudioBufferSourceNode | null = null;
let _heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let _isInitialized = false;
let _isTearing = false;

// Pre-buffered memory assets for 0ms playback latency
let _keycapNoiseBuffer: AudioBuffer | null = null;

function createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.004));
  }
  return buffer;
}

export function useSuspenseAudio() {
  const [audioEnabled, setAudioEnabled] = useState(_isInitialized);

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
    if (!_ctx || _ctx.state !== "running") return;
    const ctx = _ctx;
    const now = ctx.currentTime;

    const plink = ctx.createOscillator();
    plink.type = "sine";
    const notes = [1046.5, 1318.51, 1567.98, 2093.0];
    const freq = notes[Math.floor(Math.random() * notes.length)];
    plink.frequency.setValueAtTime(freq, now);
    plink.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.1);

    const plinkGain = ctx.createGain();
    plinkGain.gain.setValueAtTime(0.12, now);
    plinkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    plink.connect(plinkGain);
    plink.connect(_masterGain || ctx.destination);

    plink.start(now);
    plink.stop(now + 0.11);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // ORGANIC ASMR TYPING ENGINE (PITCH & GAIN VARIANCE + PRE-BUFFERED)
  // ═══════════════════════════════════════════════════════════════════════
  const playTypingKeystrokeSound = useCallback((char?: string, isFinalChar: boolean = false) => {
    if (!_ctx) return;
    if (_ctx.state === "suspended") {
      _ctx.resume();
    }
    const ctx = _ctx;
    const now = ctx.currentTime;

    // Ensure master gain is open for ASMR typing sounds
    if (_masterGain && _masterGain.gain.value < 0.2) {
      _masterGain.gain.cancelScheduledValues(now);
      _masterGain.gain.setValueAtTime(0.5, now);
    }

    // Organic pitch +/- 4% & volume variance
    const pitchFactor = 0.96 + Math.random() * 0.08;
    const gainFactor = 0.85 + Math.random() * 0.15;

    // Special Spacebar Thock (" ")
    if (char === " ") {
      const spaceThock = ctx.createOscillator();
      spaceThock.type = "sine";
      spaceThock.frequency.setValueAtTime((180 + Math.random() * 20) * pitchFactor, now);
      spaceThock.frequency.exponentialRampToValueAtTime(50, now + 0.07);

      const spaceGain = ctx.createGain();
      spaceGain.gain.setValueAtTime(0.55 * gainFactor, now);
      spaceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

      const dest = _masterGain || ctx.destination;
      spaceThock.connect(spaceGain);
      spaceGain.connect(dest);
      spaceThock.start(now);
      spaceThock.stop(now + 0.08);
      return;
    }

    // Heavy Terminal Lock-in Sound on final character
    if (isFinalChar) {
      const lockThud = ctx.createOscillator();
      lockThud.type = "sine";
      lockThud.frequency.setValueAtTime(200, now);
      lockThud.frequency.exponentialRampToValueAtTime(35, now + 0.2);

      const lockGain = ctx.createGain();
      lockGain.gain.setValueAtTime(0.75, now);
      lockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      const lockSnap = ctx.createOscillator();
      lockSnap.type = "sawtooth";
      lockSnap.frequency.setValueAtTime(3200, now);
      lockSnap.frequency.exponentialRampToValueAtTime(500, now + 0.04);

      const snapFilter = ctx.createBiquadFilter();
      snapFilter.type = "lowpass";
      snapFilter.frequency.setValueAtTime(2000, now);

      const snapGain = ctx.createGain();
      snapGain.gain.setValueAtTime(0.4, now);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      const dest = _masterGain || ctx.destination;
      lockThud.connect(lockGain);
      lockSnap.connect(snapFilter);
      snapFilter.connect(snapGain);
      lockGain.connect(dest);
      snapGain.connect(dest);

      lockThud.start(now);
      lockThud.stop(now + 0.23);
      lockSnap.start(now);
      lockSnap.stop(now + 0.055);
      return;
    }

    // Standard Organic Keystroke
    // 1. Deep Mechanical Thock Body
    const thock = ctx.createOscillator();
    thock.type = "sine";
    const baseFreq = (270 + Math.random() * 60) * pitchFactor;
    thock.frequency.setValueAtTime(baseFreq, now);
    thock.frequency.exponentialRampToValueAtTime(105, now + 0.045);

    const thockGain = ctx.createGain();
    thockGain.gain.setValueAtTime(0.4 * gainFactor, now);
    thockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    // 2. Tactile Switch Snap / Click
    const click = ctx.createOscillator();
    click.type = "triangle";
    click.frequency.setValueAtTime((4400 + Math.random() * 800) * pitchFactor, now);
    click.frequency.exponentialRampToValueAtTime(1300, now + 0.018);

    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.28 * gainFactor, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);

    // 3. Pre-buffered Keycap Bottom-out Noise
    let noiseSrc: AudioBufferSourceNode | null = null;
    let noiseGain: GainNode | null = null;
    if (_keycapNoiseBuffer) {
      noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = _keycapNoiseBuffer;
      noiseSrc.playbackRate.setValueAtTime(pitchFactor, now);

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.setValueAtTime(3400 + Math.random() * 500, now);
      noiseFilter.Q.setValueAtTime(2.2, now);

      noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.22 * gainFactor, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);

      noiseSrc.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
    }

    const destNode = _masterGain || ctx.destination;

    // Stereo Panning
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (panner) {
      panner.pan.setValueAtTime((Math.random() - 0.5) * 0.4, now);
      thock.connect(thockGain);
      click.connect(clickGain);
      thockGain.connect(panner);
      clickGain.connect(panner);
      if (noiseGain) noiseGain.connect(panner);
      panner.connect(destNode);
    } else {
      thock.connect(thockGain);
      click.connect(clickGain);
      thockGain.connect(destNode);
      clickGain.connect(destNode);
      if (noiseGain) noiseGain.connect(destNode);
    }

    thock.start(now);
    thock.stop(now + 0.052);
    click.start(now);
    click.stop(now + 0.027);
    if (noiseSrc) noiseSrc.start(now);
  }, []);

  const playEnterPunchSound = useCallback(() => {
    playTypingKeystrokeSound("O", true);
  }, [playTypingKeystrokeSound]);

  // ═══════════════════════════════════════════════════════════════════════
  // GLOBAL PERSISTENT AUDIO INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════
  const initAudio = useCallback(() => {
    if (_ctx && _ctx.state === "running") {
      setAudioEnabled(true);
      return;
    }
    if (_ctx && _ctx.state === "suspended") {
      _ctx.resume().then(() => setAudioEnabled(true));
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      _ctx = ctx;

      // Pre-buffer keystroke noise asset in memory for 0ms latency
      _keycapNoiseBuffer = createNoiseBuffer(ctx, 0.02);

      const master = ctx.createGain();
      master.gain.setValueAtTime(0.5, ctx.currentTime);
      master.connect(ctx.destination);
      _masterGain = master;

      const ambientBus = ctx.createGain();
      ambientBus.gain.setValueAtTime(1.0, ctx.currentTime);
      ambientBus.connect(master);
      _ambientGain = ambientBus;

      // Convolver Reverb
      const convolver = ctx.createConvolver();
      const reverbLength = ctx.sampleRate * 3.0;
      const reverbBuf = ctx.createBuffer(2, reverbLength, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const data = reverbBuf.getChannelData(ch);
        for (let i = 0; i < reverbLength; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / reverbLength, 2.2) * 0.3;
        }
      }
      convolver.buffer = reverbBuf;
      convolver.connect(master);
      _convolver = convolver;

      playCRTBootSound(ctx, master);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(180, ctx.currentTime);
      filter.Q.setValueAtTime(3.5, ctx.currentTime);
      filter.connect(ambientBus);
      _filter = filter;

      // 30Hz Sub-Bass Chest Rumble
      const sub = ctx.createOscillator();
      sub.type = "sine";
      sub.frequency.setValueAtTime(30, ctx.currentTime);
      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0.4, ctx.currentTime);
      sub.connect(subGain);
      subGain.connect(ambientBus);
      sub.start();
      _subOsc = sub;

      // Mechanical Drones (60Hz & 98Hz)
      const drone = ctx.createOscillator();
      drone.type = "sawtooth";
      drone.frequency.setValueAtTime(60.0, ctx.currentTime);
      drone.connect(filter);
      drone.start();
      _droneOsc = drone;

      const drone2 = ctx.createOscillator();
      drone2.type = "sawtooth";
      drone2.frequency.setValueAtTime(98.0, ctx.currentTime);
      drone2.detune.setValueAtTime(12, ctx.currentTime);
      drone2.connect(filter);
      drone2.start();
      _droneOsc2 = drone2;

      // Anti-Gravity Suction Riser
      const riser = ctx.createOscillator();
      riser.type = "sine";
      riser.frequency.setValueAtTime(100, ctx.currentTime);
      const riserGain = ctx.createGain();
      riserGain.gain.setValueAtTime(0.001, ctx.currentTime);
      riser.connect(riserGain);
      riserGain.connect(ambientBus);
      riser.start();
      _riserOsc = riser;
      _riserGain = riserGain;

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
      _noiseNode = noise;

      _isInitialized = true;
      setAudioEnabled(true);

      // Heartbeat pulse (40 BPM)
      const playHeartbeat = () => {
        if (!_ctx || _ctx.state !== "running") return;
        const now = _ctx.currentTime;

        const kick1 = _ctx.createOscillator();
        kick1.type = "sine";
        kick1.frequency.setValueAtTime(90, now);
        kick1.frequency.exponentialRampToValueAtTime(30, now + 0.12);

        const kickGain = _ctx.createGain();
        kickGain.gain.setValueAtTime(0.48, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        kick1.connect(kickGain);
        kickGain.connect(master);
        kick1.start(now);
        kick1.stop(now + 0.16);

        const kick2 = _ctx.createOscillator();
        kick2.type = "sine";
        kick2.frequency.setValueAtTime(75, now + 0.18);
        kick2.frequency.exponentialRampToValueAtTime(25, now + 0.3);

        const kickGain2 = _ctx.createGain();
        kickGain2.gain.setValueAtTime(0.32, now + 0.18);
        kickGain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

        kick2.connect(kickGain2);
        kickGain2.connect(master);
        kick2.start(now + 0.18);
        kick2.stop(now + 0.33);
      };

      _heartbeatTimer = setInterval(playHeartbeat, 1500);

    } catch (err) {
      console.warn("Web Audio initialization error:", err);
    }
  }, [playCRTBootSound]);

  const setProgress = useCallback((progress: number) => {
    if (!_ctx || _ctx.state !== "running") return;
    const ctx = _ctx;
    const norm = Math.min(Math.max(progress / 100, 0), 1);
    const now = ctx.currentTime;

    if (_filter) {
      _filter.frequency.setTargetAtTime(180 + norm * 1400, now, 0.1);
    }
    if (_subOsc) {
      _subOsc.frequency.setTargetAtTime(30 + norm * 20, now, 0.1);
    }
    if (_riserOsc && _riserGain) {
      const riserFreq = 100 + Math.pow(norm, 3.5) * 1200;
      const riserVol = norm > 0.6 ? (norm - 0.6) * 1.8 : 0;
      _riserOsc.frequency.setTargetAtTime(riserFreq, now, 0.05);
      _riserGain.gain.setTargetAtTime(Math.min(0.55, riserVol), now, 0.05);
    }

    if (norm > 0.15 && Math.random() < 0.04) {
      playCursorPlink();
    }
  }, [playCursorPlink]);

  // ═══════════════════════════════════════════════════════════════════════
  // DETONATION IMPACT & LOADER AUDIO TERMINATION
  // ═══════════════════════════════════════════════════════════════════════
  const triggerTear = useCallback(() => {
    if (!_ctx || _isTearing) return;
    _isTearing = true;

    const ctx = _ctx;
    const now = ctx.currentTime;

    try {
      // 1. CLEANLY STOP ALL LOADER AMBIENT DRONES & HEARTBEATS IMMEDIATELY AT DETONATION
      // So no background drone/throne voice bleeds into Welcome Screen!
      if (_heartbeatTimer) {
        clearInterval(_heartbeatTimer);
        _heartbeatTimer = null;
      }
      try { if (_subOsc)   { _subOsc.stop(now);   _subOsc   = null; } } catch {}
      try { if (_droneOsc) { _droneOsc.stop(now); _droneOsc = null; } } catch {}
      try { if (_droneOsc2){ _droneOsc2.stop(now); _droneOsc2= null; } } catch {}
      try { if (_riserOsc) { _riserOsc.stop(now); _riserOsc = null; } } catch {}
      try { if (_noiseNode){ _noiseNode.stop(now);_noiseNode= null; } } catch {}

      // Ensure master gain is open for detonation SFX & subsequent ASMR typing
      if (_masterGain) {
        _masterGain.gain.cancelScheduledValues(now);
        _masterGain.gain.setValueAtTime(0.5, now);
      }

      const blastTime = now + 0.02;

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-14, blastTime);
      compressor.knee.setValueAtTime(4, blastTime);
      compressor.ratio.setValueAtTime(14, blastTime);
      compressor.attack.setValueAtTime(0.002, blastTime);
      compressor.release.setValueAtTime(0.12, blastTime);
      compressor.connect(ctx.destination);

      const breachMaster = ctx.createGain();
      breachMaster.gain.setValueAtTime(1.0, blastTime);
      breachMaster.gain.exponentialRampToValueAtTime(0.001, blastTime + 1.4);
      breachMaster.connect(compressor);

      // 2. Heavy 30Hz-50Hz Sub-Bass Impact Punch
      const subDrop = ctx.createOscillator();
      subDrop.type = "sine";
      subDrop.frequency.setValueAtTime(160, blastTime);
      subDrop.frequency.exponentialRampToValueAtTime(50, blastTime + 0.05);
      subDrop.frequency.exponentialRampToValueAtTime(30, blastTime + 0.45);

      const subDropGain = ctx.createGain();
      subDropGain.gain.setValueAtTime(1.0, blastTime);
      subDropGain.gain.exponentialRampToValueAtTime(0.001, blastTime + 0.65);

      subDrop.connect(subDropGain);
      subDropGain.connect(breachMaster);
      subDrop.start(blastTime);
      subDrop.stop(blastTime + 0.7);

      // 3. Metallic Shockwave Shatter
      const slash = ctx.createOscillator();
      slash.type = "sawtooth";
      slash.frequency.setValueAtTime(5200, blastTime);
      slash.frequency.exponentialRampToValueAtTime(9800, blastTime + 0.1);
      slash.frequency.exponentialRampToValueAtTime(1400, blastTime + 0.5);

      const slashFilter = ctx.createBiquadFilter();
      slashFilter.type = "highpass";
      slashFilter.frequency.setValueAtTime(2500, blastTime);

      const slashGain = ctx.createGain();
      slashGain.gain.setValueAtTime(0.5, blastTime);
      slashGain.gain.exponentialRampToValueAtTime(0.001, blastTime + 0.55);

      slash.connect(slashFilter);
      slashFilter.connect(slashGain);
      slashGain.connect(breachMaster);
      slash.start(blastTime);
      slash.stop(blastTime + 0.6);

      // 4. Dune Horn Stab
      const horn1 = ctx.createOscillator();
      const horn2 = ctx.createOscillator();
      horn1.type = "sawtooth";
      horn2.type = "sawtooth";

      horn1.frequency.setValueAtTime(110, blastTime);
      horn1.frequency.exponentialRampToValueAtTime(80, blastTime + 0.6);
      horn2.frequency.setValueAtTime(110.8, blastTime);
      horn2.frequency.exponentialRampToValueAtTime(80.4, blastTime + 0.6);

      const hornFilter = ctx.createBiquadFilter();
      hornFilter.type = "lowpass";
      hornFilter.Q.setValueAtTime(5.5, blastTime);
      hornFilter.frequency.setValueAtTime(160, blastTime);
      hornFilter.frequency.exponentialRampToValueAtTime(1800, blastTime + 0.08);
      hornFilter.frequency.exponentialRampToValueAtTime(400, blastTime + 0.5);

      const hornGain = ctx.createGain();
      hornGain.gain.setValueAtTime(0.001, blastTime);
      hornGain.gain.linearRampToValueAtTime(0.65, blastTime + 0.03);
      hornGain.gain.exponentialRampToValueAtTime(0.001, blastTime + 0.8);

      horn1.connect(hornFilter);
      horn2.connect(hornFilter);
      hornFilter.connect(hornGain);
      hornGain.connect(breachMaster);

      horn1.start(blastTime);
      horn2.start(blastTime);
      horn1.stop(blastTime + 0.85);
      horn2.stop(blastTime + 0.85);

      // 5. Crystal Reverb Tail
      const bell1 = ctx.createOscillator();
      const bell2 = ctx.createOscillator();
      bell1.type = "sine";
      bell2.type = "sine";

      bell1.frequency.setValueAtTime(880, blastTime + 0.1);
      bell2.frequency.setValueAtTime(1320, blastTime + 0.12);

      const bellGain = ctx.createGain();
      bellGain.gain.setValueAtTime(0, blastTime + 0.1);
      bellGain.gain.linearRampToValueAtTime(0.25, blastTime + 0.22);
      bellGain.gain.exponentialRampToValueAtTime(0.001, blastTime + 1.1);

      bell1.connect(bellGain);
      bell2.connect(bellGain);
      bellGain.connect(breachMaster);

      bell1.start(blastTime + 0.1);
      bell2.start(blastTime + 0.12);
      bell1.stop(blastTime + 1.2);
      bell2.stop(blastTime + 1.2);

      setTimeout(() => {
        try { compressor.disconnect(); } catch {}
        try { breachMaster.disconnect(); } catch {}
      }, 2000);

    } catch (e) {
      console.warn("Error playing detonation blast sound:", e);
    }
  }, []);

  const stop = useCallback(() => {
    if (_heartbeatTimer) {
      clearInterval(_heartbeatTimer);
      _heartbeatTimer = null;
    }
    if (_ctx) {
      try { _ctx.close(); } catch {}
      _ctx = null;
      _masterGain = null;
      _ambientGain = null;
      _convolver = null;
      _filter = null;
      _subOsc = null;
      _droneOsc = null;
      _droneOsc2 = null;
      _riserOsc = null;
      _riserGain = null;
      _noiseNode = null;
    }
    _isInitialized = false;
    _isTearing = false;
    setAudioEnabled(false);
  }, []);

  useEffect(() => {
    if (_ctx && _ctx.state === "running") {
      setAudioEnabled(true);
    }
    const handleUserGesture = () => {
      initAudio();
      window.removeEventListener("click", handleUserGesture);
      window.removeEventListener("keydown", handleUserGesture);
      window.removeEventListener("touchstart", handleUserGesture);
    };

    if (!_ctx || _ctx.state !== "running") {
      window.addEventListener("click", handleUserGesture);
      window.addEventListener("keydown", handleUserGesture);
      window.addEventListener("touchstart", handleUserGesture);
    }

    return () => {
      window.removeEventListener("click", handleUserGesture);
      window.removeEventListener("keydown", handleUserGesture);
      window.removeEventListener("touchstart", handleUserGesture);
    };
  }, [initAudio]);

  return { audioEnabled, initAudio, setProgress, triggerTear, stop, playCursorPlink, playTypingKeystrokeSound, playEnterPunchSound };
}