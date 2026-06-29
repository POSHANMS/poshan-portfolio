"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import Lenis from "lenis";
import * as THREE from "three";

const sceneCoordinates = [
  {
    camera: new THREE.Vector3(0.2, 2.2, 7.85),
    lookAt: new THREE.Vector3(0.15, 1.62, 0),
    fov: 43,
  },
  {
    camera: new THREE.Vector3(2.5, 0.45, 2.6),
    lookAt: new THREE.Vector3(2.45, 0.35, -0.2),
    fov: 45,
  },
  {
    camera: new THREE.Vector3(-2.0, 1.2, 9),
    lookAt: new THREE.Vector3(0, 0.5, 0),
    fov: 55,
  },
  {
    camera: new THREE.Vector3(3.5, 2.0, 8),
    lookAt: new THREE.Vector3(0, 0.5, 0),
    fov: 52,
  },
  {
    camera: new THREE.Vector3(0, 2.0, 14),
    lookAt: new THREE.Vector3(0, 0, 0),
    fov: 65,
  },
];

export function CinematicCamera({ scrollProgress }: { scrollProgress: number }) {
  const currentPos = useRef(new THREE.Vector3(0.2, 2.2, 7.85));
  const currentLookAt = useRef(new THREE.Vector3(0.15, 1.62, 0));
  const currentFov = useRef(43);

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
