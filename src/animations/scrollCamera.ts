"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "./gsap";
import { sheet } from "./theatre";

// 1. Define the Theatre.js object representing the camera attributes
export const cameraObject = sheet.object("Camera", {
  position: { x: 0, y: 0.8, z: 9.5 },
  lookAt: { x: 0, y: 0, z: 0 },
  fov: 50,
});

// 2. Define the camera coordinates for all 5 scenes
const sceneCoordinates = [
  {
    // Scene 1: HOME (wide angle)
    camera: new THREE.Vector3(0, 0.8, 9.5),
    lookAt: new THREE.Vector3(0, 0, 0),
    fov: 50,
  },
  {
    // Scene 2: INTO THE LAPTOP (tight zoom on screen)
    camera: new THREE.Vector3(0.7, 0.05, -0.42),
    lookAt: new THREE.Vector3(0.7, 0.0, -0.8),
    fov: 48,
  },
  {
    // Scene 3: PROJECTS (mid-range pull-back)
    camera: new THREE.Vector3(-1.2, 0.5, 7.5),
    lookAt: new THREE.Vector3(0.5, 0.2, 0),
    fov: 50,
  },
  {
    // Scene 4: SKILLS (rotated side perspective)
    camera: new THREE.Vector3(2.5, 1.2, 7.0),
    lookAt: new THREE.Vector3(0, 0.5, 0),
    fov: 52,
  },
  {
    // Scene 5: CONTACT (wide pull-back)
    camera: new THREE.Vector3(0, 0.8, 12.0),
    lookAt: new THREE.Vector3(0, 0, 0),
    fov: 45,
  },
];

/**
 * R3F component to control camera positioning based on the Theatre.js timeline
 * or the hybrid scroll interpolation fallback.
 */
export function CinematicCamera({ scrollProgress }: { scrollProgress: number }) {
  const currentPos = useRef(new THREE.Vector3());
  const currentLookAt = useRef(new THREE.Vector3());

  useFrame((state) => {
    // 1. Fallback Interpolation (Smooth Lerp between scenes based on scrollProgress)
    // Divide [0.0, 1.0] progress into 4 intervals for 5 scenes
    const segmentCount = sceneCoordinates.length - 1;
    const rawSegment = scrollProgress * segmentCount;
    const segmentIdx = Math.min(Math.floor(rawSegment), segmentCount - 1);
    
    // Local progress inside this segment [0.0, 1.0]
    const localT = rawSegment - segmentIdx;
    
    // Cubic Hermite easing for smooth acceleration/deceleration between transitions
    const easedT = localT * localT * (3.0 - 2.0 * localT);

    const activeScene = sceneCoordinates[segmentIdx];
    const nextScene = sceneCoordinates[segmentIdx + 1];

    // Lerp camera position
    currentPos.current.lerpVectors(activeScene.camera, nextScene.camera, easedT);
    
    // Lerp camera lookAt target
    currentLookAt.current.lerpVectors(activeScene.lookAt, nextScene.lookAt, easedT);
    
    // Lerp field of view
    const targetFov = THREE.MathUtils.lerp(activeScene.fov, nextScene.fov, easedT);

    // Apply values to the camera (only if Theatre.js has no active keyframe override)
    // Note: During development, if studio is active, we can bind directly to cameraObject
    const posVal = cameraObject.value.position;
    const lookVal = cameraObject.value.lookAt;
    
    const isTheatreOverriding = 
      posVal.x !== 0 || posVal.y !== 0.8 || posVal.z !== 9.5 ||
      lookVal.x !== 0 || lookVal.y !== 0 || lookVal.z !== 0;

    const camera = state.camera as THREE.PerspectiveCamera;

    if (isTheatreOverriding) {
      camera.position.set(posVal.x, posVal.y, posVal.z);
      camera.lookAt(new THREE.Vector3(lookVal.x, lookVal.y, lookVal.z));
      if (camera.isPerspectiveCamera) {
        camera.fov = cameraObject.value.fov;
      }
    } else {
      camera.position.copy(currentPos.current);
      camera.lookAt(currentLookAt.current);
      if (camera.isPerspectiveCamera) {
        camera.fov = targetFov;
      }
    }

    camera.updateProjectionMatrix();
  });

  return null;
}

/**
 * Initializes Lenis smooth scrolling and maps the scroll container progress
 * to the GSAP ScrollTrigger and Theatre.js animation timeline.
 * 
 * @param onScrollUpdate Callback that receives the normalized scroll progress (0 - 1)
 * @returns An object containing the lenis instance for teardown
 */
export function initScrollCamera(onScrollUpdate: (progress: number) => void) {
  if (typeof window === "undefined") return null;

  // Initialize Lenis smooth scroll
  const lenis = new Lenis({
    duration: 1.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential decel
    wheelMultiplier: 1.0,
    touchMultiplier: 1.5,
    infinite: false,
  });

  // Sync scroll animations with requestAnimationFrame loop
  const raf = (time: number) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);

  // Sync GSAP ScrollTrigger with Lenis
  lenis.on("scroll", () => {
    ScrollTrigger.update();
  });

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  
  gsap.ticker.lagSmoothing(0);

  // Map scroll progress to Theatre.js camera timeline
  // The sequence has a duration of 5.0 seconds (1.0 second per scene transition)
  const sequenceDuration = 5.0;

  const trigger = ScrollTrigger.create({
    trigger: "body",
    start: "top top",
    end: "bottom bottom",
    scrub: 0.5,
    onUpdate: (self) => {
      const progress = self.progress;
      onScrollUpdate(progress);
      
      // Update Theatre.js timeline position
      sheet.sequence.position = progress * sequenceDuration;
    },
  });

  return {
    lenis,
    destroy: () => {
      lenis.destroy();
      trigger.kill();
      gsap.ticker.remove(lenis.raf);
    },
  };
}
