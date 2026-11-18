import * as THREE from "three";

const CAMERA_POSITIONS = [
  new THREE.Vector3(0, 0.55, 10.2),
  new THREE.Vector3(10.4, 2.0, 5.5),
  new THREE.Vector3(16.4, 1.0, -7.35),
  new THREE.Vector3(10.0, 0.2, -22.0),
  new THREE.Vector3(-10.0, 0.6, -22.0),
  new THREE.Vector3(-14.0, 0.4, -7.35),
  // Land in front-left after a broad, smooth orbit around the fixed galaxy.
  new THREE.Vector3(-4.2, 0.4, 9.6),
];

const CAMERA_TARGETS = [
  new THREE.Vector3(0, 0.15, -7.4),
  new THREE.Vector3(1.25, 0.1, -7.35),
  new THREE.Vector3(1.25, 0.1, -7.35),
  new THREE.Vector3(1.25, 0.1, -7.35),
  new THREE.Vector3(1.25, 0.1, -7.35),
  new THREE.Vector3(1.25, 0.1, -7.35),
  // Aim left of the galaxy on the final approach so it lands frame-right.
  new THREE.Vector3(-3.4, 0.08, -7.35),
];

const POSITION_CURVE = new THREE.CatmullRomCurve3(CAMERA_POSITIONS, false, "centripetal", 0.45);
const TARGET_CURVE = new THREE.CatmullRomCurve3(CAMERA_TARGETS, false, "centripetal", 0.45);
const LENS_KEYS = [
  { at: 0, fov: 51 },
  { at: 0.14, fov: 66 },
  { at: 0.34, fov: 58 },
  { at: 0.58, fov: 48 },
  { at: 0.82, fov: 43 },
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
  // The camera makes one broad orbital pass; only a restrained bank and pitch
  // sell weight through the turn. It never barrel-rolls or cuts through the core.
  const turnEnvelope = Math.sin(Math.PI * smoothstep01(t / 0.88));
  const bank = 0.16 * turnEnvelope + Math.sin(t * Math.PI * 2) * 0.025 * (1 - settled);
  const pitch = 0.09 * Math.sin(Math.PI * smoothstep01((t - 0.08) / 0.82));
  const yaw = 0.08 * Math.sin(Math.PI * smoothstep01((t - 0.12) / 0.78));
  const idleDrift = Math.sin(elapsedTime * 0.095) * 0.035 * settled;
  const position = POSITION_CURVE.getPointAt(t);
  position.x += idleDrift;
  // A shallow dolly creates parallax without carrying the lens through the disk.
  const inwardDolly = Math.sin(Math.PI * t) * 1.15 * (1 - settled);
  position.addScaledVector(position.clone().sub(new THREE.Vector3(1.25, 0.1, -7.35)).normalize(), -inwardDolly);

  return {
    position,
    target: TARGET_CURVE.getPointAt(t),
    fov: lensAt(t),
    roll: bank,
    pitch,
    yaw,
  };
}
