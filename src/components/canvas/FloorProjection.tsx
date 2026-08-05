"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

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

interface FloorProjectionProps {
  visible: boolean;
  animRef: React.RefObject<AnimationValues>;
  laptopScreenRef?: React.MutableRefObject<THREE.Mesh | null>;
}

// ═══════════════════════════════════════════════════════════════════════
// SHADERS — Core Disc (Main Floor Projection)
// ═══════════════════════════════════════════════════════════════════════

const discVertexShader = `
  varying vec2 vUv;
  varying float vDist;
  uniform float uTime;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vDist = length(uv - 0.5) * 2.0;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const discFragmentShader = `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uRippleProgress;
  uniform float uPulse;
  varying vec2 vUv;
  varying float vDist;

  void main() {
    float dist = vDist;

    // Core radial gradient: crimson center fading to transparent edges
    float core = 1.0 - smoothstep(0.0, 0.35, dist);
    float mid = 1.0 - smoothstep(0.0, 0.70, dist);
    float edge = 1.0 - smoothstep(0.0, 1.0, dist);

    // Data radar pattern: slowly rotating concentric rings
    float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
    float radar = sin(dist * 18.0 - uTime * 1.2) * 0.5 + 0.5;
    float radarRing = smoothstep(0.48, 0.52, radar) * 0.12;

    // Rotating sweep line (holographic HUD)
    float sweep = angle + uTime * 0.6;
    float sweepLine = smoothstep(0.03, 0.0, abs(fract(sweep / 6.28318530718) - 0.5)) * 0.2;

    // Emergence ripple ring
    float ripple = 0.0;
    float rippleBright = 0.0;
    if (uRippleProgress > 0.0 && uRippleProgress < 1.0) {
      float rp = uRippleProgress;
      float r1 = smoothstep(0.0, 0.15, dist - rp);
      float r2 = smoothstep(0.0, 0.15, rp + 0.1 - dist);
      ripple = r1 * r2;
      rippleBright = ripple * 2.5;
    }

    // Color palette
    vec3 crimson   = vec3(1.0, 0.09, 0.27); // #ff1744
    vec3 deepRed   = vec3(1.0, 0.0,  0.20); // #ff0033
    vec3 softRed   = vec3(1.0, 0.20, 0.33); // #ff3355
    vec3 darkRed   = vec3(0.5, 0.0,  0.06); // #800010
    vec3 white     = vec3(1.0, 1.0,  1.0);

    // Base color mixing
    vec3 color = mix(darkRed, crimson, core);
    color = mix(color, deepRed, mid * 0.4);
    color = mix(color, softRed, edge * 0.2);

    // Add radar HUD pattern
    color += crimson * radarRing;
    color += vec3(1.0, 0.4, 0.4) * sweepLine * edge;

    // Ripple: white-hot leading edge, fading to crimson
    vec3 rippleColor = mix(crimson, white, ripple * 0.8);
    color += rippleColor * rippleBright;

    // Alpha composition
    float alpha = (core * 0.5 + mid * 0.25 + edge * 0.08) * uOpacity;
    alpha += ripple * 0.6 * uOpacity;
    alpha += radarRing * 0.25 * uOpacity;
    alpha += sweepLine * 0.15 * uOpacity;

    if (alpha < 0.002) discard;

    gl_FragColor = vec4(color, alpha);
  }
`;

// ═══════════════════════════════════════════════════════════════════════
// SHADERS — Grid Warp Decal (Darkens grid beneath hologram)
// ═══════════════════════════════════════════════════════════════════════

const gridDecalVertexShader = `
  varying vec2 vUv;
  varying float vDist;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vDist = length(uv - 0.5) * 2.0;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const gridDecalFragmentShader = `
  uniform float uOpacity;
  varying vec2 vUv;
  varying float vDist;

  void main() {
    float dist = vDist;
    float radial = 1.0 - smoothstep(0.0, 1.0, dist);
    // Dark crimson "burn" color
    vec3 color = vec3(0.06, 0.0, 0.01);
    float alpha = radial * 0.45 * uOpacity;
    if (alpha < 0.002) discard;
    gl_FragColor = vec4(color, alpha);
  }
`;

