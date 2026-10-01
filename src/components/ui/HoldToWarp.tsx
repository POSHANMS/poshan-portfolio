"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

const HOLD_DURATION = 1450;

export default function HoldToWarp({
  onComplete,
  label = "Hold to\nwarp",
  idleLabel = "CORE LINK",
  ariaLabel = "Hold to launch into the project core",
  tapToComplete = false,
  compact = false,
  className = "",
}: {
  onComplete: () => void;
  label?: string;
  idleLabel?: string;
  ariaLabel?: string;
  tapToComplete?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const [progress, setProgress] = useState(0);
  const activePointer = useRef<number | null>(null);
  const frame = useRef<number | null>(null);
  const startedAt = useRef(0);

  const stopCharging = useCallback(() => {
    activePointer.current = null;
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = null;
    setProgress(0);
  }, []);

  const beginCharging = useCallback((pointerId?: number) => {
    if (activePointer.current !== null) return;
    activePointer.current = pointerId ?? -1;
    startedAt.current = performance.now();

    const charge = (time: number) => {
      if (activePointer.current === null) return;
      const next = Math.min(1, (time - startedAt.current) / HOLD_DURATION);
      setProgress(next);
      if (next >= 1) {
        activePointer.current = null;
        frame.current = null;
        onComplete();
        return;
      }
      frame.current = requestAnimationFrame(charge);
    };

    frame.current = requestAnimationFrame(charge);
  }, [onComplete]);

  const beginPointerCharging = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    beginCharging(event.pointerId);
  }, [beginCharging]);

  useEffect(() => stopCharging, [stopCharging]);

  const circumference = 2 * Math.PI * 45;

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={`group relative grid ${compact ? "h-24 w-24" : "h-36 w-36"} place-items-center rounded-full border border-[#ff6b7f]/55 bg-black/45 font-mono text-[10px] uppercase tracking-[0.2em] text-white shadow-[0_0_48px_rgba(255,23,68,0.2)] backdrop-blur-md transition hover:border-[#ffe4ea] hover:bg-[#ff1744]/14 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffe4ea] ${className}`}
      onPointerDown={beginPointerCharging}
      onPointerUp={stopCharging}
      onPointerCancel={stopCharging}
      onLostPointerCapture={stopCharging}
      onClick={() => {
        if (tapToComplete) onComplete();
      }}
      onKeyDown={(event) => {
        if (!event.repeat && (event.key === " " || event.key === "Enter")) beginCharging();
      }}
      onKeyUp={(event) => {
        if (event.key === " " || event.key === "Enter") stopCharging();
      }}
    >
      <svg className="absolute inset-2 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#fff0f2"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          style={{ filter: "drop-shadow(0 0 7px rgba(255,236,239,0.9))", transition: progress === 0 ? "stroke-dashoffset 220ms ease-out" : "none" }}
        />
      </svg>
      <span className="relative grid gap-2 text-center leading-4">
        <span className="text-[#ffb5c0]">{progress > 0 ? `${Math.round(progress * 100)}%` : idleLabel}</span>
        <span className="whitespace-pre-line font-bold text-white">{label}</span>
      </span>
    </button>
  );
}
