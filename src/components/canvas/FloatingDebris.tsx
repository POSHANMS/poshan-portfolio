"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMousePosition } from "@/hooks/useMousePosition";

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

interface FloatingDebrisProps {
  visible: boolean;
  isMobile: boolean;
  animRef: React.RefObject<AnimationValues>;
}

// ═══════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════

const SHARD_COUNT_DESKTOP = 26;
const SHARD_COUNT_MOBILE = 8;
const CHIP_COUNT_DESKTOP = 10;
const CHIP_COUNT_MOBILE = 4;

const SHARD_COLORS = [
  new THREE.Color("#ff1744"),
  new THREE.Color("#ff3355"),
  new THREE.Color("#800010"),
  new THREE.Color("#ffffff"),
];

const SHARD_COLOR_WEIGHTS = [0.35, 0.35, 0.25, 0.05];

const CHIP_TEXTS = [
  "01",
  "AP",
  "◢",
  "∴",
  "REACT",
  "NODE",
  "TS",
  "NEXT",
  "◤",
  "PY",
  "GO",
  "R3F",
];

// ═══════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════

function weightedRandomIndex(weights: number[]): number {
  const sum = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * sum;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

function createTextTexture(text: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  const size = 256;
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("FloatingDebris: Failed to acquire canvas 2D context");
  }

  ctx.clearRect(0, 0, size, size);

  ctx.font =
    "bold 64px 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.shadowColor = "#ff0033";
  ctx.shadowBlur = 28;
  ctx.fillStyle = "#ff1744";
  ctx.fillText(text, size / 2, size / 2);

  ctx.shadowColor = "#ff3355";
  ctx.shadowBlur = 12;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(text, size / 2, size / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// ═══════════════════════════════════════════════════════════════════════
// 7.1 ORBITING GLASS SHARDS
// ═══════════════════════════════════════════════════════════════════════

interface ShardConfig {
  orbitA: number;
  orbitB: number;
  orbitSpeed: number;
  orbitPhase: number;
  orbitQuat: THREE.Quaternion;
  spinAxis: THREE.Vector3;
  spinSpeed: number;
  size: number;
  color: THREE.Color;
}

function GlassShards({
  isMobile,
  animRef,
  mousePos,
}: {
  isMobile: boolean;
  animRef: React.RefObject<AnimationValues>;
  mousePos: { x: number; y: number };
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const dummy = useRef(new THREE.Object3D());
  const posScratch = useRef(new THREE.Vector3());
  const pushScratch = useRef(new THREE.Vector3());
  const repulsor = useRef(new THREE.Vector3());

  const count = isMobile ? SHARD_COUNT_MOBILE : SHARD_COUNT_DESKTOP;

  const shards = useMemo<ShardConfig[]>(() => {
    return Array.from({ length: count }, () => {
      const normal = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize();
      const quat = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        normal
      );

      return {
        orbitA: 3.0 + Math.random() * 5.0,
        orbitB: 2.0 + Math.random() * 4.0,
        orbitSpeed: (Math.random() - 0.5) * 0.6 + 0.25,
        orbitPhase: Math.random() * Math.PI * 2,
        orbitQuat: quat,
        spinAxis: new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).normalize(),
        spinSpeed: (Math.random() - 0.5) * 3.0,
        size: 0.02 + Math.random() * 0.06,
        color: SHARD_COLORS[weightedRandomIndex(SHARD_COLOR_WEIGHTS)].clone(),
      };
    });
  }, [count]);

  const geometry = useMemo(
    () => new THREE.CylinderGeometry(0.5, 0.5, 1, 6),
    []
  );

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < shards.length; i++) {
      mesh.setColorAt(i, shards[i].color);
    }
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [shards]);

  useFrame((state) => {
    const mesh = meshRef.current;
    const a = animRef.current;
    if (!mesh || !a) return;

    if (a.debrisOpacity <= 0.001) {
      mesh.visible = false;
      return;
    }
    mesh.visible = true;

    const t = state.clock.getElapsedTime();
    const d = dummy.current;
    const p = posScratch.current;
    const push = pushScratch.current;
    const rep = repulsor.current;

    rep.set(mousePos.x * 8, mousePos.y * 4.5, 0);

    for (let i = 0; i < shards.length; i++) {
      const s = shards[i];
      const angle = t * s.orbitSpeed + s.orbitPhase;

      p.set(Math.cos(angle) * s.orbitA, Math.sin(angle) * s.orbitB, 0);
      p.applyQuaternion(s.orbitQuat);

      push.copy(p).sub(rep);
      const dist = push.length();
      const repelRadius = 2.5;
      if (dist < repelRadius && dist > 0.001) {
        const force = (1.0 - dist / repelRadius) * 1.5;
        push.normalize().multiplyScalar(force);
        p.add(push);
      }

      d.position.copy(p);
      d.scale.setScalar(s.size);
      d.rotation.set(0, 0, 0);
      d.rotateOnAxis(s.spinAxis, t * s.spinSpeed);
      d.updateMatrix();

      mesh.setMatrixAt(i, d.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    material.opacity = a.debrisOpacity;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
      renderOrder={15}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 7.2 DATA CHIPS
// ═══════════════════════════════════════════════════════════════════════

interface ChipConfig {
  text: string;
  basePos: THREE.Vector3;
  phase: number;
  speed: number;
  scale: number;
}

function DataChips({
  isMobile,
  animRef,
  mousePos,
}: {
  isMobile: boolean;
  animRef: React.RefObject<AnimationValues>;
  mousePos: { x: number; y: number };
}) {
  const groupRef = useRef<THREE.Group>(null);

  const count = isMobile ? CHIP_COUNT_MOBILE : CHIP_COUNT_DESKTOP;

  const chips = useMemo<ChipConfig[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      text: CHIP_TEXTS[i % CHIP_TEXTS.length],
      basePos: new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 6,
        -(0.8 + Math.random() * 1.2)
      ),
      phase: Math.random() * Math.PI * 2,
      speed: 0.2 + Math.random() * 0.4,
      scale: 0.15 + Math.random() * 0.15,
    }));
  }, [count]);

  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

  const materials = useMemo(() => {
    return chips.map((chip) => {
      const tex = createTextTexture(chip.text);
      return new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
    });
  }, [chips]);

  const parallaxLerp = useRef({ x: 0, y: 0 });

  useFrame((state) => {
    const group = groupRef.current;
    const a = animRef.current;
    if (!group || !a) return;

    if (a.debrisOpacity <= 0.001) {
      group.visible = false;
      return;
    }
    group.visible = true;

    const t = state.clock.getElapsedTime();

    // Panel parallax rate ≈ 0.3 units max deflection
    // Chips move opposite at 1.5x → ~0.45 units
    const targetX = -mousePos.x * 0.45;
    const targetY = -mousePos.y * 0.35;
    parallaxLerp.current.x += (targetX - parallaxLerp.current.x) * 0.08;
    parallaxLerp.current.y += (targetY - parallaxLerp.current.y) * 0.08;

    group.children.forEach((child, i) => {
      if (i >= chips.length) return;
      const chip = chips[i];
      const mesh = child as THREE.Mesh;
      const mat = mesh.material as THREE.MeshBasicMaterial;

      const bobY = Math.sin(t * chip.speed + chip.phase) * 0.15;
      const bobX = Math.cos(t * chip.speed * 0.7 + chip.phase) * 0.08;

      mesh.position.x = chip.basePos.x + bobX + parallaxLerp.current.x;
      mesh.position.y = chip.basePos.y + bobY + parallaxLerp.current.y;
      mesh.position.z = chip.basePos.z;

      mat.opacity = a.debrisOpacity;
    });
  });

  return (
    <group ref={groupRef}>
      {chips.map((chip, i) => (
        <mesh
          key={i}
          geometry={geometry}
          material={materials[i]}
          scale={chip.scale}
          renderOrder={16}
        />
      ))}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export default function FloatingDebris({
  visible,
  isMobile,
  animRef,
}: FloatingDebrisProps) {
  const mousePos = useMousePosition(0.08);

  if (!visible) return null;

  return (
    <group>
      <GlassShards isMobile={isMobile} animRef={animRef} mousePos={mousePos} />
      <DataChips isMobile={isMobile} animRef={animRef} mousePos={mousePos} />
    </group>
  );
}