"use client";

import React, { useState } from "react";
import { ArrowUpRight } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="fixed left-0 top-0 z-50 w-full border-b border-white/[0.04] bg-[#050508]/35 px-6 py-4 backdrop-blur-md md:px-12">
      <div className="mx-auto flex max-w-[96rem] items-center justify-between">
        {/* Brand Logo */}
        <div className="flex select-none items-center space-x-3" style={{ animation: "navItemSlideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}>
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#ff1744]/20 bg-[#ff1744]/5 shadow-[0_0_18px_rgba(255,23,68,0.18)]">
            <svg width="30" height="34" viewBox="0 0 40 45" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_10px_var(--electric-blue)]">
              <path d="M5 5H22C28.6274 5 34 10.3726 34 17C34 23.6274 28.6274 29 22 29H13V40" stroke="#ff1744" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13 17H22C23.6569 17 25 15.6569 25 14C25 12.3431 23.6569 11 22 11H13V17Z" fill="#800010" />
            </svg>
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-bold tracking-[0.28em] text-white md:text-sm">POSHAN MS</span>
            <span className="font-mono text-[8px] font-medium uppercase tracking-[0.24em] text-[var(--electric-blue)] text-glow-blue md:text-[9px]">
              Cinematic Portfolio
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center space-x-4" style={{ animation: "navItemSlideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards" }}>
          <a
            href="mailto:siddeshwaraprasanna5@gmail.com"
            className="group flex items-center space-x-1.5 rounded-full border border-[var(--electric-blue)] bg-transparent px-5 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-white shadow-[0_0_16px_rgba(255,23,68,0.2)] transition-all duration-300 hover:border-[var(--hot-pink)] hover:bg-white/[0.02] hover:text-[var(--hot-pink)] hover:shadow-[0_0_18px_rgba(204,17,51,0.24)] md:text-xs"
          >
            <span>LET&apos;S CONNECT</span>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>
    </nav>
  );
}