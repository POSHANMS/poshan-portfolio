"use client";

import React, { useEffect, useRef } from "react";

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ring1Ref = useRef<HTMLDivElement>(null);
  const ring2Ref = useRef<HTMLDivElement>(null);
  const ring3Ref = useRef<HTMLDivElement>(null);
  const coordsRef = useRef<HTMLDivElement>(null);
  
  const mouseRef = useRef({ x: 0, y: 0 });
  const pos1 = useRef({ x: 0, y: 0 });
  const pos2 = useRef({ x: 0, y: 0 });
  const pos3 = useRef({ x: 0, y: 0 });
  const isHoveredRef = useRef(false);

  useEffect(() => {
    // Check if device supports fine pointers (like a mouse/trackpad)
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (!isFinePointer) return;

    const dot = dotRef.current;
    const c1 = ring1Ref.current;
    const c2 = ring2Ref.current;
    const c3 = ring3Ref.current;
    const coords = coordsRef.current;
    if (!dot || !c1 || !c2 || !c3 || !coords) return;

    [dot, c1, c2, c3, coords].forEach((el) => {
      el.style.opacity = "0";
    });

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      [dot, c1, c2, c3, coords].forEach((el) => {
        el.style.opacity = "1";
      });
      
      // Dot and HUD coordinates follow instantly for zero latency feel
      dot.style.transform = `translate3d(${e.clientX - 2}px, ${e.clientY - 2}px, 0)`;
      coords.style.transform = `translate3d(${e.clientX + 16}px, ${e.clientY + 8}px, 0)`;
      coords.innerText = `[${String(e.clientX).padStart(3, "0")}, ${String(e.clientY).padStart(3, "0")}]`;
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const isInteractive = 
        target.tagName === "A" || 
        target.tagName === "BUTTON" || 
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        !!target.closest("a") || 
        !!target.closest("button") || 
        !!target.closest('[role="button"]') ||
        target.classList.contains("hover-target") ||
        target.getAttribute("data-magnetic") !== null;

      isHoveredRef.current = isInteractive;

      if (isInteractive) {
        c1.classList.add("cursor-expand");
        c2.classList.add("cursor-expand");
        c3.classList.add("cursor-expand");
        dot.classList.add("dot-expand");
        coords.classList.add("coords-hover");
      } else {
        c1.classList.remove("cursor-expand");
        c2.classList.remove("cursor-expand");
        c3.classList.remove("cursor-expand");
        dot.classList.remove("dot-expand");
        coords.classList.remove("coords-hover");
      }
    };

    const handleMouseDown = () => {
      [c1, c2, c3].forEach((c) => c.classList.add("cursor-click"));
      coords.classList.add("coords-click");
    };

    const handleMouseUp = () => {
      [c1, c2, c3].forEach((c) => c.classList.remove("cursor-click"));
      coords.classList.remove("coords-click");
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseover", handleMouseOver);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    let rafId: number;
    const lerp = (start: number, end: number, amt: number) => (1 - amt) * start + amt * end;

    const render = () => {
      const tx = mouseRef.current.x;
      const ty = mouseRef.current.y;

      // Parallax lag for rings using separate LERP factors
      pos1.current.x = lerp(pos1.current.x, tx, 0.18);
      pos1.current.y = lerp(pos1.current.y, ty, 0.18);
      c1.style.transform = `translate3d(${pos1.current.x - 8}px, ${pos1.current.y - 8}px, 0)`;

      pos2.current.x = lerp(pos2.current.x, tx, 0.11);
      pos2.current.y = lerp(pos2.current.y, ty, 0.11);
      c2.style.transform = `translate3d(${pos2.current.x - 16}px, ${pos2.current.y - 16}px, 0)`;

      pos3.current.x = lerp(pos3.current.x, tx, 0.06);
      pos3.current.y = lerp(pos3.current.y, ty, 0.06);
      c3.style.transform = `translate3d(${pos3.current.x - 24}px, ${pos3.current.y - 24}px, 0)`;

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      {/* Central Solid Crimson Dot */}
      <div ref={dotRef} className="pointer-events-none fixed top-0 left-0 z-[9999] hidden md:block will-change-transform">
        <div className="h-1 w-1 rounded-full bg-[#ff1744] shadow-[0_0_6px_#ff1744] transition-all duration-150 dot-core" />
      </div>
      
      {/* Middle Ring - Clockwise Rotation + Concentric Crosshairs */}
      <div ref={ring1Ref} className="pointer-events-none fixed top-0 left-0 z-[9998] hidden md:block will-change-transform">
        <div className="h-4 w-4 rounded-full border border-[#ff1744]/65 animate-[spin_5s_linear_infinite] cursor-ring relative">
          {/* HUD Crosshair ticks */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-0.5 bg-[#ff1744]/65" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-0.5 bg-[#ff1744]/65" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0.5 bg-[#ff1744]/65" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-0.5 bg-[#ff1744]/65" />
        </div>
      </div>
      
      {/* Outer Ring - Dashed, Counter-Clockwise Rotation + Heartbeat breathing */}
      <div ref={ring2Ref} className="pointer-events-none fixed top-0 left-0 z-[9998] hidden md:block will-change-transform animate-[pulse_2.2s_ease-in-out_infinite]">
        <div className="h-8 w-8 rounded-full border border-dashed border-[#ff1744]/40 animate-[spin-reverse_9s_linear_infinite] cursor-ring" />
      </div>
      
      {/* Outermost Ring */}
      <div ref={ring3Ref} className="pointer-events-none fixed top-0 left-0 z-[9997] hidden md:block will-change-transform">
        <div className="h-12 w-12 rounded-full border border-[#ff1744]/22 transition-all duration-300 cursor-ring" />
      </div>

      {/* Cyberpunk HUD Coordinates */}
      <div
        ref={coordsRef}
        className="pointer-events-none fixed top-0 left-0 z-[10000] hidden md:block text-[7px] text-[#ff1744]/60 font-mono tracking-wider select-none transition-colors duration-200"
        style={{ textShadow: "0 0 4px rgba(255, 23, 68, 0.4)" }}
      >
        [000, 000]
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { 
          from { transform: rotate(0deg); } 
          to { transform: rotate(360deg); } 
        }
        @keyframes spin-reverse { 
          from { transform: rotate(360deg); } 
          to { transform: rotate(0deg); } 
        }
        .cursor-expand .cursor-ring {
          border-color: #00d4ff !important;
          box-shadow: 0 0 12px #00d4ff !important;
        }
        .dot-expand .dot-core {
          background-color: #ff2d78 !important;
          box-shadow: 0 0 10px #ff2d78 !important;
          transform: scale(1.6);
        }
        .coords-hover {
          color: #00d4ff !important;
          text-shadow: 0 0 6px rgba(0, 212, 255, 0.6) !important;
        }
        .cursor-click .cursor-ring {
          border-color: #ff2d78 !important;
          box-shadow: 0 0 16px #ff2d78 !important;
          transform: scale(0.85);
        }
        .coords-click {
          color: #ff2d78 !important;
          text-shadow: 0 0 8px rgba(255, 45, 120, 0.8) !important;
        }
      ` }} />
    </>
  );
}
