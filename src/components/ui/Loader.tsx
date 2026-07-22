"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSuspenseAudio } from "@/hooks/useSuspenseAudio";
import HUDSystem from "@/components/ui/loader/HUDSystem";
import HiddenTerminal from "@/components/ui/loader/HiddenTerminal";

// ═══════════════════════════════════════════════════════════════════════
// OVERKILL CONFIGURATION — Tuned for 60fps on all devices
// ═══════════════════════════════════════════════════════════════════════
const CONFIG = {
  // Timing
  LOAD_DURATION: 10000,        // 10s load time
  CONVERGE_DURATION: 1500,      // 1.5s convergence

  // Rain — matches working prototype EXACTLY
  DROP_COUNTS: { back: 300, mid: 150, front: 50 },
  MOUSE_RADIUS: 220,
  MOUSE_INNER_RADIUS: 110,

  // Physics (units per frame at 60fps, scaled by dt)
  SPEEDS: { back: 0.4, mid: 0.9, front: 1.6 },

  // Visual
  CORE_RED: "#ff0033",
  VOID_BLACK: "#030001",
  CLEAR_ALPHA: 0.25,
};

const CHAR_POOL = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF░▒▓█◢◣◤◥▪▫◊○●◐◑∴∵∷∞∝∫∮∯∰∱∲∳";

const LOG_LINES = [
  { threshold: 5, text: ">> NEURAL LINK ESTABLISHED" },
  { threshold: 18, text: ">> QUANTUM ENTANGLEMENT DETECTED" },
  { threshold: 32, text: ">> DIMENSIONAL BARRIER: UNSTABLE" },
  { threshold: 48, text: ">> SPACETIME FABRIC: TEARING" },
  { threshold: 65, text: ">> BREACH IMMINENT — SEEK SHELTER" },
  { threshold: 82, text: ">> REALITY ANCHOR: LOST" },
  { threshold: 95, text: ">> ENTERING THE VOID..." },
];

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════
interface DropChar { char: string; switchTimer: number; }
interface MicroDrop {
  x: number; y: number; fontSize: number; baseSpeed: number;
  baseOpacity: number; chars: DropChar[];
  phase: number; layer: number;
}
interface DebrisParticle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; size: number;
  angle: number; spin: number; noise: number;
}
interface LightningBranch {
  x: number; y: number;
  segments: { x: number; y: number }[];
  life: number; maxLife: number;
}
interface CrackPoint { x: number; y: number; angle: number; baseRadius: number; noise: number; }

