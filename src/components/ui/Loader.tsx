"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSuspenseAudio } from "@/hooks/useSuspenseAudio";
import HUDSystem from "@/components/ui/loader/HUDSystem";
import HiddenTerminal from "@/components/ui/loader/HiddenTerminal";

// ═══════════════════════════════════════════════════════════════════════
// CINEMATIC BREACH CONFIGURATION — Professional spacetime tear
// ═══════════════════════════════════════════════════════════════════════
const CONFIG = {
  LOAD_DURATION: 10000,
  CONVERGE_DURATION: 2000,
  DROP_COUNTS: { back: 300, mid: 150, front: 50 },
  MOUSE_RADIUS: 220,
  MOUSE_INNER_RADIUS: 110,
  SPEEDS: { back: 0.4, mid: 0.9, front: 1.6 },
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
interface Shard {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  vertices: { x: number; y: number }[];
  color: { r: number; g: number; b: number };
  trail: { x: number; y: number }[];
}
interface EnergyTendril {
  points: { x: number; y: number }[];
  life: number; maxLife: number;
  amplitude: number;
  frequency: number;
}
interface ShockwaveRing {
  birth: number; maxRadius: number;
  speed: number; decay: number;
  intensity: number;
}

// ═══════════════════════════════════════════════════════════════════════
// CINEMATIC BREACH ENGINE — Spacetime Fabric Tear
// ═══════════════════════════════════════════════════════════════════════
class BreachEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  active = false;
  phase: "forming" | "widening" | "collapse" | "revealing" | "done" = "forming";
  time = 0;
  centerX = 0;
  centerY = 0;
  onComplete?: () => void;
  W = 0; H = 0;

  // Breach geometry
  breachRadius = 0;
  breachTargetRadius = 0;
  breachIrregularity: number[] = [];

  // Effects
  shards: Shard[] = [];
  tendrils: EnergyTendril[] = [];
  shockwaves: ShockwaveRing[] = [];

  // Gravitational lensing
  lensStrength = 0;

  // Accretion particles
  accretionParticles: { angle: number; dist: number; speed: number; size: number }[] = [];

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

  generateBreachGeometry() {
    this.breachIrregularity = [];
    const segments = 180;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = t * Math.PI * 2;
      // Multiple octaves of noise for organic tear shape
      const r1 = Math.sin(angle * 3) * 0.3;
      const r2 = Math.sin(angle * 7 + 1) * 0.15;
      const r3 = Math.sin(angle * 13 + 2) * 0.08;
      const r4 = Math.sin(angle * 23 + 3) * 0.04;
      this.breachIrregularity.push(1 + r1 + r2 + r3 + r4);
    }

    // Generate crystalline shards
    this.shards = [];
    for (let i = 0; i < 200; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 60;
      const speed = 2 + Math.random() * 8;

      // Create irregular crystalline shape
      const vertCount = 3 + Math.floor(Math.random() * 4);
      const vertices: { x: number; y: number }[] = [];
      for (let v = 0; v < vertCount; v++) {
        const va = (v / vertCount) * Math.PI * 2 + Math.random() * 0.5;
        const vr = 0.3 + Math.random() * 0.7;
        vertices.push({ x: Math.cos(va) * vr, y: Math.sin(va) * vr });
      }

      // Color variation: white-hot center, cooling to red, then dark
      const temp = Math.random();
      let color: { r: number; g: number; b: number };
      if (temp > 0.7) {
        color = { r: 255, g: 240 + Math.random() * 15, b: 230 + Math.random() * 25 };
      } else if (temp > 0.4) {
        color = { r: 255, g: 100 + Math.random() * 80, b: 80 + Math.random() * 60 };
      } else {
        color = { r: 180 + Math.random() * 75, g: 20 + Math.random() * 40, b: 30 + Math.random() * 50 };
      }

      this.shards.push({
        x: this.centerX + Math.cos(angle) * dist,
        y: this.centerY + Math.sin(angle) * dist,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 0.8 + Math.random() * 1.2,
        size: 2 + Math.random() * 5,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.3,
        vertices,
        color,
        trail: [],
      });
    }

    // Generate energy tendrils
    this.tendrils = [];
    for (let i = 0; i < 12; i++) {
      const points: { x: number; y: number }[] = [];
      const segments = 20;
      const baseAngle = (i / 12) * Math.PI * 2;
      for (let s = 0; s <= segments; s++) {
        const t = s / segments;
        const r = t * 150;
        const wave = Math.sin(t * Math.PI * 4) * (1 - t) * 20;
        points.push({
          x: this.centerX + Math.cos(baseAngle) * r + Math.cos(baseAngle + Math.PI / 2) * wave,
          y: this.centerY + Math.sin(baseAngle) * r + Math.sin(baseAngle + Math.PI / 2) * wave,
        });
      }
      this.tendrils.push({
        points,
        life: 1,
        maxLife: 0.6 + Math.random() * 0.4,
        amplitude: 10 + Math.random() * 20,
        frequency: 2 + Math.random() * 4,
      });
    }

    // Generate accretion disk particles
    this.accretionParticles = [];
    for (let i = 0; i < 100; i++) {
      this.accretionParticles.push({
        angle: Math.random() * Math.PI * 2,
        dist: 20 + Math.random() * 80,
        speed: 0.02 + Math.random() * 0.05,
        size: 0.5 + Math.random() * 1.5,
      });
    }
  }

  start() {
    this.active = true;
    this.phase = "forming";
    this.time = 0;
    this.breachRadius = 0;
    this.breachTargetRadius = 0;
    this.lensStrength = 0;
    this.generateBreachGeometry();
  }

  update(dt: number) {
    if (!this.active) return;
    this.time += dt;

    const t = this.time;

    // Phase transitions
    if (this.phase === "forming" && t > 0.3) {
      this.phase = "widening";
    } else if (this.phase === "widening" && t > 1.0) {
      this.phase = "collapse";
    } else if (this.phase === "collapse" && t > 1.6) {
      this.phase = "revealing";
    } else if (this.phase === "revealing" && t > 2.2) {
      this.phase = "done";
      this.active = false;
      this.onComplete?.();
      return;
    }

    // Breach radius animation
    if (this.phase === "forming") {
      this.breachTargetRadius = 15;
      this.lensStrength = t / 0.3;
    } else if (this.phase === "widening") {
      this.breachTargetRadius = 80 + (t - 0.3) / 0.7 * 400;
      this.lensStrength = 1 + (t - 0.3) / 0.7 * 2;
    } else if (this.phase === "collapse") {
      this.breachTargetRadius = 480 + (t - 1.0) / 0.6 * 600;
      this.lensStrength = 3 - (t - 1.0) / 0.6 * 2;
    } else if (this.phase === "revealing") {
      this.breachTargetRadius = 1080 + (t - 1.6) / 0.6 * 400;
      this.lensStrength = Math.max(0, 1 - (t - 1.6) / 0.6);
    }

    this.breachRadius += (this.breachTargetRadius - this.breachRadius) * 0.1;

    // Spawn shockwaves
    if (this.phase === "widening" && this.shockwaves.length === 0) {
      this.shockwaves.push({
        birth: performance.now(),
        maxRadius: Math.max(this.W, this.H) * 0.8,
        speed: 400,
        decay: 1.5,
        intensity: 1,
      });
    }

    // Update shards
    for (const shard of this.shards) {
      shard.x += shard.vx * dt * 60;
      shard.y += shard.vy * dt * 60;
      shard.vx *= 0.97;
      shard.vy *= 0.97;
      shard.life -= dt / shard.maxLife;
      shard.rotation += shard.rotSpeed * dt * 60;

      // Add to trail
      shard.trail.push({ x: shard.x, y: shard.y });
      if (shard.trail.length > 8) shard.trail.shift();
    }
    this.shards = this.shards.filter(s => s.life > 0);

    // Update tendrils
    for (const tendril of this.tendrils) {
      tendril.life -= dt / tendril.maxLife;
      // Animate points
      for (let i = 0; i < tendril.points.length; i++) {
        const p = tendril.points[i];
        const t2 = i / tendril.points.length;
        p.x += Math.sin(this.time * tendril.frequency + i * 0.5) * tendril.amplitude * t2 * dt;
        p.y += Math.cos(this.time * tendril.frequency + i * 0.5) * tendril.amplitude * t2 * dt;
      }
    }
    this.tendrils = this.tendrils.filter(t => t.life > 0);

    // Update shockwaves
    for (const sw of this.shockwaves) {
      sw.intensity -= dt / sw.decay;
    }
    this.shockwaves = this.shockwaves.filter(sw => sw.intensity > 0);

    // Update accretion particles
    for (const p of this.accretionParticles) {
      p.angle += p.speed * (1 + 2 / Math.max(p.dist, 10));
      p.dist *= 0.995;
    }
  }

  draw() {
    if (!this.active) return;
    const { ctx, centerX, centerY, time, W, H } = this;

    ctx.save();
    ctx.clearRect(0, 0, W, H);

    // 1. GRAVITATIONAL LENSING BACKGROUND
    // Draw the background with distortion around the breach
    if (this.lensStrength > 0) {
      this.drawGravitationalLensing(ctx, W, H, centerX, centerY, this.breachRadius, this.lensStrength);
    }

    // 2. ACCRETION DISK — Rotating energy ring around breach
    if (this.breachRadius > 20) {
      ctx.save();
      for (const p of this.accretionParticles) {
        const x = centerX + Math.cos(p.angle + time * 2) * p.dist;
        const y = centerY + Math.sin(p.angle + time * 2) * p.dist * 0.3;
        const alpha = (1 - p.dist / 100) * 0.6 * Math.min(1, time * 2);

        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, ${30 + p.dist}, ${50 + p.dist * 2}, ${alpha})`;
        ctx.fill();
      }
      ctx.restore();
    }

    // 3. VOID CORE — The actual hole in spacetime
    const voidGrad = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, this.breachRadius * 1.2
    );
    voidGrad.addColorStop(0, "rgba(3, 0, 1, 1)");
    voidGrad.addColorStop(0.3, "rgba(8, 0, 2, 0.95)");
    voidGrad.addColorStop(0.6, "rgba(20, 0, 5, 0.3)");
    voidGrad.addColorStop(0.85, "rgba(255, 0, 51, 0.15)");
    voidGrad.addColorStop(0.95, "rgba(0, 240, 255, 0.08)");
    voidGrad.addColorStop(1, "transparent");

    ctx.fillStyle = voidGrad;
    ctx.beginPath();
    this.drawBreachPath(ctx, centerX, centerY, this.breachRadius, this.breachIrregularity);
    ctx.fill();

    // 4. EVENT HORIZON GLOW — Intense ring at the edge
    const horizonGlow = ctx.createRadialGradient(
      centerX, centerY, this.breachRadius * 0.8,
      centerX, centerY, this.breachRadius * 1.15
    );
    horizonGlow.addColorStop(0, "transparent");
    horizonGlow.addColorStop(0.5, "rgba(255, 0, 51, 0.4)");
    horizonGlow.addColorStop(0.8, "rgba(255, 100, 50, 0.2)");
    horizonGlow.addColorStop(1, "transparent");

    ctx.fillStyle = horizonGlow;
    ctx.beginPath();
    this.drawBreachPath(ctx, centerX, centerY, this.breachRadius * 1.2, this.breachIrregularity);
    ctx.fill();

    // 5. SPACETIME FABRIC TEAR EDGES — Chromatic aberration
    this.drawTearEdges(ctx, centerX, centerY, this.breachRadius, this.breachIrregularity, time);

    // 6. ENERGY TENDRILS — Organic lightning
    ctx.save();
    for (const tendril of this.tendrils) {
      const alpha = tendril.life / tendril.maxLife;
      ctx.strokeStyle = `rgba(255, ${150 + Math.sin(time * 10) * 100}, 200, ${alpha * 0.8})`;
      ctx.lineWidth = 2;
      ctx.shadowColor = "#ff0033";
      ctx.shadowBlur = 15 * alpha;
      ctx.beginPath();
      ctx.moveTo(tendril.points[0].x, tendril.points[0].y);
      for (let i = 1; i < tendril.points.length; i++) {
        const cp1x = (tendril.points[i - 1].x + tendril.points[i].x) / 2;
        const cp1y = (tendril.points[i - 1].y + tendril.points[i].y) / 2;
        ctx.quadraticCurveTo(tendril.points[i - 1].x, tendril.points[i - 1].y, cp1x, cp1y);
      }
      ctx.stroke();
    }
    ctx.restore();

    // 7. CRYSTALLINE SHARDS — With motion blur trails
    ctx.save();
    for (const shard of this.shards) {
      const alpha = Math.max(0, shard.life);

      // Draw motion trail
      if (shard.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(shard.trail[0].x, shard.trail[0].y);
        for (let i = 1; i < shard.trail.length; i++) {
          ctx.lineTo(shard.trail[i].x, shard.trail[i].y);
        }
        ctx.strokeStyle = `rgba(${shard.color.r}, ${shard.color.g}, ${shard.color.b}, ${alpha * 0.3})`;
        ctx.lineWidth = shard.size * 0.5;
        ctx.stroke();
      }

      // Draw crystalline shard
      ctx.save();
      ctx.translate(shard.x, shard.y);
      ctx.rotate(shard.rotation);
      ctx.scale(shard.size, shard.size);

      ctx.beginPath();
      ctx.moveTo(shard.vertices[0].x, shard.vertices[0].y);
      for (let i = 1; i < shard.vertices.length; i++) {
        ctx.lineTo(shard.vertices[i].x, shard.vertices[i].y);
      }
      ctx.closePath();

      // Glass-like fill
      const grad = ctx.createLinearGradient(-1, -1, 1, 1);
      grad.addColorStop(0, `rgba(${shard.color.r}, ${shard.color.g}, ${shard.color.b}, ${alpha * 0.9})`);
      grad.addColorStop(0.5, `rgba(${shard.color.r}, ${shard.color.g}, ${shard.color.b}, ${alpha * 0.5})`);
      grad.addColorStop(1, `rgba(${shard.color.r * 0.5}, ${shard.color.g * 0.5}, ${shard.color.b * 0.5}, ${alpha * 0.3})`);
      ctx.fillStyle = grad;
      ctx.fill();

      // Edge glow
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
      ctx.lineWidth = 0.1;
      ctx.stroke();

      ctx.restore();
    }
    ctx.restore();

    // 8. SHOCKWAVE RINGS
    ctx.save();
    for (const sw of this.shockwaves) {
      const age = (performance.now() - sw.birth) / 1000;
      const radius = age * sw.speed;
      const alpha = sw.intensity * (1 - age / sw.decay);

      if (alpha > 0 && radius < sw.maxRadius) {
        // Primary ring
        ctx.strokeStyle = `rgba(255, 0, 51, ${alpha * 0.5})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = "#ff0033";
        ctx.shadowBlur = 20 * alpha;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Secondary cyan ring (chromatic separation)
        ctx.strokeStyle = `rgba(0, 240, 255, ${alpha * 0.3})`;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = "#00f0ff";
        ctx.shadowBlur = 15 * alpha;
        ctx.beginPath();
        ctx.arc(centerX + 3, centerY + 2, radius * 1.02, 0, Math.PI * 2);
        ctx.stroke();

        // Tertiary faint outer ring
        ctx.strokeStyle = `rgba(255, 100, 100, ${alpha * 0.15})`;
        ctx.lineWidth = 8;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 1.05, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();

    // 9. CENTER SINGULARITY GLOW
    if (this.phase !== "done") {
      const singularityGlow = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, this.breachRadius * 0.5
      );
      singularityGlow.addColorStop(0, "rgba(255, 255, 255, 0.8)");
      singularityGlow.addColorStop(0.2, "rgba(255, 200, 200, 0.4)");
      singularityGlow.addColorStop(0.5, "rgba(255, 50, 50, 0.2)");
      singularityGlow.addColorStop(1, "transparent");

      ctx.fillStyle = singularityGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, this.breachRadius * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 10. FINAL DISSOLVE VIGNETTE
    if (this.phase === "revealing") {
      const revealT = (time - 1.6) / 0.6;
      const vigAlpha = revealT * 0.9;
      const vig = ctx.createRadialGradient(
        centerX, centerY, this.breachRadius * 0.3,
        centerX, centerY, Math.max(W, H)
      );
      vig.addColorStop(0, "transparent");
      vig.addColorStop(0.2, `rgba(3, 0, 1, ${vigAlpha * 0.1})`);
      vig.addColorStop(0.6, `rgba(3, 0, 1, ${vigAlpha * 0.5})`);
      vig.addColorStop(1, `rgba(3, 0, 1, ${vigAlpha})`);
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);
    }

    ctx.restore();
  }

  private drawBreachPath(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number,
    radius: number,
    irregularity: number[]
  ) {
    const segments = irregularity.length - 1;
    ctx.moveTo(
      cx + Math.cos(0) * radius * irregularity[0],
      cy + Math.sin(0) * radius * irregularity[0]
    );
    for (let i = 1; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const r = radius * irregularity[i];
      ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
    }
    ctx.closePath();
  }

  private drawTearEdges(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number,
    radius: number,
    irregularity: number[],
    time: number
  ) {
    const segments = irregularity.length - 1;

    // Red channel offset (left/up)
    ctx.save();
    ctx.shadowColor = "#ff0033";
    ctx.shadowBlur = 20;
    ctx.strokeStyle = "rgba(255, 0, 51, 0.7)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const r = radius * irregularity[i] + Math.sin(time * 8 + i * 0.5) * 2;
      const x = cx + Math.cos(angle) * r - 3;
      const y = cy + Math.sin(angle) * r - 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // Cyan channel offset (right/down)
    ctx.save();
    ctx.shadowColor = "#00f0ff";
    ctx.shadowBlur = 15;
    ctx.strokeStyle = "rgba(0, 240, 255, 0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const r = radius * irregularity[i] + Math.sin(time * 6 + i * 0.3) * 1.5;
      const x = cx + Math.cos(angle) * r + 3;
      const y = cy + Math.sin(angle) * r + 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // White hot core filament
    ctx.save();
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 10;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const r = radius * irregularity[i];
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  private drawGravitationalLensing(
    ctx: CanvasRenderingContext2D,
    W: number, H: number,
    cx: number, cy: number,
    radius: number,
    strength: number
  ) {
    // Create a subtle distortion effect by drawing radial gradient bands
    const bands = 8;
    for (let i = 0; i < bands; i++) {
      const dist = radius * (0.5 + i * 0.3);
      const alpha = strength * 0.03 * (1 - i / bands);

      const grad = ctx.createRadialGradient(cx, cy, dist * 0.9, cx, cy, dist * 1.1);
      grad.addColorStop(0, `rgba(255, 0, 51, 0)`);
      grad.addColorStop(0.5, `rgba(255, 0, 51, ${alpha})`);
      grad.addColorStop(1, `rgba(255, 0, 51, 0)`);

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════
interface LoaderProps {
  onComplete?: () => void;
}

export default function Loader({ onComplete }: LoaderProps) {
  const { audioEnabled, initAudio, setProgress: setAudioProgress, triggerTear: triggerAudioTear } = useSuspenseAudio();
  const [isComplete, setIsComplete] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const matrixCanvasRef = useRef<HTMLCanvasElement>(null);
  const breachCanvasRef = useRef<HTMLCanvasElement>(null);
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
  const logoRef = useRef<HTMLDivElement>(null);

  const dropsRef = useRef<MicroDrop[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const mouseSmoothRef = useRef({ x: -1000, y: -1000 });
  const breachEngineRef = useRef<BreachEngine | null>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());
  const phaseTimerRef = useRef(0);
  const hasCompletedRef = useRef(false);
  const progressRef = useRef(0);
  const phaseRef = useRef<"void" | "loading" | "converging" | "breaching" | "done">("void");
  const shownLogsRef = useRef<Set<number>>(new Set());
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const voidStartRef = useRef<number>(0);
  const rainFadeRef = useRef(0);
  const hbRingsRef = useRef<{ birth: number }[]>([]);
  const lastHbRef = useRef(0);
  const themeColorRef = useRef("#ff0033");
  const logoScaleRef = useRef(0);
  const logoOpacityRef = useRef(0);

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

  useEffect(() => {
    const matrixCanvas = matrixCanvasRef.current;
    const breachCanvas = breachCanvasRef.current;
    if (!matrixCanvas || !breachCanvas) return;

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

    breachEngineRef.current = new BreachEngine(breachCanvas);
    breachEngineRef.current.resize(W, H);
    breachEngineRef.current.onComplete = () => {
      if (hasCompletedRef.current) return;
      hasCompletedRef.current = true;
      phaseRef.current = "done";

      if (flashRef.current) {
        flashRef.current.style.transition = "opacity 0.15s";
        flashRef.current.style.opacity = "1";
        setTimeout(() => {
          if (flashRef.current) {
            flashRef.current.style.transition = "opacity 2s ease-out";
            flashRef.current.style.opacity = "0";
          }
        }, 150);
      }

      if (uiLayerRef.current) {
        uiLayerRef.current.style.transition = "opacity 0.8s";
        uiLayerRef.current.style.opacity = "0";
      }
      if (bigCounterRef.current) {
        bigCounterRef.current.style.transition = "opacity 0.8s";
        bigCounterRef.current.style.opacity = "0";
      }

      setTimeout(() => {
        setIsComplete(true);
        onComplete?.();
      }, 2000);
    };

    initDrops(W, H);
    voidStartRef.current = performance.now();

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) mouseRef.current = { x: touch.clientX, y: touch.clientY, active: true };
    };
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    const handleResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      matrixCanvas.width = W * dpr;
      matrixCanvas.height = H * dpr;
      matrixCanvas.style.width = W + "px";
      matrixCanvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      breachEngineRef.current?.resize(W, H);
      initDrops(W, H);
    };
    window.addEventListener("resize", handleResize);

    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const time = now / 1000;

      mouseSmoothRef.current.x += (mouseRef.current.x - mouseSmoothRef.current.x) * 0.1;
      mouseSmoothRef.current.y += (mouseRef.current.y - mouseSmoothRef.current.y) * 0.1;
      const mx = mouseSmoothRef.current.x;
      const my = mouseSmoothRef.current.y;

      // ── VOID PHASE ──
      if (phaseRef.current === "void") {
        const voidElapsed = (now - voidStartRef.current) / 1000;
        ctx.fillStyle = CONFIG.VOID_BLACK;
        ctx.fillRect(0, 0, W, H);

        if (voidElapsed >= 0.5 && voidElapsed < 0.7) {
          const t = (voidElapsed - 0.5) / 0.2;
          const halfWidth = Math.min(Math.pow(2, t * 10), W / 2);
          ctx.save();
          ctx.shadowColor = "#ff0033";
          ctx.shadowBlur = 8 + t * 16;
          ctx.fillStyle = "#ff0033";
          ctx.fillRect(W / 2 - halfWidth, H / 2 - 1, halfWidth * 2, 2);
          ctx.restore();
        } else if (voidElapsed >= 0.7 && voidElapsed < 1.2) {
          const sweepT = (voidElapsed - 0.7) / 0.5;
          const sweepY = sweepT * H;
          for (let sy = 0; sy < sweepY; sy += 4) {
            if (Math.random() < 0.35) {
              ctx.fillStyle = `rgba(255, 0, 51, ${0.01 + Math.random() * 0.03})`;
              ctx.fillRect(0, sy, W, 1);
            }
          }
          ctx.save();
          ctx.shadowColor = "#ff0033";
          ctx.shadowBlur = 25;
          ctx.fillStyle = `rgba(255, 0, 51, ${0.7 + Math.random() * 0.3})`;
          ctx.fillRect(0, sweepY - 2, W, 3);
          ctx.fillStyle = "rgba(255, 100, 120, 0.3)";
          ctx.fillRect(0, sweepY + 3, W, 1);
          ctx.restore();
        } else if (voidElapsed >= 1.2) {
          phaseRef.current = "loading";
          startTimeRef.current = Date.now();
          rainFadeRef.current = 0;
        }

        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // ── PROGRESS LOGIC ──
      if (phaseRef.current === "loading") {
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
        for (const d of dropsRef.current) {
          const dx = W / 2 - d.x;
          const dy = H / 2 - d.y;
          d.x += dx * 0.025 * dt * 60;
          d.y += dy * 0.025 * dt * 60;
          d.baseSpeed *= 1.008;
        }
        if (phaseTimerRef.current > CONFIG.CONVERGE_DURATION / 1000) {
          phaseRef.current = "breaching";
          breachEngineRef.current?.start();
          triggerAudioTear();

          // ═════ LOGO EMERGENCE FROM SINGULARITY ═════
          if (logoRef.current) {
            logoRef.current.style.transition = 
              "transform 2.2s cubic-bezier(0.16, 1, 0.3, 1), " +
              "opacity 1.6s cubic-bezier(0.4, 0, 0.2, 1), " +
              "filter 2.5s ease-out";
            logoRef.current.style.transform = "scale(1)";
            logoRef.current.style.opacity = "1";
            logoRef.current.style.filter = 
              "drop-shadow(0 0 40px rgba(255,0,51,1)) " +
              "drop-shadow(0 0 80px rgba(255,0,51,0.6)) " +
              "drop-shadow(0 0 120px rgba(255,0,51,0.3))";
          }
        }
      } else if (phaseRef.current === "breaching") {
        // Logo emerges from singularity
        logoScaleRef.current = Math.min(1, logoScaleRef.current + dt * 0.8);
        logoOpacityRef.current = Math.min(1, logoOpacityRef.current + dt * 1.2);
      }

      // ── UPDATE UI ──
      const currentProgress = progressRef.current;
      setAudioProgress(currentProgress);
      const displayProgress = Math.floor(currentProgress);

      if (phaseRef.current === "loading" && logoRef.current) {
        logoRef.current.style.opacity = Math.min(1, Math.max(0.3, currentProgress / 5)).toString();
        logoRef.current.style.transform = "scale(1)";
      }

      if (progressFillRef.current) {
        progressFillRef.current.style.width = displayProgress + "%";
      }
      if (percentTextRef.current) {
        percentTextRef.current.textContent = displayProgress + "%";
      }
      const s = displayProgress.toString().padStart(3, "0");
      if (counterC1Ref.current) counterC1Ref.current.textContent = s[0];
      if (counterC2Ref.current) counterC2Ref.current.textContent = s[1];
      if (counterC3Ref.current) counterC3Ref.current.textContent = s[2];

      for (const log of LOG_LINES) {
        if (currentProgress >= log.threshold && !shownLogsRef.current.has(log.threshold)) {
          shownLogsRef.current.add(log.threshold);
          if (terminalRef.current) {
            const div = document.createElement("div");
            div.textContent = log.text;
            div.style.opacity = "0";
            div.style.transition = "opacity 0.3s";
            div.style.color = "#ff0033";
            div.style.textShadow = "0 0 8px rgba(255, 0, 51, 0.6)";
            div.style.fontFamily = "var(--font-jetbrains-mono), monospace";
            div.style.fontSize = "11px";
            div.style.letterSpacing = "0.15em";
            div.style.marginBottom = "4px";
            terminalRef.current.appendChild(div);
            requestAnimationFrame(() => { div.style.opacity = "1"; });
            if (terminalRef.current.children.length > 4) {
              terminalRef.current.removeChild(terminalRef.current.firstChild!);
            }
          }
        }
      }

      if (phaseRef.current === "converging" && uiLayerRef.current) {
        const shake = (1 - phaseTimerRef.current / (CONFIG.CONVERGE_DURATION / 1000)) * 3;
        uiLayerRef.current.style.transform =
          `translate(${(Math.random() - 0.5) * shake}px, ${(Math.random() - 0.5) * shake}px)`;
      }

      // ── CLEAR CANVAS ──
      ctx.fillStyle = `rgba(3, 0, 1, ${CONFIG.CLEAR_ALPHA})`;
      ctx.fillRect(0, 0, W, H);

      // ── DRAW DROPS ──
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

        const breathe = Math.sin(time * 2 + d.phase) * 0.3 + 0.7;
        opacity *= breathe;
        d.y += speed * (dt * 60);

        for (let c = 0; c < d.chars.length; c++) {
          const ch = d.chars[c];
          ch.switchTimer -= dt * 60;
          if (ch.switchTimer <= 0) {
            ch.char = CHAR_POOL[Math.floor(Math.random() * CHAR_POOL.length)];
            ch.switchTimer = 5 + Math.random() * 25;
          }
        }

        if (d.y > H + 20) {
          d.y = -20;
          d.x = Math.random() * W;
        }

        for (let c = 0; c < d.chars.length; c++) {
          const cy = d.y - c * d.fontSize * 1.1;
          if (cy < -10 || cy > H + 10) continue;

          const charOpacity = (c === 0 ? opacity : opacity * (1 - c / d.chars.length) * 0.7) * rainFadeRef.current;
          if (charOpacity < 0.005) continue;

          let r: number, g: number, b: number;
          if (d.layer === 2 && c === 0) {
            r = Math.min(255, 200 + tcR * 0.2 + Math.sin(time * 3) * 55);
            g = Math.min(255, 200 + tcG * 0.2 + Math.sin(time * 3) * 55);
            b = Math.min(255, 200 + tcB * 0.2 + Math.sin(time * 3) * 55);
          } else {
            const intensity = d.layer === 2 ? 1.0 : d.layer === 1 ? 0.7 : 0.31;
            r = tcR * intensity;
            g = tcG * intensity;
            b = tcB * intensity;
          }

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

      // ── HEARTBEAT RING ──
      if (phaseRef.current === "loading" || phaseRef.current === "converging") {
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

      // ── BREACH ──
      breachEngineRef.current?.update(dt);
      breachEngineRef.current?.draw();

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (isComplete) return null;

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

      {/* Breach overlay canvas */}
      <canvas
        ref={breachCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 100 }}
      />

      {/* White flash on breach */}
      <div
        ref={flashRef}
        className="absolute inset-0 pointer-events-none bg-white"
        style={{ zIndex: 200, opacity: 0 }}
      />

      {/* UI Layer */}
      <div
        ref={uiLayerRef}
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{ zIndex: 10 }}
      >
      {/* ═══════════════════════════════════════════════════════════════
      CYBERPUNK "P" LOGO — Singularity Emergence
      ══════════════════════════════════════════════════════════════ */}
        <div
          ref={logoRef}
          className="relative w-[160px] h-[160px] mb-16 flex items-center justify-center logo-breach-container"
          style={{ 
            transform: "scale(1)", 
            opacity: 1,
            zIndex: 150,
            filter: "drop-shadow(0 0 25px rgba(255,0,51,0.8)) drop-shadow(0 0 50px rgba(255,0,51,0.4))"
          }}
        >
          {/* Outer tachyon ring */}
          <div
            className="absolute inset-[-28px] rounded-full border border-[#ff0033]/15 border-t-[#ff0033]/90"
            style={{ 
              animation: "spin 3.5s linear infinite",
              boxShadow: "inset 0 0 20px rgba(255,0,51,0.1), 0 0 30px rgba(255,0,51,0.15)"
            }}
          />
          {/* Middle counter-rotating ring */}
          <div
            className="absolute inset-[-45px] rounded-full border-[0.5px] border-b-[#ff0033]/50 border-t-transparent"
            style={{ 
              animation: "spin-reverse 5.5s linear infinite",
              boxShadow: "0 0 25px rgba(255,0,51,0.1)"
            }}
          />
          {/* Inner data-stream ring */}
          <div
            className="absolute inset-[-62px] rounded-full border-[0.3px] border-l-[#ff0033]/40 border-r-transparent"
            style={{ 
              animation: "spin 7.5s linear infinite",
              boxShadow: "0 0 15px rgba(255,0,51,0.08)"
            }}
          />
          {/* Glitch hex frame */}
          <div
            className="absolute inset-[-8px]"
            style={{
              clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
              border: "1px solid rgba(255,0,51,0.2)",
              animation: "glitch-pulse 2.1s ease-in-out infinite"
            }}
          />
          {/* ═════ THE "P" LETTER ═════ */}
          <div className="relative flex items-center justify-center w-full h-full">
            <span
              className="font-black select-none"
              style={{
                fontSize: "96px",
                fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                color: "#ff0033",
                textShadow: `
                  0 0 10px rgba(255,0,51,0.9),
                  0 0 30px rgba(255,0,51,0.7),
                  0 0 60px rgba(255,0,51,0.4),
                  0 0 100px rgba(255,0,51,0.2),
                  -2px 0 0 rgba(0,240,255,0.5),
                  2px 0 0 rgba(255,0,51,0.5)
                `,
                animation: "p-blink 1.8s ease-in-out infinite, p-flicker 0.15s steps(1) infinite",
                letterSpacing: "-2px",
                lineHeight: 1,
                transform: "translateY(-2px)"
              }}
            >
              P
            </span>
            {/* Subtle scanline overlay on P */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,0,51,0.03) 2px, rgba(255,0,51,0.03) 4px)",
                mixBlendMode: "overlay"
              }}
            />
          </div>
          {/* Corner brackets — cyberpunk frame accents */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#ff0033]/60" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#ff0033]/60" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#ff0033]/60" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#ff0033]/60" />
          {/* Floating data particles around P */}
          <div className="absolute inset-0 pointer-events-none overflow-visible">
            <span className="absolute top-[-10px] left-[20%] text-[7px] text-[#ff0033]/40 font-mono animate-pulse" style={{ animationDelay: "0s" }}>01</span>
            <span className="absolute top-[30%] right-[-12px] text-[6px] text-[#00f0ff]/30 font-mono animate-pulse" style={{ animationDelay: "0.4s" }}>AP</span>
            <span className="absolute bottom-[15%] left-[-8px] text-[7px] text-[#ff0033]/35 font-mono animate-pulse" style={{ animationDelay: "0.8s" }}>◢</span>
            <span className="absolute bottom-[-8px] right-[25%] text-[6px] text-[#ff0033]/30 font-mono animate-pulse" style={{ animationDelay: "1.2s" }}>∴</span>
          </div>
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
          phaseRef.current = "breaching";
          breachEngineRef.current?.start();
        }}
        onThemeChange={(color) => {
          themeColorRef.current = color;
        }}
      />
    </div>
  );
}

