import * as THREE from "three";

/** Shared Act V composition and timing used by the camera, scene, and cards. */
export const ACT_FIVE_TIMING = {
  revealInStart: 0.902,
  revealInEnd: 0.922,
  cameraIntroStart: 0.89,
  cameraStart: 0.915,
  cameraExitStart: 0.958,
  sceneExit: 0.975,
  galaxyFullReveal: 0.985,
  localCheckpointStops: [0, 0.17, 0.34, 0.51, 0.68] as const,
  localTransferStarts: [0, 0.12, 0.29, 0.46, 0.63] as const,
} as const;

export const ACT_FIVE_ORIGIN = new THREE.Vector3(0, 0, -5.15);
export const ACT_FIVE_REACTOR_CENTER = new THREE.Vector3(0, -0.55, 0);
export const ACT_FIVE_ORBIT_RADIUS = 10.5;
export const ACT_FIVE_ORBIT_ANGLES = [-78, -26, 26, 78] as const;
export const ACT_FIVE_CARD_HEIGHTS = [0.6, -0.5, 0.5, -0.4] as const;

export type ActFiveStop = {
  camera: THREE.Vector3;
  target: THREE.Vector3;
};

export const ACT_FIVE_CARD_POSITIONS = ACT_FIVE_ORBIT_ANGLES.map((degrees, index) => {
  const angle = THREE.MathUtils.degToRad(degrees);
  return new THREE.Vector3(
    Math.sin(angle) * ACT_FIVE_ORBIT_RADIUS,
    ACT_FIVE_CARD_HEIGHTS[index],
    Math.cos(angle) * ACT_FIVE_ORBIT_RADIUS,
  );
});

export const ACT_FIVE_CHECKPOINT_STOPS: ActFiveStop[] = ACT_FIVE_ORBIT_ANGLES.map((degrees, index) => {
  const angle = THREE.MathUtils.degToRad(degrees);
  const radial = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
  const tangent = new THREE.Vector3(Math.cos(angle), 0, -Math.sin(angle));
  const card = ACT_FIVE_ORIGIN.clone().add(ACT_FIVE_CARD_POSITIONS[index]);
  const camera = card.clone()
    .addScaledVector(radial, 2.85)
    .addScaledVector(tangent, -4.35)
    .add(new THREE.Vector3(0, 0.34, 0));
  const reactor = ACT_FIVE_ORIGIN.clone().add(ACT_FIVE_REACTOR_CENTER);
  const target = reactor.add(card).multiplyScalar(0.5);
  target.addScaledVector(radial, [-1.35, -1.9, -1.35, -1.52][index]);
  target.addScaledVector(tangent, 2.41);
  target.y += [0, -1.2, 0, 0][index];

  const viewForward = target.clone().sub(camera).normalize();
  const screenRight = viewForward.clone().cross(new THREE.Vector3(0, 1, 0)).normalize();
  target.addScaledVector(screenRight, [0, 0, 0, 1.1][index]);
  return { camera, target };
});

export const ACT_FIVE_EXIT_CAMERA = ACT_FIVE_ORIGIN.clone().add(new THREE.Vector3(0, 0.55, 15.35));
export const ACT_FIVE_EXIT_TARGET = ACT_FIVE_ORIGIN.clone().add(new THREE.Vector3(0, 0.15, -2.25));
export const ACT_FIVE_ENTRY_CAMERA = ACT_FIVE_CHECKPOINT_STOPS[0].camera.clone().add(new THREE.Vector3(-2.2, 1.2, 1.4));
export const ACT_FIVE_ENTRY_TARGET = ACT_FIVE_CHECKPOINT_STOPS[0].target.clone();
export const ACT_FIVE_LOCAL_KEY_T = [0, 0.12, 0.17, 0.29, 0.34, 0.46, 0.51, 0.63, 0.68, 1] as const;

export function createActFiveCameraCurves() {
  const positions = [
    ACT_FIVE_CHECKPOINT_STOPS[0].camera.clone(), ACT_FIVE_CHECKPOINT_STOPS[0].camera.clone(),
    ACT_FIVE_CHECKPOINT_STOPS[1].camera.clone(), ACT_FIVE_CHECKPOINT_STOPS[1].camera.clone(),
    ACT_FIVE_CHECKPOINT_STOPS[2].camera.clone(), ACT_FIVE_CHECKPOINT_STOPS[2].camera.clone(),
    ACT_FIVE_CHECKPOINT_STOPS[3].camera.clone(), ACT_FIVE_CHECKPOINT_STOPS[3].camera.clone(),
    ACT_FIVE_CHECKPOINT_STOPS[3].camera.clone(), ACT_FIVE_EXIT_CAMERA.clone(),
  ];
  const targets = [
    ACT_FIVE_CHECKPOINT_STOPS[0].target.clone(), ACT_FIVE_CHECKPOINT_STOPS[0].target.clone(),
    ACT_FIVE_CHECKPOINT_STOPS[1].target.clone(), ACT_FIVE_CHECKPOINT_STOPS[1].target.clone(),
    ACT_FIVE_CHECKPOINT_STOPS[2].target.clone(), ACT_FIVE_CHECKPOINT_STOPS[2].target.clone(),
    ACT_FIVE_CHECKPOINT_STOPS[3].target.clone(), ACT_FIVE_CHECKPOINT_STOPS[3].target.clone(),
    ACT_FIVE_CHECKPOINT_STOPS[3].target.clone(), ACT_FIVE_EXIT_TARGET.clone(),
  ];
  return {
    position: new THREE.CatmullRomCurve3(positions, false, "centripetal", 0.5),
    target: new THREE.CatmullRomCurve3(targets, false, "centripetal", 0.5),
  };
}
