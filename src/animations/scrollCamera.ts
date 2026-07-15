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

export function CinematicCamera({ scrollProgress }: { scrollProgress: number }) {
  const currentPos = useRef(new THREE.Vector3(0.5, 0.5, 8));
  const currentLookAt = useRef(new THREE.Vector3(0.8, 0, -1));
  const currentFov = useRef(45);

  useFrame((state) => {
    const segmentCount = sceneCoordinates.length - 1;
    const rawSegment = scrollProgress * segmentCount;
    const segmentIdx = Math.min(Math.floor(rawSegment), segmentCount - 1);
    const localT = rawSegment - segmentIdx;
    const easedT = localT * localT * (3.0 - 2.0 * localT);

    const from = sceneCoordinates[segmentIdx];
    const to = sceneCoordinates[Math.min(segmentIdx + 1, segmentCount)];

    currentPos.current.lerpVectors(from.camera, to.camera, easedT);
    currentLookAt.current.lerpVectors(from.lookAt, to.lookAt, easedT);
    currentFov.current = THREE.MathUtils.lerp(from.fov, to.fov, easedT);

    const camera = state.camera as THREE.PerspectiveCamera;
    camera.position.copy(currentPos.current);
    camera.lookAt(currentLookAt.current);
    camera.fov = currentFov.current;
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
