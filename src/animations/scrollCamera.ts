"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import Lenis from "lenis";
import * as THREE from "three";
import type { ActFourPhase } from "@/types/actFour";
import { getActSixCameraPose } from "./actSixChoreography";
import {
  ACT_FIVE_ENTRY_CAMERA,
  ACT_FIVE_ENTRY_TARGET,
  ACT_FIVE_LOCAL_KEY_T,
  ACT_FIVE_TIMING,
  createActFiveCameraCurves,
} from "./actFiveChoreography";
import { ACT_FOUR_CORE_POSITION, ACT_FOUR_EXIT_CAMERA_PATH, ACT_FOUR_EXIT_TARGET_PATH, createActFourExitPaths, getActFourProjectPose } from "./actFourChoreography";

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
    // Act IV approach begins before the launch gate, letting the core grow in frame.
    camera: new THREE.Vector3(0.75, 0.92, 7.45),
    lookAt: new THREE.Vector3(4.5, 2.5, -8),
    fov: 50,
    progress: 0.85,
  },
  {
    // At the gravity lock, the camera is centered exactly 14 units in front of the core.
    camera: new THREE.Vector3(4.5, 2.5, 6),
    lookAt: new THREE.Vector3(4.5, 2.5, -8),
    fov: 45,
    progress: 0.875,
  },
  {
    // Act IV hold — lock onto the core before the manual warp begins.
    camera: new THREE.Vector3(4.5, 2.5, 6),
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
  actFourPhase = "act3",
  actFourProjectIndex = 0,
  warpCharge,
}: {
  scrollProgress: number;
  lensDistortion?: number;
  actFourPhase?: ActFourPhase;
  actFourProjectIndex?: number;
  warpCharge?: React.RefObject<number>;
}) {
  const currentPos = useRef(new THREE.Vector3(0.5, 0.5, 8));
  const currentLookAt = useRef(new THREE.Vector3(0.8, 0, -1));
  const currentFov = useRef(45);
  const smoothProgress = useRef(0);
  const cameraRoll = useRef(0);
  const cameraPitch = useRef(0);
  const cameraYaw = useRef(0);
  const cameraVelocity = useRef(new THREE.Vector3());
  const targetVelocity = useRef(new THREE.Vector3());
  const cameraNoise = useRef(new THREE.Vector3());
  const phaseRef = useRef(actFourPhase);
  const phaseStartedAt = useRef(0);
  const breachCurve = useRef<THREE.CatmullRomCurve3 | null>(null);
  const tunnelCurve = useRef<THREE.CatmullRomCurve3 | null>(null);
  const tunnelTargetCurve = useRef<THREE.CatmullRomCurve3 | null>(null);
  const arrivalCurve = useRef<THREE.CatmullRomCurve3 | null>(null);
  const arrivalTarget = useRef<THREE.Vector3 | null>(null);
  const returnPositionCurve = useRef<THREE.CatmullRomCurve3 | null>(null);
  const returnTargetCurve = useRef<THREE.CatmullRomCurve3 | null>(null);
  const projectMotion = useRef(0);
  const projectMotionFrom = useRef(0);
  const projectMotionTo = useRef(0);
  const projectMotionStartedAt = useRef(0);
  const gatePulseAt = useRef(Number.NEGATIVE_INFINITY);

  useEffect(() => {
    const onGatePulse = () => { gatePulseAt.current = performance.now(); };
    window.addEventListener("act-four-gate-pulse", onGatePulse);
    return () => window.removeEventListener("act-four-gate-pulse", onGatePulse);
  }, []);

  const clampedProgress = Math.max(0, Math.min(1, scrollProgress));

  useFrame((state, delta) => {
    const camera = state.camera as THREE.PerspectiveCamera;
    const time = state.clock.getElapsedTime();
    if (phaseRef.current !== actFourPhase) {
      phaseRef.current = actFourPhase;
      phaseStartedAt.current = time;
      if (actFourPhase === "act4_warp_in") {
        const plungeStart = new THREE.Vector3(ACT_FOUR_CORE_POSITION.x, ACT_FOUR_CORE_POSITION.y, ACT_FOUR_CORE_POSITION.z + 14);
        const plungeExit = new THREE.Vector3(ACT_FOUR_CORE_POSITION.x, ACT_FOUR_CORE_POSITION.y, ACT_FOUR_CORE_POSITION.z + 1.5);
        const firstStation = getActFourProjectPose(0);
        breachCurve.current = new THREE.CatmullRomCurve3([plungeStart, plungeExit], false, "centripetal");
        tunnelCurve.current = new THREE.CatmullRomCurve3([
          plungeExit,
          new THREE.Vector3((plungeExit.x + firstStation.camera.x) * 0.5, (plungeExit.y + firstStation.camera.y) * 0.5, -1.2),
          firstStation.camera.clone().add(new THREE.Vector3(0, 0, 6)),
        ], false, "centripetal");
        tunnelTargetCurve.current = new THREE.CatmullRomCurve3([
          plungeExit.clone().add(new THREE.Vector3(0, 0, -20)),
          new THREE.Vector3(firstStation.target.x, firstStation.target.y, -8),
          firstStation.target.clone(),
        ], false, "centripetal");
        arrivalCurve.current = new THREE.CatmullRomCurve3([
          tunnelCurve.current.getPointAt(1),
          firstStation.camera.clone().add(new THREE.Vector3(0, 0, 2.5)),
          firstStation.camera.clone(),
        ], false, "centripetal");
        arrivalTarget.current = firstStation.target.clone();
      }
      if (actFourPhase === "act4_warp_out") {
        const exitPaths = createActFourExitPaths(actFourProjectIndex);
        returnPositionCurve.current = exitPaths.position;
        returnTargetCurve.current = exitPaths.target;
      }
      if (actFourPhase === "act4_vault") {
        projectMotion.current = 0;
        projectMotionFrom.current = 0;
        projectMotionTo.current = 0;
        projectMotionStartedAt.current = time;
      }
    }
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
    let authoredActSixRoll = 0;
    let authoredActSixPitch = 0;
    let authoredActSixYaw = 0;
    let actSixCameraActive = false;

    // The Act V entry blends out of the existing Act IV camera, then follows
    // keyed Catmull-Rom position and target splines through all four artifacts.
    if (p >= ACT_FIVE_TIMING.cameraIntroStart && p < ACT_FIVE_TIMING.sceneExit && actFourPhase === "act5") {
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
        const exitBlend = THREE.MathUtils.smoothstep(progress, 0.8, 1.0);
        bank += Math.sin(exitBlend * Math.PI) * 0.18;
        authoredActFivePitch += Math.sin(exitBlend * Math.PI) * -0.055;
        authoredActFiveYaw += Math.sin(exitBlend * Math.PI) * 0.06;
        speedRamp = Math.max(speedRamp, Math.sin(exitBlend * Math.PI) * 0.7);
        desiredFov = 51.5 + speedRamp * 10.5;
        authoredActFiveRoll = bank;
      }
    }

    const isWarping = actFourPhase === "act4_warp_in";
    const charge = actFourPhase === "act4_exterior" ? THREE.MathUtils.clamp(warpCharge?.current ?? 0, 0, 1) : 0;
    if (actFourPhase === "act4_exterior" && charge > 0) {
      const pullback = desiredPosition.clone().sub(desiredLookAt).normalize();
      desiredPosition.addScaledVector(pullback, charge * 1.15);
      desiredFov = 45 + charge * 23;
    } else if (isWarping) {
      const elapsed = time - phaseStartedAt.current;
      const flight = THREE.MathUtils.clamp(elapsed / 2.2, 0, 1);
      const breachEnd = 0.25;
      const tunnelEnd = 0.75;
      camera.up.set(0, 1, 0);
      if (flight < breachEnd) {
        const stage = THREE.MathUtils.smootherstep(flight / breachEnd, 0, 1);
        desiredPosition.copy((breachCurve.current ?? ACT_FOUR_EXIT_CAMERA_PATH).getPointAt(stage));
        desiredLookAt.set(desiredPosition.x, desiredPosition.y, desiredPosition.z - 18);
        desiredFov = 84;
        authoredActFiveRoll = stage * 0.025;
      } else if (flight < tunnelEnd) {
        const stage = THREE.MathUtils.smootherstep((flight - breachEnd) / (tunnelEnd - breachEnd), 0, 1);
        desiredPosition.copy((tunnelCurve.current ?? ACT_FOUR_EXIT_CAMERA_PATH).getPointAt(stage));
        desiredLookAt.copy((tunnelTargetCurve.current ?? ACT_FOUR_EXIT_TARGET_PATH).getPointAt(stage));
        desiredFov = 84;
        const bank = THREE.MathUtils.smoothstep(stage, 0.06, 0.28) * (1 - THREE.MathUtils.smoothstep(stage, 0.7, 1));
        authoredActFiveRoll = THREE.MathUtils.degToRad(14) * bank;
        authoredActFivePitch = -0.035 * bank;
        authoredActFiveYaw = Math.sin(stage * Math.PI) * 0.025;
      } else {
        const u = THREE.MathUtils.clamp((flight - tunnelEnd) / (1 - tunnelEnd), 0, 1);
        const stage = 1 - Math.pow(1 - u, 3.5);
        desiredPosition.copy((arrivalCurve.current ?? ACT_FOUR_EXIT_CAMERA_PATH).getPointAt(stage));
        desiredLookAt.copy(arrivalTarget.current ?? getActFourProjectPose(0).target);
        desiredFov = THREE.MathUtils.lerp(84, 42, stage);
        authoredActFiveRoll = 0;
        authoredActFivePitch = 0;
      }
    } else if (actFourPhase === "act4_vault") {
      if (actFourProjectIndex !== projectMotionTo.current) {
        projectMotionFrom.current = projectMotion.current;
        projectMotionTo.current = actFourProjectIndex;
        projectMotionStartedAt.current = time;
      }
      const flight = THREE.MathUtils.clamp((time - projectMotionStartedAt.current) / 0.85, 0, 1);
      const cubicInOut = flight < 0.5 ? 4 * flight * flight * flight : 1 - Math.pow(-2 * flight + 2, 3) / 2;
      projectMotion.current = THREE.MathUtils.lerp(projectMotionFrom.current, projectMotionTo.current, cubicInOut);
      const pose = getActFourProjectPose(projectMotion.current);
      desiredPosition.copy(pose.camera);
      desiredLookAt.copy(pose.target);
      desiredFov = 42 + Math.sin(flight * Math.PI) * 5;
      const direction = Math.sign(projectMotionTo.current - projectMotionFrom.current);
      authoredActFiveRoll = Math.sin(flight * Math.PI) * THREE.MathUtils.degToRad(3) * direction;
    } else if (actFourPhase === "act4_warp_out") {
      const flight = THREE.MathUtils.clamp((time - phaseStartedAt.current - 0.22) / 0.9, 0, 1);
      const eased = THREE.MathUtils.smoothstep(flight, 0, 1);
      const positionCurve = returnPositionCurve.current ?? ACT_FOUR_EXIT_CAMERA_PATH;
      const targetCurve = returnTargetCurve.current ?? ACT_FOUR_EXIT_TARGET_PATH;
      desiredPosition.copy(positionCurve.getPointAt(eased));
      desiredLookAt.copy(targetCurve.getPointAt(eased));
      desiredFov = THREE.MathUtils.lerp(42, 82, eased);
      authoredActFiveRoll = Math.sin(flight * Math.PI) * 0.035;
    }

    // Act I breathes before the first scroll: a small authored arc from the
    // lower/front angle toward the right. It fades before the first scroll
    // keyframe, leaving every real scene transition under scroll control.
    if (p < 0.082 && actFourPhase === "act3") {
      const settle = 1 - THREE.MathUtils.smoothstep(p, 0.026, 0.082);
      const heroArc = time * 0.105 - Math.PI * 0.52;
      desiredPosition.x += Math.sin(heroArc) * 0.48 * settle;
      desiredPosition.y += Math.cos(heroArc * 0.72) * 0.1 * settle;
      desiredPosition.z += (Math.cos(heroArc) - 0.25) * 0.14 * settle;
      desiredLookAt.x += Math.sin(heroArc * 0.78) * 0.13 * settle;
      desiredLookAt.y += Math.cos(heroArc * 0.7) * 0.045 * settle;
      desiredFov -= 0.55 * settle;
    }

    // Act VI is a scroll-triggered camera orbit. The galaxy remains a fixed
    // composition while the camera sweeps around it into the contact landing.
    if (p >= ACT_FIVE_TIMING.sceneExit && actFourPhase === "act6") {
      actSixCameraActive = true;
      const scrollFlight = THREE.MathUtils.clamp(
        (p - ACT_FIVE_TIMING.sceneExit) / (1 - ACT_FIVE_TIMING.sceneExit),
        0,
        1,
      );
      // Scroll is the timeline: no hidden timer can hold or desynchronize the
      // Act V-to-VI move. Each wheel/touch movement advances the same shot.
      const pose = getActSixCameraPose(scrollFlight, time);
      desiredPosition.copy(pose.position);
      desiredLookAt.copy(pose.target);
      desiredFov = pose.fov;
      authoredActSixRoll = pose.roll;
      authoredActSixPitch = pose.pitch;
      authoredActSixYaw = pose.yaw;

      // A small damped mouse parallax becomes available after the handoff has
      // landed; it moves the virtual rig without changing the authored galaxy.
      const parallax = THREE.MathUtils.smoothstep(scrollFlight, 0.58, 0.9);
      desiredPosition.x += state.pointer.x * 0.16 * parallax;
      desiredPosition.y += state.pointer.y * 0.1 * parallax;
      desiredLookAt.x += state.pointer.x * 0.12 * parallax;
      desiredLookAt.y += state.pointer.y * 0.08 * parallax;
      // A barely perceptible lens breath keeps the landing alive without
      // changing galaxy size or particle spacing.
      // The visitor's final Act VI scroll movement creates a restrained lens
      // inhale/exhale; no timer runs once the scroll position is held still.
      desiredFov += Math.sin(scrollFlight * Math.PI * 2.25) * 0.56 * parallax;
    }

    const cameraDamping = actFourPhase === "act3" || actFourPhase === "act4_exterior" ? 8.4 : actFourPhase === "act4_warp_in" || actFourPhase === "act4_warp_out" ? 8.8 : 4.6;
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
    const actFourBreathing = actFourPhase === "act4_exterior";
    const drift = Math.sin(time * 0.45 + p * Math.PI * 2) * (actFourBreathing ? 0.018 : 0.01);
    const warpSettle = isWarping ? 1 - THREE.MathUtils.smoothstep((time - phaseStartedAt.current) / 2.2, 0.78, 1) : 0;
    const noiseEnvelope = actFiveCameraActive ? 1 : charge > 0 ? charge : isWarping ? 0.7 * warpSettle : 0;
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
      smoothRigNoise(noiseEnvelope > 0 ? 26 : 7.4, 0.31) * (charge > 0 || isWarping ? 0.016 : 0.0042) * noiseEnvelope,
      smoothRigNoise(noiseEnvelope > 0 ? 22 : 6.1, 1.77) * (charge > 0 || isWarping ? 0.012 : 0.0032) * noiseEnvelope,
      smoothRigNoise(noiseEnvelope > 0 ? 22 : 8.2, 2.43) * (charge > 0 || isWarping ? 0.004 : 0.0012) * noiseEnvelope,
    );

    camera.position.copy(currentPos.current).add(new THREE.Vector3(drift, drift * 0.35, 0)).add(cameraNoise.current);
    if (actFourPhase === "act4_exterior") {
      const pulseAge = (performance.now() - gatePulseAt.current) / 420;
      if (pulseAge >= 0 && pulseAge < 1) camera.position.z += Math.sin((1 - pulseAge) * Math.PI) * 0.16;
    }
    camera.lookAt(currentLookAt.current);
    const actFourCameraActive = actFourPhase === "act4_warp_in" || actFourPhase === "act4_vault" || actFourPhase === "act4_warp_out";
    const targetRoll = actFiveCameraActive || actFourCameraActive ? authoredActFiveRoll : actSixCameraActive ? authoredActSixRoll : 0;
    const targetPitch = actFiveCameraActive || actFourCameraActive ? authoredActFivePitch : actSixCameraActive ? authoredActSixPitch : 0;
    const targetYaw = actFiveCameraActive || actFourCameraActive ? authoredActFiveYaw : actSixCameraActive ? authoredActSixYaw : 0;
    const cinematicCameraActive = actFiveCameraActive || actSixCameraActive || actFourCameraActive;
    cameraRoll.current = THREE.MathUtils.damp(cameraRoll.current, targetRoll, cinematicCameraActive ? 5.5 : 8, delta);
    cameraPitch.current = THREE.MathUtils.damp(cameraPitch.current, targetPitch, cinematicCameraActive ? 5.2 : 8, delta);
    cameraYaw.current = THREE.MathUtils.damp(cameraYaw.current, targetYaw, cinematicCameraActive ? 5.2 : 8, delta);
    camera.rotateY(cameraYaw.current);
    camera.rotateX(cameraPitch.current);
    camera.rotateZ(cameraRoll.current);
    if (actFourBreathing) {
      camera.position.x += Math.sin(time * 0.19) * 0.025;
      camera.position.y += Math.cos(time * 0.16) * 0.018;
    }
    if (charge > 0 || isWarping || actFourPhase === "act4_warp_out") {
      const shake = charge > 0 ? charge : isWarping
        ? THREE.MathUtils.smoothstep(Math.sin(time * 0.7) * 0.5 + 0.5, 0.15, 0.85) * warpSettle
        : THREE.MathUtils.smoothstep(Math.sin(time * 0.7) * 0.5 + 0.5, 0.15, 0.85);
      camera.rotateX(smoothRigNoise(31, 5.3) * 0.004 * shake);
      camera.rotateY(smoothRigNoise(27, 9.1) * 0.005 * shake);
      camera.rotateZ(smoothRigNoise(34, 14.4) * 0.006 * shake);
    }
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
