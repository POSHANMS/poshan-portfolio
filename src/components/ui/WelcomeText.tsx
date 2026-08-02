"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAudio } from "@/context/AudioContext";

interface WelcomeTextProps {
  onComplete?: () => void;
  layoutMode?: "stacked" | "cinematic-pan";
}

const FULL_TEXT = "WELCOME TO MY PORTFOLIO";
const LINE_1 = "WELCOME TO";
const LINE_2 = "MY PORTFOLIO";
const BOOT_LINES = [
  "// NEURAL LINK ONLINE //",
  "INITIALIZING INTERFACE...",
  "CALIBRATING OPTICAL SENSORS...",
  "ESTABLISHING UPLINK...",
  "REALITY ANCHOR: LOCKED",
];

type Phase = "boot" | "typing" | "surge" | "hold" | "warp";

/* ═══════════════════════════════════════════════════════════════════════
   CINEMATIC TEXT LINE — Isolated Shadow + Chromatic Aberration + Glow
   Each line carries its own layer stack so multiline layouts remain
   perfectly composited without cross-line bleed or clipping.
   ═══════════════════════════════════════════════════════════════════════ */
function CinematicTextLine({
  text,
  isActive,
  showCursor,
  glitchOffset,
  brightness,
  flickerOpacity,
  phase,
}: {
  text: string;
  isActive: boolean;
  showCursor: boolean;
  glitchOffset: { x: number; y: number };
  brightness: number;
  flickerOpacity: number;
  phase: Phase;
}) {
  const fontSize = "clamp(2.5rem, 8.5vw, 8rem)";
  const letterSpacing = "0.18em";
  const lineHeight = 1.1;

  const baseTextShadow = `
    0 0 20px rgba(255,0,51,0.9),
    0 0 50px rgba(255,0,51,0.7),
    0 0 100px rgba(255,0,51,0.45),
    0 0 180px rgba(255,0,51,0.25),
    0 0 300px rgba(255,0,51,0.12)
  `;

  return (
    <div
      className="relative block max-w-[85vw] mx-auto text-center"
      style={{ fontSize, lineHeight, minHeight: "1.15em" }}
    >
      {/* Deep background glow bloom per line */}
      <div
        className="pointer-events-none absolute inset-0 blur-3xl"
        style={{
          background: "radial-gradient(circle, rgba(255,0,51,0.45) 0%, transparent 70%)",
          transform: "scale(2.2)",
          opacity: flickerOpacity,
        }}
      />

      {/* Shadow depth layer */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 select-none whitespace-nowrap font-mono font-black uppercase w-full text-center"
        style={{
          fontSize,
          letterSpacing,
          lineHeight,
          color: "rgba(80, 0, 10, 0.9)",
          transform: `translate3d(${glitchOffset.x - 6}px, ${glitchOffset.y + 4}px, -30px)`,
          textShadow: "0 0 60px rgba(255,0,51,0.3)",
        }}
      >
        {text}
      </span>

      {/* Cyan chromatic aberration layer */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 select-none whitespace-nowrap font-mono font-black uppercase w-full text-center"
        style={{
          fontSize,
          letterSpacing,
          lineHeight,
          color: "rgba(0, 240, 255, 0.35)",
          transform: `translate3d(${glitchOffset.x + 4}px, ${glitchOffset.y - 2}px, 10px)`,
          mixBlendMode: "screen",
          filter: "blur(1.5px)",
        }}
      >
        {text}
      </span>

      {/* Red chromatic aberration layer */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 select-none whitespace-nowrap font-mono font-black uppercase w-full text-center"
        style={{
          fontSize,
          letterSpacing,
          lineHeight,
          color: "rgba(255, 0, 51, 0.45)",
          transform: `translate3d(${glitchOffset.x - 3}px, ${glitchOffset.y + 1}px, 5px)`,
          mixBlendMode: "screen",
          filter: "blur(1px)",
        }}
      >
        {text}
      </span>

      {/* Main visible text */}
      <h1
        className="relative select-none whitespace-nowrap font-mono font-black uppercase text-[#ff0033] w-full text-center"
        style={{
          fontSize,
          letterSpacing,
          lineHeight,
          textShadow: baseTextShadow,
          opacity: flickerOpacity,
          filter: `brightness(${brightness})`,
        }}
      >
        {text}
        {isActive && showCursor && (phase === "typing" || phase === "boot") && (
          <span
            className="ml-3 inline-block align-middle bg-[#ff0033]"
            style={{
              width: "clamp(4px, 0.6vw, 8px)",
              height: "clamp(1.8rem, 5.5vw, 5rem)",
              boxShadow: "0 0 12px rgba(255,0,51,0.9)",
            }}
          />
        )}
      </h1>
    </div>
  );
}

export default function WelcomeText({ onComplete, layoutMode = "stacked" }: WelcomeTextProps) {
  const { initAudio, stopLoaderDrones, playTypingKeystrokeSound, playEnterPunchSound } = useAudio();

  const [phase, setPhase] = useState<Phase>("boot");
  const [displayText, setDisplayText] = useState("");
  const [bootIndex, setBootIndex] = useState(0);
  const [glitchOffset, setGlitchOffset] = useState({ x: 0, y: 0 });
  const [scanlineY, setScanlineY] = useState(-10);
  const [brightness, setBrightness] = useState(1);
  const [showCursor, setShowCursor] = useState(true);
  const [flickerOpacity, setFlickerOpacity] = useState(1);

  // Module 5: 3D Spatial Camera Warp Push-Through state
  const [warpScale, setWarpScale] = useState(1.0);
  const [warpOpacity, setWarpOpacity] = useState(1.0);
  const [warpBlur, setWarpBlur] = useState(0);

  // Cinematic pan state for Option B fallback
  const [panX, setPanX] = useState(0);
  const textWrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const charIndexRef = useRef(0);
  const hasTriggeredCompleteRef = useRef(false);
  const panRafRef = useRef<number>(0);

  useEffect(() => {
    initAudio();
    stopLoaderDrones();
  }, [initAudio, stopLoaderDrones]);

  // ══ PHASE 1: BOOT SEQUENCE ══
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

  // ══ PHASE 2: CINEMATIC ASMR TYPING ENGINE (MODULE 4) ══
  useEffect(() => {
    if (phase !== "typing") return;

    const typeNext = () => {
      const idx = charIndexRef.current;
      if (idx >= FULL_TEXT.length) {
        playEnterPunchSound();
        setPhase("surge");
        return;
      }

      charIndexRef.current = idx + 1;
      const currentChar = FULL_TEXT[idx];
      const isLastChar = idx === FULL_TEXT.length - 1;
      setDisplayText(FULL_TEXT.slice(0, idx + 1));

      // Module 4: Organic ASMR keystroke audio trigger
      playTypingKeystrokeSound(currentChar, isLastChar);

      let delay = 65 + Math.random() * 45;
      if (currentChar === " ") delay = 160;
      if (idx === 0) delay = 350;

      if (Math.random() < 0.1) {
        setGlitchOffset({ x: (Math.random() - 0.5) * 14, y: (Math.random() - 0.5) * 6 });
        setTimeout(() => setGlitchOffset({ x: 0, y: 0 }), 50);
      }

      setTimeout(typeNext, delay);
    };

    const timer = setTimeout(typeNext, 180);
    return () => clearTimeout(timer);
  }, [phase, playTypingKeystrokeSound, playEnterPunchSound]);

  // ══ OPTION B: Cinematic pan tracking during typing ══
  useEffect(() => {
    if (layoutMode !== "cinematic-pan") return;
    if (phase !== "typing" && phase !== "surge" && phase !== "hold") return;

    const updatePan = () => {
      if (!textWrapperRef.current || !containerRef.current) return;
      const textW = textWrapperRef.current.scrollWidth;
      const containerW = containerRef.current.offsetWidth;
      const cursorIdx = charIndexRef.current;

      const ratio = Math.min(cursorIdx / FULL_TEXT.length, 1);
      const cursorX = textW * ratio;

      let targetPan = containerW / 2 - cursorX;
      const minPan = containerW - textW - 48;
      const maxPan = 48;
      targetPan = Math.max(minPan, Math.min(maxPan, targetPan));

      setPanX(targetPan);
    };

    updatePan();
    window.addEventListener("resize", updatePan);
    return () => window.removeEventListener("resize", updatePan);
  }, [layoutMode, phase]);

  useEffect(() => {
    if (layoutMode !== "cinematic-pan") return;
    if (phase !== "surge" && phase !== "hold") return;

    if (!textWrapperRef.current || !containerRef.current) return;
    const textW = textWrapperRef.current.scrollWidth;
    const containerW = containerRef.current.offsetWidth;

    if (textW <= containerW - 80) {
      setPanX(0);
    } else {
      setPanX((containerW - textW) / 2);
    }
  }, [layoutMode, phase]);

  // ══ PHASE 3: POWER SURGE & LOCK-IN ══
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

  // ══ PHASE 4: STAGE 1 PAUSE (0.4s PAUSE WITH GLOW INTENSITY PULSE) ══
  useEffect(() => {
    if (phase !== "hold") return;
    const timer = setTimeout(() => setPhase("warp"), 400); // Module 5 Stage 1: 0.4s pause
    return () => clearTimeout(timer);
  }, [phase]);

  // ══ PHASE 5: STAGE 2 SPATIAL CAMERA WARP (SCALE 1.0 → 8.0 WITH RADIAL BLUR) ══
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
      const currentBlur = progress * 20; // radial motion blur 0px -> 20px

      setWarpScale(currentScale);
      setWarpOpacity(currentOpacity);
      setWarpBlur(currentBlur);

      // STAGE 3 HERO REVEAL: Overlap Stage 2 by 0.2s (trigger at progress >= 0.65)
      if (progress >= 0.65 && !hasTriggeredCompleteRef.current) {
        hasTriggeredCompleteRef.current = true;
        onComplete?.();
      }

      if (progress < 1) {
        panRafRef.current = requestAnimationFrame(warpLoop);
      }
    };

    panRafRef.current = requestAnimationFrame(warpLoop);
    return () => cancelAnimationFrame(panRafRef.current);
  }, [phase, onComplete]);

  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => setShowCursor((p) => !p), 530);
    return () => clearInterval(interval);
  }, []);

  // Occasional scanline sweep
  useEffect(() => {
    if (phase === "warp") return;
    let animInterval: ReturnType<typeof setInterval>;
    const interval = setInterval(() => {
      setScanlineY(0);
      animInterval = setInterval(() => {
        setScanlineY((y) => {
          if (y >= 110) {
            clearInterval(animInterval);
            return -10;
          }
          return y + 4;
        });
      }, 16);
    }, 4000 + Math.random() * 3000);
    return () => {
      clearInterval(interval);
      clearInterval(animInterval);
    };
  }, [phase]);

  // Derived display values
  const line1Text = displayText.slice(0, Math.min(displayText.length, LINE_1.length));
  const line2Text = displayText.length > LINE_1.length ? displayText.slice(LINE_1.length) : "";
  const cursorOnLine1 = phase === "typing" && displayText.length < LINE_1.length;
  const cursorOnLine2 = phase === "typing" && displayText.length >= LINE_1.length && displayText.length < FULL_TEXT.length;

  const progressPercent =
    phase === "boot"
      ? Math.round(((bootIndex + 1) / BOOT_LINES.length) * 100)
      : phase === "typing"
      ? Math.round((displayText.length / FULL_TEXT.length) * 100)
      : 100;

  const statusLabel =
    phase === "boot"
      ? `SYSTEM BOOT ${Math.round(((bootIndex + 1) / BOOT_LINES.length) * 100)}%`
      : phase === "typing"
      ? `NEURAL UPLINK ${Math.round((displayText.length / FULL_TEXT.length) * 100)}%`
      : phase === "surge"
      ? "POWER SURGE DETECTED"
      : phase === "hold"
      ? "INTERFACE STABILIZED"
      : "WARPING TO CORE...";

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
        className="relative flex flex-col items-center justify-center px-6 max-w-[85vw] mx-auto text-center"
        style={{
          perspective: "1200px",
          transform:
            layoutMode === "cinematic-pan"
              ? `translateX(${panX}px) scale(${warpScale})`
              : `scale(${warpScale})`,
          filter: `brightness(${brightness}) blur(${warpBlur}px)`,
          transformOrigin: "center center",
          willChange: "transform, filter",
          transition:
            phase === "surge" || phase === "hold"
              ? "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)"
              : undefined,
        }}
      >
        {layoutMode === "stacked" ? (
          <div ref={textWrapperRef} className="flex flex-col items-center gap-1 md:gap-2 max-w-[85vw] mx-auto">
            {/* Line 1: WELCOME TO */}
            <CinematicTextLine
              text={line1Text}
              isActive={cursorOnLine1}
              showCursor={showCursor}
              glitchOffset={glitchOffset}
              brightness={brightness}
              flickerOpacity={flickerOpacity}
              phase={phase}
            />

            {/* Line 2: MY PORTFOLIO — materializes with cinematic entrance */}
            {phase !== "boot" && (
              <div
                style={{
                  opacity: line2Text.length > 0 ? 1 : 0,
                  transform: line2Text.length > 0 ? "translateY(0)" : "translateY(24px)",
                  transition: "opacity 0.5s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <CinematicTextLine
                  text={line2Text || "​"}
                  isActive={cursorOnLine2}
                  showCursor={showCursor}
                  glitchOffset={glitchOffset}
                  brightness={brightness}
                  flickerOpacity={flickerOpacity}
                  phase={phase}
                />
              </div>
            )}
          </div>
        ) : (
          <div ref={textWrapperRef} className="inline-block max-w-[85vw] mx-auto">
            <CinematicTextLine
              text={displayText}
              isActive={phase === "typing" || phase === "boot"}
              showCursor={showCursor}
              glitchOffset={glitchOffset}
              brightness={brightness}
              flickerOpacity={flickerOpacity}
              phase={phase}
            />
          </div>
        )}

        {/* Subtitle */}
        <div
          className="mt-6 md:mt-8 transition-all duration-1000"
          style={{
            opacity: phase === "typing" || phase === "boot" ? 0 : 0.7,
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
              width: `${progressPercent}%`,
              transition: "width 0.3s ease-out",
              boxShadow: "0 0 8px rgba(255,0,51,0.5)",
            }}
          />
        </div>
        <p className="mt-3 font-mono text-[8px] uppercase tracking-[0.4em] text-[#ff0033]/30">
          {statusLabel}
        </p>
      </div>
    </div>
  );
}