// ═══════════════════════════════════════════════════════════════════════
// TEAR ENGINE — Self-contained, no React dependencies
// ═══════════════════════════════════════════════════════════════════════
class TearEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  active = false;
  phase: "forming" | "widening" | "collapsing" | "done" = "forming";
  time = 0;
  centerX = 0;
  centerY = 0;
  crackPoints: CrackPoint[] = [];
  debris: DebrisParticle[] = [];
  lightning: LightningBranch[] = [];
  onComplete?: () => void;
  W = 0; H = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2d context");
    this.ctx = ctx;
  }

  resize(w: number, h: number) {
    const dpr = Math.min(window.devicePixelRatio, 2);
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + "px";
    this.canvas.style.height = h + "px";
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.W = w; this.H = h;
    this.centerX = w / 2;
    this.centerY = h / 2;
  }

  generateCrack() {
    this.crackPoints = [];
    const segments = 120;
    const baseAngle = -Math.PI / 2;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = baseAngle + t * Math.PI * 2;
      const r1 = Math.sin(t * 19) * 22;
      const r2 = Math.cos(t * 11 + 1) * 16;
      const r3 = Math.sin(t * 31 + 2) * 8;
      const baseR = 3 + t * 4;
      const radius = baseR + r1 + r2 + r3;
      this.crackPoints.push({
        x: this.centerX + Math.cos(angle) * radius,
        y: this.centerY + Math.sin(angle) * radius,
        angle,
        baseRadius: radius,
        noise: Math.random(),
      });
    }

    // High velocity shrapnel + glass debris
    this.debris = [];
    for (let i = 0; i < 350; i++) {
      const a = Math.random() * Math.PI * 2;
      const dist = Math.random() * 80;
      const speed = 4 + Math.random() * 9;
      this.debris.push({
        x: this.centerX + Math.cos(a) * dist,
        y: this.centerY + Math.sin(a) * dist,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        size: 2 + Math.random() * 6,
        life: 1,
        maxLife: 0.6 + Math.random() * 1.4,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.4,
        noise: Math.random(),
      });
    }
  }

  start() {
    this.active = true;
    this.phase = "forming";
    this.time = 0;
    this.generateCrack();
  }

  update(dt: number) {
    if (!this.active) return;
    this.time += dt;

    if (this.phase === "forming" && this.time > 0.25) this.phase = "widening";
    if (this.phase === "widening" && this.time > 1.1) this.phase = "collapsing";
    if (this.phase === "collapsing" && this.time > 1.8) {
      this.phase = "done";
      this.active = false;
      this.onComplete?.();
      return;
    }

    for (const d of this.debris) {
      d.x += d.vx * dt * 60;
      d.y += d.vy * dt * 60;
      d.vx *= 0.97;
      d.vy *= 0.97;
      d.life -= dt / d.maxLife;
      d.angle += d.spin * dt * 60;
    }
    this.debris = this.debris.filter((d) => d.life > 0);

    // Electric arcs
    if ((this.phase === "forming" || this.phase === "widening") && Math.random() < 0.6) {
      const idx = Math.floor(Math.random() * this.crackPoints.length);
      const p = this.crackPoints[idx];
      const lAngle = p.angle + (Math.random() - 0.5) * 1.2;
      const segs: { x: number; y: number }[] = [];
      let lx = p.x;
      let ly = p.y;
      for (let s = 0; s < 7; s++) {
        lx += Math.cos(lAngle + (Math.random() - 0.5)) * (12 + Math.random() * 25);
        ly += Math.sin(lAngle + (Math.random() - 0.5)) * (12 + Math.random() * 25);
        segs.push({ x: lx, y: ly });
      }
      this.lightning.push({ x: lx, y: ly, segments: segs, life: 0.25, maxLife: 0.25 });
    }

    for (let i = this.lightning.length - 1; i >= 0; i--) {
      this.lightning[i].life -= dt;
      if (this.lightning[i].life <= 0) this.lightning.splice(i, 1);
    }
  }

  draw() {
    if (!this.active) return;
    const { ctx, centerX, centerY, time, W, H } = this;
    const t = time;

    let expansion = 0;
    if (this.phase === "forming") expansion = (t / 0.25) * 12;
    else if (this.phase === "widening") expansion = 12 + ((t - 0.25) / 0.85) * 550;
    else if (this.phase === "collapsing") expansion = 562 + ((t - 1.1) / 0.7) * 900;

    ctx.save();
    ctx.clearRect(0, 0, W, H);

    // 1. Radial Shockwave Rings
    if (t < 0.8) {
      const ringR = expansion * 1.4;
      ctx.save();
      ctx.strokeStyle = "rgba(255, 0, 51, " + Math.max(0, 0.8 - t) + ")";
      ctx.lineWidth = 4;
      ctx.shadowColor = CONFIG.CORE_RED;
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringR, 0, Math.PI * 2);
      ctx.stroke();

      // Outer Cyan Shockwave Ring
      ctx.strokeStyle = "rgba(0, 240, 255, " + Math.max(0, 0.6 - t) + ")";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringR * 1.15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Void Core Hole Cutout
    const voidGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, expansion * 1.6);
    voidGrad.addColorStop(0, CONFIG.VOID_BLACK);
    voidGrad.addColorStop(0.35, CONFIG.VOID_BLACK);
    voidGrad.addColorStop(0.6, "rgba(255,0,51,0.2)");
    voidGrad.addColorStop(0.8, "rgba(0,240,255,0.15)");
    voidGrad.addColorStop(1, "transparent");
    ctx.fillStyle = voidGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, expansion * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // 3. Chromatic Aberration Spider-Verse Crack Edges
    if (this.crackPoints.length > 1) {
      // Crimson Shift (Left/Top)
      ctx.save();
      ctx.shadowColor = "#ff0033";
      ctx.shadowBlur = 25;
      ctx.strokeStyle = "rgba(255, 0, 51, 0.95)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let i = 0; i < this.crackPoints.length; i++) {
        const p = this.crackPoints[i];
        const r = p.baseRadius + expansion + Math.sin(t * 12 + i) * 4;
        const x = centerX + Math.cos(p.angle) * r - 4;
        const y = centerY + Math.sin(p.angle) * r - 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();

      // Cyan Shift (Right/Bottom)
      ctx.shadowColor = "#00f0ff";
      ctx.shadowBlur = 20;
      ctx.strokeStyle = "rgba(0, 240, 255, 0.85)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i < this.crackPoints.length; i++) {
        const p = this.crackPoints[i];
        const r = p.baseRadius + expansion * 0.97 + Math.sin(t * 16 + i) * 3;
        const x = centerX + Math.cos(p.angle) * r + 4;
        const y = centerY + Math.sin(p.angle) * r + 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();

      // Pure White Core Filament
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = 12;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < this.crackPoints.length; i++) {
        const p = this.crackPoints[i];
        const r = p.baseRadius + expansion * 0.99;
        const x = centerX + Math.cos(p.angle) * r;
        const y = centerY + Math.sin(p.angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }

    // 4. Electric Arcs
    ctx.save();
    ctx.shadowBlur = 18;
    for (const l of this.lightning) {
      const alpha = l.life / l.maxLife;
      ctx.shadowColor = Math.random() < 0.5 ? "#ff0033" : "#00f0ff";
      ctx.strokeStyle = Math.random() < 0.5 ? `rgba(255, 220, 240, ${alpha})` : `rgba(200, 245, 255, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(l.x, l.y);
      for (const s of l.segments) ctx.lineTo(s.x, s.y);
      ctx.stroke();
    }
    ctx.restore();

    // 5. High-Velocity Polygon Glass Shrapnel
    ctx.save();
    for (const d of this.debris) {
      const alpha = Math.max(0, d.life);
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.angle);
      ctx.shadowColor = d.noise > 0.5 ? "#ff0033" : "#00f0ff";
      ctx.shadowBlur = 8;
      
      const r = d.noise > 0.5 ? 255 : 0;
      const g = d.noise > 0.5 ? 40 : 240;
      const b = d.noise > 0.5 ? 80 : 255;
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;

      // Draw triangular shrapnel shard
      ctx.beginPath();
      ctx.moveTo(0, -d.size);
      ctx.lineTo(d.size * 0.8, d.size * 0.8);
      ctx.lineTo(-d.size * 0.8, d.size * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // 6. Final Dissolve Flash Vignette
    if (this.phase === "collapsing") {
      const collapseT = (t - 1.1) / 0.7;
      const vigAlpha = collapseT * 0.95;
      const vig = ctx.createRadialGradient(
        centerX, centerY, expansion * 0.4,
        centerX, centerY, Math.max(W, H)
      );
      vig.addColorStop(0, "transparent");
      vig.addColorStop(0.3, `rgba(3, 0, 1, ${vigAlpha * 0.2})`);
      vig.addColorStop(1, `rgba(3, 0, 1, ${vigAlpha})`);
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);
    }

    ctx.restore();
  }
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT — COMPLETELY ISOLATED FROM REACT RENDER CYCLE
// ═══════════════════════════════════════════════════════════════════════
interface LoaderProps {
  onComplete?: () => void;
}

export default function Loader({ onComplete }: LoaderProps) {
  const { audioEnabled, initAudio, setProgress: setAudioProgress, triggerTear: triggerAudioTear } = useSuspenseAudio();

  // React state — ONLY used for mount/unmount, NEVER inside RAF
  const [isComplete, setIsComplete] = useState(false);

  // DOM Refs — for direct manipulation, zero React involvement
  const containerRef = useRef<HTMLDivElement>(null);
  const matrixCanvasRef = useRef<HTMLCanvasElement>(null);
  const tearCanvasRef = useRef<HTMLCanvasElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const percentTextRef = useRef<HTMLSpanElement>(null);
  const statusTextRef = useRef<HTMLSpanElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const counterC1Ref = useRef<HTMLSpanElement>(null);
  const counterC2Ref = useRef<HTMLSpanElement>(null);
  const counterC3Ref = useRef<HTMLSpanElement>(null);
  const uiLayerRef = useRef<HTMLDivElement>(null);
  const bigCounterRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);

  // Animation state — ALL in refs, NEVER triggers re-render
  const dropsRef = useRef<MicroDrop[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const mouseSmoothRef = useRef({ x: -1000, y: -1000 });
  const tearEngineRef = useRef<TearEngine | null>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());
  const phaseTimerRef = useRef(0);
  const hasCompletedRef = useRef(false);
  const progressRef = useRef(0);
  const phaseRef = useRef<"void" | "loading" | "converging" | "tearing" | "done">("void");
  const shownLogsRef = useRef<Set<number>>(new Set());
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const voidStartRef = useRef<number>(0);
  const rainFadeRef = useRef(0);
  const hbRingsRef = useRef<{ birth: number }[]>([]);
  const lastHbRef = useRef(0);
  const themeColorRef = useRef("#ff0033");

  // Initialize drops — called ONCE, never again
  const initDrops = (w: number, h: number) => {
    const drops: MicroDrop[] = [];
    const configs = [
      { count: CONFIG.DROP_COUNTS.back, font: 7, speed: CONFIG.SPEEDS.back, opacity: 0.06, chars: 4 },
      { count: CONFIG.DROP_COUNTS.mid, font: 10, speed: CONFIG.SPEEDS.mid, opacity: 0.12, chars: 7 },
      { count: CONFIG.DROP_COUNTS.front, font: 13, speed: CONFIG.SPEEDS.front, opacity: 0.28, chars: 10 },
    ];

    for (let layer = 0; layer < 3; layer++) {
      const cfg = configs[layer];
      for (let i = 0; i < cfg.count; i++) {
        const chars: DropChar[] = [];
        for (let c = 0; c < cfg.chars; c++) {
          chars.push({
            char: CHAR_POOL[Math.floor(Math.random() * CHAR_POOL.length)],
            switchTimer: Math.random() * 30,
          });
        }
        drops.push({
          x: Math.random() * w,
          y: Math.random() * h,
          fontSize: cfg.font + Math.random() * 3,
          baseSpeed: cfg.speed * (0.7 + Math.random() * 0.6),
          baseOpacity: cfg.opacity,
          chars,
          phase: Math.random() * Math.PI * 2,
          layer,
        });
      }
    }
    dropsRef.current = drops;
  };

  // Main effect — runs ONCE, sets up everything, never re-runs
  useEffect(() => {
    const matrixCanvas = matrixCanvasRef.current;
    const tearCanvas = tearCanvasRef.current;
    if (!matrixCanvas || !tearCanvas) return;

    // Setup matrix canvas context ONCE
    const ctx = matrixCanvas.getContext("2d");
    if (!ctx) return;
    ctxRef.current = ctx;

    let W = window.innerWidth;
    let H = window.innerHeight;

    const dpr = Math.min(window.devicePixelRatio, 2);
    matrixCanvas.width = W * dpr;
    matrixCanvas.height = H * dpr;
    matrixCanvas.style.width = W + "px";
    matrixCanvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Setup tear engine
    tearEngineRef.current = new TearEngine(tearCanvas);
    tearEngineRef.current.resize(W, H);
    tearEngineRef.current.onComplete = () => {
      if (hasCompletedRef.current) return;
      hasCompletedRef.current = true;
      phaseRef.current = "done";

      // White flash
      if (flashRef.current) {
        flashRef.current.style.transition = "opacity 0.1s";
        flashRef.current.style.opacity = "1";
        setTimeout(() => {
          if (flashRef.current) {
            flashRef.current.style.transition = "opacity 1.5s ease-out";
            flashRef.current.style.opacity = "0";
          }
        }, 100);
      }

      // Hide UI
      if (uiLayerRef.current) {
        uiLayerRef.current.style.transition = "opacity 0.5s";
        uiLayerRef.current.style.opacity = "0";
      }
      if (bigCounterRef.current) {
        bigCounterRef.current.style.transition = "opacity 0.5s";
        bigCounterRef.current.style.opacity = "0";
      }

      // Notify completion after flash fades
      setTimeout(() => {
        setIsComplete(true);
        onComplete?.();
      }, 1600);
    };

    initDrops(W, H);
    voidStartRef.current = performance.now();

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Touch tracking for mobile cursor interaction
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) mouseRef.current = { x: touch.clientX, y: touch.clientY, active: true };
    };
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    // Resize handler
    const handleResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      matrixCanvas.width = W * dpr;
      matrixCanvas.height = H * dpr;
      matrixCanvas.style.width = W + "px";
      matrixCanvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      tearEngineRef.current?.resize(W, H);
      initDrops(W, H);
    };
    window.addEventListener("resize", handleResize);

    // ═══════════════════════════════════════════════════════════════
    // THE ANIMATION LOOP — ZERO React state updates, pure DOM refs
    // ═══════════════════════════════════════════════════════════════
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const time = now / 1000;

      // Smooth mouse
      mouseSmoothRef.current.x += (mouseRef.current.x - mouseSmoothRef.current.x) * 0.1;
      mouseSmoothRef.current.y += (mouseRef.current.y - mouseSmoothRef.current.y) * 0.1;
      const mx = mouseSmoothRef.current.x;
      const my = mouseSmoothRef.current.y;

      // ── VOID PHASE — The Dramatic Entrance ──
      if (phaseRef.current === "void") {
        const voidElapsed = (now - voidStartRef.current) / 1000;

        ctx.fillStyle = CONFIG.VOID_BLACK;
        ctx.fillRect(0, 0, W, H);

        if (voidElapsed >= 0.5 && voidElapsed < 0.7) {
          // Single red pixel → exponentially expanding horizontal scanline
          const t = (voidElapsed - 0.5) / 0.2;
          const halfWidth = Math.min(Math.pow(2, t * 10), W / 2);
          ctx.save();
          ctx.shadowColor = "#ff0033";
          ctx.shadowBlur = 8 + t * 16;
          ctx.fillStyle = "#ff0033";
          ctx.fillRect(W / 2 - halfWidth, H / 2 - 1, halfWidth * 2, 2);
          ctx.restore();
        } else if (voidElapsed >= 0.7 && voidElapsed < 1.2) {
          // CRT scanline sweep top → bottom
          const sweepT = (voidElapsed - 0.7) / 0.5;
          const sweepY = sweepT * H;

          // Faint static noise behind sweep line
          for (let sy = 0; sy < sweepY; sy += 4) {
            if (Math.random() < 0.35) {
              ctx.fillStyle = `rgba(255, 0, 51, ${0.01 + Math.random() * 0.03})`;
              ctx.fillRect(0, sy, W, 1);
            }
          }

          // Bright sweeping head with imperfect flicker
          ctx.save();
          ctx.shadowColor = "#ff0033";
          ctx.shadowBlur = 25;
          ctx.fillStyle = `rgba(255, 0, 51, ${0.7 + Math.random() * 0.3})`;
          ctx.fillRect(0, sweepY - 2, W, 3);
          ctx.fillStyle = "rgba(255, 100, 120, 0.3)";
          ctx.fillRect(0, sweepY + 3, W, 1);
          ctx.restore();
        } else if (voidElapsed >= 1.2) {
          // Transition to loading — rain will fade in gradually
          phaseRef.current = "loading";
          startTimeRef.current = Date.now();
          rainFadeRef.current = 0;
        }

        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // ── PROGRESS LOGIC ──
      if (phaseRef.current === "loading") {
        // Gradually fade rain in from void
        if (rainFadeRef.current < 1) {
          rainFadeRef.current = Math.min(1, rainFadeRef.current + dt * 1.25);
        }
        const elapsed = Date.now() - startTimeRef.current;
        progressRef.current = Math.min(elapsed / CONFIG.LOAD_DURATION, 1) * 100;

        if (progressRef.current >= 100) {
          progressRef.current = 100;
          phaseRef.current = "converging";
          phaseTimerRef.current = 0;
          if (statusTextRef.current) {
            statusTextRef.current.textContent = "DIMENSIONAL BREACH IMMINENT";
          }
        }
      } else if (phaseRef.current === "converging") {
        phaseTimerRef.current += dt;
        // Rain converges to center
        for (const d of dropsRef.current) {
          const dx = W / 2 - d.x;
          const dy = H / 2 - d.y;
          d.x += dx * 0.02 * dt * 60;
          d.y += dy * 0.02 * dt * 60;
          d.baseSpeed *= 1.01;
        }
        if (phaseTimerRef.current > CONFIG.CONVERGE_DURATION / 1000) {
          phaseRef.current = "tearing";
          tearEngineRef.current?.start();
          triggerAudioTear();
        }
      }

      // ── UPDATE UI VIA DOM MANIPULATION (NOT setState) ──
      const currentProgress = progressRef.current;
      setAudioProgress(currentProgress);
      const displayProgress = Math.floor(currentProgress);

      // Progress bar width
      if (progressFillRef.current) {
        progressFillRef.current.style.width = displayProgress + "%";
      }
      // Percent text
      if (percentTextRef.current) {
        percentTextRef.current.textContent = displayProgress + "%";
      }
      // Counter digits
      const s = displayProgress.toString().padStart(3, "0");
      if (counterC1Ref.current) counterC1Ref.current.textContent = s[0];
      if (counterC2Ref.current) counterC2Ref.current.textContent = s[1];
      if (counterC3Ref.current) counterC3Ref.current.textContent = s[2];

      // Terminal logs — add via DOM, NOT state
      for (const log of LOG_LINES) {
        if (currentProgress >= log.threshold && !shownLogsRef.current.has(log.threshold)) {
          shownLogsRef.current.add(log.threshold);
          if (terminalRef.current) {
            const div = document.createElement("div");
            div.textContent = log.text;
            div.style.opacity = "0";
            div.style.transition = "opacity 0.3s";
            terminalRef.current.appendChild(div);
            requestAnimationFrame(() => { div.style.opacity = "1"; });
            if (terminalRef.current.children.length > 4) {
              terminalRef.current.removeChild(terminalRef.current.firstChild!);
            }
          }
        }
      }

      // Shake UI during convergence
      if (phaseRef.current === "converging" && uiLayerRef.current) {
        const shake = (1 - phaseTimerRef.current / (CONFIG.CONVERGE_DURATION / 1000)) * 3;
        uiLayerRef.current.style.transform =
          `translate(${(Math.random() - 0.5) * shake}px, ${(Math.random() - 0.5) * shake}px)`;
      }

      // ── CLEAR CANVAS ──
      ctx.fillStyle = `rgba(3, 0, 1, ${CONFIG.CLEAR_ALPHA})`;
      ctx.fillRect(0, 0, W, H);

      // ── DRAW DROPS ── (matches working prototype exactly)
      // Parse theme color once per frame for rain coloring
      const _tcHex = parseInt(themeColorRef.current.slice(1), 16);
      const tcR = (_tcHex >> 16) & 255, tcG = (_tcHex >> 8) & 255, tcB = _tcHex & 255;
      const drops = dropsRef.current;
      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        const dx = d.x - mx;
        const dy = d.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const mouseRadius = CONFIG.MOUSE_RADIUS;

        let speed = d.baseSpeed;
        let opacity = d.baseOpacity;

        if (dist < mouseRadius && mouseRef.current.active) {
          const influence = 1 - dist / mouseRadius;
          speed *= (1 - influence * 0.7);
          opacity = Math.min(1, opacity + influence * 0.6);
          d.x -= (dx / Math.max(dist, 1)) * influence * 0.3;
        }

        // Breathing
        const breathe = Math.sin(time * 2 + d.phase) * 0.3 + 0.7;
        opacity *= breathe;

        // Move
        d.y += speed * (dt * 60);

        // Character switching
        for (let c = 0; c < d.chars.length; c++) {
          const ch = d.chars[c];
          ch.switchTimer -= dt * 60;
          if (ch.switchTimer <= 0) {
            ch.char = CHAR_POOL[Math.floor(Math.random() * CHAR_POOL.length)];
            ch.switchTimer = 5 + Math.random() * 25;
          }
        }

        // Reset if off screen
        if (d.y > H + 20) {
          d.y = -20;
          d.x = Math.random() * W;
        }

        // Draw
        for (let c = 0; c < d.chars.length; c++) {
          const cy = d.y - c * d.fontSize * 1.1;
          if (cy < -10 || cy > H + 10) continue;

          const charOpacity = (c === 0 ? opacity : opacity * (1 - c / d.chars.length) * 0.7) * rainFadeRef.current;
          if (charOpacity < 0.005) continue;

          // Color by layer — responds to theme from terminal 'matrix' command
          let r: number, g: number, b: number;
          if (d.layer === 2 && c === 0) {
            // Head character — white-hot with theme tint
            r = Math.min(255, 200 + tcR * 0.2 + Math.sin(time * 3) * 55);
            g = Math.min(255, 200 + tcG * 0.2 + Math.sin(time * 3) * 55);
            b = Math.min(255, 200 + tcB * 0.2 + Math.sin(time * 3) * 55);
          } else {
            const intensity = d.layer === 2 ? 1.0 : d.layer === 1 ? 0.7 : 0.31;
            r = tcR * intensity;
            g = tcG * intensity;
            b = tcB * intensity;
          }

          // Mouse glow
          if (dist < mouseRadius * 0.5 && mouseRef.current.active) {
            const h = 1 - dist / (mouseRadius * 0.5);
            r = 255;
            g = Math.min(255, g + h * 200);
            b = Math.min(255, b + h * 200);
          }

          ctx.fillStyle = `rgba(${r | 0}, ${g | 0}, ${b | 0}, ${charOpacity})`;
          ctx.font = `${d.fontSize}px "JetBrains Mono", "Courier New", monospace`;
          ctx.fillText(d.chars[c].char, d.x, cy);
        }
      }

      // ── SCANLINES ──
      ctx.fillStyle = "rgba(255, 0, 51, 0.02)";
      for (let y = 0; y < H; y += 4) {
        ctx.fillRect(0, y, W, 1);
      }

      // ── HEARTBEAT RING — Visual pulse synced to 46 BPM ──
      if (phaseRef.current === "loading" || phaseRef.current === "converging") {
        // Spawn new ring every 1.3s (matches audio heartbeat interval)
        if (now - lastHbRef.current > 1300) {
          lastHbRef.current = now;
          hbRingsRef.current.push({ birth: now });
        }

        ctx.save();
        for (let ri = hbRingsRef.current.length - 1; ri >= 0; ri--) {
          const ring = hbRingsRef.current[ri];
          const age = (now - ring.birth) / 1000;
          if (age > 1.5) {
            hbRingsRef.current.splice(ri, 1);
            continue;
          }
          const radius = 50 + age * 100;
          const alpha = Math.max(0, 0.5 * (1 - age / 1.5));
          const lineW = Math.max(0.3, 2 - age * 1.3);
          ctx.strokeStyle = `rgba(255, 0, 51, ${alpha})`;
          ctx.lineWidth = lineW;
          ctx.shadowColor = "#ff0033";
          ctx.shadowBlur = 12 * (1 - age / 1.5);
          ctx.beginPath();
          ctx.arc(W / 2, H / 2 - 50, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // ── TEAR ──
      tearEngineRef.current?.update(dt);
      tearEngineRef.current?.draw();

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // EMPTY ARRAY = runs ONCE, never re-runs

  // If loader is complete, render nothing
  if (isComplete) return null;

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER — Static JSX, no state dependencies except isComplete
  // All animated elements are updated via refs, not React state
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div
      ref={containerRef}
      onClick={() => initAudio()}
      className="fixed inset-0 z-[99999] overflow-hidden cursor-pointer"
      style={{ background: CONFIG.VOID_BLACK }}
    >
      {/* Audio Initializer Badge */}
      {!audioEnabled && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            initAudio();
          }}
          className="absolute top-8 left-1/2 -translate-x-1/2 z-[300] pointer-events-auto px-5 py-2.5 bg-red-950/60 border border-[#ff0033]/80 rounded-full text-[11px] tracking-[0.25em] font-mono text-[#ff0033] shadow-[0_0_20px_rgba(255,0,51,0.5)] animate-pulse hover:bg-[#ff0033]/20 transition-all cursor-pointer flex items-center gap-2"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff0033] animate-ping" />
          🔊 CLICK TO INITIALIZE AUDIO ENGINE
        </button>
      )}

      {/* Matrix rain canvas */}
      <canvas
        ref={matrixCanvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ imageRendering: "auto" }}
      />

      {/* Tear overlay canvas */}
      <canvas
        ref={tearCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 100 }}
      />

      {/* White flash on breach */}
      <div
        ref={flashRef}
        className="absolute inset-0 pointer-events-none bg-white"
        style={{ zIndex: 200, opacity: 0 }}
      />

      {/* UI Layer — updated via DOM refs, not React state */}
      <div
        ref={uiLayerRef}
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{ zIndex: 10 }}
      >
        {/* Logo */}
        <div className="relative w-[140px] h-[140px] mb-16">
          <div
            className="absolute inset-[-20px] rounded-full border border-[#ff0033]/20 border-t-[#ff0033]/80"
            style={{ animation: "spin 4s linear infinite" }}
          />
          <div
            className="absolute inset-[-35px] rounded-full border-[0.5px] border-b-[#ff0033]/40 border-t-transparent"
            style={{ animation: "spin-reverse 6s linear infinite" }}
          />
          <div
            className="absolute inset-[-50px] rounded-full border-[0.3px] border-l-[#ff0033]/30 border-r-transparent"
            style={{ animation: "spin 8s linear infinite" }}
          />
          {/* FIXED: Solid crimson stroke with CSS drop-shadow instead of SVG filter */}
          <svg 
            viewBox="0 0 100 100" 
            className="w-full h-full" 
            style={{ filter: "drop-shadow(0 0 12px rgba(255,0,51,0.8)) drop-shadow(0 0 24px rgba(255,0,51,0.4))" }}
          >
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff0033" />
                <stop offset="50%" stopColor="#ff3366" />
                <stop offset="100%" stopColor="#cc0022" />
              </linearGradient>
            </defs>
            {/* Main P stroke — solid crimson, no SVG filter */}
            <path
              d="M28 18 h28 c16 0 24 10 24 22 c0 14 -10 22 -26 22 h-18 v30 h-16 v-74 h8"
              stroke="#ff0033"
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Inner detail stroke */}
            <path
              d="M28 34 h20 c8 0 12 4 12 10 c0 7 -5 10 -14 10 h-18 v-20"
              stroke="#ff3366"
              strokeWidth="2.5"
              fill="none"
              opacity="0.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Center dot */}
            <circle cx="42" cy="40" r="3" fill="#ff0033">
              <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>

        {/* Progress bar */}
        <div className="w-[320px] relative">
          <div className="flex justify-between mb-2">
            <span
              ref={statusTextRef}
              className="text-[9px] tracking-[0.3em] text-[#ff0033]/70 uppercase font-mono"
            >
              ESTABLISHING UPLINK
            </span>
            <span
              ref={percentTextRef}
              className="text-[9px] tracking-[0.2em] text-[#ff0033]/70 font-mono"
            >
              0%
            </span>
          </div>
          <div className="h-[1px] bg-[#ff0033]/10 relative overflow-hidden">
            <div
              ref={progressFillRef}
              className="h-full absolute left-0 top-0"
              style={{
                width: "0%",
                background: "linear-gradient(90deg, #ff0033, #ff3366)",
                boxShadow: "0 0 10px rgba(255,0,51,0.8), 0 0 30px rgba(255,0,51,0.3)",
                transition: "width 0.1s linear",
              }}
            >
              <div className="absolute right-0 top-[-2px] w-1 h-[5px] bg-white shadow-[0_0_10px_#fff,0_0_20px_#ff0033]" />
            </div>
          </div>
        </div>

        {/* Terminal logs */}
        <div
          ref={terminalRef}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 text-center min-h-[80px]"
        />
      </div>

      {/* Big counter */}
      <div
        ref={bigCounterRef}
        className="fixed bottom-14 left-6 font-mono pointer-events-none"
        style={{ zIndex: 10 }}
      >
        <div className="flex items-baseline">
          <span
            ref={counterC1Ref}
            className="text-[80px] font-black leading-none tracking-tighter"
            style={{
              color: "rgba(255, 0, 51, 0.15)",
              fontFamily: "var(--font-jetbrains-mono), monospace",
            }}
          >
            0
          </span>
          <span
            ref={counterC2Ref}
            className="text-[80px] font-black leading-none tracking-tighter"
            style={{
              color: "rgba(255, 0, 51, 0.15)",
              fontFamily: "var(--font-jetbrains-mono), monospace",
            }}
          >
            0
          </span>
          <span
            ref={counterC3Ref}
            className="text-[80px] font-black leading-none tracking-tighter"
            style={{
              color: "rgba(255, 0, 51, 0.15)",
              fontFamily: "var(--font-jetbrains-mono), monospace",
            }}
          >
            0
          </span>
        </div>
        <p className="text-[9px] tracking-[0.32em] text-white/25 uppercase mt-1">
          System Integrity Matrix
        </p>
      </div>

      {/* Cyber HUD Telemetry System */}
      <HUDSystem />

      {/* Interactive Hidden Cyber Terminal CLI */}
      <HiddenTerminal
        onOverride={() => {
          phaseRef.current = "tearing";
          tearEngineRef.current?.start();
        }}
        onThemeChange={(color) => {
          themeColorRef.current = color;
        }}
      />
    </div>
  );
}