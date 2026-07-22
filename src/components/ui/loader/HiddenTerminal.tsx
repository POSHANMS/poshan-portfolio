"use client";

import React, { useState, useEffect, useRef } from "react";

interface HiddenTerminalProps {
  onOverride?: () => void;
  onThemeChange?: (color: string) => void;
}

export default function HiddenTerminal({ onOverride, onThemeChange }: HiddenTerminalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [history, setHistory] = useState<string[]>([
    "NEURAL TERMINAL v2.4.0 — ARCHITECT KERNEL",
    "Type 'help' to display available operational commands.",
    "---------------------------------------------------",
  ]);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle terminal on '~' or '`' key, or any letter key if not focused elsewhere
      if (e.key === "`" || e.key === "~") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleCommand = (cmdStr: string) => {
    const raw = cmdStr.trim();
    if (!raw) return;
    const cmd = raw.toLowerCase();
    const newHistory = [...history, `> ${raw}`];

    switch (cmd) {
      case "help":
        newHistory.push(
          "AVAILABLE COMMANDS:",
          "  help     - List terminal commands",
          "  status   - Dump system hardware & memory telemetry",
          "  matrix   - Switch matrix rain theme (green/red/cyan/gold)",
          "  poshan   - Developer bio & credentials",
          "  override - Bypass preloader sequence immediately",
          "  clear    - Clear terminal output buffer",
          "  sudo     - Root authorization test"
        );
        break;
      case "status":
        newHistory.push(
          "SYSTEM TELEMETRY DUMP:",
          `  CORES: ${navigator.hardwareConcurrency || 8} logical threads`,
          `  MEMORY: ${(performance as any).memory ? Math.round((performance as any).memory.usedJSHeapSize / 1048576) + 'MB used' : '64MB heap allocated'}`,
          `  DISPLAY: ${window.innerWidth}x${window.innerHeight} @ DPR ${window.devicePixelRatio}`,
          "  UPLINK: STABLE 100Gbps (0.00% packet drop)",
          "  ENCRYPTION: G-256 QUANTUM LOCK"
        );
        break;
      case "matrix":
      case "theme":
        onThemeChange?.("#00ff88");
        newHistory.push(">> MATRIX RAIN THEME: EMERALD MATRIX ACTIVE [#00ff88]");
        break;
      case "poshan":
        newHistory.push(
          "=========================================",
          "  POSHAN MS — FULL STACK ENGINEER",
          "  Location: Karnataka, India",
          "  Specialties: React, Next.js, Node, Flask",
          "  Experience: 2+ Years | 20+ Completed Projects",
          "========================================="
        );
        break;
      case "override":
        newHistory.push(">> OVERRIDE COMMAND DETECTED. INITIATING BREACH...");
        onOverride?.();
        break;
      case "clear":
        setHistory([]);
        setInputVal("");
        return;
      case "sudo":
        newHistory.push(">> PERMISSION DENIED: Nice try, operative.");
        break;
      default:
        newHistory.push(`Command not recognized: '${raw}'. Type 'help' for options.`);
        break;
    }

    setHistory(newHistory);
    setInputVal("");
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-[300] pointer-events-auto px-3.5 py-1.5 bg-black/80 border border-[#ff0033]/60 rounded text-[10px] tracking-[0.2em] font-mono text-[#ff0033] shadow-[0_0_12px_rgba(255,0,51,0.4)] hover:bg-[#ff0033]/20 transition-all cursor-pointer flex items-center gap-2"
      >
        <span className="w-2 h-2 rounded-full bg-[#ff0033] animate-pulse" />
        {isOpen ? "[ CLOSE CLI ]" : "[ ~ ] TERMINAL CLI"}
      </button>

      {/* Terminal Drawer */}
      {isOpen && (
        <div className="fixed bottom-16 right-6 z-[400] w-[380px] max-w-[90vw] h-[260px] bg-black/90 border border-[#ff0033]/80 rounded-lg p-4 font-mono text-xs shadow-[0_0_30px_rgba(255,0,51,0.4)] backdrop-blur-md flex flex-col pointer-events-auto">
          {/* Header Bar */}
          <div className="flex justify-between items-center pb-2 mb-2 border-b border-[#ff0033]/40 text-[#ff0033]">
            <span className="text-[10px] tracking-widest font-bold">// NEURAL_CLI_v2.4</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#ff0033] hover:text-white text-sm"
            >
              ✕
            </button>
          </div>

          {/* History Scroll Area */}
          <div className="flex-1 overflow-y-auto space-y-1 text-red-400/90 text-[11px] pr-1 leading-relaxed">
            {history.map((line, i) => (
              <div key={i} className={line.startsWith(">") ? "text-white font-bold" : ""}>
                {line}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCommand(inputVal);
            }}
            className="flex items-center gap-2 mt-2 pt-2 border-t border-[#ff0033]/30"
          >
            <span className="text-[#ff0033] font-bold">&gt;</span>
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="type 'help' or 'override'..."
              className="w-full bg-transparent text-white outline-none font-mono text-xs placeholder:text-red-900/60"
            />
          </form>
        </div>
      )}
    </>
  );
}
