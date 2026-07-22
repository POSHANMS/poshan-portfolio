"use client";

import React, { useEffect, useState } from "react";

export default function HUDSystem() {
  const [latency, setLatency] = useState(12);
  const [hexBytes, setHexBytes] = useState("0x8F3A");
  const [nodeCount, setNodeCount] = useState(847);

  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(Math.floor(10 + Math.random() * 6));
      setHexBytes("0x" + Math.floor(Math.random() * 65535).toString(16).toUpperCase());
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      setNodeCount(document.querySelectorAll("*").length || 847);
    }
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-20 font-mono text-[9px] text-[#ff0033]/80 p-6 flex flex-col justify-between select-none">
      {/* TOP BAR */}
      <div className="flex justify-between items-start">
        {/* Top Left Telemetry */}
        <div className="bg-black/40 backdrop-blur-sm border border-[#ff0033]/30 p-3 rounded space-y-1 shadow-[0_0_15px_rgba(255,0,51,0.15)] animate-fade-in">
          <div className="flex items-center gap-2 font-bold text-white tracking-widest text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff0033] animate-ping" />
            SECURE_NET_CONNECTION
          </div>
          <div className="text-red-400/90">// PORTAL_GATE: [CHARGING...]</div>
          <div className="flex gap-4 text-[9px] pt-1 text-red-500/80">
            <span>UPLINK: STABLE</span>
            <span>LATENCY: {latency}ms</span>
            <span>LOSS: 0.00%</span>
          </div>
        </div>

        {/* Top Right Security */}
        <div className="bg-black/40 backdrop-blur-sm border border-[#ff0033]/30 p-3 rounded space-y-1 text-right shadow-[0_0_15px_rgba(255,0,51,0.15)] animate-fade-in">
          <div className="font-bold text-white tracking-widest text-[10px]">
            STATUS: ACTIVE // G-256
          </div>
          <div className="text-red-400/90">KEY_STREAM: {hexBytes}</div>
          <div className="flex gap-3 justify-end text-[9px] pt-1 text-red-500/80">
            <span>THREAT: NULL</span>
            <span>DIM_LOCK: HOLD</span>
          </div>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="flex justify-between items-end">
        {/* Bottom Left Telemetry Pill */}
        <div className="bg-black/40 backdrop-blur-sm border border-[#ff0033]/30 px-3.5 py-1.5 rounded shadow-[0_0_15px_rgba(255,0,51,0.15)] text-[9px] text-red-400/90 font-mono flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff0033] animate-pulse" />
          <span className="font-bold text-white">NODES:</span> {nodeCount} / {nodeCount}
          <span className="text-[#ff0033]/40">|</span>
          <span className="font-bold text-white">CORRUPTION:</span> 0.00%
        </div>

        {/* Bottom Center Version — Dead Centered */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center bg-black/40 backdrop-blur-sm border border-[#ff0033]/30 px-4 py-2 rounded text-[9px] text-red-400/80 shadow-[0_0_15px_rgba(255,0,51,0.15)]">
          <span className="font-bold text-white">POSHAN MS PORTFOLIO</span> v1.0.0 · NODE_ENV = PRODUCTION
        </div>
      </div>
    </div>
  );
}
