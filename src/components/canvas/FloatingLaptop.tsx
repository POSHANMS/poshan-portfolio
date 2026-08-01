"use client";

import React, { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useMousePosition } from "@/hooks/useMousePosition";
import { WormholeValues } from "@/animations/wormholeLaptop";

const SCREEN_MATERIAL_NAME = "Material.004";

interface FloatingLaptopProps {
  laptopOpacity?: number;
  wormholeValues?: WormholeValues;
  wormholeActive?: boolean;
}

export default function FloatingLaptop({
  laptopOpacity = 1,
  wormholeValues,
  wormholeActive = false,
}: FloatingLaptopProps) {
  const { scene } = useGLTF("/models/laptop-baked.glb");

  const groupRef = useRef<THREE.Group>(null);
  const bobRef   = useRef<THREE.Group>(null);
  const kbLightRef = useRef<THREE.PointLight>(null);
  const mouse = useMousePosition(0.08);

  useMemo(() => {
    // ═══════════════════════════════════════════════════════════════════
    // PBR MATERIAL TUNING — Gunmetal Chassis + Backlit Keyboard
    // ═══════════════════════════════════════════════════════════════════

    // Dark gunmetal for body, lid, base — catches red rim reflections
    const chassisMaterial = new THREE.MeshStandardMaterial({
      color:             "#1a0a10",   // Dark warm gunmetal
      metalness:          0.80,       // Highly metallic for crisp reflections
      roughness:          0.35,       // Satin finish — not mirror, not matte
      emissive:          "#0d0204",   // Barely perceptible warm ambient glow
      emissiveIntensity:  0.05,
    });

    // Keyboard keycaps — subtle crimson backlight so keys are readable
    const keyboardMaterial = new THREE.MeshStandardMaterial({
      color:             "#0f0508",   // Near-black keycap base
      metalness:          0.55,
      roughness:          0.48,
      emissive:          "#ff1744",   // Crimson backlight
      emissiveIntensity:  0.18,       // Soft glow — visible but not blown out
    });

    // Trackpad — slightly smoother than chassis
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

      // Preserve screen emission texture (vscode screenshot)
      if (mat && mat.name === SCREEN_MATERIAL_NAME) {
        mat.toneMapped = false;
        mat.needsUpdate = true;
        return;
      }

      // ── Keyboard keycaps get subtle backlight ──
      if (
        name.includes("keyboard") ||
        name.includes("keycap") ||
        name.includes("keys") ||
        (name.includes("key") && !name.includes("iskey")) // avoid false positives
      ) {
        mesh.material = keyboardMaterial;
        return;
      }

      // ── Trackpad / touchpad ──
      if (name.includes("trackpad") || name.includes("touchpad")) {
        mesh.material = trackpadMaterial;
        return;
      }

      // ── Everything else: body, lid, base, hinges, ports ──
      mesh.material = chassisMaterial;
    });
  }, [scene]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // ═══════════════════════════════════════════════════════════════
    // WORMHOLE OVERRIDE — direct transform control during materialization
    // Bypasses normal bobbing/mouse animation until sequence completes
    // ═══════════════════════════════════════════════════════════════
    if (wormholeActive && wormholeValues && wormholeValues.laptopScale > 0.001) {
      const v = wormholeValues;

      if (groupRef.current) {
        // Laptop rises from the rift (below floor) to final floating position
        const finalY = -0.52;
        const currentY = finalY + v.laptopEmergenceY + v.laptopY;

        groupRef.current.position.set(laptopX, currentY, -1.14);
        groupRef.current.rotation.set(
          (v.laptopTiltX * Math.PI) / 180,  // tilt forward during emergence
          v.laptopRotationY,                  // rotation locks into hero stance
          -0.03
        );
        groupRef.current.scale.setScalar(v.laptopScale * 1.21);
      }

      // Suppress bobbing during wormhole
      if (bobRef.current) {
        bobRef.current.position.y = 0;
      }

      // Keyboard light uses wormhole ambient ramp instead of mouse proximity
      if (kbLightRef.current) {
        const ambientRamp = Math.max(laptopOpacity, v.ambientTransition);
        kbLightRef.current.intensity = (0.8 + 1.2 * ambientRamp) * v.laptopScale;
        kbLightRef.current.distance = 3.5;
      }

      return; // Skip normal animation frame
    }

    // ═══════════════════════════════════════════════════════════════
    // NORMAL MODE — existing bob + mouse reactivity (unchanged)
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

  // During wormhole, derive effective opacity from wormholeValues
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

        {/* ═══════════════════════════════════════════════════════════════
            LIGHTING RIG — Soft overhead key light + rim lights
            Harsh hinge glare removed; keyboard deck now readable.
        ═══════════════════════════════════════════════════════════════ */}

        {/* ① SOFT OVERHEAD KEY LIGHT
           Positioned front-above the laptop to gently wash the keyboard
           deck, trackpad, and palm rests without blowing out the screen. */}
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

        {/* ② LEFT RIM LIGHT — catches the metallic lid & chassis edge */}
        <pointLight
          position={[-2.4, 0.4, 0.8]}
          intensity={1.4 * effectiveOpacity}
          color="#ff1744"
          distance={9}
          decay={2}
        />

        {/* ③ RIGHT RIM LIGHT — symmetrical silhouette definition */}
        <pointLight
          position={[2.4, 0.4, 0.8]}
          intensity={1.4 * effectiveOpacity}
          color="#ff4466"
          distance={9}
          decay={2}
        />

        {/* ④ SOFT FRONT FILL — reduces harsh contrast on the deck */}
        <pointLight
          position={[0, 0.3, 2.8]}
          intensity={1.2 * effectiveOpacity}
          color="#ffb3c1"
          distance={10}
          decay={2}
        />

        {/* ⑤ UNDER-GLOW — subtle bounce from the floor grid */}
        <pointLight
          position={[0, -1.4, 0.6]}
          intensity={1.0 * effectiveOpacity}
          color="#800010"
          distance={8}
          decay={2}
        />

        {/* ⑥ KEYBOARD BACKLIGHT — localised, low-intensity, mouse-reactive */}
        <pointLight
          ref={kbLightRef}
          position={[0.3, -0.12, 0.35]}
          intensity={1.2 * effectiveOpacity}
          distance={3.5}
          color="#ff6680"
          decay={2}
        />

        {/* ⑦ SCREEN HALO — very soft, prevents the display from floating in void */}
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