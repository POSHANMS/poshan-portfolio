import * as THREE from "three";

const CAMERA_POSITIONS = [
  new THREE.Vector3(0, 0.55, 10.2),
  new THREE.Vector3(4.2, 3.35, 4.4),
  new THREE.Vector3(10.7, 1.25, -2.8),
  new THREE.Vector3(10.7, -0.4, -13.8),
  new THREE.Vector3(2.4, 0.55, -23.4),
];

const CAMERA_TARGETS = [
  new THREE.Vector3(0, 0.15, -7.4),
  new THREE.Vector3(0.45, 0.2, -7.35),
  new THREE.Vector3(0.25, -0.1, -7.35),
  new THREE.Vector3(-0.3, -0.15, -7.35),
  new THREE.Vector3(0.05, 0.08, -7.35),
];

const POSITION_CURVE = new THREE.CatmullRomCurve3(CAMERA_POSITIONS, false, "centripetal", 0.45);
const TARGET_CURVE = new THREE.CatmullRomCurve3(CAMERA_TARGETS, false, "centripetal", 0.45);
const LENS_KEYS = [
  { at: 0, fov: 51.5 },
  { at: 0.16, fov: 60 },
  { at: 0.4, fov: 40 },
  { at: 0.68, fov: 50 },
  { at: 1, fov: 44 },
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
  const bank = Math.sin(t * Math.PI * 2.1) * 0.105 * (1 - settled * 0.72);
  const idleDrift = Math.sin(elapsedTime * 0.095) * 0.035 * settled;
  const position = POSITION_CURVE.getPointAt(t);
  position.x += idleDrift;

  return {
    position,
    target: TARGET_CURVE.getPointAt(t),
    fov: lensAt(t),
    roll: bank,
  };
}
