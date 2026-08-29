"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useMousePosition } from "@/hooks/useMousePosition";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES — Strict, zero `any`
// ═══════════════════════════════════════════════════════════════════════════════

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
  brightness: number;
  emergenceProgress: number;
  dissipationProgress: number;
  panelY: number;
  hoverPhase: number;
}

interface FloatingDebrisProps {
  visible: boolean;
  isMobile: boolean;
  animRef: React.RefObject<AnimationValues>;
}

interface ShardConfig {
  orbitA: number;
  orbitB: number;
  orbitSpeed: number;
  orbitPhase: number;
  inclinationX: number;
  inclinationY: number;
  inclinationZ: number;
  spinAxis: THREE.Vector3;
  spinSpeed: number;
  baseSize: number;
  color: THREE.Color;
  emissive: THREE.Color;
  repulsionStrength: number;
  formationDelay: number;
}

interface ChipConfig {
  text: string;
  basePos: THREE.Vector3;
  phase: number;
  speed: number;
  scale: number;
  parallaxFactor: number;
  rotationSpeed: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const SHARD_COUNT_DESKTOP = 30;
const SHARD_COUNT_MOBILE = 8;
const CHIP_COUNT_DESKTOP = 12;
const CHIP_COUNT_MOBILE = 4;
const DUST_COUNT_DESKTOP = 80;
const DUST_COUNT_MOBILE = 0;

const PALETTE: { color: THREE.Color; emissive: THREE.Color; weight: number }[] = [
  { color: new THREE.Color("#ff1744"), emissive: new THREE.Color("#ff0033"), weight: 0.35 },
  { color: new THREE.Color("#ff3355"), emissive: new THREE.Color("#ff6688"), weight: 0.35 },
  { color: new THREE.Color("#800010"), emissive: new THREE.Color("#400008"), weight: 0.25 },
  { color: new THREE.Color("#ffffff"), emissive: new THREE.Color("#ffcccc"), weight: 0.05 },
];

const CHIP_TEXTS = [
  "01", "AP", "◢", "∴", "REACT", "NODE", "TS", "NEXT", "◤", "PY", "GO", "R3F",
];

// ═══════════════════════════════════════════════════════════════════════════════
// MATH UTILITIES — GC-free helpers
// ═══════════════════════════════════════════════════════════════════════════════

function weightedRandomEntry<T>(items: { value: T; weight: number }[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item.value;
  }
  return items[items.length - 1].value;
}

function damp(current: number, target: number, lambda: number, dt: number): number {
  return THREE.MathUtils.lerp(current, target, 1.0 - Math.exp(-lambda * dt));
}

// ═══════════════════════════════════════════════════════════════════════════════
// CANVAS TEXTURE FACTORY — JetBrains Mono holographic chips
// ═══════════════════════════════════════════════════════════════════════════════

function createChipTexture(text: string): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("[FloatingDebris] Canvas 2D context acquisition failed");

  // Transparent background
  ctx.clearRect(0, 0, size, size);

  // Outer glow pass (crimson)
  ctx.shadowColor = "#ff0033";
  ctx.shadowBlur = 60;
  ctx.font = "bold 96px 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ff1744";
  ctx.fillText(text, size / 2, size / 2);

  // Inner glow pass (bright core)
  ctx.shadowColor = "#ff99aa";
  ctx.shadowBlur = 25;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(text, size / 2, size / 2);

