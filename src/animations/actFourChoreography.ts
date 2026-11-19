import * as THREE from "three";
import { PROJECTS } from "@/utils/constants";

export const ACT_FOUR_CORE_POSITION = new THREE.Vector3(4.5, 2.5, -8);
export const ACT_FOUR_SINGULARITY_POSITION = new THREE.Vector3(2.4, 1.2, -95);
export const ACT_FOUR_CARD_SIZE = new THREE.Vector2(5.5, 3.35);

/** Five real project sculptures occupy the same navigable Z corridor. */
export const ACT_FOUR_PROJECT_STATIONS = [
  new THREE.Vector3(2.6, -0.3, 0),
  new THREE.Vector3(3.2, -0.1, -16),
  new THREE.Vector3(2.2, -0.4, -32),
  new THREE.Vector3(3.0, -0.2, -48),
  new THREE.Vector3(2.5, -0.3, -64),
].slice(0, PROJECTS.length);

// Stations are approached from their positive-Z side, so each step travels
// forward down the corridor and the final singularity remains ahead at -95.
const CAMERA_OFFSET = new THREE.Vector3(-1.65, 0.1, 8.4);
export const ACT_FOUR_CAMERA_PATH = new THREE.CatmullRomCurve3(
  ACT_FOUR_PROJECT_STATIONS.map((station) => station.clone().add(CAMERA_OFFSET)),
  false,
  "centripetal",
);
export const ACT_FOUR_TARGET_PATH = new THREE.CatmullRomCurve3(
  ACT_FOUR_PROJECT_STATIONS.map((station) => station.clone().add(new THREE.Vector3(0, 0.1, 0))),
  false,
  "centripetal",
);

/** Exit stays on a one-way negative-Z corridor, ending at the distant core. */
export const ACT_FOUR_EXIT_CAMERA_PATH = new THREE.CatmullRomCurve3([
  ACT_FOUR_CAMERA_PATH.getPointAt(1),
  new THREE.Vector3(2.7, 1.1, -76),
  ACT_FOUR_SINGULARITY_POSITION.clone().add(new THREE.Vector3(0, 0, 10)),
  ACT_FOUR_SINGULARITY_POSITION.clone(),
], false, "centripetal");
export const ACT_FOUR_EXIT_TARGET_PATH = new THREE.CatmullRomCurve3([
  ACT_FOUR_TARGET_PATH.getPointAt(1),
  new THREE.Vector3(2.4, 1.2, -84),
  ACT_FOUR_SINGULARITY_POSITION.clone(),
], false, "centripetal");

export function getActFourProjectPose(index: number) {
  const progress = THREE.MathUtils.clamp(index / Math.max(1, ACT_FOUR_PROJECT_STATIONS.length - 1), 0, 1);
  return {
    camera: ACT_FOUR_CAMERA_PATH.getPointAt(progress),
    target: ACT_FOUR_TARGET_PATH.getPointAt(progress),
  };
}

/** Build a forward-only exit beginning at the station the visitor is viewing. */
export function createActFourExitPaths(index: number) {
  const start = getActFourProjectPose(index);
  const remainingDistance = Math.max(1, start.camera.z - ACT_FOUR_SINGULARITY_POSITION.z);
  const firstControlZ = start.camera.z - remainingDistance * 0.34;
  const secondControlZ = start.camera.z - remainingDistance * 0.72;
  return {
    position: new THREE.CatmullRomCurve3([
      start.camera.clone(),
      start.camera.clone().lerp(ACT_FOUR_SINGULARITY_POSITION, 0.34).setZ(firstControlZ),
      start.camera.clone().lerp(ACT_FOUR_SINGULARITY_POSITION, 0.72).setZ(secondControlZ),
      ACT_FOUR_SINGULARITY_POSITION.clone(),
    ], false, "centripetal"),
    target: new THREE.CatmullRomCurve3([
      start.target.clone(),
      new THREE.Vector3(2.4, 1.2, firstControlZ - 8),
      ACT_FOUR_SINGULARITY_POSITION.clone(),
    ], false, "centripetal"),
  };
}
