import * as THREE from "three";
import { ACT_FIVE_ENTRY_CAMERA, ACT_FIVE_ENTRY_TARGET } from "./actFiveChoreography";
import { PROJECTS } from "@/utils/constants";

export const ACT_FOUR_CORE_POSITION = new THREE.Vector3(4.5, 2.5, -8);
export const ACT_FOUR_CARD_SIZE = new THREE.Vector2(5.5, 3.35);

export const ACT_FOUR_PROJECT_STATIONS = PROJECTS.map((_, index) => new THREE.Vector3(
  ACT_FOUR_CORE_POSITION.x + Math.sin(index * 0.58) * 0.82,
  ACT_FOUR_CORE_POSITION.y + Math.sin(index * 0.72) * 0.26,
  ACT_FOUR_CORE_POSITION.z - 5.15 - index * 6.25,
));

export const ACT_FOUR_CAMERA_PATH = new THREE.CatmullRomCurve3(
  ACT_FOUR_PROJECT_STATIONS.map((station) => new THREE.Vector3(station.x - 1.55, station.y, station.z + 5.45)),
  false,
  "centripetal",
);

export const ACT_FOUR_TARGET_PATH = new THREE.CatmullRomCurve3(
  ACT_FOUR_PROJECT_STATIONS.map((station) => new THREE.Vector3(station.x - 1.55, station.y, station.z)),
  false,
  "centripetal",
);

export const ACT_FOUR_EXIT_CAMERA_PATH = new THREE.CatmullRomCurve3([
  ACT_FOUR_CAMERA_PATH.getPointAt(1),
  ACT_FOUR_CAMERA_PATH.getPointAt(1).clone().add(new THREE.Vector3(0.15, 0.12, -9)),
  new THREE.Vector3(4.2, 2.8, -48),
  new THREE.Vector3(2.8, 2.2, -43),
  ACT_FIVE_ENTRY_CAMERA.clone(),
], false, "centripetal");

export const ACT_FOUR_EXIT_TARGET_PATH = new THREE.CatmullRomCurve3([
  ACT_FOUR_TARGET_PATH.getPointAt(1),
  ACT_FOUR_TARGET_PATH.getPointAt(1).clone().add(new THREE.Vector3(0, 0, -8)),
  new THREE.Vector3(4.2, 2.8, -52),
  new THREE.Vector3(2.8, 2.2, -42),
  ACT_FIVE_ENTRY_TARGET.clone(),
], false, "centripetal");

export function getActFourProjectPose(index: number) {
  const progress = THREE.MathUtils.clamp(index / Math.max(1, ACT_FOUR_PROJECT_STATIONS.length - 1), 0, 1);
  return {
    camera: ACT_FOUR_CAMERA_PATH.getPointAt(progress),
    target: ACT_FOUR_TARGET_PATH.getPointAt(progress),
  };
}
