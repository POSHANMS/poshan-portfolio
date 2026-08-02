"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import Lenis from "lenis";
import * as THREE from "three";

const sceneCoordinates = [
  {
    // Station 1 — Close/Low: intimate view near the laptop, slightly looking up at globe behind
    camera: new THREE.Vector3(0.5, 0.5, 8.0),
    lookAt: new THREE.Vector3(0.8, 0.0, -1.0),
    fov: 45,
  },
  {
    // Station 2 — Mid Swing: dynamic lateral swing to the left, mathematically positioned for full globe ring headroom
    camera: new THREE.Vector3(-3.5, 2.8, 9.0),
    lookAt: new THREE.Vector3(1.2, 1.3, -1.5),
    fov: 58,
  },
  {
    // Station 3 — Wide Establishing: centered high angle, pulled in slightly closer to keep group unified
    camera: new THREE.Vector3(0.0, 3.8, 12.5),
    lookAt: new THREE.Vector3(0.5, 0.2, -2.5),
    fov: 52,
  },
];

export function CinematicCamera({
  scrollProgress,
  lensDistortion = 0,
}: {
  scrollProgress: number;
  lensDistortion?: number;
}) {
  const currentPos = useRef(new THREE.Vector3(0.5, 0.5, 8));
  const currentLookAt = useRef(new THREE.Vector3(0.8, 0, -1));
  const currentFov = useRef(45);

  // Station 1 is the hard-locked hero position — camera must be frozen here
  // until the user physically scrolls. Clamp to 0 to prevent any drift.
  const clampedProgress = Math.max(0, Math.min(1, scrollProgress));

  useFrame((state) => {
    const camera = state.camera as THREE.PerspectiveCamera;

    // HARD LOCK: When scrollProgress is in Stage 4 Hero HUD phase (0.0 to 1.0),
    // lock camera position and lookAt 100% CONSTANT at Station 1 wide-shot view.
    // Zero rotation, zero pitch change, zero camera zoom, zero translation.
    if (clampedProgress <= 1.0) {
      const s1 = sceneCoordinates[0];
      camera.position.copy(s1.camera);
      camera.lookAt(s1.lookAt);
      camera.fov = s1.fov + lensDistortion * 15;
      camera.updateProjectionMatrix();
      currentPos.current.copy(s1.camera);
      currentLookAt.current.copy(s1.lookAt);
      currentFov.current = s1.fov;
      return;
    }

    // Transition from Station 1 to Station 2 when scrollProgress goes from 0.9 to 1.0
    const t = (clampedProgress - 0.9) / 0.1;
    const easedT = t * t * (3.0 - 2.0 * t);

    const from = sceneCoordinates[0];
    const to = sceneCoordinates[1];

    currentPos.current.lerpVectors(from.camera, to.camera, easedT);
    currentLookAt.current.lerpVectors(from.lookAt, to.lookAt, easedT);
    currentFov.current = THREE.MathUtils.lerp(from.fov, to.fov, easedT);

    camera.position.copy(currentPos.current);
    camera.lookAt(currentLookAt.current);
    camera.fov = currentFov.current + lensDistortion * 15;
    camera.updateProjectionMatrix();
  });

  return null;
}

export function initScrollCamera(onScrollUpdate: (progress: number) => void) {
  if (typeof window === "undefined") return null;

  let ticking = false;
  let animationFrame = 0;
  const getProgress = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    return docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
  };

  const handleScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        onScrollUpdate(getProgress());
        ticking = false;
      });
      ticking = true;
    }
  };

  let lenis: Lenis | null = null;

  try {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.88,
      touchMultiplier: 1.15,
    });

    const raf = (time: number) => {
      lenis?.raf(time);
      onScrollUpdate(getProgress());
      animationFrame = requestAnimationFrame(raf);
    };

    animationFrame = requestAnimationFrame(raf);
  } catch {
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
  }

  return {
    destroy: () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      lenis?.destroy();
      window.removeEventListener("scroll", handleScroll);
    },
  };
}