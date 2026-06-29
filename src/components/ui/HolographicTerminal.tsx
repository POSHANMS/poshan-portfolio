"use client";

import React from "react";
import { motion } from "framer-motion";

export default function HolographicTerminal({ scrollProgress = 0 }: { scrollProgress?: number }) {
  const isHeroVisible = scrollProgress < 0.08;

  return (
    <motion.div
      initial={{ opacity: 0, x: 28, y: 8 }}
      animate={{
        opacity: isHeroVisible ? 0.86 : 0,
        x: isHeroVisible ? 0 : 24,
        y: isHeroVisible ? 0 : 10,
      }}
      transition={{ duration: 0.45, delay: isHeroVisible ? 1.15 : 0 }}
      className="pointer-events-none fixed right-[7vw] top-[35vh] z-20 hidden w-[330px] overflow-hidden rounded-md border border-cyan-400/35 bg-[#050817]/45 font-mono text-[11px] text-white/78 shadow-[0_0_32px_rgba(0,212,255,0.18)] backdrop-blur-xl xl:block"
    >
      <div className="flex items-center justify-between border-b border-cyan-400/20 bg-cyan-400/[0.06] px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-cyan-200">
        <span>dev console</span>
        <span className="text-pink-300/80">live</span>
      </div>

      <div className="grid grid-cols-[1.12fr_0.88fr]">
        <div className="space-y-1.5 border-r border-cyan-400/15 px-4 py-3">
          <p><span className="text-pink-300">const</span> profile = {"{"}</p>
          <p className="pl-3"><span className="text-cyan-300">name</span>: <span className="text-emerald-300">&quot;Poshan MS&quot;</span>,</p>
          <p className="pl-3"><span className="text-cyan-300">role</span>: <span className="text-emerald-300">&quot;Full Stack Engineer&quot;</span>,</p>
          <p className="pl-3"><span className="text-cyan-300">stack</span>: [<span className="text-violet-300">&quot;React&quot;</span>, <span className="text-violet-300">&quot;Node&quot;</span>]</p>
          <p>{"};"}</p>
          <p><span className="text-pink-300">export</span> <span className="text-cyan-300">default</span> build;</p>
        </div>

        <div className="space-y-1.5 px-4 py-3 text-emerald-300">
          <p><span className="text-cyan-300">$</span> npm run dev</p>
          <p className="text-white/58">Next.js ready</p>
          <p>Local: 3000</p>
          <p className="text-white/58">compiled</p>
          <p className="text-pink-300">portfolio online</p>
          <motion.span
            animate={{ opacity: [1, 0.25, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="inline-block h-3 w-2 bg-emerald-300 shadow-[0_0_14px_rgba(0,255,136,0.75)]"
          />
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent" />
    </motion.div>
  );
}
