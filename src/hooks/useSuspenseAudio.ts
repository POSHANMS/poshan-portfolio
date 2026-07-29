"use client";

import { useEffect, useRef, useCallback, useState } from "react";

/**
 * ═══════════════════════════════════════════════════════════════════════
 * CINEMATIC AUDIO ENGINE — Detonation Blast & Sub-Bass Impact
 *
 * AudioContext is a MODULE-LEVEL SINGLETON so it survives across
 * component mounts/unmounts (Loader → WelcomeText → Hero) without
 * ever requiring a second user gesture.
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

// ─────────────────────────────────────────────────────────────────────────────
// MODULE-LEVEL SINGLETON — shared across ALL hook instances / component mounts
// ─────────────────────────────────────────────────────────────────────────────
let _ctx: AudioContext | null = null;
let _masterGain: GainNode | null = null;
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

// ─────────────────────────────────────────────────────────────────────────────

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
    if (!_ctx) return;
    if (_ctx.state === "suspended") {
      _ctx.resume();
    }
    const ctx = _ctx;
    const now = ctx.currentTime;

    if (_masterGain && _masterGain.gain.value < 0.1) {
      _masterGain.gain.cancelScheduledValues(now);
      _masterGain.gain.setValueAtTime(0.4, now);
    }

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
    plinkGain.connect(_masterGain || ctx.destination);

    plink.start(now);
    plink.stop(now + 0.11);
  }, []);

  // ASMR Cyberpunk Keystroke Sound (Lubed mechanical thock + tactile click + binaural pan)
  const playTypingKeystrokeSound = useCallback(() => {
    if (!_ctx) return;
    if (_ctx.state === "suspended") {
      _ctx.resume();
    }
    const ctx = _ctx;
    const now = ctx.currentTime;

    // Ensure master gain is restored if it was muted during detonation
    if (_masterGain && _masterGain.gain.value < 0.1) {
      _masterGain.gain.cancelScheduledValues(now);
      _masterGain.gain.setValueAtTime(0.4, now);
    }

    // 1. Deep Mechanical Thock Body (lubed switch sound: 260Hz -> 100Hz)
    const thock = ctx.createOscillator();
    thock.type = "sine";
    const baseFreq = 260 + Math.random() * 60;
    thock.frequency.setValueAtTime(baseFreq, now);
    thock.frequency.exponentialRampToValueAtTime(100, now + 0.045);

    const thockGain = ctx.createGain();
    thockGain.gain.setValueAtTime(0.35, now);
    thockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    // 2. Tactile Switch Click / Snap (high-frequency tactile bump)
    const click = ctx.createOscillator();
    click.type = "triangle";
    click.frequency.setValueAtTime(4200 + Math.random() * 800, now);
    click.frequency.exponentialRampToValueAtTime(1200, now + 0.018);

    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.22, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.022);

    // 3. Keycap Bottom-out Noise Burst (tactile key housing contact)
    const noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.015), ctx.sampleRate);
    const noiseData = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.004));
    }
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuf;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(3200 + Math.random() * 500, now);
    noiseFilter.Q.setValueAtTime(2.5, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.18, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

    noiseSrc.connect(noiseFilter);
    noiseFilter.connect(noiseGain);

    // Binaural Panning across stereo field
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const destNode = _masterGain || ctx.destination;

    if (panner) {
      panner.pan.setValueAtTime((Math.random() - 0.5) * 0.5, now);
      thock.connect(thockGain);
      click.connect(clickGain);
      thockGain.connect(panner);
      clickGain.connect(panner);
      noiseGain.connect(panner);
      panner.connect(destNode);
    } else {
      thock.connect(thockGain);
      click.connect(clickGain);
      thockGain.connect(destNode);
      clickGain.connect(destNode);
      noiseGain.connect(destNode);
    }

    thock.start(now);
    thock.stop(now + 0.052);
    click.start(now);
    click.stop(now + 0.025);
    noiseSrc.start(now);
  }, []);

  // Enter Lock-in Mechanical Thud (Heavy switch bottom-out + sub thump)
  const playEnterPunchSound = useCallback(() => {
    if (!_ctx) return;
    if (_ctx.state === "suspended") {
      _ctx.resume();
    }
    const ctx = _ctx;
    const now = ctx.currentTime;

    if (_masterGain && _masterGain.gain.value < 0.1) {
      _masterGain.gain.cancelScheduledValues(now);
      _masterGain.gain.setValueAtTime(0.4, now);
    }

    // Heavy Sub Thump
    const thud = ctx.createOscillator();
    thud.type = "sine";
    thud.frequency.setValueAtTime(160, now);
    thud.frequency.exponentialRampToValueAtTime(35, now + 0.18);

    const thudGain = ctx.createGain();
    thudGain.gain.setValueAtTime(0.65, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    // Metal housing click
    const snap = ctx.createOscillator();
    snap.type = "sawtooth";
    snap.frequency.setValueAtTime(2800, now);
    snap.frequency.exponentialRampToValueAtTime(400, now + 0.04);

    const snapFilter = ctx.createBiquadFilter();
    snapFilter.type = "lowpass";
    snapFilter.frequency.setValueAtTime(1800, now);

    const snapGain = ctx.createGain();
    snapGain.gain.setValueAtTime(0.35, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    const destNode = _masterGain || ctx.destination;
    thud.connect(thudGain);
    snap.connect(snapFilter);
    snapFilter.connect(snapGain);
    thudGain.connect(destNode);
    snapGain.connect(destNode);

    thud.start(now);
    thud.stop(now + 0.23);
    snap.start(now);
    snap.stop(now + 0.055);
  }, []);

  // INIT Audio Context & Ambient Drones — singleton guard
  const initAudio = useCallback(() => {
    // Already running — ensure master gain is restored if it was ducked
    if (_ctx && _ctx.state === "running") {
      if (_masterGain && _masterGain.gain.value < 0.1) {
        const now = _ctx.currentTime;
        _masterGain.gain.cancelScheduledValues(now);
        _masterGain.gain.setValueAtTime(0.4, now);
      }
      setAudioEnabled(true);
      return;
    }
    // Suspended (e.g. browser tab switched) — just resume it
    if (_ctx && _ctx.state === "suspended") {
      _ctx.resume().then(() => {
        if (_masterGain && _masterGain.gain.value < 0.1) {
          _masterGain.gain.cancelScheduledValues(_ctx!.currentTime);
          _masterGain.gain.setValueAtTime(0.4, _ctx!.currentTime);
        }
        setAudioEnabled(true);
      });
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      _ctx = ctx;

      const master = ctx.createGain();
      master.gain.setValueAtTime(0.4, ctx.currentTime);
      master.connect(ctx.destination);
      _masterGain = master;

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
      _convolver = convolver;

      playCRTBootSound(ctx, master);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(180, ctx.currentTime);
      filter.Q.setValueAtTime(3.5, ctx.currentTime);
      filter.connect(master);
      _filter = filter;

      // 30Hz Sub-Bass Chest Rumble
      const sub = ctx.createOscillator();
      sub.type = "sine";
      sub.frequency.setValueAtTime(30, ctx.currentTime);
      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0.45, ctx.currentTime);
      sub.connect(subGain);
      subGain.connect(master);
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
      riserGain.connect(master);
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

  // Modulate suction riser during progress (0% -> 100%)
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

    // Vacuum Riser Accelerates exponentially toward 100%
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

  // TRIGGER TEAR — 50ms Silence Gap & Detonation Impact
  const triggerTear = useCallback(() => {
    if (!_ctx || _isTearing) return;
    _isTearing = true;

    const ctx = _ctx;
    const now = ctx.currentTime;

    try {
      // 50ms Ultra-brief Vacuum Silence Gap — master goes near-zero for tension
      if (_masterGain) {
        _masterGain.gain.cancelScheduledValues(now);
        _masterGain.gain.setValueAtTime(0.001, now);
        _masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.05);
        // Master gain stays silent through the blast tail — ambient drones die below
      }

      if (_heartbeatTimer) {
        clearInterval(_heartbeatTimer);
        _heartbeatTimer = null;
      }

      // Kill all looping ambient nodes IMMEDIATELY — they are inaudible (master=0.0001)
      // so stopping them now vs later makes zero sound difference but prevents them
      // from being audible if anything re-opens the gain path.
      try { if (_subOsc)   { _subOsc.stop();   _subOsc   = null; } } catch {}
      try { if (_droneOsc) { _droneOsc.stop(); _droneOsc = null; } } catch {}
      try { if (_droneOsc2){ _droneOsc2.stop();_droneOsc2= null; } } catch {}
      try { if (_riserOsc) { _riserOsc.stop(); _riserOsc = null; } } catch {}
      try { if (_noiseNode){ _noiseNode.stop();_noiseNode= null; } } catch {}

      // After the punchy blast finishes (~1.5s), restore master gain for typing ASMR
      setTimeout(() => {
        if (_masterGain && _ctx) {
          const t = _ctx.currentTime;
          _masterGain.gain.cancelScheduledValues(t);
          _masterGain.gain.setValueAtTime(0.5, t);
        }
      }, 1800);

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
      breachMaster.gain.exponentialRampToValueAtTime(0.001, blastTime + 1.4); // short punchy fade
      breachMaster.connect(compressor);

      // Heavy 42Hz Sub-Bass Impact Punch — punchy, done in 0.7s
      const subDrop = ctx.createOscillator();
      subDrop.type = "sine";
      subDrop.frequency.setValueAtTime(180, blastTime);
      subDrop.frequency.exponentialRampToValueAtTime(42, blastTime + 0.06);
      subDrop.frequency.exponentialRampToValueAtTime(28, blastTime + 0.5); // stops before 22Hz drone

      const subDropGain = ctx.createGain();
      subDropGain.gain.setValueAtTime(1.0, blastTime);
      subDropGain.gain.exponentialRampToValueAtTime(0.001, blastTime + 0.7); // done at 0.7s

      subDrop.connect(subDropGain);
      subDropGain.connect(breachMaster);
      subDrop.start(blastTime);
      subDrop.stop(blastTime + 0.75);

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

      // Dune Horn Stab — short cinematic punch, NOT a long swell drone
      const horn1 = ctx.createOscillator();
      const horn2 = ctx.createOscillator();
      horn1.type = "sawtooth";
      horn2.type = "sawtooth";

      horn1.frequency.setValueAtTime(110, blastTime);
      horn1.frequency.exponentialRampToValueAtTime(80, blastTime + 0.6); // stays high, no drone
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
      hornGain.gain.exponentialRampToValueAtTime(0.001, blastTime + 0.8); // done at 0.8s

      horn1.connect(hornFilter);
      horn2.connect(hornFilter);
      hornFilter.connect(hornGain);
      hornGain.connect(breachMaster);

      horn1.start(blastTime);
      horn2.start(blastTime);
      horn1.stop(blastTime + 0.85);
      horn2.stop(blastTime + 0.85);

      // Short crystal shimmer tail
      const bell1 = ctx.createOscillator();
      const bell2 = ctx.createOscillator();
      bell1.type = "sine";
      bell2.type = "sine";

      bell1.frequency.setValueAtTime(880, blastTime + 0.1);
      bell2.frequency.setValueAtTime(1320, blastTime + 0.12);

      const bellGain = ctx.createGain();
      bellGain.gain.setValueAtTime(0, blastTime + 0.1);
      bellGain.gain.linearRampToValueAtTime(0.25, blastTime + 0.22);
      bellGain.gain.exponentialRampToValueAtTime(0.001, blastTime + 1.1); // done at 1.1s

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
      }, 2500);

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
    // If audio was already initialized (e.g. by the Loader), reflect that state
    if (_ctx && _ctx.state === "running") {
      setAudioEnabled(true);
    }

    const handleUserGesture = () => {
      initAudio();
      window.removeEventListener("click", handleUserGesture);
      window.removeEventListener("keydown", handleUserGesture);
      window.removeEventListener("touchstart", handleUserGesture);
    };

    // Only attach listeners if context not yet running
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