"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import Lenis from "lenis";
import * as THREE from "three";
import type { ActFourPhase } from "@/types/actFour";

const sceneCoordinates = [
  {
    // Act I — hero establishing shot.
    camera: new THREE.Vector3(0.15, 0.62, 8.4),
    lookAt: new THREE.Vector3(0.72, -0.05, -1.18),
    fov: 44,
    progress: 0.0,
  },
  {
    // Drift left first so the hero has parallax instead of a straight push.
    camera: new THREE.Vector3(-0.95, 0.72, 7.0),
    lookAt: new THREE.Vector3(0.95, -0.08, -1.22),
    fov: 42,
    progress: 0.075,
  },
  {
    // The laptop starts taking over the frame as the entry probe launches.
    camera: new THREE.Vector3(0.7, 0.42, 4.85),
    lookAt: new THREE.Vector3(1.02, 0.04, -1.42),
    fov: 37,
    progress: 0.155,
  },
  {
    // Act II — screen portal lock. The frame should feel like it is holding breath.
    camera: new THREE.Vector3(1.06, 0.31, 2.45),
    lookAt: new THREE.Vector3(1.0, 0.22, -1.9),
    fov: 32,
    progress: 0.235,
  },
  {
    // Crossing the screen plane into the laptop world.
    camera: new THREE.Vector3(0.72, 0.48, 1.06),
    lookAt: new THREE.Vector3(0.42, 0.42, -4.05),
    fov: 78,
    progress: 0.34,
  },
  {
    // Act II hold — inside-laptop world, calm enough to read.
    camera: new THREE.Vector3(0.08, 0.66, 2.82),
    lookAt: new THREE.Vector3(0.12, 0.2, -4.9),
    fov: 64,
    progress: 0.47,
  },
  {
    // Pull back through the screen before skill constellation starts.
    camera: new THREE.Vector3(1.25, 0.58, 3.85),
    lookAt: new THREE.Vector3(0.72, 0.08, -1.7),
    fov: 43,
    progress: 0.55,
  },
  {
    // Act III — a calm, frontal arrival in the skills vault.
    camera: new THREE.Vector3(-0.45, 0.3, 5.3),
    lookAt: new THREE.Vector3(0, 0.05, -3.2),
    fov: 43,
    progress: 0.62,
  },
  {
    // A restrained camera drift lets the recruiter inspect the four artifacts.
    camera: new THREE.Vector3(0.42, 0.18, 4.35),
    lookAt: new THREE.Vector3(0, 0.04, -3.2),
    fov: 41,
    progress: 0.72,
  },
  {
    // Act III hold — let the recruiter read the actual skill map.
    camera: new THREE.Vector3(-0.25, 0.28, 4.6),
    lookAt: new THREE.Vector3(0, 0.03, -3.2),
    fov: 42,
    progress: 0.81,
  },
  {
    // Act IV — the external globe becomes the project-world destination.
    camera: new THREE.Vector3(0.75, 0.92, 7.45),
    lookAt: new THREE.Vector3(4.5, 2.5, -8),
    fov: 50,
    progress: 0.85,
  },
  {
    // Act IV hold — lock onto the core before the manual warp begins.
    camera: new THREE.Vector3(2.25, 1.4, 4.25),
    lookAt: new THREE.Vector3(4.5, 2.5, -8),
    fov: 45,
    progress: 0.89,
  },
  {
    // Act V — the camera clears the recall and gives the education orbit its own frame.
    camera: new THREE.Vector3(-0.72, 1.82, 9.7),
    lookAt: new THREE.Vector3(1.35, 0.72, -5.15),
    fov: 47,
    progress: 0.935,
  },
  {
    // Hold Act V until its final checkpoint has been read.
    camera: new THREE.Vector3(-0.72, 1.82, 9.7),
    lookAt: new THREE.Vector3(1.35, 0.72, -5.15),
    fov: 47,
    progress: 0.956,
  },
  {
    // Act VI — the final contact signal lives in its own nebula, not the old desk-world.
    camera: new THREE.Vector3(0, 0.55, 10.2),
    lookAt: new THREE.Vector3(0, 0.15, -7.4),
    fov: 45,
    progress: 0.963,
  },
  {
    // Settle the final frame without reintroducing any previous scene objects.
    camera: new THREE.Vector3(0, 0.55, 10.2),
    lookAt: new THREE.Vector3(0, 0.15, -7.4),
    fov: 45,
    progress: 1.0,
  },
];