  // Subtle scanline overlay on texture
  ctx.globalCompositeOperation = "overlay";
  for (let y = 0; y < size; y += 4) {
    ctx.fillStyle = `rgba(255, 0, 30, ${0.03 + Math.random() * 0.04})`;
    ctx.fillRect(0, y, size, 1);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENT: HEX SHARD SYSTEM
// 30 instanced hexagonal prisms with elliptical orbits, magnetic repulsion,
// tumbling spin, and cinematic formation animation.
// ═══════════════════════════════════════════════════════════════════════════════

interface HexShardSystemProps {
  count: number;
  animRef: React.RefObject<AnimationValues>;
  mousePos: { x: number; y: number };
}

const HexShardSystem = React.memo(function HexShardSystem({
  count,
  animRef,
  mousePos,
}: HexShardSystemProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { camera } = useThree();

  // Scratch objects — persisted across frames to eliminate GC pressure
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const _pos = useMemo(() => new THREE.Vector3(), []);
  const _push = useMemo(() => new THREE.Vector3(), []);
  const _euler = useMemo(() => new THREE.Euler(), []);
  const _color = useMemo(() => new THREE.Color(), []);

  // Smooth formation & opacity
  const smoothForm = useRef(0);
  const smoothOpacity = useRef(0);

  // Generate shard configurations
  const shards = useMemo<ShardConfig[]>(() => {
    return Array.from({ length: count }, () => {
      const spinAxis = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize();

      const paletteEntry = weightedRandomEntry(
        PALETTE.map((p) => ({ value: p, weight: p.weight }))
      );

      return {
        orbitA: 2.0 + Math.random() * 2.6,
        orbitB: 1.3 + Math.random() * 1.7,
        orbitSpeed: (Math.random() - 0.5) * 0.45 + 0.18,
        orbitPhase: Math.random() * Math.PI * 2,
        inclinationX: (Math.random() - 0.5) * 1.4,
        inclinationY: (Math.random() - 0.5) * 0.8,
        inclinationZ: (Math.random() - 0.5) * 1.4,
        spinAxis,
        spinSpeed: (Math.random() - 0.5) * 3.5,
        baseSize: 0.02 + Math.random() * 0.06,
        color: paletteEntry.color.clone(),
        emissive: paletteEntry.emissive.clone(),
        repulsionStrength: 0.9 + Math.random() * 1.4,
        formationDelay: Math.random() * 0.6,
      };
    });
  }, [count]);

  // Hexagonal prism geometry — flattened into chip-like plates
  const geometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.5, 0.5, 1, 6);
    geo.scale(1, 0.22, 1);
    return geo;
  }, []);

