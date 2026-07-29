"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSuspenseAudio } from "@/hooks/useSuspenseAudio";

interface WelcomeTextProps {
  onComplete?: () => void;
}

const FULL_TEXT = "WELCOME TO MY PORTFOLIO";
const BOOT_LINES = [
  "// NEURAL LINK ONLINE //",
  "INITIALIZING INTERFACE...",
  "CALIBRATING OPTICAL SENSORS...",
  "ESTABLISHING UPLINK...",
  "REALITY ANCHOR: LOCKED",
];

export default function WelcomeText({ onComplete }: WelcomeTextProps) {
  const { playTypingKeystrokeSound, playEnterPunchSound } = useSuspenseAudio();
  const [phase, setPhase] = useState<"boot" | "typing" | "surge" | "hold" | "warp">("boot");
  const [displayText, setDisplayText] = useState("");
  const [bootIndex, setBootIndex] = useState(0);
  const [glitchOffset, setGlitchOffset] = useState({ x: 0, y: 0 });
  const [scanlineY, setScanlineY] = useState(-10);
  const [brightness, setBrightness] = useState(1);
  const [showCursor, setShowCursor] = useState(true);
  const [flickerOpacity, setFlickerOpacity] = useState(1);

  // 3D Spatial Camera Warp Push-Through state
  const [warpScale, setWarpScale] = useState(1.0);
  const [warpOpacity, setWarpOpacity] = useState(1.0);
  const [warpBlur, setWarpBlur] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const charIndexRef = useRef(0);
  const hasTriggeredCompleteRef = useRef(false);

  // ── PHASE 1: BOOT SEQUENCE ──
  useEffect(() => {
    if (phase !== "boot") return;
    const interval = setInterval(() => {
      setBootIndex((prev) => {
        if (prev >= BOOT_LINES.length - 1) {
          clearInterval(interval);
          setTimeout(() => setPhase("typing"), 300);
          return prev;
        }
        return prev + 1;
      });
    }, 280);
    return () => clearInterval(interval);
  }, [phase]);

  // ── PHASE 2: CINEMATIC ASMR TYPING ──
  useEffect(() => {
    if (phase !== "typing") return;

    const typeNext = () => {
      const idx = charIndexRef.current;
      if (idx >= FULL_TEXT.length) {
        playEnterPunchSound(); // Enter lock-in mechanical thud
        setPhase("surge");
        return;
      }

      charIndexRef.current = idx + 1;
      setDisplayText(FULL_TEXT.slice(0, idx + 1));
      playTypingKeystrokeSound(); // ASMR mechanical keythock per character

      const char = FULL_TEXT[idx];
      let delay = 70 + Math.random() * 40;
      if (char === " ") delay = 160;
      if (idx === 0) delay = 400;

      if (Math.random() < 0.1) {
        setGlitchOffset({ x: (Math.random() - 0.5) * 14, y: (Math.random() - 0.5) * 6 });
        setTimeout(() => setGlitchOffset({ x: 0, y: 0 }), 50);
      }

      setTimeout(typeNext, delay);
    };

    const timer = setTimeout(typeNext, 200);
    return () => clearTimeout(timer);
  }, [phase, playTypingKeystrokeSound, playEnterPunchSound]);

  // ── PHASE 3: POWER SURGE & LOCK-IN ──
  useEffect(() => {
    if (phase !== "surge") return;

    let frame = 0;
    const surgeInterval = setInterval(() => {
      frame++;
      if (frame <= 3) {
        setBrightness(2.8);
        setFlickerOpacity(0.3 + Math.random() * 0.7);
      } else if (frame <= 8) {
        setBrightness(1.2 + Math.random() * 0.4);
        setFlickerOpacity(0.8 + Math.random() * 0.2);
      } else {
        setBrightness(1);
        setFlickerOpacity(1);
        clearInterval(surgeInterval);
        setPhase("hold");
      }
    }, 70);

    return () => clearInterval(surgeInterval);
  }, [phase]);

  // ── PHASE 4: STAGE 1 LOCK-IN & HOLD (0.4s PAUSE) ──
  useEffect(() => {
    if (phase !== "hold") return;
    const timer = setTimeout(() => setPhase("warp"), 400); // 0.4s pause with intense glow
    return () => clearTimeout(timer);
  }, [phase]);

  // ── PHASE 5: STAGE 2 SPATIAL CAMERA WARP (FLY FORWARD THROUGH TEXT) ──
  useEffect(() => {
    if (phase !== "warp") return;

    let startTime = performance.now();
    const duration = 600; // 0.6s total warp duration

    const warpLoop = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1, elapsed / duration);

      // power3.in exponential curve: scale 1.0 -> 8.0
      const cubicIn = Math.pow(progress, 3);
      const currentScale = 1.0 + cubicIn * 7.0;
      const currentOpacity = Math.max(0, 1 - Math.pow(progress, 1.5));
      const currentBlur = progress * 24; // 0px -> 24px radial motion blur

      setWarpScale(currentScale);
      setWarpOpacity(currentOpacity);
      setWarpBlur(currentBlur);

      // STAGE 3 HERO REVEAL: Overlap Stage 2 by 0.2s (trigger at progress >= 0.65)
      if (progress >= 0.65 && !hasTriggeredCompleteRef.current) {
        hasTriggeredCompleteRef.current = true;
        onComplete?.();
      }

      if (progress < 1) {
        requestAnimationFrame(warpLoop);
      }
    };

    requestAnimationFrame(warpLoop);
  }, [phase, onComplete]);

  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => setShowCursor((p) => !p), 530);
    return () => clearInterval(interval);
  }, []);

  // Occasional scanline sweep
  useEffect(() => {
    if (phase === "warp") return;
    const interval = setInterval(() => {
      setScanlineY(0);
      const anim = setInterval(() => {
        setScanlineY((y) => {
          if (y >= 110) {
            clearInterval(anim);
            return -10;
          }
          return y + 4;
        });
      }, 16);
    }, 4000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, [phase]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[99990] flex items-center justify-center overflow-hidden pointer-events-none"
      style={{
        background: "#000000",
        opacity: warpOpacity,
        willChange: "transform, opacity, filter",
      }}
    >
      {/* ═══ CINEMATIC LETTERBOX BARS ═══ */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 z-50 h-[7vh] bg-black" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-50 h-[7vh] bg-black" />

      {/* ═══ FILM GRAIN ═══ */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.09]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }}
      />

      {/* ═══ VIGNETTE ═══ */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 0%, transparent 35%, rgba(255,0,51,0.06) 65%, rgba(0,0,0,0.85) 100%)",
        }}
      />

      {/* ═══ SCANLINES ═══ */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,0,51,0.04) 3px, rgba(255,0,51,0.04) 6px)",
        }}
      />

      {/* ═══ MOVING SCANLINE ═══ */}
      {scanlineY >= 0 && scanlineY <= 100 && (
        <div
          className="pointer-events-none absolute left-0 right-0 h-[2px] bg-[#ff0033]/20"
          style={{ top: `${scanlineY}%`, boxShadow: "0 0 12px rgba(255,0,51,0.4)" }}
        />
      )}

      {/* ═══ TOP BOOT INFO ═══ */}
      <div className="absolute top-[10vh] left-0 right-0 text-center">
        <p className="font-mono text-[9px] uppercase tracking-[0.5em] text-[#ff0033]/40">
          // Neural Interface v2.4.0 // Boot Sequence
        </p>
        {phase === "boot" && (
          <div className="mt-3 flex justify-center">
            <div className="font-mono text-[10px] tracking-widest text-[#ff0033]/60">
              {BOOT_LINES.slice(0, bootIndex + 1).map((line, i) => (
                <div key={i} className="py-0.5" style={{ opacity: i === bootIndex ? 1 : 0.4 }}>
                  &gt; {line}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══ MAIN TEXT CONTAINER (3D SPATIAL CAMERA WARP PUSH-THROUGH) ═══ */}
      <div
        className="relative flex flex-col items-center justify-center px-6"
        style={{
          perspective: "1200px",
          transform: `scale(${warpScale})`,
          filter: `brightness(${brightness}) blur(${warpBlur}px)`,
          transformOrigin: "center center",
          willChange: "transform, filter",
        }}
      >
        {/* Deep background glow bloom */}
        <div
          className="pointer-events-none absolute inset-0 blur-3xl"
          style={{
            background: "radial-gradient(circle, rgba(255,0,51,0.45) 0%, transparent 70%)",
            transform: "scale(2.2)",
            opacity: flickerOpacity,
          }}
        />

        {/* Shadow depth layer */}
        <h1
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 select-none whitespace-nowrap font-mono font-black uppercase"
          style={{
            fontSize: "clamp(2.8rem, 9vw, 8.5rem)",
            letterSpacing: "0.18em",
            color: "rgba(80, 0, 10, 0.9)",
            transform: `translate3d(${glitchOffset.x - 6}px, ${glitchOffset.y + 4}px, -30px)`,
            textShadow: "0 0 60px rgba(255,0,51,0.3)",
          }}
        >
          {displayText}
        </h1>

        {/* Cyan chromatic aberration layer */}
        <h1
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 select-none whitespace-nowrap font-mono font-black uppercase"
          style={{
            fontSize: "clamp(2.8rem, 9vw, 8.5rem)",
            letterSpacing: "0.18em",
            color: "rgba(0, 240, 255, 0.35)",
            transform: `translate3d(${glitchOffset.x + 4}px, ${glitchOffset.y - 2}px, 10px)`,
            mixBlendMode: "screen",
            filter: "blur(1.5px)",
          }}
        >
          {displayText}
        </h1>

        {/* Red chromatic aberration layer */}
        <h1
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 select-none whitespace-nowrap font-mono font-black uppercase"
          style={{
            fontSize: "clamp(2.8rem, 9vw, 8.5rem)",
            letterSpacing: "0.18em",
            color: "rgba(255, 0, 51, 0.45)",
            transform: `translate3d(${glitchOffset.x - 3}px, ${glitchOffset.y + 1}px, 5px)`,
            mixBlendMode: "screen",
            filter: "blur(1px)",
          }}
        >
          {displayText}
        </h1>

        {/* Main visible text */}
        <h1
          className="relative select-none whitespace-nowrap font-mono font-black uppercase text-[#ff0033]"
          style={{
            fontSize: "clamp(2.8rem, 9vw, 8.5rem)",
            letterSpacing: "0.18em",
            lineHeight: 1.1,
            textShadow: `
              0 0 20px rgba(255,0,51,0.9),
              0 0 50px rgba(255,0,51,0.7),
              0 0 100px rgba(255,0,51,0.45),
              0 0 180px rgba(255,0,51,0.25),
              0 0 300px rgba(255,0,51,0.12)
            `,
            opacity: flickerOpacity,
          }}
        >
          {displayText}
          {(phase === "typing" || phase === "boot") && (
            <span
              className="ml-3 inline-block align-middle bg-[#ff0033]"
              style={{
                width: "clamp(4px, 0.6vw, 8px)",
                height: "clamp(1.8rem, 5.5vw, 5rem)",
                opacity: showCursor ? 1 : 0,
                boxShadow: "0 0 12px rgba(255,0,51,0.9)",
              }}
            />
          )}
        </h1>

        {/* Subtitle */}
        <div
          className="mt-8 transition-all duration-1000"
          style={{
            opacity: phase === "typing" ? 0 : phase === "boot" ? 0 : 0.7,
            transform: phase === "typing" || phase === "boot" ? "translateY(12px)" : "translateY(0)",
          }}
        >
          <p
            className="font-mono text-[10px] uppercase tracking-[0.6em] text-white/50"
            style={{ textShadow: "0 0 10px rgba(255,0,51,0.35)" }}
          >
            // Reality Anchor Established
          </p>
        </div>
      </div>

      {/* ═══ BOTTOM PROGRESS / STATUS ═══ */}
      <div className="absolute bottom-[10vh] left-0 right-0 flex flex-col items-center">
        <div className="w-[280px] h-[1px] bg-[#ff0033]/15 relative overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#ff0033]/60 to-[#ff3366]/80"
            style={{
              width: phase === "boot"
                ? `${((bootIndex + 1) / BOOT_LINES.length) * 100}%`
                : phase === "typing"
                ? `${(displayText.length / FULL_TEXT.length) * 100}%`
                : "100%",
              transition: "width 0.3s ease-out",
              boxShadow: "0 0 8px rgba(255,0,51,0.5)",
            }}
          />
        </div>
        <p className="mt-3 font-mono text-[8px] uppercase tracking-[0.4em] text-[#ff0033]/30">
          {phase === "boot"
            ? `SYSTEM BOOT ${Math.round(((bootIndex + 1) / BOOT_LINES.length) * 100)}%`
            : phase === "typing"
            ? `NEURAL UPLINK ${Math.round((displayText.length / FULL_TEXT.length) * 100)}%`
            : phase === "surge"
            ? "POWER SURGE DETECTED"
            : phase === "hold"
            ? "INTERFACE STABILIZED"
            : "WARPING TO CORE..."}
        </p>
      </div>
    </div>
  );
}