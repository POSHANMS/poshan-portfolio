"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useMousePosition } from "@/hooks/useMousePosition";
import { WormholeValues } from "@/animations/wormholeLaptop";

const SCREEN_MATERIAL_NAME = "Material.004";

interface FloatingLaptopProps {
  powerUpStage?: string;
  laptopOpacity?: number;
  wormholeValues?: WormholeValues;
  wormholeActive?: boolean;
}

const TERMINAL_LINES = [
  "[ CORE ARCHITECTURE ONLINE ]",
  "> USER_IDENTITY: POSHAN_M_S",
  "> SYSTEM_STATUS: OPERATIONAL",
  "> SCROLL TO INITIALIZE HOLOGRAM INTERFACE_",
];

export default function FloatingLaptop({
  powerUpStage = "complete",
  laptopOpacity = 1,
  wormholeValues,
  wormholeActive = false,
}: FloatingLaptopProps) {
  const { scene } = useGLTF("/models/laptop-baked.glb");

  const groupRef = useRef<THREE.Group>(null);
  const bobRef   = useRef<THREE.Group>(null);
  const kbLightRef = useRef<THREE.PointLight>(null);
  const mouse = useMousePosition(0.08);

  // ── Live terminal canvas texture refs & persistent animation state ────
  const canvasRef       = useRef<HTMLCanvasElement | null>(null);
  const textureRef      = useRef<THREE.CanvasTexture | null>(null);
  const screenMeshRef   = useRef<THREE.Mesh | null>(null);
  const textureDirtyRef = useRef(false);

  // Persistent typewriter & boot state
  const animRef = useRef({
    booting: false,
    bootStartTime: 0,
    booted: false,
    completedLines: [] as string[],
    currentText: "",
    lineIndex: 0,
    cursorVisible: true,
    phase: "typing" as "typing" | "waiting" | "clearing",
    waitCounter: 0,
    lastTypeTime: 0,
    lastBlinkTime: 0,
    initialized: false,
  });

  useMemo(() => {
    // ═══════════════════════════════════════════════════════════════════
    // PBR MATERIAL TUNING — Gunmetal Chassis + Backlit Keyboard
    // ═══════════════════════════════════════════════════════════════════
    const chassisMaterial = new THREE.MeshStandardMaterial({
      color:             "#1a0a10",
      metalness:          0.80,
      roughness:          0.35,
      emissive:          "#0d0204",
      emissiveIntensity:  0.05,
    });

    const keyboardMaterial = new THREE.MeshStandardMaterial({
      color:             "#0f0508",
      metalness:          0.55,
      roughness:          0.48,
      emissive:          "#ff1744",
      emissiveIntensity:  0.18,
    });

    const trackpadMaterial = new THREE.MeshStandardMaterial({
      color:             "#14080c",
      metalness:          0.70,
      roughness:          0.25,
      emissive:          "#1a0005",
      emissiveIntensity:  0.04,
    });

    scene.updateMatrixWorld(true);

    scene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;

      mesh.castShadow    = true;
      mesh.receiveShadow = true;

      const mat = mesh.material as THREE.MeshStandardMaterial;
      const name = mesh.name.toLowerCase();

      if (mat && mat.name === SCREEN_MATERIAL_NAME) {
        screenMeshRef.current = mesh;
        mat.color.set("#050508");
        mat.emissive.set("#000000");
        mat.emissiveIntensity = 0; // Screen completely dark/off on load
        mat.roughness = 0.05;
        mat.metalness = 0.0;
        mat.toneMapped = false;
        mat.needsUpdate = true;
        return;
      }

      if (
        name.includes("keyboard") ||
        name.includes("keycap") ||
        name.includes("keys") ||
        (name.includes("key") && !name.includes("iskey"))
      ) {
        mesh.material = keyboardMaterial;
        return;
      }

      if (name.includes("trackpad") || name.includes("touchpad")) {
        mesh.material = trackpadMaterial;
        return;
      }

      mesh.material = chassisMaterial;
    });
  }, [scene]);

  // ── Canvas Initialization (runs once on mount) ──────────────────────
  useEffect(() => {
    if (!canvasRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width  = 512;
      canvas.height = 320;
      canvasRef.current = canvas;

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      textureRef.current = texture;

      if (screenMeshRef.current) {
        const mat = screenMeshRef.current.material as THREE.MeshStandardMaterial;
        mat.map          = texture;
        mat.emissiveMap  = texture;
        mat.emissive     = new THREE.Color("#ff2244");
        mat.emissiveIntensity = 0; // Dark until boot trigger
        mat.needsUpdate  = true;
      }
    }
  }, []);

  // Helper to draw terminal frame to canvas
  const drawTerminal = (screenOn: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const anim = animRef.current;

    // Pitch black if screen is off
    if (!screenOn) {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      textureDirtyRef.current = true;
      return;
    }

    // Black background
    ctx.fillStyle = "#050508";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle crimson scanlines
    for (let y = 0; y < canvas.height; y += 3) {
      ctx.fillStyle = "rgba(255,0,30,0.04)";
      ctx.fillRect(0, y, canvas.width, 1);
    }

    // Typography
    ctx.font = "bold 13.5px monospace";
    const lineH = 32, padX = 22, padY = 55;

    // Faded completed lines
    ctx.globalAlpha = 0.65;
    ctx.fillStyle   = "#ff2244";
    for (let i = 0; i < anim.completedLines.length; i++) {
      ctx.fillText(anim.completedLines[i], padX, padY + i * lineH);
    }

    // Active typing line — full brightness
    ctx.globalAlpha = 1.0;
    const curY = padY + anim.completedLines.length * lineH;
    ctx.fillText(anim.currentText, padX, curY);

    // 1Hz blinking cursor
    if (anim.cursorVisible) {
      const tw = ctx.measureText(anim.currentText).width;
      ctx.fillText("\u2588", padX + tw, curY);
    }

    ctx.globalAlpha = 1.0;
    textureDirtyRef.current = true;
  };

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const anim = animRef.current;

    // Determine if stage has reached UI or complete
    const isStageReady =
      powerUpStage === "ui" ||
      powerUpStage === "complete" ||
      (!wormholeActive && laptopOpacity >= 0.95);

    // Trigger boot sequence when stage is ready
    if (isStageReady && !anim.booted && !anim.booting) {
      anim.booting = true;
      anim.bootStartTime = t;
    }

    // Handle 1.0 second power-on screen flash
    if (anim.booting) {
      const elapsed = t - anim.bootStartTime;
      if (screenMeshRef.current) {
        const mat = screenMeshRef.current.material as THREE.MeshStandardMaterial;
        if (elapsed < 0.2) {
          // Rapid flash burst
          mat.emissiveIntensity = (elapsed / 0.2) * 1.2;
        } else if (elapsed < 0.6) {
          // Dip & settle
          mat.emissiveIntensity = 1.2 - ((elapsed - 0.2) / 0.4) * 0.6;
        } else if (elapsed < 1.0) {
          mat.emissiveIntensity = 0.6;
        } else {
          mat.emissiveIntensity = 0.6;
          anim.booting = false;
          anim.booted = true;
          anim.lastTypeTime = t;
          anim.lastBlinkTime = t;
        }
      }
    }

    // Initial pitch-black frame paint if screen is off
    if (!anim.initialized) {
      anim.initialized = true;
      drawTerminal(false);
    }

    // Run typewriter & cursor logic ONLY when booted or booting is complete
    if (anim.booted) {
      // Cursor Blink (every 500ms)
      if (t - anim.lastBlinkTime > 0.5) {
        anim.cursorVisible = !anim.cursorVisible;
        anim.lastBlinkTime = t;
        drawTerminal(true);
      }

      // Typewriter Advance (every 45ms)
      if (t - anim.lastTypeTime > 0.045) {
        anim.lastTypeTime = t;

        if (anim.phase === "typing") {
          const line = TERMINAL_LINES[anim.lineIndex];
          if (anim.currentText.length < line.length) {
            anim.currentText += line[anim.currentText.length];
            drawTerminal(true);
          } else {
            anim.completedLines.push(anim.currentText);
            anim.currentText = "";
            anim.lineIndex++;
            if (anim.lineIndex >= TERMINAL_LINES.length) {
              anim.phase = "waiting";
              anim.waitCounter = 0;
            }
            drawTerminal(true);
          }
        } else if (anim.phase === "waiting") {
          anim.waitCounter++;
          if (anim.waitCounter > 50) anim.phase = "clearing";
        } else if (anim.phase === "clearing") {
          if (anim.completedLines.length > 0) {
            anim.completedLines.shift();
            drawTerminal(true);
          } else {
            anim.lineIndex   = 0;
            anim.currentText = "";
            anim.phase       = "typing";
            drawTerminal(true);
          }
        }
      }
    } else if (anim.booting) {
      drawTerminal(true);
    }

    // Upload updated canvas texture to GPU
    if (textureRef.current && textureDirtyRef.current) {
      textureRef.current.needsUpdate = true;
      textureDirtyRef.current = false;
    }

    // ═══════════════════════════════════════════════════════════════
    // WORMHOLE OVERRIDE — direct transform control during materialization
    // ═══════════════════════════════════════════════════════════════
    if (wormholeActive && wormholeValues && wormholeValues.laptopScale > 0.001) {
      const v = wormholeValues;

      if (groupRef.current) {
        const finalY = -0.52;
        const currentY = finalY + v.laptopEmergenceY + v.laptopY;

        groupRef.current.position.set(laptopX, currentY, -1.14);
        groupRef.current.rotation.set(
          (v.laptopTiltX * Math.PI) / 180,
          v.laptopRotationY,
          -0.03
        );
        groupRef.current.scale.setScalar(v.laptopScale * 1.21);
      }

      if (bobRef.current) {
        bobRef.current.position.y = 0;
      }

      if (kbLightRef.current) {
        const ambientRamp = Math.max(laptopOpacity, v.ambientTransition);
        kbLightRef.current.intensity = (0.8 + 1.2 * ambientRamp) * v.laptopScale;
        kbLightRef.current.distance = 3.5;
      }

      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // NORMAL MODE — bobbing & mouse reactivity
    // ═══════════════════════════════════════════════════════════════
    if (bobRef.current) {
      bobRef.current.position.y = Math.sin(t * 0.85) * 0.15;
    }

    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        -Math.PI / 2 - 0.15 + state.pointer.x * 0.045,
        0.045,
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        0.09 - state.pointer.y * 0.035,
        0.045,
      );
    }

    if (kbLightRef.current) {
      const dx = mouse.x - 0.25;
      const dy = mouse.y + 0.15;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const proximity = Math.exp(-dist * dist * 4.0);

      kbLightRef.current.intensity = (0.8 + proximity * 2.5) * laptopOpacity;
      kbLightRef.current.distance = 2.5 + proximity * 2.0;
    }
  });

  const { width } = useThree((state) => state.viewport);
  const laptopX   = Math.max(0.8, width * 0.08);

  const effectiveOpacity = wormholeActive && wormholeValues
    ? Math.max(laptopOpacity, wormholeValues.laptopEmergence)
    : laptopOpacity;

  return (
    <group
      ref={groupRef}
      position={[laptopX, -0.52, -1.14]}
      rotation={[0.09, -Math.PI / 2 - 0.15, -0.03]}
      scale={wormholeActive && wormholeValues ? wormholeValues.laptopScale * 1.21 : laptopOpacity * 1.21}
    >
      <group ref={bobRef}>
        <primitive object={scene} />

        <spotLight
          position={[0, 3.0, 2.0]}
          target-position={[0, 0, 0]}
          angle={0.55}
          penumbra={0.85}
          intensity={2.2 * effectiveOpacity}
          color="#ff8a95"
          distance={14}
          decay={2}
          castShadow={false}
        />

        <pointLight
          position={[-2.4, 0.4, 0.8]}
          intensity={1.4 * effectiveOpacity}
          color="#ff1744"
          distance={9}
          decay={2}
        />

        <pointLight
          position={[2.4, 0.4, 0.8]}
          intensity={1.4 * effectiveOpacity}
          color="#ff4466"
          distance={9}
          decay={2}
        />

        <pointLight
          position={[0, 0.3, 2.8]}
          intensity={1.2 * effectiveOpacity}
          color="#ffb3c1"
          distance={10}
          decay={2}
        />

        <pointLight
          position={[0, -1.4, 0.6]}
          intensity={1.0 * effectiveOpacity}
          color="#800010"
          distance={8}
          decay={2}
        />

        <pointLight
          ref={kbLightRef}
          position={[0.3, -0.12, 0.35]}
          intensity={1.2 * effectiveOpacity}
          distance={3.5}
          color="#ff6680"
          decay={2}
        />

        <pointLight
          position={[0, 1.6, -0.8]}
          intensity={1.8 * effectiveOpacity}
          color="#ff1744"
          distance={12}
          decay={2}
        />
      </group>
    </group>
  );
}

useGLTF.preload("/models/laptop-baked.glb");