export function CinematicCamera({
  scrollProgress,
  lensDistortion = 0,
  actFourPhase = "locked",
}: {
  scrollProgress: number;
  lensDistortion?: number;
  actFourPhase?: ActFourPhase;
}) {
  const currentPos = useRef(new THREE.Vector3(0.5, 0.5, 8));
  const currentLookAt = useRef(new THREE.Vector3(0.8, 0, -1));
  const currentFov = useRef(45);
  const smoothProgress = useRef(0);
  const warpProgress = useRef(0);

  const clampedProgress = Math.max(0, Math.min(1, scrollProgress));

  useFrame((state, delta) => {
    const camera = state.camera as THREE.PerspectiveCamera;
    smoothProgress.current = THREE.MathUtils.damp(smoothProgress.current, clampedProgress, 7.2, delta);
    const p = smoothProgress.current;

    let fromIdx = 0;
    let toIdx = 1;

    for (let i = 0; i < sceneCoordinates.length - 1; i++) {
      const from = sceneCoordinates[i];
      const to = sceneCoordinates[i + 1];
      if (p >= from.progress && p <= to.progress) {
        fromIdx = i;
        toIdx = i + 1;
        break;
      }
    }

    const from = sceneCoordinates[fromIdx];
    const to = sceneCoordinates[toIdx];
    const segmentLength = Math.max(0.001, to.progress - from.progress);
    const localT = THREE.MathUtils.clamp((p - from.progress) / segmentLength, 0, 1);
    const easedT = localT * localT * (3.0 - 2.0 * localT);

    const desiredPosition = new THREE.Vector3().lerpVectors(from.camera, to.camera, easedT);
    const desiredLookAt = new THREE.Vector3().lerpVectors(from.lookAt, to.lookAt, easedT);
    let desiredFov = THREE.MathUtils.lerp(from.fov, to.fov, easedT);

    const isWarping = actFourPhase === "warping";
    warpProgress.current = THREE.MathUtils.damp(warpProgress.current, isWarping ? 1 : 0, isWarping ? 3.2 : 5.6, delta);

    if (isWarping) {
      const origin = new THREE.Vector3(2.25, 1.4, 4.25);
      const destination = new THREE.Vector3(4.5, 2.5, -7.25);
      desiredPosition.lerpVectors(origin, destination, warpProgress.current);
      desiredLookAt.lerpVectors(new THREE.Vector3(4.5, 2.5, -8), new THREE.Vector3(4.5, 2.5, -12), warpProgress.current);
      desiredFov = 46 + Math.sin(warpProgress.current * Math.PI) * 38;
    } else if (actFourPhase === "inside") {
      desiredPosition.set(4.5, 2.5, -6.85);
      desiredLookAt.set(4.5, 2.5, -12.4);
      desiredFov = 48;
    } else if (actFourPhase === "returning") {
      desiredPosition.set(2.9, 1.85, 4.7);
      desiredLookAt.set(0.9, 0.35, -3.4);
      desiredFov = 51;
    }

    const time = state.clock.getElapsedTime();
    // Act VI uses a restrained camera orbit. The nebula itself stays fixed.
    if (p >= 0.963 && actFourPhase === "locked") {
      const orbit = time * 0.06;
      desiredPosition.x += Math.sin(orbit) * 0.28;
      desiredPosition.y += Math.cos(orbit * 0.82) * 0.12;
      desiredLookAt.x += Math.sin(orbit * 0.72) * 0.12;
      desiredLookAt.y += Math.cos(orbit * 0.82) * 0.05;
    }

    const cameraDamping = actFourPhase === "locked" || actFourPhase === "ready" ? 8.4 : 4.6;
    currentPos.current.lerp(desiredPosition, 1 - Math.exp(-cameraDamping * delta));
    currentLookAt.current.lerp(desiredLookAt, 1 - Math.exp(-cameraDamping * delta));
    currentFov.current = THREE.MathUtils.damp(currentFov.current, desiredFov, cameraDamping, delta);

    // Subtle handheld-cinema drift while scrolling; very small so the scene stays premium.
    const drift = Math.sin(time * 0.45 + p * Math.PI * 2) * 0.01;

    camera.position.copy(currentPos.current).add(new THREE.Vector3(drift, drift * 0.35, 0));
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