  // Physical material for glass-like crystalline feel with emissive bloom
  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.15,
        roughness: 0.15,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        emissive: 0xff1744,
        emissiveIntensity: 0.35,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
      }),
    []
  );

  // Initialize instance colors & matrices
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    for (let i = 0; i < shards.length; i++) {
      mesh.setColorAt(i, shards[i].color);
      dummy.position.set(0, -999, 0);
      dummy.scale.setScalar(0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.instanceMatrix.needsUpdate = true;
  }, [shards, dummy]);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    const a = animRef.current;
    if (!mesh || !a) return;

    const dt = Math.min(delta, 0.05);
    const t = state.clock.getElapsedTime();

    // Gate visibility
    const targetOpacity = a.debrisOpacity * (a.hasEmerged ? 1 : 0);
    smoothOpacity.current = damp(smoothOpacity.current, targetOpacity, 10, dt);

    if (smoothOpacity.current <= 0.001) {
      mesh.visible = false;
      return;
    }
    mesh.visible = true;

    // Formation progress: shards spiral in from expanded orbits
    const rawForm = Math.max(0, (a.debrisOpacity - 0.1) / 0.9);
    smoothForm.current = damp(smoothForm.current, rawForm, 4, dt);
    const form = smoothForm.current;

    // Material pulse synced with hologram rim
    const pulse = 0.85 + 0.15 * Math.sin(t * 1.8) * a.rimPulse;
    material.opacity = smoothOpacity.current * pulse;
    material.emissiveIntensity = (0.25 + 0.2 * a.rimPulse) * smoothOpacity.current;

    // Mouse repulsor in local panel space
    // Panel faces camera via lookAt, so local XY ≈ screen space
    const repulsorX = mousePos.x * 5.5;
    const repulsorY = mousePos.y * 3.8;

    for (let i = 0; i < shards.length; i++) {
      const s = shards[i];
      const staggeredForm = Math.max(0, Math.min(1, (form - s.formationDelay) / (1 - s.formationDelay)));
      if (staggeredForm <= 0.001) {
        dummy.position.set(0, -999, 0);
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        continue;
      }

      // Elliptical orbit
      const angle = t * s.orbitSpeed + s.orbitPhase;
      const expand = 1.0 + (1.0 - staggeredForm) * 2.5; // Start far, spiral in
      _pos.set(
        Math.cos(angle) * s.orbitA * expand,
        Math.sin(angle) * s.orbitB * expand,
        0
      );

      // Apply 3D inclination to orbit plane
      _euler.set(s.inclinationX, s.inclinationY, s.inclinationZ);
      _pos.applyEuler(_euler);

      // Magnetic repulsion from cursor (world-space approx in local XY)
      _push.copy(_pos);
      _push.x -= repulsorX;
      _push.y -= repulsorY;
      const dist = _push.length();
      const repelRadius = 3.2;
      if (dist < repelRadius && dist > 0.001) {
        const force = Math.pow(1.0 - dist / repelRadius, 1.5) * s.repulsionStrength;
        _push.normalize().multiplyScalar(force);
        _pos.add(_push);
      }

      // Breathing scale
      const breathe = 1.0 + Math.sin(t * 2.2 + i * 0.7) * 0.06 * a.rimPulse;
      const scale = s.baseSize * staggeredForm * breathe;

      // Tumble rotation
      dummy.position.copy(_pos);
      dummy.scale.setScalar(scale);
      dummy.rotation.set(0, 0, 0);
      dummy.rotateOnAxis(s.spinAxis, t * s.spinSpeed + i * 1.3);
      dummy.updateMatrix();

      mesh.setMatrixAt(i, dummy.matrix);

      // Dynamic emissive color pulse per shard
      _color.copy(s.color).lerp(s.emissive, 0.3 + 0.2 * Math.sin(t * 3 + i));
      mesh.setColorAt(i, _color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={true}
      renderOrder={15}
    />
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENT: DATA CHIP SYSTEM
// 12 floating text chips rendered as canvas textures. They float in the
// foreground (closer to camera than panel) with 1.5x parallax reactivity.
// ═══════════════════════════════════════════════════════════════════════════════

interface DataChipSystemProps {
  count: number;
  animRef: React.RefObject<AnimationValues>;
  mousePos: { x: number; y: number };
}

const DataChipSystem = React.memo(function DataChipSystem({
  count,
  animRef,
  mousePos,
}: DataChipSystemProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Smooth parallax state
  const smoothMouse = useRef({ x: 0, y: 0 });
  const smoothForm = useRef(0);

  const chips = useMemo<ChipConfig[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      text: CHIP_TEXTS[i % CHIP_TEXTS.length],
      basePos: new THREE.Vector3(
        (Math.random() - 0.5) * 5.8,
        (Math.random() - 0.5) * 3.6,
        0.25 + Math.random() * 0.75 // Foreground layer
      ),
      phase: Math.random() * Math.PI * 2,
      speed: 0.2 + Math.random() * 0.45,
      scale: 0.09 + Math.random() * 0.13,
      parallaxFactor: 1.3 + Math.random() * 0.8,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
    }));
  }, [count]);

  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

  const materials = useMemo(() => {
    return chips.map((chip) => {
      const tex = createChipTexture(chip.text);
      return new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      });
    });
  }, [chips]);

  useFrame((state, delta) => {
    const group = groupRef.current;
    const a = animRef.current;
    if (!group || !a) return;

    const dt = Math.min(delta, 0.05);
    const t = state.clock.getElapsedTime();

    const targetOpacity = a.debrisOpacity * (a.hasEmerged ? 1 : 0);
    if (targetOpacity <= 0.001) {
      group.visible = false;
      return;
    }
    group.visible = true;

    // Smooth formation
    const rawForm = Math.max(0, (a.debrisOpacity - 0.15) / 0.85);
    smoothForm.current = damp(smoothForm.current, rawForm, 5, dt);
    const form = smoothForm.current;

    // Parallax at 1.5x panel rate (opposite direction for depth)
    const targetX = -mousePos.x * 0.55;
    const targetY = -mousePos.y * 0.42;
    smoothMouse.current.x += (targetX - smoothMouse.current.x) * 0.07;
    smoothMouse.current.y += (targetY - smoothMouse.current.y) * 0.07;

    group.children.forEach((child, i) => {
      if (i >= chips.length) return;
      const chip = chips[i];
      const mesh = child as THREE.Mesh;
      const mat = mesh.material as THREE.MeshBasicMaterial;

      const staggeredForm = Math.max(0, Math.min(1, (form - i * 0.04) / 0.7));

      // Organic bobbing
      const bobY = Math.sin(t * chip.speed + chip.phase) * 0.14;
      const bobX = Math.cos(t * chip.speed * 0.65 + chip.phase) * 0.07;
      const bobZ = Math.sin(t * chip.speed * 0.35 + chip.phase) * 0.05;

      // Parallax offset (1.5x rate as specified)
      const paraX = smoothMouse.current.x * chip.parallaxFactor;
      const paraY = smoothMouse.current.y * chip.parallaxFactor;

      mesh.position.set(
        chip.basePos.x + bobX + paraX,
        chip.basePos.y + bobY + paraY,
        chip.basePos.z + bobZ
      );

      // Gentle rotation
      mesh.rotation.z = Math.sin(t * chip.rotationSpeed + chip.phase) * 0.08;

      // Scale & opacity with formation
      const s = chip.scale * staggeredForm;
      mesh.scale.set(s, s, s);
      mat.opacity = targetOpacity * staggeredForm * (0.85 + 0.15 * Math.sin(t * 2 + i));
    });
  });

  return (
    <group ref={groupRef}>
      {chips.map((chip, i) => (
        <mesh
          key={`chip-${chip.text}-${i}`}
          geometry={geometry}
          material={materials[i]}
          renderOrder={16}
        />
      ))}
    </group>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENT: ATMOSPHERIC DUST
// Ultra-subtle crimson motes that drift around the hologram. Adds volumetric
// depth and sells the "physical light" illusion. Disabled on mobile.
// ═══════════════════════════════════════════════════════════════════════════════

interface AtmosphericDustProps {
  count: number;
  animRef: React.RefObject<AnimationValues>;
}

const AtmosphericDust = React.memo(function AtmosphericDust({
  count,
  animRef,
}: AtmosphericDustProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const smoothOpacity = useRef(0);

  const { positions, phases, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const ph = new Float32Array(count);
    const sz = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * 9;
      pos[i3 + 1] = (Math.random() - 0.5) * 5.5;
      pos[i3 + 2] = (Math.random() - 0.5) * 2.5;
      ph[i] = Math.random() * Math.PI * 2;
      sz[i] = 0.008 + Math.random() * 0.025;
    }
    return { positions: pos, phases: ph, sizes: sz };
  }, [count]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uOpacity: { value: 0 },
          uColor: { value: new THREE.Color("#ff1744") },
        },
        vertexShader: /* glsl */ `
          attribute float aPhase;
          attribute float aSize;
          varying float vAlpha;
          uniform float uTime;
          void main() {
            vAlpha = 0.3 + 0.25 * sin(uTime * 0.7 + aPhase);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = aSize * (45.0 / max(1.0, -mv.z));
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform float uOpacity;
          varying float vAlpha;
          void main() {
            vec2 uv = gl_PointCoord - vec2(0.5);
            float d = length(uv);
            if (d > 0.5) discard;
            float core = smoothstep(0.5, 0.0, d);
            float halo = smoothstep(0.5, 0.2, d) * 0.4;
            float alpha = (core + halo) * vAlpha * uOpacity;
            if (alpha < 0.003) discard;
            gl_FragColor = vec4(uColor * (1.0 + core * 0.5), alpha);
          }
        `,
      }),
    []
  );

  useFrame((state, delta) => {
    const points = pointsRef.current;
    const a = animRef.current;
    if (!points || !a || count === 0) return;

    const dt = Math.min(delta, 0.05);
    const t = state.clock.getElapsedTime();

    const targetOpacity = a.debrisOpacity * 0.3 * (a.hasEmerged ? 1 : 0);
    smoothOpacity.current = damp(smoothOpacity.current, targetOpacity, 8, dt);

    if (smoothOpacity.current <= 0.001) {
      points.visible = false;
      return;
    }
    points.visible = true;
    material.uniforms.uTime.value = t;
    material.uniforms.uOpacity.value = smoothOpacity.current;

    const posAttr = points.geometry.attributes.position;
    const posArray = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      posArray[i3] += Math.sin(t * 0.25 + phases[i]) * 0.0006;
      posArray[i3 + 1] += Math.cos(t * 0.18 + phases[i]) * 0.0005;
      posArray[i3 + 2] += Math.sin(t * 0.12 + phases[i]) * 0.0003;
    }
    posAttr.needsUpdate = true;
  });

  if (count === 0) return null;

  return (
    <points ref={pointsRef} material={material} renderOrder={13} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
      </bufferGeometry>
    </points>
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT: FloatingDebris
// Orchestrates shards, chips, and dust into one cohesive debris field.
// ═══════════════════════════════════════════════════════════════════════════════

export default function FloatingDebris({
  visible,
  isMobile,
  animRef,
}: FloatingDebrisProps) {
  const mousePos = useMousePosition(0.08);

  if (!visible) return null;

  const shardCount = isMobile ? SHARD_COUNT_MOBILE : SHARD_COUNT_DESKTOP;
  const chipCount = isMobile ? CHIP_COUNT_MOBILE : CHIP_COUNT_DESKTOP;
  const dustCount = isMobile ? DUST_COUNT_MOBILE : DUST_COUNT_DESKTOP;

  return (
    <group name="FloatingDebrisRig">
      {/* Orbiting glass shards — elliptical hex prisms */}
      <HexShardSystem count={shardCount} animRef={animRef} mousePos={mousePos} />

      {/* Foreground data chips — canvas text textures */}
      <DataChipSystem count={chipCount} animRef={animRef} mousePos={mousePos} />

      {/* Atmospheric dust motes — volumetric depth */}
      <AtmosphericDust count={dustCount} animRef={animRef} />
    </group>
  );
}