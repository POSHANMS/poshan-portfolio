"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * CinematicHUD
 * ─────────────────────────────────────────────────────────
 * A full-screen, non-blocking cinematic overlay that fades in
 * after the 3D scene reveals. Contains:
 *
 *  ① FILM-STRIP RULER — bottom center  (footage counter)
 *  ② TIMECODE SIDEBAR — left edge      (frame counter)
 *  ③ CORNER BRACKETS  — all 4 corners  (viewfinder frame)
 *  ④ SCROLL HINT      — bottom center above ruler
 *  ⑤ STATUS BADGE     — bottom right   (REC indicator)
 * ─────────────────────────────────────────────────────────
 */

const RULER_TICKS = 41; // total tick slots visible
const CENTER = Math.floor(RULER_TICKS / 2);

function useAnimatedOffset() {
  return 0;
}

function useTimecode() {
  const [tc, setTc] = useState("00:00:00:00");
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    let raf: number;
    const tick = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const ms = ts - startRef.current;
      const totalFrames = Math.floor((ms / 1000) * 24);
      const h = Math.floor(totalFrames / (24 * 3600)).toString().padStart(2, "0");
      const m = Math.floor((totalFrames / (24 * 60)) % 60).toString().padStart(2, "0");
      const s = Math.floor((totalFrames / 24) % 60).toString().padStart(2, "0");
      const f = (totalFrames % 24).toString().padStart(2, "0");
      setTc(`${h}:${m}:${s}:${f}`);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return tc;
}

function FilmRuler({ offset }: { offset: number }) {
  const ticks = Array.from({ length: RULER_TICKS });

  return (
    <div className="relative flex items-end justify-center gap-0" style={{ width: "min(680px, 90vw)", height: 40 }}>
      {ticks.map((_, i) => {
        const pos = (i - offset + RULER_TICKS) % RULER_TICKS;
        // Label every 5 ticks
        const isMajor = Math.round(pos) % 5 === 0;
        const isCenter = i === CENTER;
        const labelValue = Math.round((i - CENTER - offset) * 2.5);

        return (
          <div key={i} className="flex flex-col items-center" style={{ flex: "1 0 0" }}>
            {/* Label on major ticks */}
            {isMajor && (
              <span
                className="font-mono text-[7px] text-white/25 mb-0.5 select-none"
                style={{ letterSpacing: "0.05em" }}
              >
                {labelValue > 0 ? `+${labelValue}` : labelValue}
              </span>
            )}
            {!isMajor && <span className="mb-0.5" style={{ height: 10 }} />}

            {/* Tick mark */}
            <div
              style={{
                width: isCenter ? 2 : 1,
                height: isMajor ? (isCenter ? 22 : 16) : 9,
                background: isCenter
                  ? "#ff1744"
                  : isMajor
                  ? "rgba(255,255,255,0.45)"
                  : "rgba(255,255,255,0.15)",
                boxShadow: isCenter ? "0 0 6px rgba(255,23,68,0.8)" : undefined,
                borderRadius: 1,
              }}
            />
          </div>
        );
      })}

      {/* Center playhead triangle */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{ zIndex: 10 }}
      >
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M5 0L10 8H0L5 0Z" fill="#ff1744" fillOpacity="0.9" />
        </svg>
      </div>
    </div>
  );
}

function CornerBracket({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const isLeft = position === "tl" || position === "bl";
  const isTop = position === "tl" || position === "tr";

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        top: isTop ? 72 : undefined,
        bottom: isTop ? undefined : 80,
        left: isLeft ? 28 : undefined,
        right: isLeft ? undefined : 28,
        width: 40,
        height: 40,
      }}
    >
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        {position === "tl" && (
          <>
            <path d="M0 20V0H20" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          </>
        )}
        {position === "tr" && (
          <>
            <path d="M40 20V0H20" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          </>
        )}
        {position === "bl" && (
          <>
            <path d="M0 20V40H20" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          </>
        )}
        {position === "br" && (
          <>
            <path d="M40 20V40H20" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          </>
        )}
      </svg>
    </div>
  );
}