// ═══════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export default function FloorProjection({ visible, animRef, laptopScreenRef }: FloorProjectionProps) {
  if (!visible) return null;

  // ── Refs ─────────────────────────────────────────────────────────────
  const groupRef = useRef<THREE.Group>(null);
  const discRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const shockwaveRef = useRef<THREE.Mesh>(null);
  const gridDecalRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const screenWorldPosRef = useRef(new THREE.Vector3());

  // Ripple animation state (all refs — no setState)
  const rippleState = useRef({
    progress: 0.0,
    active: false,
    hasTriggered: false,
  });
  const prevFloorOpacity = useRef(0.0);
  const prevHasEmerged = useRef(false);

  // ── Geometries (useMemo) ─────────────────────────────────────────────
  const discGeometry = useMemo(() => new THREE.CircleGeometry(6.0, 64), []);
  const ringGeometry = useMemo(() => new THREE.RingGeometry(2.0, 2.1, 64), []);
  const shockwaveGeometry = useMemo(() => new THREE.RingGeometry(0.95, 1.0, 64), []);
  const gridDecalGeometry = useMemo(() => new THREE.CircleGeometry(6.0, 64), []);

  // ── Materials (useMemo) ──────────────────────────────────────────────
  const discUniforms = useMemo(
    () => ({
      uTime: { value: 0.0 },
      uOpacity: { value: 0.0 },
      uRippleProgress: { value: 0.0 },
      uPulse: { value: 0.0 },
    }),
    []
  );

  const discMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: discVertexShader,
        fragmentShader: discFragmentShader,
        uniforms: discUniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [discUniforms]
  );

  const gridDecalUniforms = useMemo(
    () => ({
      uOpacity: { value: 0.0 },
    }),
    []
  );

  const gridDecalMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: gridDecalVertexShader,
        fragmentShader: gridDecalFragmentShader,
        uniforms: gridDecalUniforms,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [gridDecalUniforms]
  );

  const ringMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#ff1744"),
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    []
  );

  const shockwaveMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#ffffff"),
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    []
  );

  // ── Main Animation Loop ──────────────────────────────────────────────
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const a = animRef.current;
    if (!a) return;

    // Detect emergence trigger for ripple
    const justEmerged = a.hasEmerged && !prevHasEmerged.current;
    const floorJustActivated = a.floorOpacity > 0.001 && prevFloorOpacity.current <= 0.001;
    if ((justEmerged || floorJustActivated) && !rippleState.current.hasTriggered) {
      rippleState.current.active = true;
      rippleState.current.progress = 0.0;
      rippleState.current.hasTriggered = true;
    }
    prevHasEmerged.current = a.hasEmerged;
    prevFloorOpacity.current = a.floorOpacity;

    // Animate ripple progress
    if (rippleState.current.active) {
      rippleState.current.progress += 0.012;
      if (rippleState.current.progress >= 1.0) {
        rippleState.current.progress = 1.0;
        rippleState.current.active = false;
      }
    }

    // Compute disc opacity: 0.08 → 0.18 pulsing range, gated by floorOpacity
    const discOpacity =
      a.floorOpacity > 0.001
        ? 0.13 + 0.05 * Math.sin(t * 1.5) * a.rimPulse
        : 0.0;

    // Update disc shader uniforms via direct assignment
    discMaterial.uniforms.uTime.value = t;
    discMaterial.uniforms.uOpacity.value = discOpacity;
    discMaterial.uniforms.uRippleProgress.value =
      rippleState.current.active || rippleState.current.progress < 1.0
        ? rippleState.current.progress
        : 0.0;
    discMaterial.uniforms.uPulse.value = a.rimPulse;

    // Update grid decal
    gridDecalMaterial.uniforms.uOpacity.value = a.floorOpacity;

    // Update energy ring (secondary) — slow rotation + pulse
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.004 * (1.0 + a.rimPulse * 0.5);
      const ringPulse = 0.4 + 0.35 * Math.sin(t * 1.2) * a.rimPulse;
      ringMaterial.opacity = a.floorOpacity > 0.001 ? ringPulse : 0.0;
    }

    // Update shockwave ring (tertiary) — expands 0 → 8.0 during emergence
    if (shockwaveRef.current) {
      if (rippleState.current.active || rippleState.current.progress < 1.0) {
        const shockScale = rippleState.current.progress * 8.0;
        shockwaveRef.current.scale.set(shockScale, shockScale, 1.0);
        shockwaveMaterial.opacity = a.floorOpacity * (1.0 - rippleState.current.progress) * 0.6;
        shockwaveRef.current.visible = true;
      } else {
        shockwaveRef.current.visible = false;
      }
    }

    // Update group position to track laptop screen X/Z coordinates
    if (laptopScreenRef?.current && groupRef.current) {
      const screen = laptopScreenRef.current;
      screen.updateWorldMatrix(true, false);
      screen.getWorldPosition(screenWorldPosRef.current);
      groupRef.current.position.x = screenWorldPosRef.current.x;
      groupRef.current.position.z = screenWorldPosRef.current.z;
    }

    // Update upward point light intensity
    if (lightRef.current) {
      lightRef.current.intensity = a.floorOpacity * 2.0;
    }
  });

  return (
    <group ref={groupRef} position={[0, -2.12, 0]}>
      {/* ═══ GRID WARP DECAL (darkens grid beneath) ═══ */}
      <mesh
        ref={gridDecalRef}
        geometry={gridDecalGeometry}
        material={gridDecalMaterial}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.02, 0]}
        renderOrder={1}
      />

      {/* ═══ CORE DISC (main floor projection) ═══ */}
      <mesh
        ref={discRef}
        geometry={discGeometry}
        material={discMaterial}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={2}
      />

      {/* ═══ SECONDARY ENERGY RING (targeting reticle) ═══ */}
      <mesh
        ref={ringRef}
        geometry={ringGeometry}
        material={ringMaterial}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
        renderOrder={3}
      />

      {/* ═══ TERTIARY SHOCKWAVE RING (emergence expansion) ═══ */}
      <mesh
        ref={shockwaveRef}
        geometry={shockwaveGeometry}
        material={shockwaveMaterial}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
        renderOrder={3}
        visible={false}
      />

      {/* ═══ UPWARD LIGHT CAST ═══ */}
      <pointLight
        ref={lightRef}
        color="#ff1744"
        intensity={0}
        distance={12}
        decay={2}
        position={[0, 0.1, 0]}
      />
    </group>
  );
}