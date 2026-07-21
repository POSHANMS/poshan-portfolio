"use client";

import React, { useEffect, useRef, useState } from "react";

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
  angle: number; spin: number;
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
    const segments = 80;
    const baseAngle = -Math.PI / 2;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = baseAngle + t * Math.PI * 2;
      const r1 = Math.sin(t * 13) * 15;
      const r2 = Math.sin(t * 7 + 1) * 10;
      const r3 = Math.sin(t * 23 + 2) * 5;
      const baseR = 2 + t * 3;
      const radius = baseR + r1 + r2 + r3;
      this.crackPoints.push({
        x: this.centerX + Math.cos(angle) * radius,
        y: this.centerY + Math.sin(angle) * radius,
        angle,
        baseRadius: radius,
        noise: Math.random(),
      });
    }

    this.debris = [];
    for (let i = 0; i < 200; i++) {
      const a = Math.random() * Math.PI * 2;
      const dist = Math.random() * 100;
      const speed = 2 + Math.random() * 4;
      this.debris.push({
        x: this.centerX + Math.cos(a) * dist,
        y: this.centerY + Math.sin(a) * dist,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        size: 1 + Math.random() * 3,
        life: 1,
        maxLife: 0.8 + Math.random() * 1.2,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.2,
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

    if (this.phase === "forming" && this.time > 0.3) this.phase = "widening";
    if (this.phase === "widening" && this.time > 1.2) this.phase = "collapsing";
    if (this.phase === "collapsing" && this.time > 2.0) {
      this.phase = "done";
      this.active = false;
      this.onComplete?.();
      return;
    }

    for (const d of this.debris) {
      d.x += d.vx * dt * 60;
      d.y += d.vy * dt * 60;
      d.vx *= 0.98;
      d.vy *= 0.98;
      d.life -= dt / d.maxLife;
      d.angle += d.spin * dt * 60;
    }
    this.debris = this.debris.filter((d) => d.life > 0);

    if (this.phase === "forming" && Math.random() < 0.3) {
      const idx = Math.floor(Math.random() * this.crackPoints.length);
      const p = this.crackPoints[idx];
      const lAngle = p.angle + (Math.random() - 0.5) * 1;
      const segs: { x: number; y: number }[] = [];
      let lx = p.x;
      let ly = p.y;
      for (let s = 0; s < 5; s++) {
        lx += Math.cos(lAngle + (Math.random() - 0.5)) * (10 + Math.random() * 20);
        ly += Math.sin(lAngle + (Math.random() - 0.5)) * (10 + Math.random() * 20);
        segs.push({ x: lx, y: ly });
      }
      this.lightning.push({ x: lx, y: ly, segments: segs, life: 0.3, maxLife: 0.3 });
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
    if (this.phase === "forming") expansion = (t / 0.3) * 5;
    else if (this.phase === "widening") expansion = 5 + ((t - 0.3) / 0.9) * 400;
    else if (this.phase === "collapsing") expansion = 405 + ((t - 1.2) / 0.8) * 600;

    ctx.save();
    ctx.clearRect(0, 0, W, H);

    // Void gradient
    const voidGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, expansion * 1.5);
    voidGrad.addColorStop(0, CONFIG.VOID_BLACK);
    voidGrad.addColorStop(0.3, CONFIG.VOID_BLACK);
    voidGrad.addColorStop(0.5, "rgba(255,0,51,0.1)");
    voidGrad.addColorStop(0.7, "rgba(255,0,51,0.3)");
    voidGrad.addColorStop(0.85, "rgba(255,50,80,0.15)");
    voidGrad.addColorStop(1, "transparent");
    ctx.fillStyle = voidGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, expansion * 2, 0, Math.PI * 2);
    ctx.fill();

    // Crack edges
    if (this.crackPoints.length > 1) {
      ctx.shadowColor = CONFIG.CORE_RED;
      ctx.shadowBlur = 20;
      ctx.strokeStyle = "rgba(255, 0, 51, 0.8)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < this.crackPoints.length; i++) {
        const p = this.crackPoints[i];
        const r = p.baseRadius + expansion + Math.sin(t * 10 + i) * 3;
        const x = centerX + Math.cos(p.angle) * r;
        const y = centerY + Math.sin(p.angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();

      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = 10;
      ctx.strokeStyle = "rgba(255, 200, 200, 0.9)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < this.crackPoints.length; i++) {
        const p = this.crackPoints[i];
        const r = p.baseRadius + expansion * 0.95 + Math.sin(t * 15 + i) * 2;
        const x = centerX + Math.cos(p.angle) * r;
        const y = centerY + Math.sin(p.angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Lightning
    ctx.shadowBlur = 15;
    for (const l of this.lightning) {
      const alpha = l.life / l.maxLife;
      ctx.strokeStyle = `rgba(255, 200, 255, ${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(l.x, l.y);
      for (const s of l.segments) ctx.lineTo(s.x, s.y);
      ctx.stroke();
    }

    // Debris
    ctx.shadowBlur = 5;
    for (const d of this.debris) {
      const alpha = Math.max(0, d.life);
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.angle);
      const r = 255;
      const g = 50 + d.life * 100;
      const b = 80 + d.life * 50;
      ctx.fillStyle = `rgba(${r}, ${g | 0}, ${b | 0}, ${alpha})`;
      ctx.fillRect(-d.size / 2, -d.size / 2, d.size, d.size);
      ctx.restore();
    }

    // Vignette during collapse
    if (this.phase === "collapsing") {
      const collapseT = (t - 1.2) / 0.8;
      const vigAlpha = collapseT * 0.95;
      const vig = ctx.createRadialGradient(
        centerX, centerY, expansion * 0.5,
        centerX, centerY, Math.max(W, H)
      );
      vig.addColorStop(0, "transparent");
      vig.addColorStop(0.4, `rgba(3, 0, 1, ${vigAlpha * 0.3})`);
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
  const phaseRef = useRef<"loading" | "converging" | "tearing" | "done">("loading");
  const shownLogsRef = useRef<Set<number>>(new Set());
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

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

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

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

      // ── PROGRESS LOGIC ──
      if (phaseRef.current === "loading") {
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
        }
      }

      // ── UPDATE UI VIA DOM MANIPULATION (NOT setState) ──
      const currentProgress = progressRef.current;
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

          const charOpacity = c === 0 ? opacity : opacity * (1 - c / d.chars.length) * 0.7;
          if (charOpacity < 0.005) continue;

          // Color by layer (matches prototype)
          let r: number, g: number, b: number;
          if (d.layer === 2 && c === 0) {
            r = 255; g = 200 + Math.sin(time * 3) * 55; b = 200 + Math.sin(time * 3) * 55;
          } else if (d.layer === 2) {
            r = 255; g = 30; b = 50;
          } else if (d.layer === 1) {
            r = 180; g = 10; b = 25;
          } else {
            r = 80; g = 0; b = 8;
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
      className="fixed inset-0 z-[99999] overflow-hidden"
      style={{ background: CONFIG.VOID_BLACK, cursor: "none" }}
    >
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
        className="fixed bottom-10 left-10 font-mono pointer-events-none"
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
    </div>
  );
}