"use client";

import React from "react";
import { BarChart3, Coffee, Code2, Rocket } from "lucide-react";
import { motion } from "framer-motion";

const stats = [
  { icon: Rocket, value: "3+", label: "Years Experience" },
  { icon: Code2, value: "20+", label: "Projects Completed" },
  { icon: BarChart3, value: "10K+", label: "Lines of Code" },
  { icon: Coffee, value: "24/7", label: "Coffee Fueled" },
];

export default function StatsPanel({ scrollProgress = 0 }: { scrollProgress?: number }) {
  const isHeroVisible = scrollProgress < 0.08;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isHeroVisible ? 1 : 0, y: isHeroVisible ? 0 : 24 }}
      transition={{ duration: 0.35, delay: isHeroVisible ? 2.4 : 0 }}
      className="fixed bottom-[4.25rem] left-1/2 z-20 hidden -translate-x-1/2 pointer-events-none lg:block"
    >
      <div
        className="flex h-[100px] w-[760px] items-center gap-8 overflow-hidden rounded-lg px-[30px] py-5"
        style={{
          background: "linear-gradient(135deg, rgba(16, 24, 52, 0.62), rgba(8, 10, 26, 0.78))",
          backdropFilter: "blur(18px) saturate(1.25)",
          WebkitBackdropFilter: "blur(18px) saturate(1.25)",
          border: "1px solid rgba(0, 212, 255, 0.38)",
          boxShadow: "0 0 28px rgba(0, 212, 255, 0.2), inset 0 0 28px rgba(139, 92, 246, 0.12)",
        }}
      >
        <div className="border-r border-white/10 pr-6">
          <span className="font-mono text-[11px] tracking-widest text-[#00d4ff]/90">{"// STATS"}</span>
        </div>

        <div className="grid flex-1 grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 2.6 + index * 0.1 }}
              className="flex min-w-0 items-center gap-3.5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#00d4ff]/35 bg-white/8 text-[#00d4ff] shadow-[0_0_18px_rgba(0,212,255,0.18)]">
                <stat.icon size={19} />
              </span>
              <div className="min-w-0">
                <div className="text-2xl font-black leading-none text-white">{stat.value}</div>
                <div className="mt-1.5 text-[10px] leading-tight text-white/68">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
