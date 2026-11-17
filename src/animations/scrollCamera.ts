"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import Lenis from "lenis";
import * as THREE from "three";
import type { ActFourPhase } from "@/types/actFour";
import {
  ACT_FIVE_ENTRY_CAMERA,
  ACT_FIVE_ENTRY_TARGET,
  ACT_FIVE_LOCAL_KEY_T,
  ACT_FIVE_TIMING,
  createActFiveCameraCurves,
} from "./actFiveChoreography";

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
    // Act V — the card orbit owns its camera from 0.89 through the exit arc.
    camera: new THREE.Vector3(0, 0.55, 10.2),
    lookAt: new THREE.Vector3(0, 0.15, -7.4),
    fov: 60,
    progress: 0.94,
  },
  {
    // Hold the contact-facing end of the Act V arc while both scenes crossfade.
    camera: new THREE.Vector3(0, 0.55, 10.2),
    lookAt: new THREE.Vector3(0, 0.15, -7.4),
    fov: 60,
    progress: 0.958,
  },
  {
    // Act VI — the final contact signal lives in its own nebula, not the old desk-world.
    camera: new THREE.Vector3(0, 0.55, 10.2),
    lookAt: new THREE.Vector3(0, 0.15, -7.4),
    fov: 45,
    progress: 0.975,
  },
  {
    // Settle the final frame without reintroducing any previous scene objects.
    camera: new THREE.Vector3(0, 0.55, 10.2),
    lookAt: new THREE.Vector3(0, 0.15, -7.4),
    fov: 45,
    progress: 1.0,
  },
];

// One shared spline now owns camera positions and look targets for every Act V
// stop, each orbital transfer, and the final arc away from the reactor.
const actFiveCurves = createActFiveCameraCurves();
const ACT_FIVE_POSITION_CURVE = actFiveCurves.position;
const ACT_FIVE_TARGET_CURVE = actFiveCurves.target;

