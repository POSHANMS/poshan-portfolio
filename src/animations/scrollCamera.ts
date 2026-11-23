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
import { ACT_FOUR_CORE_POSITION, ACT_FOUR_EXIT_CAMERA_PATH, ACT_FOUR_EXIT_TARGET_PATH, ACT_FOUR_PROJECT_STATIONS, createActFourExitPaths, getActFourProjectPose } from "./actFourChoreography";

const WORMHOLE_ARRIVAL_POSE = getActFourProjectPose(0);
const ACT_FOUR_CAMERA_OFFSETS = [
  new THREE.Vector3(-1.65, 0.1, 8.4),
  new THREE.Vector3(8.4, 0.1, 1.65),
  new THREE.Vector3(1.65, 0.1, -8.4),
  new THREE.Vector3(-8.4, 0.1, -1.65),
  new THREE.Vector3(-1.65, 0.1, 8.4),
];
/** One canonical set of camera/target poses drives both the fold and each physical slab. */
export const ACT_FOUR_FOLD_POSES = ACT_FOUR_PROJECT_STATIONS.map((station, index) => ({
  // Station 01 is the exact same pose used by the wormhole arrival endpoint.
  camera: index === 0 ? WORMHOLE_ARRIVAL_POSE.camera.clone() : station.clone().add(ACT_FOUR_CAMERA_OFFSETS[index] ?? ACT_FOUR_CAMERA_OFFSETS[0]),
  target: index === 0 ? WORMHOLE_ARRIVAL_POSE.target.clone() : station.clone().add(new THREE.Vector3(0, 0.1, 0)),
}));
export const ACT_FOUR_WARP_IN_DURATION_MS = 2200;
export const ACT_FOUR_WARP_IN_DURATION_SECONDS = ACT_FOUR_WARP_IN_DURATION_MS / 1000;
/** Shared immutable 3D corridor: its ends join the exterior core and FINDIT pose. */
const WORMHOLE_CHORD_LENGTH = ACT_FOUR_CORE_POSITION.distanceTo(WORMHOLE_ARRIVAL_POSE.camera);
export const WORMHOLE_SCALE = WORMHOLE_CHORD_LENGTH / 180;
const WORMHOLE_LATERAL_AMPLITUDE = 5 * WORMHOLE_SCALE;
const WORMHOLE_VERTICAL_AMPLITUDE = 3.5 * WORMHOLE_SCALE;
export const WORMHOLE_CURVE = new THREE.CatmullRomCurve3([
  ACT_FOUR_CORE_POSITION.clone(),
  ACT_FOUR_CORE_POSITION.clone().lerp(WORMHOLE_ARRIVAL_POSE.camera, 0.25)
    .add(new THREE.Vector3(WORMHOLE_LATERAL_AMPLITUDE, WORMHOLE_VERTICAL_AMPLITUDE, 0)),
  ACT_FOUR_CORE_POSITION.clone().lerp(WORMHOLE_ARRIVAL_POSE.camera, 0.5)
    .add(new THREE.Vector3(-WORMHOLE_LATERAL_AMPLITUDE * 0.45, -WORMHOLE_VERTICAL_AMPLITUDE * 0.2, 0)),
  ACT_FOUR_CORE_POSITION.clone().lerp(WORMHOLE_ARRIVAL_POSE.camera, 0.75)
    .add(new THREE.Vector3(WORMHOLE_LATERAL_AMPLITUDE, -WORMHOLE_VERTICAL_AMPLITUDE, 0)),
  WORMHOLE_ARRIVAL_POSE.camera.clone(),
], false, "centripetal");
export const WORMHOLE_PATH_LENGTH = WORMHOLE_CURVE.getLength();
/** Scale the 8.5-unit design radius to this exact, joined spline length. */
export const WORMHOLE_TUBE_RADIUS = 8.5 * WORMHOLE_PATH_LENGTH / 180;

