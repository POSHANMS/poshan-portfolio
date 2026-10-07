"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useMousePosition } from "@/hooks/useMousePosition";
import { WormholeValues } from "@/animations/wormholeLaptop";
import type { ActFourPhase } from "@/types/actFour";

const SCREEN_MATERIAL_NAME = "Material.004";

interface FloatingLaptopProps {
  powerUpStage?: string;
  laptopOpacity?: number;
  scrollProgress?: number;
  wormholeValues?: WormholeValues;
  wormholeActive?: boolean;
  laptopScreenRef?: React.MutableRefObject<THREE.Mesh | null>;
  actFourPhase?: ActFourPhase;
}

const TERMINAL_LINES = [
  "[ POSHAN MS PORTFOLIO ]",
  "> IDENTITY: POSHAN_MS",
  "> ROLE: FULL_STACK_DEVELOPER_AI_DEVELOPER",
  "> EDUCATION: BE_CSE_2026_CGPA_8.16",
  "> SCROLL THROUGH THE SCREEN_",
];

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function phase(progress: number, start: number, end: number) {
  const fade = Math.min(0.08, (end - start) * 0.4);
  return smoothstep(start, start + fade, progress) * (1 - smoothstep(end - fade, end, progress));
}

export default function FloatingLaptop({
  powerUpStage = "complete",
  laptopOpacity = 1,
  scrollProgress = 0,
  wormholeValues,
  wormholeActive = false,
  laptopScreenRef,
  actFourPhase = "locked",
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
    locked: false,
    screenTextureAttached: false,
    lastScreenRender: 0,
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
      emissiveIntensity:  0.58,
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
        if (laptopScreenRef) laptopScreenRef.current = mesh;
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
  }, [scene, laptopScreenRef]);

  // Create canvas + texture once
  useEffect(() => {
    if (!canvasRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width  = 512;
      canvas.height = 320;
      canvasRef.current = canvas;

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      textureRef.current = texture;
    }
  }, []);

  // Attach texture to screen mesh as soon as it exists
  useEffect(() => {
    const id = setInterval(() => {
      const texture = textureRef.current;
      const mesh = screenMeshRef.current;
      if (texture && mesh) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (!animRef.current.screenTextureAttached) {
          mat.map = texture;
          mat.emissiveMap = texture;
          mat.emissive = new THREE.Color("#ff2244");
          mat.emissiveIntensity = 0;
          mat.needsUpdate = true;
          animRef.current.screenTextureAttached = true;
          clearInterval(id);
        }
      }
    }, 50);
    return () => clearInterval(id);
  }, []);

  // Helper to draw split-screen IDE + terminal frame to canvas (matching Gemini video)
  const drawTerminal = (screenOn: boolean, elapsed = 0) => {
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

    const W = canvas.width;
    const H = canvas.height;
    const splitX = Math.floor(W * 0.52);

    // Dark sleek cyberpunk background
    ctx.fillStyle = "#060308";
    ctx.fillRect(0, 0, W, H);

    // Cool scanlines keep the live code readable against the red scene lighting.
    for (let y = 0; y < H; y += 3) {
      ctx.fillStyle = "rgba(86, 221, 255, 0.028)";
      ctx.fillRect(0, y, W, 1);
    }

    // Top Title Bar
    ctx.fillStyle = "rgba(7, 12, 20, 0.92)";
    ctx.fillRect(0, 0, W, 22);
    ctx.strokeStyle = "rgba(91, 222, 255, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 22);
    ctx.lineTo(W, 22);
    ctx.stroke();

    // Title bar tabs
    ctx.font = "bold 9px monospace";
    ctx.fillStyle = "#75e5ff";
    ctx.fillText("portfolio.scene.tsx", 16, 15);
    ctx.fillStyle = "#ffd166";
    ctx.fillText("system.live", splitX + 16, 15);

    // Vertical Split Divider
    ctx.strokeStyle = "rgba(117, 229, 255, 0.26)";
    ctx.beginPath();
    ctx.moveTo(splitX, 0);
    ctx.lineTo(splitX, H);
    ctx.stroke();

    // ── LEFT PANE: SYNTAX-HIGHLIGHTED CODE (matching Gemini video) ──
    const codeLines = [
      { text: "import { Canvas } from '@react-three/fiber';", color: "#81eaff" },
      { text: "export default function PortfolioScene() {", color: "#f6f8ff" },
      { text: "  const mode = useSystem('ONLINE');", color: "#c7adff" },
      { text: "  return (", color: "#f6f8ff" },
      { text: "    <ExperienceEngine>", color: "#6cf2bb" },
      { text: "      <CoreRenderer fps={120} />", color: "#ffd166" },
      { text: "      <NeuralMesh active />", color: "#81eaff" },
      { text: "    </ExperienceEngine>", color: "#6cf2bb" },
      { text: "  );", color: "#f6f8ff" },
      { text: "}", color: "#f6f8ff" },
    ];

    ctx.font = "bold 10px monospace";
    const lineH = 18;
    const startY = 42;
    for (let i = 0; i < codeLines.length; i++) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      ctx.fillText(`${i + 1}`, 12, startY + i * lineH); // Line number
      ctx.fillStyle = codeLines[i].color;
      ctx.fillText(codeLines[i].text, 32, startY + i * lineH);
    }

    // ── RIGHT PANE: REAL-TIME TERMINAL & DIAGNOSTIC STREAM ──
    ctx.font = "bold 9.5px monospace";
    const rPadX = splitX + 14;
    let rY = 42;

    // Faded completed boot lines
    ctx.globalAlpha = 0.72;
    ctx.fillStyle = "#ffd166";
    for (let i = 0; i < anim.completedLines.length; i++) {
      ctx.fillText(anim.completedLines[i], rPadX, rY);
      rY += 22;
    }

    // Active typing line
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = "#78f2c1";
    ctx.fillText(anim.currentText, rPadX, rY);

    // Blinking cursor
    if (anim.cursorVisible) {
      const tw = ctx.measureText(anim.currentText).width;
      ctx.fillStyle = "#ffffff";
      ctx.fillText("\u2588", rPadX + tw, rY);
    }

    // A small live mesh makes the screen read as an active workstation.
    const panelY = 174;
    const panelHeight = 100;
    ctx.strokeStyle = "rgba(117, 229, 255, 0.32)";
    ctx.strokeRect(rPadX, panelY, W - rPadX - 14, panelHeight);
    ctx.font = "8px monospace";
    ctx.fillStyle = "#75e5ff";
    ctx.fillText("WEBGL // NODE MESH", rPadX + 8, panelY + 14);
    const panelWidth = W - rPadX - 30;
    const nodes = Array.from({ length: 7 }, (_, index) => ({
      x: rPadX + 12 + (index / 6) * panelWidth,
      y: panelY + 57 + Math.sin(elapsed * 2.4 + index * 1.36) * 16 + (index % 2) * 8,
    }));
    ctx.strokeStyle = "rgba(255, 209, 102, 0.68)";
    ctx.beginPath();
    nodes.forEach((node, index) => {
      if (index === 0) ctx.moveTo(node.x, node.y);
      else ctx.lineTo(node.x, node.y);
    });
    ctx.stroke();
    nodes.forEach((node, index) => {
      ctx.fillStyle = index === 3 ? "#ff405f" : "#75e5ff";
      ctx.beginPath();
      ctx.arc(node.x, node.y, index === 3 ? 3 : 1.8, 0, Math.PI * 2);
      ctx.fill();
    });

    // Small status footer
    ctx.fillStyle = "rgba(255, 23, 68, 0.42)";
    ctx.fillRect(0, H - 16, W, 16);
    ctx.font = "8px monospace";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("● POSHAN_OS // PIPELINE: ONLINE // STATUS: 200 OK", 14, H - 5);

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
      // Continuous 1Hz cursor blink (every 500ms)
      if (t - anim.lastBlinkTime > 0.5) {
        anim.cursorVisible = !anim.cursorVisible;
        anim.lastBlinkTime = t;
        drawTerminal(true, t);
      }

      // Typewriter Advance (every 45ms) until locked
      if (!anim.locked && t - anim.lastTypeTime > 0.045) {
        anim.lastTypeTime = t;
        const line = TERMINAL_LINES[anim.lineIndex];
        if (anim.currentText.length < line.length) {
          anim.currentText += line[anim.currentText.length];
          drawTerminal(true, t);
        } else {
          anim.completedLines.push(anim.currentText);
          anim.currentText = "";
          anim.lineIndex++;
          if (anim.lineIndex >= TERMINAL_LINES.length) {
            anim.locked = true; // Permanently locked — never reset or clear
            anim.cursorVisible = true;
          }
          drawTerminal(true, t);
        }
      }
    } else if (anim.booting) {
      drawTerminal(true, t);
    }

    // Keep the node mesh animated after the typewriter reaches its final line.
    if (anim.booted && t - anim.lastScreenRender > 0.12) {
      anim.lastScreenRender = t;
      drawTerminal(true, t);
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
      const portal = phase(scrollProgress, 0.09, 0.36);
      const inside = phase(scrollProgress, 0.22, 0.56);
      bobRef.current.position.y = Math.sin(t * 0.85) * 0.15 * (1 - portal * 0.55) + inside * 0.08;
    }

    if (groupRef.current) {
      const portal = phase(scrollProgress, 0.09, 0.36);
      const inside = phase(scrollProgress, 0.22, 0.56);
      const pullback = smoothstep(0.47, 0.57, scrollProgress) * (1 - smoothstep(0.76, 0.84, scrollProgress));
      // The skill vault is a separate room, so the laptop exits rather than
      // competing with the artifacts that explain the stack.
      const skills = smoothstep(0.55, 0.62, scrollProgress) * (1 - smoothstep(0.80, 0.85, scrollProgress));
      // The project entry owns the laptop only while it is in frame. Once the
      // core returns, the laptop comes back before Act V instead of vanishing.
      const actFourApproach = smoothstep(0.80, 0.852, scrollProgress) * (1 - smoothstep(0.93, 0.955, scrollProgress));
      const actFourSeal = actFourPhase === "returning"
        ? 0
        : Math.max(actFourApproach, actFourPhase === "warping" || actFourPhase === "inside" ? 1 : 0);
      const finalPullback = smoothstep(0.82, 1, scrollProgress);

      const targetX = laptopX - portal * 0.1 - inside * 0.5 + pullback * 0.34 + skills * 7.8 + actFourSeal * 0.5 + finalPullback * 0.08;
      const targetY = -0.52 + portal * 0.2 + inside * 0.22 + pullback * 0.12 + skills * 1.75 - actFourSeal * 0.72 - finalPullback * 0.12;
      const targetZ = -1.14 + portal * 0.58 - inside * 0.82 + pullback * 1.26 - skills * 7.2 + actFourSeal * 0.8;
      const targetScale = laptopOpacity * (1.21 + portal * 0.82 - inside * 0.36 + pullback * 0.44 - skills * 1.05 - finalPullback * 0.1) * (1 - actFourSeal);

      groupRef.current.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.07);
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.07);

      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        -Math.PI / 2 - 0.15 + state.pointer.x * 0.045 + portal * 0.42 - inside * 0.28 + skills * 1.1,
        0.07,
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        0.09 - state.pointer.y * 0.035 - portal * 0.16 + inside * 0.18 - pullback * 0.16 + actFourSeal * 1.08,
        0.07,
      );
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z,
        -0.03 + portal * 0.045 - inside * 0.035 + actFourSeal * 0.12,
        0.07,
      );

      if (screenMeshRef.current) {
        const mat = screenMeshRef.current.material as THREE.MeshStandardMaterial;
        const storyScreenGlow = (1.08 + portal * 0.92 + inside * 0.32 + pullback * 0.22) * (1 - actFourSeal);
        mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, storyScreenGlow, 0.05);
      }
    }

    if (kbLightRef.current) {
      const dx = mouse.x - 0.25;
      const dy = mouse.y + 0.15;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const proximity = Math.exp(-dist * dist * 4.0);

      kbLightRef.current.intensity = (1.35 + proximity * 2.5) * laptopOpacity;
      kbLightRef.current.intensity += phase(scrollProgress, 0.09, 0.36) * 2.6;
      kbLightRef.current.distance = 2.5 + proximity * 2.0;
    }
  });

  const { width } = useThree((state) => state.viewport);
  const laptopX   = Math.max(0.8, width * 0.08);

  const effectiveOpacity = wormholeActive && wormholeValues
    ? wormholeValues.laptopEmergence
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
          intensity={2.35 * effectiveOpacity}
          color="#ffb3c1"
          distance={12}
          decay={2}
        />

        <pointLight
          position={[0.2, 1.15, 1.35]}
          intensity={1.15 * effectiveOpacity}
          color="#76e7ff"
          distance={7}
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
          intensity={2.4 * effectiveOpacity}
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