function pointOnKeyedCurve(curve: THREE.CatmullRomCurve3, value: number) {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  let segment = ACT_FIVE_LOCAL_KEY_T.length - 2;
  for (let index = 0; index < ACT_FIVE_LOCAL_KEY_T.length - 1; index += 1) {
    if (t <= ACT_FIVE_LOCAL_KEY_T[index + 1]) {
      segment = index;
      break;
    }
  }
  const span = ACT_FIVE_LOCAL_KEY_T[segment + 1] - ACT_FIVE_LOCAL_KEY_T[segment];
  const local = span > 0 ? (t - ACT_FIVE_LOCAL_KEY_T[segment]) / span : 0;
  return curve.getPoint((segment + local) / (ACT_FIVE_LOCAL_KEY_T.length - 1));
}

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
  const cameraRoll = useRef(0);
  const cameraPitch = useRef(0);
  const cameraYaw = useRef(0);
  const cameraVelocity = useRef(new THREE.Vector3());
  const targetVelocity = useRef(new THREE.Vector3());
  const cameraNoise = useRef(new THREE.Vector3());

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
    let authoredActFiveRoll = 0;
    let authoredActFivePitch = 0;
    let authoredActFiveYaw = 0;
    let actFiveCameraActive = false;

    // The Act V entry blends out of the existing Act IV camera, then follows
    // keyed Catmull-Rom position and target splines through all four artifacts.
    const insideProjectWorld = actFourPhase === "inside" || actFourPhase === "warping";
    if (p >= ACT_FIVE_TIMING.cameraIntroStart && p < ACT_FIVE_TIMING.sceneExit && !insideProjectWorld) {
      actFiveCameraActive = true;
      if (p < ACT_FIVE_TIMING.cameraStart) {
        const entry = THREE.MathUtils.smoothstep(p, ACT_FIVE_TIMING.cameraIntroStart, ACT_FIVE_TIMING.cameraStart);
        desiredPosition.lerp(ACT_FIVE_ENTRY_CAMERA, entry);
        desiredLookAt.lerp(ACT_FIVE_ENTRY_TARGET, entry);
        const entryPunch = Math.sin(entry * Math.PI);
        const entryArc = Math.sin(entry * Math.PI * 0.82);
        desiredPosition.x += entryArc * 0.3;
        desiredPosition.y += entryPunch * 0.16;
        desiredLookAt.x += entryArc * 0.12;
        desiredFov = THREE.MathUtils.lerp(49, 53, entry) + entryPunch * 6.5;
        authoredActFiveRoll = Math.sin(entry * Math.PI) * 0.16;
        authoredActFivePitch = Math.sin(entry * Math.PI) * -0.045;
        authoredActFiveYaw = entryArc * 0.055;
      } else {
        const progress = THREE.MathUtils.clamp((p - ACT_FIVE_TIMING.cameraStart) / (ACT_FIVE_TIMING.sceneExit - ACT_FIVE_TIMING.cameraStart), 0, 1);
        desiredPosition.copy(pointOnKeyedCurve(ACT_FIVE_POSITION_CURVE, progress));
        desiredLookAt.copy(pointOnKeyedCurve(ACT_FIVE_TARGET_CURVE, progress));
        let bank = 0;
        let speedRamp = 0;
        for (let index = 0; index < 3; index += 1) {
          const start = ACT_FIVE_TIMING.localTransferStarts[index + 1];
          const end = ACT_FIVE_TIMING.localCheckpointStops[index + 1];
          const blend = THREE.MathUtils.clamp((progress - start) / (end - start), 0, 1);
          const travel = Math.sin(blend * Math.PI);
          const turnSign = index % 2 === 0 ? 1 : -1;
          bank += travel * turnSign * 0.255;
          authoredActFivePitch += travel * (index % 2 === 0 ? -0.038 : 0.032);
          authoredActFiveYaw += travel * turnSign * 0.045;
          speedRamp = Math.max(speedRamp, travel);
          if (travel > 0) {
            const forward = desiredLookAt.clone().sub(desiredPosition).normalize();
            const lateral = forward.clone().cross(new THREE.Vector3(0, 1, 0)).normalize();
            desiredPosition.addScaledVector(lateral, turnSign * travel * 0.52);
            desiredPosition.y += travel * (index % 2 === 0 ? 0.28 : -0.22);
          }
        }
        const exitBlend = THREE.MathUtils.smoothstep(progress, 0.68, 1.0);
        bank += Math.sin(exitBlend * Math.PI) * 0.18;
        authoredActFivePitch += Math.sin(exitBlend * Math.PI) * -0.055;
        authoredActFiveYaw += Math.sin(exitBlend * Math.PI) * 0.06;
        speedRamp = Math.max(speedRamp, Math.sin(exitBlend * Math.PI) * 0.7);
        desiredFov = 51.5 + speedRamp * 10.5;
        authoredActFiveRoll = bank;
      }
    }

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
    } else if (actFourPhase === "returning" && p < 0.905) {
      desiredPosition.set(2.9, 1.85, 4.7);
      desiredLookAt.set(0.9, 0.35, -3.4);
      desiredFov = 51;
    }

    const time = state.clock.getElapsedTime();
    // Act I breathes before the first scroll: a small authored arc from the
    // lower/front angle toward the right. It fades before the first scroll
    // keyframe, leaving every real scene transition under scroll control.
    if (p < 0.082 && actFourPhase === "locked") {
      const settle = 1 - THREE.MathUtils.smoothstep(p, 0.026, 0.082);
      const heroArc = time * 0.105 - Math.PI * 0.52;
      desiredPosition.x += Math.sin(heroArc) * 0.48 * settle;
      desiredPosition.y += Math.cos(heroArc * 0.72) * 0.1 * settle;
      desiredPosition.z += (Math.cos(heroArc) - 0.25) * 0.14 * settle;
      desiredLookAt.x += Math.sin(heroArc * 0.78) * 0.13 * settle;
      desiredLookAt.y += Math.cos(heroArc * 0.7) * 0.045 * settle;
      desiredFov -= 0.55 * settle;
    }

    // Act VI uses a restrained camera orbit. The nebula itself stays fixed.
    if (p >= ACT_FIVE_TIMING.sceneExit && actFourPhase === "locked") {
      const orbit = time * 0.06;
      desiredPosition.x += Math.sin(orbit) * 0.28;
      desiredPosition.y += Math.cos(orbit * 0.82) * 0.12;
      desiredLookAt.x += Math.sin(orbit * 0.72) * 0.12;
      desiredLookAt.y += Math.cos(orbit * 0.82) * 0.05;
    }

    const cameraDamping = actFourPhase === "locked" || actFourPhase === "ready" ? 8.4 : 4.6;
    if (actFiveCameraActive) {
      // A lightly underdamped spring gives the camera mass, a restrained overshoot,
      // and a short settle at each authored checkpoint without affecting other acts.
      const step = Math.min(delta, 1 / 30);
      const omega = 7.2;
      const dampingRatio = 0.88;
      cameraVelocity.current.addScaledVector(desiredPosition.clone().sub(currentPos.current).multiplyScalar(omega * omega)
        .addScaledVector(cameraVelocity.current, -2 * dampingRatio * omega), step);
      targetVelocity.current.addScaledVector(desiredLookAt.clone().sub(currentLookAt.current).multiplyScalar(omega * omega)
        .addScaledVector(targetVelocity.current, -2 * dampingRatio * omega), step);
      currentPos.current.addScaledVector(cameraVelocity.current, step);
      currentLookAt.current.addScaledVector(targetVelocity.current, step);
      currentFov.current = THREE.MathUtils.damp(currentFov.current, desiredFov, 6.2, step);
    } else {
      currentPos.current.lerp(desiredPosition, 1 - Math.exp(-cameraDamping * delta));
      currentLookAt.current.lerp(desiredLookAt, 1 - Math.exp(-cameraDamping * delta));
      currentFov.current = THREE.MathUtils.damp(currentFov.current, desiredFov, cameraDamping, delta);
      cameraVelocity.current.multiplyScalar(Math.exp(-9 * delta));
      targetVelocity.current.multiplyScalar(Math.exp(-9 * delta));
    }

    // Subtle handheld-cinema drift while scrolling; very small so the scene stays premium.
    const drift = Math.sin(time * 0.45 + p * Math.PI * 2) * 0.01;
    const noiseEnvelope = actFiveCameraActive ? 1 : 0;
    const smoothRigNoise = (frequency: number, phase: number) => {
      const sample = time * frequency + phase;
      const cell = Math.floor(sample);
      const local = sample - cell;
      const eased = local * local * (3 - 2 * local);
      const a = Math.sin(cell * 127.1 + phase * 311.7) * 43758.5453;
      const b = Math.sin((cell + 1) * 127.1 + phase * 311.7) * 43758.5453;
      return THREE.MathUtils.lerp(a - Math.floor(a) - 0.5, b - Math.floor(b) - 0.5, eased);
    };
    cameraNoise.current.set(
      smoothRigNoise(7.4, 0.31) * 0.0042 * noiseEnvelope,
      smoothRigNoise(6.1, 1.77) * 0.0032 * noiseEnvelope,
      smoothRigNoise(8.2, 2.43) * 0.0012 * noiseEnvelope,
    );

    camera.position.copy(currentPos.current).add(new THREE.Vector3(drift, drift * 0.35, 0)).add(cameraNoise.current);
    camera.lookAt(currentLookAt.current);
    const targetRoll = actFiveCameraActive ? authoredActFiveRoll : 0;
    const targetPitch = actFiveCameraActive ? authoredActFivePitch : 0;
    const targetYaw = actFiveCameraActive ? authoredActFiveYaw : 0;
    cameraRoll.current = THREE.MathUtils.damp(cameraRoll.current, targetRoll, actFiveCameraActive ? 5.5 : 8, delta);
    cameraPitch.current = THREE.MathUtils.damp(cameraPitch.current, targetPitch, actFiveCameraActive ? 5.2 : 8, delta);
    cameraYaw.current = THREE.MathUtils.damp(cameraYaw.current, targetYaw, actFiveCameraActive ? 5.2 : 8, delta);
    camera.rotateY(cameraYaw.current);
    camera.rotateX(cameraPitch.current);
    camera.rotateZ(cameraRoll.current);
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
