"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * CinematicHUD
 * ─────────────────────────────────────────────────────────
 * A full-screen, non-blocking cinematic overlay that fades in
 * after the 3D scene reveals. Contains:
 *
 *  ① TIMECODE SIDEBAR — left edge      (frame counter)
 *  ② CORNER BRACKETS  — all 4 corners  (viewfinder frame)
 *  ③ SCROLL HINT      — bottom center before first scroll
 *  ④ STATUS BADGE     — bottom right   (REC indicator)
 * ─────────────────────────────────────────────────────────
 */

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

const sceneLabels = [
  { progress: 0, act: "ACT I", label: "HERO" },
  { progress: 0.22, act: "ACT II", label: "INSIDE THE LAPTOP" },
  { progress: 0.66, act: "ACT III", label: "SKILL CONSTELLATION" },
  { progress: 0.86, act: "ACT IV", label: "PROJECTS" },
  { progress: 0.94, act: "ACT V", label: "EDUCATION PRACTICE" },
  { progress: 0.985, act: "ACT VI", label: "CONTACT" },
];

export default function CinematicHUD({ visible, scrollProgress = 0 }: { visible: boolean; scrollProgress?: number }) {
  const timecode = useTimecode();
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [scrollHintOpacity, setScrollHintOpacity] = useState(1);
  const [hasScrolled, setHasScrolled] = useState(false);
  const scrollHintDismissed = useRef(false);

  // Delay scroll hint appearance
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setShowScrollHint(true), 1800);
    return () => clearTimeout(t);
  }, [visible]);

  // Fade hint after first scroll/wheel interaction
  useEffect(() => {
    const onWheel = () => {
      if (scrollHintDismissed.current) return;
      scrollHintDismissed.current = true;
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

  const activeScene = sceneLabels.reduce((best, current) =>
    Math.abs(scrollProgress - current.progress) < Math.abs(scrollProgress - best.progress) ? current : best,
  );

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

      {/* ─── BOTTOM CENTER: FIRST-ENTRY SCROLL HINT ─── */}
      {showScrollHint && !hasScrolled && scrollProgress < 0.08 && (
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 transition-all duration-700" style={{ opacity: scrollHintOpacity }}>
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
      )}

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
          {activeScene.act}
        </span>
        <span className="font-mono text-[7px] text-white/20 select-none">
          {activeScene.label}
        </span>
      </div>
    </div>
  );
}
