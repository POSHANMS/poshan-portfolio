"use client";

import React, { useEffect, useRef } from "react";

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  
  const mouseRef = useRef({ x: 0, y: 0 });
  const ringPosRef = useRef({ x: 0, y: 0 });
  const isHoveredRef = useRef(false);

  useEffect(() => {
    // Check if device supports fine pointers (like a mouse/trackpad)
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (!isFinePointer) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // Initially hide cursor elements until first mouse move to prevent flash
    dot.style.opacity = "0";
    ring.style.opacity = "0";

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;

      dot.style.opacity = "1";
      ring.style.opacity = "1";

      // Directly update dot position for zero-latency feel
      dot.style.transform = `translate3d(${e.clientX - 4}px, ${e.clientY - 4}px, 0)`;
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Detect interactive elements
      const isInteractive = 
        target.tagName === "A" || 
        target.tagName === "BUTTON" || 
        target.closest("a") || 
        target.closest("button") || 
        target.closest('[role="button"]') ||
        target.classList.contains("hover-target") ||
        target.getAttribute("data-magnetic") !== null;

      if (isInteractive) {
        isHoveredRef.current = true;
        ring.classList.add("cursor-morph");
        dot.classList.add("dot-morph");
      } else {
        isHoveredRef.current = false;
        ring.classList.remove("cursor-morph");
        dot.classList.remove("dot-morph");
      }
    };

    const handleMouseDown = () => {
      ring.classList.add("cursor-click");
    };

    const handleMouseUp = () => {
      ring.classList.remove("cursor-click");
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseover", handleMouseOver);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    // Smooth LERP (Linear Interpolation) loop for the outer ring lag effect
    let animationFrameId: number;
    const lerp = (start: number, end: number, amt: number) => (1 - amt) * start + amt * end;

    const render = () => {
      // Lerp ring coordinates toward target mouse coordinates
      // 0.15 is the speed of follow (lower = slower lag)
      const targetX = mouseRef.current.x;
      const targetY = mouseRef.current.y;

      ringPosRef.current.x = lerp(ringPosRef.current.x, targetX, 0.15);
      ringPosRef.current.y = lerp(ringPosRef.current.y, targetY, 0.15);

      // Apply coordinates offset by half of ring's normal size (24px / 2 = 12px)
      ring.style.transform = `translate3d(${ringPosRef.current.x - 12}px, ${ringPosRef.current.y - 12}px, 0)`;

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      {/* Central glowing white orb */}
      <div
        ref={dotRef}
        className="pointer-events-none fixed top-0 left-0 z-[9999] h-2 w-2 rounded-full bg-white shadow-[0_0_10px_#fff,_0_0_20px_var(--electric-blue)] transition-transform duration-[0.05s] ease-out will-change-transform hidden md:block"
        style={{ transform: "translate3d(-100px, -100px, 0)" }}
      />
      {/* Outer LERP ring (Light trail & hover morph) */}
      <div
        ref={ringRef}
        className="pointer-events-none fixed top-0 left-0 z-[9998] h-6 w-6 rounded-full border border-white/40 bg-transparent transition-all duration-300 ease-out will-change-transform hidden md:block"
        style={{
          transform: "translate3d(-100px, -100px, 0)",
          boxShadow: "0 0 8px rgba(255, 255, 255, 0.1)",
        }}
      />
      
      {/* Morph styling rules locally managed */}
      <style jsx global>{`
        .cursor-morph {
          width: 48px !important;
          height: 48px !important;
          border-color: var(--electric-blue) !important;
          box-shadow: 0 0 15px var(--electric-blue), inset 0 0 10px rgba(0, 212, 255, 0.3) !important;
          margin-top: -12px;
          margin-left: -12px;
          background-color: rgba(0, 212, 255, 0.05) !important;
        }
        .dot-morph {
          transform: scale(0.5) !important;
          background-color: var(--hot-pink) !important;
          shadow-[0_0_10px_#ff2d78] !important;
        }
        .cursor-click {
          transform: scale(0.7) !important;
          border-color: var(--hot-pink) !important;
          background-color: rgba(255, 45, 120, 0.2) !important;
        }
      `}</style>
    </>
  );
}
