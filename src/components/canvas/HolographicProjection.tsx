"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import DashboardHero from "@/components/ui/DashboardHero";
import FloatingDebris from "./FloatingDebris";
import FloorProjection from "./FloorProjection";

// ═══════════════════════════════════════════════════════════════════════
// SHADERS — Volumetric Beam (Light Cone)
// ═══════════════════════════════════════════════════════════════════════

const beamVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying float vDistFromCenter;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uPulse;

  void main() {
    vUv = uv;
    vec3 pos = position;

    // Breathing effect: expand/contract radius with time
    float breathe = 1.0 + sin(uTime * 2.5 + uv.y * 8.0) * 0.08 * uPulse;
    pos.x *= breathe;
    pos.z *= breathe;

    // Slight waviness
    pos.x += sin(uv.y * 12.0 + uTime * 3.0) * 0.12 * uv.y;
    pos.z += cos(uv.y * 10.0 + uTime * 2.5) * 0.08 * uv.y;

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPos.xyz;
    vDistFromCenter = length(vec2(pos.x, pos.z));

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const beamFragmentShader = `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uIntensity;
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying float vDistFromCenter;

  void main() {
    // Core vs rim
    float core = 1.0 - smoothstep(0.0, 0.35, vDistFromCenter);
    float rim = 1.0 - smoothstep(0.2, 0.85, vDistFromCenter);

    // Vertical fade: brighter at bottom (source), dimmer at top
    float verticalFade = 1.0 - smoothstep(0.3, 1.0, vUv.y);
    float sourceGlow = 1.0 - smoothstep(0.0, 0.15, vUv.y);

    // Scanlines moving upward
    float scan = sin(vUv.y * 60.0 - uTime * 8.0) * 0.5 + 0.5;
    float scanlines = scan * 0.15;

    // Dust sparkle inside beam
    float sparkle = pow(sin(vUv.y * 120.0 + uTime * 15.0) * 0.5 + 0.5, 12.0) * 0.4;

    // Colors: hot white core, crimson body, deep red edges
    vec3 coreColor = vec3(1.0, 0.9, 0.9);
    vec3 midColor = vec3(1.0, 0.08, 0.2);
    vec3 rimColor = vec3(0.6, 0.02, 0.08);

    vec3 color = mix(rimColor, midColor, rim);
    color = mix(color, coreColor, core * 0.6);

    // Add scanline tint
    color += midColor * scanlines;
    color += coreColor * sparkle;

    // Alpha: core is solid, edges fade, bottom is brightest
    float alpha = (core * 0.9 + rim * 0.35 + scanlines * 0.5) * verticalFade * uOpacity;
    alpha += sourceGlow * 0.4 * uOpacity;
    alpha *= (1.0 - vUv.y * 0.3); // gentle top fade

    if (alpha < 0.002) discard;

    gl_FragColor = vec4(color, alpha);
  }
`;

// ═══════════════════════════════════════════════════════════════════════
// SHADERS — Beam Particles (Dust Motes)
// ═══════════════════════════════════════════════════════════════════════

const particleVertexShader = `
  attribute float aSize;
  attribute float aPhase;
  attribute float aSpeed;
  varying float vAlpha;
  uniform float uTime;
  uniform float uOpacity;

  void main() {
    vAlpha = 0.4 + 0.3 * sin(uTime * 0.8 + aPhase);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * (40.0 / max(1.0, -mv.z));
    gl_PointSize = min(gl_PointSize, 32.0);
  }
`;

const particleFragmentShader = `
  uniform float uOpacity;
  varying float vAlpha;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float d = length(uv);
    if (d > 0.5) discard;

    float core = smoothstep(0.5, 0.0, d);
    float glow = smoothstep(0.5, 0.15, d) * 0.5;

    // White-hot center, crimson edge
    vec3 color = mix(vec3(1.0, 0.08, 0.2), vec3(1.0, 0.9, 0.9), core);
    float alpha = (core * 0.9 + glow * 0.4) * vAlpha * uOpacity;

    if (alpha < 0.005) discard;
    gl_FragColor = vec4(color, alpha);
  }
`;

// ═══════════════════════════════════════════════════════════════════════
// SHADERS — Backing Glow (Radial bloom behind panel)
// ═══════════════════════════════════════════════════════════════════════

const backingVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const backingFragmentShader = `
  uniform float uOpacity;
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    float dist = length(vUv - 0.5);
    float radial = 1.0 - smoothstep(0.0, 0.5, dist);

    vec3 centerColor = vec3(1.0, 0.9, 0.9);
    vec3 edgeColor = vec3(1.0, 0.08, 0.2);
    vec3 color = mix(edgeColor, centerColor, radial);

    float alpha = radial * 0.08 * uOpacity;
    if (alpha < 0.002) discard;

    gl_FragColor = vec4(color, alpha);
  }
`;

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

interface HolographicProjectionProps {
  scrollProgress: number;
  laptopScreenRef: React.MutableRefObject<THREE.Mesh | null>;
  visible: boolean;
  deviceTier?: "mobile" | "tablet" | "desktop";
}

interface AnimationValues {
  beamOpacity: number;
  beamScaleY: number;
  glassOpacity: number;
  htmlOpacity: number;
  htmlBlur: number;
  panelZ: number;
  panelRotateX: number;
  panelScale: number;
  chromaticAberration: number;
  wireframeScale: number;
  floorOpacity: number;
  debrisOpacity: number;
  rimPulse: number;
  hasEmerged: boolean;
  sourceGlow: number;
}

// ═══════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export default function HolographicProjection({
  scrollProgress,
  laptopScreenRef,
  visible,
  deviceTier = "desktop",
}: HolographicProjectionProps) {
  const { camera } = useThree();
  const isMobile = deviceTier === "mobile";

  // ── Refs ─────────────────────────────────────────────────────────────
  const rigRef = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const glassRef = useRef<THREE.Mesh>(null);
  const rimLightRef = useRef<THREE.PointLight>(null);
  const beamBaseLightRef = useRef<THREE.PointLight>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const edgeTorusRef = useRef<THREE.LineSegments>(null);
  const wireframeRef = useRef<THREE.Mesh>(null);
  const htmlWrapperRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  // Animation values (all refs — no setState in useFrame)
  const animRef = useRef<AnimationValues>({
    beamOpacity: 0,
    beamScaleY: 0.1,
    glassOpacity: 0,
    htmlOpacity: 0,
    htmlBlur: 8,
    panelZ: -2.0,
    panelRotateX: 45,
    panelScale: 0.2,
    chromaticAberration: 0,
    wireframeScale: 0.01,
    floorOpacity: 0,
    debrisOpacity: 0,
    rimPulse: 0,
    hasEmerged: false,
    sourceGlow: 0.6,
  });

  // Mouse tracking for parallax
  const mouseRef = useRef({ x: 0, y: 0 });
  const smoothMouse = useRef({ x: 0, y: 0 });

  // Scratch vectors (persisted across frames)
  const scratch = useMemo(
    () => ({
      screenPos: new THREE.Vector3(),
      screenQuat: new THREE.Quaternion(),
      screenScale: new THREE.Vector3(),
      screenNormal: new THREE.Vector3(),
      rigPos: new THREE.Vector3(),
      up: new THREE.Vector3(0, 1, 0),
      beamTarget: new THREE.Vector3(),
      beamMid: new THREE.Vector3(),
      beamDir: new THREE.Vector3(),
      tempVec: new THREE.Vector3(),
      wireframePos: new THREE.Vector3(),
      wireframeQuat: new THREE.Quaternion(),
      wireframeScale: new THREE.Vector3(),
    }),
    []
  );

  // ── Beam Material ────────────────────────────────────────────────────
  const beamMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uOpacity: { value: 0 },
          uPulse: { value: 0 },
          uIntensity: { value: 1.0 },
        },
        vertexShader: beamVertexShader,
        fragmentShader: beamFragmentShader,
      }),
    []
  );

  // ── Particle Geometry & Material ─────────────────────────────────────
  const particleCount = isMobile ? 0 : 150;

  const { particlePositions, particleSizes, particlePhases, particleSpeeds } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const sz = new Float32Array(particleCount);
    const ph = new Float32Array(particleCount);
    const spd = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      // Distribute inside cone volume
      const radius = Math.random() * 0.6;
      const angle = Math.random() * Math.PI * 2;
      const y = Math.random();

      pos[i3] = Math.cos(angle) * radius * (1.0 - y * 0.5);
      pos[i3 + 1] = y;
      pos[i3 + 2] = Math.sin(angle) * radius * (1.0 - y * 0.5);

      sz[i] = 0.5 + Math.random() * 1.5;
      ph[i] = Math.random() * Math.PI * 2;
      spd[i] = 0.2 + Math.random() * 0.5;
    }

    return {
      particlePositions: pos,
      particleSizes: sz,
      particlePhases: ph,
      particleSpeeds: spd,
    };
  }, [particleCount]);

  const particleMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uOpacity: { value: 0 },
        },
        vertexShader: particleVertexShader,
        fragmentShader: particleFragmentShader,
      }),
    []
  );

  // ── Backing Glow Material ────────────────────────────────────────────
  const backingMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: {
          uOpacity: { value: 0 },
          uTime: { value: 0 },
        },
        vertexShader: backingVertexShader,
        fragmentShader: backingFragmentShader,
      }),
    []
  );

  // ── Glass Slab Material ──────────────────────────────────────────────
  const glassMaterial = useMemo(() => {
    if (isMobile) {
      return new THREE.MeshBasicMaterial({
        color: new THREE.Color("#0a0002"),
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      });
    }
    return new THREE.MeshPhysicalMaterial({
      transmission: 0.95,
      thickness: 2.0,
      roughness: 0.05,
      metalness: 0.1,
      color: new THREE.Color("#0a0002"),
      attenuationColor: new THREE.Color("#ff0033"),
      attenuationDistance: 5.0,
      ior: 1.7,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      envMapIntensity: 2.0,
    });
  }, [isMobile]);


  // ── Mouse listener ───────────────────────────────────────────────────
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  // ── Emergence Animation Timeline (GSAP) ──────────────────────────────
  useEffect(() => {
    if (!visible) {
      // Reset values when hidden
      const a = animRef.current;
      a.beamOpacity = 0;
      a.beamScaleY = 0.1;
      a.glassOpacity = 0;
      a.htmlOpacity = 0;
      a.htmlBlur = 8;
      a.panelZ = -2.0;
      a.panelRotateX = 45;
      a.panelScale = 0.2;
      a.chromaticAberration = 0;
      a.wireframeScale = 0.01;
      a.floorOpacity = 0;
      a.debrisOpacity = 0;
      a.rimPulse = 0;
      a.hasEmerged = false;
      a.sourceGlow = 0.6;
      return;
    }

    const a = animRef.current;
    const tl = gsap.timeline();
    tlRef.current = tl;

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 1: THE SPARK (0.0s - 0.4s)
    // ═══════════════════════════════════════════════════════════════════
    tl.to(
      a,
      {
        wireframeScale: 0.3,
        sourceGlow: 3.0,
        duration: 0.2,
        ease: "power2.out",
        onComplete: () => {
          gsap.to(a, { sourceGlow: 0.8, duration: 0.2 });
        },
      },
      0
    );
    tl.to(a, { beamOpacity: 0.15, duration: 0.4, ease: "power2.out" }, 0);

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 2: THE BREACH (0.4s - 1.2s)
    // ═══════════════════════════════════════════════════════════════════
    tl.to(a, { beamOpacity: 0.85, duration: 0.8, ease: "power4.out" }, 0.4);
    tl.to(a, { beamScaleY: 1.0, duration: 0.8, ease: "power4.out" }, 0.4);
    tl.to(a, { glassOpacity: 0.15, duration: 0.8 }, 0.4);
    tl.to(a, { chromaticAberration: 4.0, duration: 0.3, yoyo: true, repeat: 3 }, 0.5);

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 3: MATERIALIZATION (1.2s - 2.2s)
    // ═══════════════════════════════════════════════════════════════════
    tl.to(a, { chromaticAberration: 0, duration: 0.3 }, 1.2);
    tl.to(a, { glassOpacity: 0.3, duration: 1.0 }, 1.2);
    tl.to(a, { htmlOpacity: 1, duration: 1.0, ease: "power2.out" }, 1.2);
    tl.to(a, { htmlBlur: 0, duration: 1.0, ease: "power2.out" }, 1.2);
    tl.to(a, { floorOpacity: 0.12, duration: 0.8, ease: "power2.out" }, 1.4);
    tl.to(
      a,
      {
        panelZ: 0,
        panelRotateX: 8,
        panelScale: 1.0,
        duration: 1.0,
        ease: "power3.out",
      },
      1.2
    );

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 4: STABILIZATION (2.2s - 3.5s)
    // ═══════════════════════════════════════════════════════════════════
    tl.to(a, { debrisOpacity: 1, duration: 1.3 }, 2.2);
    tl.to(a, { rimPulse: 1, duration: 1.3 }, 2.2);
    tl.call(
      () => {
        a.hasEmerged = true;
      },
      [],
      3.5
    );

    return () => {
      tl.kill();
    };
  }, [visible]);

  // ── Speed up timeline if user scrolls early ──────────────────────────
  useEffect(() => {
    if (!visible || !tlRef.current) return;
    const tl = tlRef.current;
    if (scrollProgress > 0.01 && !animRef.current.hasEmerged && tl.progress() < scrollProgress * 6) {
      tl.time(scrollProgress * 21);
    }
  }, [scrollProgress, visible]);

  // ── Main Animation Loop ──────────────────────────────────────────────
  useFrame((state) => {
    const screen = laptopScreenRef.current;
    const rig = rigRef.current;
    const t = state.clock.getElapsedTime();
    const a = animRef.current;

    if (!screen || !rig) {
      if (htmlWrapperRef.current) {
        htmlWrapperRef.current.style.opacity = "0";
      }
      return;
    }

    // Smooth mouse interpolation
    smoothMouse.current.x += (mouseRef.current.x - smoothMouse.current.x) * 0.08;
    smoothMouse.current.y += (mouseRef.current.y - smoothMouse.current.y) * 0.08;
    const mx = smoothMouse.current.x;
    const my = smoothMouse.current.y;

    // Decompose laptop screen world transform
    screen.updateWorldMatrix(true, false);
    screen.matrixWorld.decompose(
      scratch.screenPos,
      scratch.screenQuat,
      scratch.screenScale
    );

    // Screen normal (pointing out of laptop screen)
    scratch.screenNormal.set(0, 0, 1).applyQuaternion(scratch.screenQuat).normalize();

    // ── Scroll-driven targets ──────────────────────────────────────────
    const p = Math.max(0, Math.min(1, scrollProgress));

    let targetZ = 0;
    let targetRotateX = 8;
    let targetScale = 1.0;
    let targetY = 0;
    let targetOpacity = 1.0;
    let targetBeamOpacity = 0.85;
    let targetBeamScale = 1.0;
    let targetChromatic = 0;
    let targetBrightness = 1.0;
    let mouseParallaxActive = false;

    if (p < 0.15) {
      // EMERGENCE (0.00 - 0.15)
      const s = p / 0.15;
      targetZ = THREE.MathUtils.lerp(-2.0, 0, s);
      targetRotateX = THREE.MathUtils.lerp(45, 8, s);
      targetScale = THREE.MathUtils.lerp(0.2, 1.0, s);
    } else if (p >= 0.15 && p < 0.5) {
      // STABILIZED HERO (0.15 - 0.50)
      targetRotateX = 8;
      targetScale = 1.0;
      mouseParallaxActive = true;
    } else if (p >= 0.5 && p < 0.75) {
      // DEEP READ (0.50 - 0.75)
      const s = (p - 0.5) / 0.25;
      targetBrightness = THREE.MathUtils.lerp(1.0, 0.85, s);
      mouseParallaxActive = true;
    } else if (p >= 0.75 && p < 0.9) {
      // ASCENSION (0.75 - 0.90)
      const s = (p - 0.75) / 0.15;
      targetY = THREE.MathUtils.lerp(0, -1.2, s);
      targetRotateX = THREE.MathUtils.lerp(8, -15, s);
      targetScale = THREE.MathUtils.lerp(1.0, 0.92, s);
      targetBeamOpacity = THREE.MathUtils.lerp(0.85, 0.4, s);
    } else if (p >= 0.9) {
      // DISSIPATION (0.90 - 1.00)
      const s = (p - 0.9) / 0.1;
      targetOpacity = THREE.MathUtils.lerp(1.0, 0.0, s);
      targetChromatic = s * 8;
      targetBeamOpacity = THREE.MathUtils.lerp(0.4, 0.0, s);
      targetBeamScale = THREE.MathUtils.lerp(1.0, 0.1, s);
      targetScale = THREE.MathUtils.lerp(0.92, 0.1, s);
      targetY = -1.2;
      targetRotateX = -15;
    }

    // Blend emergence animation with scroll-driven values
    const effectiveZ = a.hasEmerged ? targetZ : THREE.MathUtils.lerp(a.panelZ, targetZ, 0.1);
    const effectiveRotateX = a.hasEmerged
      ? targetRotateX
      : THREE.MathUtils.lerp(a.panelRotateX, targetRotateX, 0.1);
    const effectiveScale = a.hasEmerged
      ? targetScale
      : THREE.MathUtils.lerp(a.panelScale, targetScale, 0.1);

    // Mouse parallax (max ±3deg)
    const parallaxX = mouseParallaxActive ? mx * 3 : 0;
    const parallaxY = mouseParallaxActive ? my * 3 : 0;

    // Panel hover (Phase 4: gentle sinusoidal Y ±6px, 6s period)
    const hoverY = a.hasEmerged ? Math.sin(t * 1.05) * 0.06 : 0;

    // ── Position hologram rig ──────────────────────────────────────────
    // Position above laptop screen, facing camera
    scratch.rigPos.copy(scratch.screenPos).add(scratch.screenNormal.clone().multiplyScalar(2.5));
    scratch.rigPos.y += targetY + (mouseParallaxActive ? my * 0.05 : 0) + hoverY;
    // FIX: Apply scroll-driven Z offset (approaching camera during emergence)
    scratch.rigPos.add(scratch.screenNormal.clone().multiplyScalar(effectiveZ));

    rig.position.copy(scratch.rigPos);
    rig.lookAt(camera.position);

    // Apply rotations
    const rotXRad = (effectiveRotateX + parallaxY) * (Math.PI / 180);
    const rotYRad = parallaxX * (Math.PI / 180);
    rig.rotateX(rotXRad);
    rig.rotateY(rotYRad);
    rig.scale.setScalar(effectiveScale);

    // Visibility
    const effectiveOpacity = a.hasEmerged ? targetOpacity * a.htmlOpacity : a.htmlOpacity;
    rig.visible = effectiveOpacity > 0.002 && visible;

    // ── Update HTML wrapper opacity, blur, CSS variables & emerged state ──
    if (htmlWrapperRef.current) {
      htmlWrapperRef.current.style.opacity = effectiveOpacity.toFixed(4);
      htmlWrapperRef.current.style.filter = `blur(${a.htmlBlur}px) brightness(${targetBrightness})`;
      const chromatic = a.hasEmerged ? targetChromatic : a.chromaticAberration;
      htmlWrapperRef.current.style.transform = `translateZ(0) scale(${1.0 + chromatic * 0.01})`;
      htmlWrapperRef.current.style.setProperty("--emergence-opacity", a.htmlOpacity.toFixed(4));
      htmlWrapperRef.current.classList.toggle("has-emerged", a.htmlOpacity > 0.05);
    }

    // ── Update Beam ────────────────────────────────────────────────────
    if (beamRef.current) {
      const beamOp = a.beamOpacity * targetBeamOpacity;
      beamRef.current.visible = beamOp > 0.002 && visible;

      // Position beam from screen center to panel center
      scratch.beamTarget.copy(scratch.rigPos);
      scratch.beamMid.copy(scratch.screenPos).lerp(scratch.beamTarget, 0.5);
      scratch.beamDir.copy(scratch.beamTarget).sub(scratch.screenPos).normalize();

      beamRef.current.position.copy(scratch.beamMid);
      beamRef.current.quaternion.setFromUnitVectors(scratch.up, scratch.beamDir);
      beamRef.current.scale.set(
        1.0,
        scratch.screenPos.distanceTo(scratch.beamTarget) * a.beamScaleY * targetBeamScale,
        1.0
      );

      beamMaterial.uniforms.uTime.value = t;
      beamMaterial.uniforms.uOpacity.value = beamOp;
      beamMaterial.uniforms.uPulse.value = a.hasEmerged ? 1.0 : 0.5;
    }

    // ── Update Particles ───────────────────────────────────────────────
    if (particlesRef.current && particleCount > 0) {
      particleMaterial.uniforms.uTime.value = t;
      particleMaterial.uniforms.uOpacity.value = a.beamOpacity * targetBeamOpacity;
      particlesRef.current.visible = a.beamOpacity > 0.01 && visible;

      // Animate particles drifting upward
      const posAttr = particlesRef.current.geometry.attributes.position;
      const posArray = posAttr.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        posArray[i3 + 1] += particleSpeeds[i] * 0.002;
        if (posArray[i3 + 1] > 1.2) {
          posArray[i3 + 1] = 0;
        }
      }
      posAttr.needsUpdate = true;
    }

    // ── Update Glass Slab ──────────────────────────────────────────────
    if (glassRef.current) {
      const glassMat = glassRef.current.material as THREE.MeshBasicMaterial | THREE.MeshPhysicalMaterial;
      glassMat.opacity = a.glassOpacity;
      if (!isMobile && "transmission" in glassMat) {
        (glassMat as THREE.MeshPhysicalMaterial).transmission = a.glassOpacity > 0.01 ? 0.95 : 0;
      }
    }

    // ── Update Edge Glow ───────────────────────────────────────────────
    if (edgeTorusRef.current) {
      const pulse = 0.5 + Math.sin(t * 1.5) * 0.2 * a.rimPulse;
      const lineMat = edgeTorusRef.current.material as THREE.LineBasicMaterial;
      if (lineMat) lineMat.opacity = pulse * a.glassOpacity;
    }

    // ── Update Backing Glow ────────────────────────────────────────────
    if (glowRef.current) {
      backingMaterial.uniforms.uOpacity.value = a.glassOpacity * a.rimPulse;
      backingMaterial.uniforms.uTime.value = t;
    }

    // ── Update Rim Light (panel glow) ──────────────────────────────────
    if (rimLightRef.current) {
      rimLightRef.current.position.copy(scratch.rigPos);
      rimLightRef.current.intensity = a.beamOpacity * 2.4 * targetOpacity;
    }

    // ── Update Beam Base Light (red tint on laptop chassis) ────────────
    if (beamBaseLightRef.current) {
      beamBaseLightRef.current.position.copy(scratch.screenPos);
      beamBaseLightRef.current.intensity = a.beamOpacity * 1.5;
    }
  });

  // ── Wireframe Cube Animation (separate useFrame) ─────────────────────
  useFrame(() => {
    const screen = laptopScreenRef.current;
    const wire = wireframeRef.current;
    const a = animRef.current;
    if (!screen || !wire) return;

    screen.updateWorldMatrix(true, false);
    screen.matrixWorld.decompose(
      scratch.wireframePos,
      scratch.wireframeQuat,
      scratch.wireframeScale
    );

    wire.position.copy(scratch.wireframePos);
    wire.scale.setScalar(Math.max(0.001, a.wireframeScale));
    wire.visible = a.wireframeScale > 0.001 && visible;
  });

  if (!visible) return null;

  return (
    <group>
      {/* ═══ VOLUMETRIC BEAM ═══ */}
      <mesh ref={beamRef} material={beamMaterial} renderOrder={5}>
        <cylinderGeometry args={[0.8, 0.04, 1, 4, isMobile ? 12 : 24, true]} />
      </mesh>

      {/* ═══ BEAM PARTICLES ═══ */}
      {particleCount > 0 && (
        <points ref={particlesRef} material={particleMaterial} renderOrder={6}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[particlePositions, 3]}
            />
            <bufferAttribute
              attach="attributes-aSize"
              args={[particleSizes, 1]}
            />
            <bufferAttribute
              attach="attributes-aPhase"
              args={[particlePhases, 1]}
            />
            <bufferAttribute
              attach="attributes-aSpeed"
              args={[particleSpeeds, 1]}
            />
          </bufferGeometry>
        </points>
      )}

      {/* ═══ PHASE 1 WIREFRAME CUBE (The Spark) ═══ */}
      <mesh ref={wireframeRef} visible={false} renderOrder={7}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshBasicMaterial
          color="#ff1744"
          wireframe
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* ═══ BEAM BASE LIGHT (subtle red tint on laptop chassis) ═══ */}
      <pointLight
        ref={beamBaseLightRef}
        color="#ff1744"
        intensity={0}
        distance={3}
        decay={2}
      />

      {/* ═══ HOLOGRAM RIG ═══ */}
      <group ref={rigRef}>
        {/* ── Glass Panel Backing ── */}
        <mesh ref={glassRef} material={glassMaterial} renderOrder={10}>
          <boxGeometry args={[14.2, 7.2, 0.15]} />
        </mesh>

        {/* ── Edge Glow (rectangular rim tracing the glass slab perimeter) ── */}
        <lineSegments ref={edgeTorusRef} renderOrder={11}>
          <edgesGeometry args={[new THREE.BoxGeometry(14.2, 7.2, 0.15)]} />
          <lineBasicMaterial
            color="#ff1744"
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </lineSegments>

        {/* ── Backing Glow (radial bloom behind panel) ── */}
        <mesh
          ref={glowRef}
          material={backingMaterial}
          position={[0, 0, -0.3]}
          renderOrder={8}
        >
          <planeGeometry args={[16, 9]} />
        </mesh>

        {/* ── Rim Light (crimson glow at panel) ── */}
        <pointLight
          ref={rimLightRef}
          color="#ff1744"
          intensity={0}
          distance={4.5}
          decay={2}
        />

        {/* ── HTML Content (DashboardHero) ── */}
        <Html
          transform
          center
          distanceFactor={1.0}
          zIndexRange={[20, 60]}
          style={{ pointerEvents: "auto", userSelect: "none" }}
        >
          <div
            ref={htmlWrapperRef}
            style={{
              width: isMobile ? "100vw" : "1400px",
              maxWidth: isMobile ? "100vw" : "1400px",
              padding: "48px 56px",
              background: "transparent",
              opacity: 0,
              transformOrigin: "center center",
              willChange: "opacity, filter, transform",
            }}
          >
            <DashboardHero scrollProgress={scrollProgress} stageScale={1} spatial />
          </div>
        </Html>

        {/* ── Floating Debris (orbiting shards & data chips) ── */}
        <FloatingDebris visible={visible} isMobile={isMobile} animRef={animRef} />
      </group>

      {/* ═══ FLOOR PROJECTION ═══ */}
      <FloorProjection visible={visible} animRef={animRef} laptopScreenRef={laptopScreenRef} />
    </group>
  );
}