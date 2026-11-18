import * as THREE from "three";

const CAMERA_POSITIONS = [
  new THREE.Vector3(0, 0.55, 10.2),
  new THREE.Vector3(-0.6, 1.2, 1.4),
  new THREE.Vector3(3.1, 3.8, -2.1),
  new THREE.Vector3(5.4, 1.1, -12.6),
  new THREE.Vector3(4.2, 0.4, -22.4),
];

const CAMERA_TARGETS = [
  new THREE.Vector3(0, 0.15, -7.4),
  new THREE.Vector3(0.1, 0.2, -7.35),
  new THREE.Vector3(0.7, -0.1, -7.35),
  new THREE.Vector3(-0.2, -0.15, -7.35),
  // Aim left of the galaxy so it lands on frame-right and leaves a quiet
  // stage for the contact interface on frame-left.
  new THREE.Vector3(-3.4, 0.08, -7.35),
];

const POSITION_CURVE = new THREE.CatmullRomCurve3(CAMERA_POSITIONS, false, "centripetal", 0.45);
const TARGET_CURVE = new THREE.CatmullRomCurve3(CAMERA_TARGETS, false, "centripetal", 0.45);
const LENS_KEYS = [
  { at: 0, fov: 51 },
  { at: 0.12, fov: 88 },
  { at: 0.32, fov: 64 },
  { at: 0.58, fov: 48 },
  { at: 0.82, fov: 42 },
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
  // A scroll-authored full barrel roll peaks as the lens rushes through the
  // reactor plane, then banks upright into the settled contact composition.
  const rollEnvelope = smoothstep01(t / 0.16) * (1 - smoothstep01((t - 0.52) / 0.3));
  const bank = Math.PI * 2 * smoothstep01(t / 0.68) + Math.sin(t * Math.PI * 2.1) * 0.12 * (1 - settled);
  const breakoutBank = Math.sin(Math.PI * smoothstep01((t - 0.3) / 0.7));
  const pitch = breakoutBank * 0.15 + Math.sin(t * Math.PI * 2) * 0.035 * rollEnvelope;
  const yaw = Math.sin(t * Math.PI * 2.3) * 0.13 * rollEnvelope;
  const idleDrift = Math.sin(elapsedTime * 0.095) * 0.035 * settled;
  const position = POSITION_CURVE.getPointAt(t);
  position.x += idleDrift;
  // Short forward rush through the galaxy's near plane, restrained to keep the
  // move legible and avoid clipping the particle core.
  position.z += -3.4 * Math.sin(Math.PI * Math.min(1, t / 0.46)) * (1 - smoothstep01((t - 0.34) / 0.16));

  return {
    position,
    target: TARGET_CURVE.getPointAt(t),
    fov: lensAt(t),
    roll: bank,
    pitch,
    yaw,
  };
}
