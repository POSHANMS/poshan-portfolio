import * as THREE from "three";

const CAMERA_POSITIONS = [
  // The first pose exactly matches Act V's exit, preserving the shared shot.
  new THREE.Vector3(0, 0.55, 10.2),
  // Rise above the disk before dropping into a low orbital sweep.
  new THREE.Vector3(2.5, 12.0, 5.8),
  new THREE.Vector3(13.0, 4.0, -1.0),
  new THREE.Vector3(15.0, 0.0, -12.0),
  new THREE.Vector3(2.0, 0.25, -24.0),
  new THREE.Vector3(-12.0, 1.0, -19.0),
  new THREE.Vector3(-11.0, 0.0, -3.0),
  // Land in front-left while the galaxy core holds in the open middle stage.
  new THREE.Vector3(-4.2, 0.4, 9.6),
];

const CAMERA_TARGETS = [
  new THREE.Vector3(0, 0.15, -7.4),
  new THREE.Vector3(1.25, 0.1, -7.35),
  new THREE.Vector3(1.25, 0.1, -7.35),
  new THREE.Vector3(1.25, 0.1, -7.35),
  new THREE.Vector3(1.25, 0.1, -7.35),
  new THREE.Vector3(1.25, 0.1, -7.35),
  new THREE.Vector3(1.25, 0.1, -7.35),
  // A small target offset puts the core into the unobstructed central column.
  new THREE.Vector3(-0.2, 0.08, -7.35),
];

const POSITION_CURVE = new THREE.CatmullRomCurve3(CAMERA_POSITIONS, false, "centripetal", 0.45);
const TARGET_CURVE = new THREE.CatmullRomCurve3(CAMERA_TARGETS, false, "centripetal", 0.45);
const LENS_KEYS = [
  { at: 0, fov: 45 },
  { at: 0.12, fov: 67 },
  { at: 0.2, fov: 80 },
  { at: 0.37, fov: 61 },
  { at: 0.58, fov: 49 },
  { at: 0.8, fov: 43 },
  { at: 0.94, fov: 41 },
  { at: 1, fov: 40 },
] as const;

function smoothstep01(value: number) {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function lensAt(progress: number) {
  for (let index = 0; index < LENS_KEYS.length - 1; index += 1) {
    const start = LENS_KEYS[index];
    const end = LENS_KEYS[index + 1];
    if (progress <= end.at) {
      const local = (progress - start.at) / (end.at - start.at);
      return THREE.MathUtils.lerp(start.fov, end.fov, smoothstep01(local));
    }
  }
  return LENS_KEYS[LENS_KEYS.length - 1].fov;
}

/** Scroll-triggered camera transfer from Act V's exit pose around the galaxy to Contact. */
export function getActSixCameraPose(progress: number, elapsedTime: number) {
  const t = THREE.MathUtils.clamp(progress, 0, 1);
  const settled = smoothstep01((t - 0.82) / 0.18);
  // One controlled 12-degree Dutch bank gives the orbit cinematic weight,
  // then eases level as the viewer reaches the contact composition.
  const turnEnvelope = Math.sin(Math.PI * smoothstep01(t / 0.96));
  const bank = 0.21 * turnEnvelope + Math.sin(t * Math.PI * 2) * 0.018 * (1 - settled);
  const pitch = 0.12 * Math.sin(Math.PI * smoothstep01((t - 0.04) / 0.9));
  const yaw = 0.075 * Math.sin(Math.PI * smoothstep01((t - 0.1) / 0.82));
  const idleDrift = Math.sin(elapsedTime * 0.095) * 0.035 * settled;
  const position = POSITION_CURVE.getPointAt(t);
  position.x += idleDrift;

  return {
    position,
    target: TARGET_CURVE.getPointAt(t),
    fov: lensAt(t),
    roll: bank,
    pitch,
    yaw,
  };
}