function cubicBezier(start: THREE.Vector3, controlOne: THREE.Vector3, controlTwo: THREE.Vector3, end: THREE.Vector3, t: number) {
  const inverse = 1 - t;
  return start.clone().multiplyScalar(inverse ** 3)
    .addScaledVector(controlOne, 3 * inverse ** 2 * t)
    .addScaledVector(controlTwo, 3 * inverse * t ** 2)
    .addScaledVector(end, t ** 3);
}

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
  const arrivalTarget = useRef<THREE.Vector3 | null>(null);
  const returnPositionCurve = useRef<THREE.CatmullRomCurve3 | null>(null);
  const returnTargetCurve = useRef<THREE.CatmullRomCurve3 | null>(null);
  const projectMotion = useRef(0);
  const projectMotionFrom = useRef(0);
  const projectMotionTo = useRef(0);
  const projectMotionStartedAt = useRef(0);
  const foldTransitionActive = useRef(false);
  const foldTransitionDuration = useRef(0.9);
  const foldStartFov = useRef(42);
  const foldEndFov = useRef(42);
  const arrivalSettleActive = useRef(false);
  const foldStartPosition = useRef(new THREE.Vector3());
  const foldControlOne = useRef(new THREE.Vector3());
  const foldControlTwo = useRef(new THREE.Vector3());
  const foldEndPosition = useRef(new THREE.Vector3());
  const foldStartTarget = useRef(new THREE.Vector3());
  const foldEndTarget = useRef(new THREE.Vector3());
  const foldStartQuaternion = useRef(new THREE.Quaternion());
  const foldEndQuaternion = useRef(new THREE.Quaternion());
  const foldQuaternion = useRef(new THREE.Quaternion());
  const foldPointer = useRef(new THREE.Vector2());
  // Use a Camera, not a generic Object3D: cameras look along local -Z, while
  // Object3D.lookAt aims local +Z at the target and reverses the view direction.
  const foldLookObject = useRef(new THREE.Camera());
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
      const previousPhase = phaseRef.current;
      phaseRef.current = actFourPhase;
      phaseStartedAt.current = time;
      if (actFourPhase === "act4_warp_in") {
        // Start the breach at the charged camera pose. Reusing the old wide
        // establishing point would pull the camera backward at the exact
        // moment the visitor crosses the hold threshold.
        const plungeStart = camera.position.clone();
        currentPos.current.copy(plungeStart);
        // The hold charge settles at 52°. Lock that authored handoff pose so
        // the first breach frame cannot inherit a stale damped lens value.
        currentFov.current = 52;
        camera.fov = 52;
        camera.updateProjectionMatrix();
        cameraRoll.current = 0;
        const plungeExit = WORMHOLE_CURVE.getPointAt(0);
        const firstStation = getActFourProjectPose(0);
        breachCurve.current = new THREE.CatmullRomCurve3([plungeStart, plungeExit], false, "centripetal");
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
        if (previousPhase === "act4_warp_in") {
          const firstStation = ACT_FOUR_FOLD_POSES[0];
          foldStartPosition.current.copy(camera.position);
          foldStartTarget.current.copy(camera.position).add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(12));
          foldEndPosition.current.copy(firstStation.camera);
          foldEndTarget.current.copy(firstStation.target);
          foldControlOne.current.copy(foldStartPosition.current).lerp(foldEndPosition.current, 1 / 3);
          foldControlTwo.current.copy(foldStartPosition.current).lerp(foldEndPosition.current, 2 / 3);
          foldStartQuaternion.current.copy(camera.quaternion);
          foldLookObject.current.position.copy(firstStation.camera);
          foldLookObject.current.up.set(0, 1, 0);
          foldLookObject.current.lookAt(firstStation.target);
          foldEndQuaternion.current.copy(foldLookObject.current.quaternion);
          foldQuaternion.current.copy(camera.quaternion);
          foldStartFov.current = camera.fov - lensDistortion * 15;
          foldEndFov.current = 42;
          foldTransitionDuration.current = 0.18;
          arrivalSettleActive.current = true;
          foldTransitionActive.current = true;
        } else {
          foldTransitionActive.current = false;
          arrivalSettleActive.current = false;
          foldTransitionDuration.current = 0.9;
        }
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
    let foldQuaternionActive = false;

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
      // Move straight along the existing camera-to-target sightline. The
      // distance pull and 45°→52° lens change combine to enlarge the horizon
      // by roughly 13% while keeping its screen placement and angle fixed.
      desiredPosition.lerp(desiredLookAt, charge * 0.25);
      desiredFov = THREE.MathUtils.lerp(45, 52, charge);
    } else if (isWarping) {
      const elapsed = time - phaseStartedAt.current;
      const flight = THREE.MathUtils.clamp(elapsed / ACT_FOUR_WARP_IN_DURATION_SECONDS, 0, 1);
      const breachEnd = 0.26;
      const tunnelStart = 0.24;
      const tunnelEnd = 0.78;
      const arrivalStart = 0.78;
      camera.up.set(0, 1, 0);
      const tunnelProgress = THREE.MathUtils.clamp((flight - tunnelStart) / (tunnelEnd - tunnelStart), 0, 1);
      const tunnelU = tunnelProgress * 0.96;
      const tunnelPosition = WORMHOLE_CURVE.getPointAt(tunnelU);
      const tunnelLookAt = WORMHOLE_CURVE.getPointAt(Math.min(1, tunnelU + 0.065));
      const tunnelFov = THREE.MathUtils.lerp(92, 108, Math.sin(tunnelProgress * Math.PI * 0.5));
      if (flight < tunnelStart) {
        const u = THREE.MathUtils.clamp(flight / breachEnd, 0, 1);
        const stage = Math.pow(u, 2.7);
        desiredPosition.copy((breachCurve.current ?? ACT_FOUR_EXIT_CAMERA_PATH).getPointAt(stage));
        desiredLookAt.copy(ACT_FOUR_CORE_POSITION).add(new THREE.Vector3(0, 0, -24));
        desiredFov = THREE.MathUtils.lerp(52, 92, stage);
        authoredActFiveRoll = 0;
      } else if (flight < arrivalStart) {
        const tangentBefore = WORMHOLE_CURVE.getTangentAt(Math.max(0, tunnelU - 0.015));
        const tangentAfter = WORMHOLE_CURVE.getTangentAt(Math.min(1, tunnelU + 0.015));
        const bendSign = Math.sign(tangentBefore.clone().cross(tangentAfter).z);
        const bendBank = bendSign * THREE.MathUtils.degToRad(7.5) * Math.sin(tunnelProgress * Math.PI);
        const requestedBank = THREE.MathUtils.degToRad(32) * Math.sin(tunnelProgress * Math.PI * 0.5) + bendBank;
        authoredActFiveRoll = THREE.MathUtils.clamp(requestedBank, -THREE.MathUtils.degToRad(32), THREE.MathUtils.degToRad(32));
        authoredActFivePitch = -0.025 * Math.sin(tunnelProgress * Math.PI);
        authoredActFiveYaw = bendSign * 0.018 * Math.sin(tunnelProgress * Math.PI);
        if (flight < breachEnd) {
          const u = THREE.MathUtils.clamp(flight / breachEnd, 0, 1);
          const plunge = Math.pow(u, 2.7);
          const blend = THREE.MathUtils.smoothstep(flight, tunnelStart, breachEnd);
          desiredPosition.lerpVectors((breachCurve.current ?? ACT_FOUR_EXIT_CAMERA_PATH).getPointAt(plunge), tunnelPosition, blend);
          desiredLookAt.lerpVectors(ACT_FOUR_CORE_POSITION.clone().add(new THREE.Vector3(0, 0, -24)), tunnelLookAt, blend);
          desiredFov = THREE.MathUtils.lerp(THREE.MathUtils.lerp(52, 92, plunge), tunnelFov, blend);
          authoredActFiveRoll *= blend;
          authoredActFivePitch *= blend;
          authoredActFiveYaw *= blend;
        } else {
          desiredPosition.copy(tunnelPosition);
          desiredLookAt.copy(tunnelLookAt);
          desiredFov = tunnelFov;
        }
      } else {
        const u = THREE.MathUtils.clamp((flight - arrivalStart) / (1 - arrivalStart), 0, 1);
        const stage = 1 - Math.pow(1 - u, 3.5);
        desiredPosition.lerpVectors(WORMHOLE_CURVE.getPointAt(0.96), WORMHOLE_ARRIVAL_POSE.camera, stage);
        desiredFov = THREE.MathUtils.lerp(108, 42, stage);
        authoredActFiveRoll = THREE.MathUtils.degToRad(32) * (1 - stage);
        authoredActFivePitch = 0;
        authoredActFiveYaw = 0;
        desiredLookAt.lerpVectors(WORMHOLE_CURVE.getPointAt(1), arrivalTarget.current ?? WORMHOLE_ARRIVAL_POSE.target, stage);
      }
    } else if (actFourPhase === "act4_vault") {
      foldQuaternionActive = true;
      camera.up.set(0, 1, 0);
      const nextIndex = THREE.MathUtils.clamp(Math.round(actFourProjectIndex), 0, ACT_FOUR_FOLD_POSES.length - 1);
      if (nextIndex !== projectMotionTo.current) {
        const fromPose = ACT_FOUR_FOLD_POSES[projectMotionTo.current] ?? ACT_FOUR_FOLD_POSES[0];
        const toPose = ACT_FOUR_FOLD_POSES[nextIndex] ?? ACT_FOUR_FOLD_POSES[0];
        projectMotionFrom.current = projectMotion.current;
        projectMotionTo.current = nextIndex;
        projectMotionStartedAt.current = time;
        foldStartPosition.current.copy(camera.position);
        foldStartTarget.current.copy(currentLookAt.current);
        foldEndPosition.current.copy(toPose.camera);
        foldEndTarget.current.copy(toPose.target);
        foldStartQuaternion.current.copy(camera.quaternion);
        foldLookObject.current.position.copy(toPose.camera);
        foldLookObject.current.up.set(0, 1, 0);
        foldLookObject.current.lookAt(toPose.target);
        foldEndQuaternion.current.copy(foldLookObject.current.quaternion);
        const targetDelta = toPose.target.clone().sub(fromPose.target);
        const side = new THREE.Vector3(targetDelta.z, 0, -targetDelta.x).normalize();
        if (side.lengthSq() < 0.1) side.set(1, 0, 0);
        const startRadial = camera.position.clone().sub(currentLookAt.current).normalize();
        const endRadial = toPose.camera.clone().sub(toPose.target).normalize();
        foldControlOne.current.copy(camera.position).addScaledVector(startRadial, 2.3).addScaledVector(side, 4.2);
        foldControlTwo.current.copy(toPose.camera).addScaledVector(endRadial, 2.3).addScaledVector(side, -4.2);
        foldTransitionActive.current = true;
      }
      const rawFlight = foldTransitionActive.current
        ? THREE.MathUtils.clamp((time - projectMotionStartedAt.current) / foldTransitionDuration.current, 0, 1)
        : 1;
      const flight = arrivalSettleActive.current
        ? rawFlight * rawFlight * (3 - 2 * rawFlight)
        : rawFlight < 0.5 ? 4 * rawFlight ** 3 : 1 - Math.pow(-2 * rawFlight + 2, 3) / 2;
      const destination = ACT_FOUR_FOLD_POSES[projectMotionTo.current] ?? ACT_FOUR_FOLD_POSES[0];
      if (foldTransitionActive.current) {
        desiredPosition.copy(cubicBezier(foldStartPosition.current, foldControlOne.current, foldControlTwo.current, foldEndPosition.current, flight));
        desiredLookAt.lerpVectors(foldStartTarget.current, foldEndTarget.current, flight);
        const elapsed = rawFlight;
        if (arrivalSettleActive.current) desiredFov = THREE.MathUtils.lerp(foldStartFov.current, foldEndFov.current, flight);
        else if (elapsed < 0.38) desiredFov = THREE.MathUtils.lerp(42, 51, THREE.MathUtils.smoothstep(elapsed, 0, 0.38));
        else if (elapsed < 0.64) desiredFov = 51;
        else desiredFov = THREE.MathUtils.lerp(51, 42, THREE.MathUtils.smoothstep(elapsed, 0.64, 1));
        const direction = Math.sign(projectMotionTo.current - projectMotionFrom.current) || 1;
        foldQuaternion.current.copy(foldStartQuaternion.current).slerp(foldEndQuaternion.current, flight);
        if (!arrivalSettleActive.current) {
          foldQuaternion.current.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), THREE.MathUtils.degToRad(9) * Math.sin(rawFlight * Math.PI) * direction));
        }
        projectMotion.current = THREE.MathUtils.lerp(projectMotionFrom.current, projectMotionTo.current, flight);
        if (rawFlight >= 1) {
          foldTransitionActive.current = false;
          arrivalSettleActive.current = false;
          foldTransitionDuration.current = 0.9;
          projectMotion.current = projectMotionTo.current;
        }
      } else {
        desiredPosition.copy(destination.camera);
        desiredLookAt.copy(destination.target);
        desiredFov = 42;
        foldLookObject.current.position.copy(destination.camera);
        foldLookObject.current.up.set(0, 1, 0);
        foldLookObject.current.lookAt(destination.target);
        foldQuaternion.current.copy(foldLookObject.current.quaternion);
        const pointerWeight = THREE.MathUtils.clamp((time - projectMotionStartedAt.current - foldTransitionDuration.current) / 0.45, 0, 1);
        foldPointer.current.lerp(state.pointer, 1 - Math.exp(-4.2 * delta));
        desiredPosition.x += foldPointer.current.x * 0.45 * pointerWeight;
        desiredPosition.y += foldPointer.current.y * 0.25 * pointerWeight;
        desiredLookAt.x += foldPointer.current.x * 0.11 * pointerWeight;
        desiredLookAt.y += foldPointer.current.y * 0.07 * pointerWeight;
        foldLookObject.current.position.copy(desiredPosition);
        foldLookObject.current.lookAt(desiredLookAt);
        foldQuaternion.current.copy(foldLookObject.current.quaternion);
      }
      authoredActFiveRoll = 0;
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
    } else if (isWarping) {
      // The warp is authored as one continuous shot; direct sampling avoids
      // exponential lag that would otherwise leave the camera short of FINDIT.
      currentPos.current.copy(desiredPosition);
      currentLookAt.current.copy(desiredLookAt);
      currentFov.current = desiredFov;
      cameraVelocity.current.set(0, 0, 0);
      targetVelocity.current.set(0, 0, 0);
    } else if (foldQuaternionActive) {
      // Fold motion is a timed spline: apply each sampled pose directly so the
      // 900ms flight lands on the exact next station without a spring tail.
      currentPos.current.copy(desiredPosition);
      currentLookAt.current.copy(desiredLookAt);
      currentFov.current = desiredFov;
      cameraVelocity.current.set(0, 0, 0);
      targetVelocity.current.set(0, 0, 0);
    } else {
      currentPos.current.lerp(desiredPosition, 1 - Math.exp(-cameraDamping * delta));
      currentLookAt.current.lerp(desiredLookAt, 1 - Math.exp(-cameraDamping * delta));
      currentFov.current = THREE.MathUtils.damp(currentFov.current, desiredFov, cameraDamping, delta);
      cameraVelocity.current.multiplyScalar(Math.exp(-9 * delta));
      targetVelocity.current.multiplyScalar(Math.exp(-9 * delta));
    }

    // Subtle handheld-cinema drift while scrolling; very small so the scene stays premium.
    const actFourBreathing = actFourPhase === "act4_exterior";
    const actFourCharging = actFourBreathing && charge > 0;
    const drift = Math.sin(time * 0.45 + p * Math.PI * 2) * (actFourBreathing ? (actFourCharging ? 0 : 0.006) : 0.01);
    const warpProgress = isWarping ? THREE.MathUtils.clamp((time - phaseStartedAt.current) / ACT_FOUR_WARP_IN_DURATION_SECONDS, 0, 1) : 0;
    const rimPassTremor = isWarping
      ? THREE.MathUtils.smoothstep(warpProgress, 0, 0.25) * (1 - THREE.MathUtils.smoothstep(warpProgress, 0.25, 0.34))
      : 0;
    const tunnelFlightTremor = isWarping
      ? 0.82 * THREE.MathUtils.smoothstep(warpProgress, 0.24, 0.31) * (1 - THREE.MathUtils.smoothstep(warpProgress, 0.82, 0.96))
      : 0;
    const warpSettle = isWarping ? Math.max(rimPassTremor, tunnelFlightTremor, 0.12 * (1 - THREE.MathUtils.smoothstep(warpProgress, 0.84, 0.98))) : 0;
    const chargeTremor = THREE.MathUtils.smoothstep(charge, 0.55, 1);
    const noiseEnvelope = actFiveCameraActive ? 1 : charge > 0 ? chargeTremor : isWarping ? warpSettle : 0;
    const smoothRigNoise = (frequency: number, phase: number) => {
      const sample = time * frequency + phase;
      const cell = Math.floor(sample);
      const local = sample - cell;
      const eased = local * local * (3 - 2 * local);
      const a = Math.sin(cell * 127.1 + phase * 311.7) * 43758.5453;
      const b = Math.sin((cell + 1) * 127.1 + phase * 311.7) * 43758.5453;
      return THREE.MathUtils.lerp(a - Math.floor(a) - 0.5, b - Math.floor(b) - 0.5, eased);
    };
    if (actFourCharging) {
      // Keep charging tremor symmetric and on the optical axis: no lateral
      // translation, camera bank, or angle change can peel the disk layers apart.
      const sightline = currentLookAt.current.clone().sub(currentPos.current).normalize();
      const axialTremor = smoothRigNoise(48, 0.31) * 0.0024 * chargeTremor;
      cameraNoise.current.copy(sightline).multiplyScalar(axialTremor);
    } else {
      cameraNoise.current.set(
        smoothRigNoise(noiseEnvelope > 0 ? 26 : 7.4, 0.31) * (isWarping ? 0.028 : 0.0042) * noiseEnvelope,
        smoothRigNoise(noiseEnvelope > 0 ? 22 : 6.1, 1.77) * (isWarping ? 0.022 : 0.0032) * noiseEnvelope,
        smoothRigNoise(noiseEnvelope > 0 ? 22 : 8.2, 2.43) * (isWarping ? 0.009 : 0.0012) * noiseEnvelope,
      );
    }

    camera.position.copy(currentPos.current).add(new THREE.Vector3(drift, drift * 0.35, 0)).add(cameraNoise.current);
    if (actFourPhase === "act4_exterior") {
      const pulseAge = (performance.now() - gatePulseAt.current) / 420;
      if (pulseAge >= 0 && pulseAge < 1) camera.position.z += Math.sin((1 - pulseAge) * Math.PI) * 0.16;
    }
    if (foldQuaternionActive) camera.quaternion.copy(foldQuaternion.current);
    else camera.lookAt(currentLookAt.current);
    const actFourCameraActive = actFourPhase === "act4_warp_in" || actFourPhase === "act4_vault" || actFourPhase === "act4_warp_out";
    const targetRoll = actFiveCameraActive || actFourCameraActive ? authoredActFiveRoll : actSixCameraActive ? authoredActSixRoll : 0;
    const targetPitch = actFiveCameraActive || actFourCameraActive ? authoredActFivePitch : actSixCameraActive ? authoredActSixPitch : 0;
    const targetYaw = actFiveCameraActive || actFourCameraActive ? authoredActFiveYaw : actSixCameraActive ? authoredActSixYaw : 0;
    const cinematicCameraActive = actFiveCameraActive || actSixCameraActive || actFourCameraActive;
    if (actFourCharging) {
      cameraRoll.current = 0;
      cameraPitch.current = 0;
      cameraYaw.current = 0;
    } else if (isWarping) {
      // The warp roll is part of the authored physical flight; apply its
      // continuously sampled value directly so it reaches the full bank and
      // completes the 42°→0° braking unwind on the same frames as the camera.
      cameraRoll.current = targetRoll;
      cameraPitch.current = targetPitch;
      cameraYaw.current = targetYaw;
    } else {
      cameraRoll.current = THREE.MathUtils.damp(cameraRoll.current, targetRoll, cinematicCameraActive ? 5.5 : 8, delta);
      cameraPitch.current = THREE.MathUtils.damp(cameraPitch.current, targetPitch, cinematicCameraActive ? 5.2 : 8, delta);
      cameraYaw.current = THREE.MathUtils.damp(cameraYaw.current, targetYaw, cinematicCameraActive ? 5.2 : 8, delta);
    }
    if (!foldQuaternionActive) {
      camera.rotateY(cameraYaw.current);
      camera.rotateX(cameraPitch.current);
      camera.rotateZ(cameraRoll.current);
    }
    if (actFourBreathing && !actFourCharging) {
      camera.position.x += Math.sin(time * 0.19) * 0.008;
      camera.position.y += Math.cos(time * 0.16) * 0.006;
    }
    if (isWarping || actFourPhase === "act4_warp_out") {
      const shake = isWarping
        ? THREE.MathUtils.smoothstep(Math.sin(time * 0.7) * 0.5 + 0.5, 0.15, 0.85) * warpSettle
        : THREE.MathUtils.smoothstep(Math.sin(time * 0.7) * 0.5 + 0.5, 0.15, 0.85);
      camera.rotateX(smoothRigNoise(31, 5.3) * 0.009 * shake);
      camera.rotateY(smoothRigNoise(27, 9.1) * 0.011 * shake);
      camera.rotateZ(smoothRigNoise(34, 14.4) * 0.015 * shake);
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