export default function CinematicHUD({ visible }: { visible: boolean }) {
  const offset = useAnimatedOffset();
  const timecode = useTimecode();
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [scrollHintOpacity, setScrollHintOpacity] = useState(1);
  const [hasScrolled, setHasScrolled] = useState(false);

  // Delay scroll hint appearance
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setShowScrollHint(true), 1800);
    return () => clearTimeout(t);
  }, [visible]);

  // Fade hint after first scroll/wheel interaction
  useEffect(() => {
    const onWheel = () => {
      setHasScrolled(true);
      setScrollHintOpacity(0);
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchmove", onWheel, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", onWheel);
    };
  }, []);

  // Blinking REC dot
  const [recVisible, setRecVisible] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setRecVisible((v) => !v), 800);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-20 transition-opacity duration-1000"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {/* ─── CORNER BRACKETS ─────────────────────────── */}
      <CornerBracket position="tl" />
      <CornerBracket position="tr" />
      <CornerBracket position="bl" />
      <CornerBracket position="br" />

      {/* ─── LEFT TIMECODE SIDEBAR ───────────────────── */}
      <div
        className="absolute left-7 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4"
        style={{ opacity: 0.55 }}
      >
        {/* Vertical label */}
        <span
          className="font-mono text-[8px] uppercase tracking-[0.35em] text-white/40 select-none"
          style={{ writingMode: "vertical-lr", transform: "rotate(180deg)", letterSpacing: "0.3em" }}
        >
          TIMECODE
        </span>

        {/* Frame counter */}
        <div
          className="font-mono text-[10px] text-white/55 select-none tabular-nums"
          style={{ writingMode: "vertical-lr", transform: "rotate(180deg)", letterSpacing: "0.12em" }}
        >
          {timecode}
        </div>

        {/* Vertical thin line */}
        <div className="w-px bg-white/10" style={{ height: 80 }} />

        {/* Small crosshair */}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="5" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" />
          <line x1="6" y1="0" x2="6" y2="4" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" />
          <line x1="6" y1="8" x2="6" y2="12" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" />
          <line x1="0" y1="6" x2="4" y2="6" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" />
          <line x1="8" y1="6" x2="12" y2="6" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" />
        </svg>
      </div>

      {/* ─── BOTTOM CENTER: SCROLL HINT + FILM RULER ─── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">

        {/* Scroll hint */}
        <div
          className="flex flex-col items-center gap-2 transition-all duration-700"
          style={{
            opacity: showScrollHint && !hasScrolled ? scrollHintOpacity : 0,
            transform: showScrollHint ? "translateY(0)" : "translateY(8px)",
          }}
        >
          <span className="font-mono text-[9px] uppercase tracking-[0.5em] text-white/35 select-none">
            DRAG · SCROLL TO EXPLORE
          </span>
          {/* Animated chevrons */}
          <div className="flex gap-1 opacity-60">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 1,
                  height: 8 + i * 3,
                  background: i === 2 ? "rgba(255,23,68,0.7)" : "rgba(255,255,255,0.25)",
                  borderRadius: 1,
                  animation: `pulse 1.4s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Film ruler with BZ labels */}
        <div className="flex flex-col items-center gap-1">
          {/* BZ label row */}
          <div
            className="flex justify-between font-mono text-[7px] text-white/20 select-none"
            style={{ width: "min(680px, 90vw)" }}
          >
            <span>-100 BZ</span>
            <span>-75</span>
            <span>-50</span>
            <span>-25</span>
            <span style={{ color: "rgba(255,23,68,0.5)" }}>± 0</span>
            <span>+25</span>
            <span>+50</span>
            <span>+75</span>
            <span>+100 BZ</span>
          </div>

          {/* Animated tick ruler */}
          <FilmRuler offset={offset} />

          {/* Bottom line */}
          <div
            className="bg-white/10"
            style={{ width: "min(680px, 90vw)", height: 1 }}
          />
        </div>
      </div>

      {/* ─── BOTTOM RIGHT: REC STATUS ─────────────────── */}
      <div
        className="absolute bottom-8 right-8 flex items-center gap-2"
        style={{ opacity: 0.6 }}
      >
        <div
          className="h-2 w-2 rounded-full bg-[#ff1744]"
          style={{
            opacity: recVisible ? 1 : 0.15,
            boxShadow: recVisible ? "0 0 6px rgba(255,23,68,0.9)" : "none",
            transition: "opacity 0.2s, box-shadow 0.2s",
          }}
        />
        <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/40 select-none">
          REC
        </span>
      </div>

      {/* ─── TOP RIGHT: SCENE LABEL ───────────────────── */}
      <div
        className="absolute right-8 flex flex-col items-end gap-0.5"
        style={{ top: 80, opacity: 0.45 }}
      >
        <span className="font-mono text-[8px] uppercase tracking-[0.4em] text-white/35 select-none">
          ACT I
        </span>
        <span className="font-mono text-[7px] text-white/20 select-none">
          HERO STATION
        </span>
      </div>
    </div>
  );
}