"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import * as THREE from "three";
import { ACT_FIVE_CARD_POSITIONS, ACT_FIVE_ORIGIN, ACT_FIVE_TIMING } from "@/animations/actFiveChoreography";
import { ACT_FOUR_PROJECT_STATIONS } from "@/animations/actFourChoreography";

export interface PostProcessingProps {
  hologramActive?: boolean;
  cosmicActive?: boolean;
  reactorActive?: boolean;
  actFourActive?: boolean;
  actFourWarping?: boolean;
  actFourProjectIndex?: number;
  scrollProgress?: number;
  depthOfFieldEnabled?: boolean;
}

const DEFAULT_STRENGTH = 0.32;
const DEFAULT_RADIUS = 0.35;
const DEFAULT_THRESHOLD = 0.40;

const HOLOGRAM_STRENGTH = 0.55;
const HOLOGRAM_RADIUS = 0.45;
const HOLOGRAM_THRESHOLD = 0.35;

const COSMIC_STRENGTH = 0.52;
const COSMIC_RADIUS = 0.38;
const COSMIC_THRESHOLD = 0.96;
const REACTOR_STRENGTH = 0.62;
const REACTOR_RADIUS = 0.4;
const REACTOR_THRESHOLD = 0.28;
const ACT_FIVE_BOKEH_APERTURE = 0.000012;

const LERP_FACTOR = 0.05;

const LENS_SHADER = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uChromatic: { value: 0 },
    uVignette: { value: 0 },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uChromatic;
    uniform float uVignette;
    varying vec2 vUv;
    void main(){
      vec2 radial=vUv-0.5;
      float edge=clamp(dot(radial,radial)*4.0,0.0,1.0);
      vec2 split=normalize(radial+vec2(0.00001))*uChromatic*edge;
      vec4 base=texture2D(tDiffuse,vUv);
      float red=texture2D(tDiffuse,vUv+split).r;
      float blue=texture2D(tDiffuse,vUv-split).b;
      float vignette=1.0-uVignette*smoothstep(0.16,0.72,dot(radial,radial));
      gl_FragColor=vec4(vec3(red,base.g,blue)*vignette,base.a);
    }
  `,
};

function actFiveFocusPoint(progress: number) {
  const local = THREE.MathUtils.clamp((progress - ACT_FIVE_TIMING.cameraStart) / (ACT_FIVE_TIMING.sceneExit - ACT_FIVE_TIMING.cameraStart), 0, 1);
  const stops = [0, 0.17, 0.34, 0.51, 0.68];
  let index = 0;
  let blend = 0;
  for (let card = 0; card < 3; card += 1) {
    const start = [0.12, 0.29, 0.46][card];
    const end = [0.17, 0.34, 0.51][card];
    if (local >= start && local < end) {
      index = card;
      blend = THREE.MathUtils.smoothstep((local - start) / (end - start), 0, 1);
      break;
    }
    if (local >= end) index = card + 1;
  }
  if (local >= 0.68) index = 3;
  const next = Math.min(index + 1, 3);
  const point = ACT_FIVE_ORIGIN.clone().add(ACT_FIVE_CARD_POSITIONS[index]);
  if (blend > 0 && next !== index) point.lerp(ACT_FIVE_ORIGIN.clone().add(ACT_FIVE_CARD_POSITIONS[next]), blend);
  // The short end arc moves away from the fourth card; keep the focus plane in front of it.
  if (local > stops[4]) point.lerp(ACT_FIVE_ORIGIN.clone().add(new THREE.Vector3(0, 0.15, -2.25)), THREE.MathUtils.smoothstep(local, 0.68, 1));
  return point;
}

export default function PostProcessing({ hologramActive, cosmicActive, reactorActive, actFourActive = false, actFourWarping = false, actFourProjectIndex = 0, scrollProgress = 0, depthOfFieldEnabled = true }: PostProcessingProps) {
  const { gl, scene, camera, size } = useThree();
  const bloomPassRef = useRef<UnrealBloomPass | null>(null);
  const bokehPassRef = useRef<BokehPass | null>(null);
  const lensPassRef = useRef<ShaderPass | null>(null);
  const previousProgress = useRef(scrollProgress);
  const transitionEnergy = useRef(0);
  const actFourWarpEnergy = useRef(0);

  const bloomStrength = useRef(DEFAULT_STRENGTH);
  const bloomRadius = useRef(DEFAULT_RADIUS);
  const bloomThreshold = useRef(DEFAULT_THRESHOLD);

  const composer = useMemo(() => {
    const instance = new EffectComposer(gl);
    const renderPass = new RenderPass(scene, camera);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      DEFAULT_STRENGTH,
      DEFAULT_RADIUS,
      DEFAULT_THRESHOLD
    );
    bloomPassRef.current = bloomPass;

    const bokehPass = new BokehPass(scene, camera, {
      focus: 14,
      aperture: 0,
      maxblur: 0.004,
    });
    bokehPass.enabled = false;
    bokehPassRef.current = bokehPass;

    const lensPass = new ShaderPass(LENS_SHADER);
    lensPass.enabled = false;
    lensPassRef.current = lensPass;

    const outputPass = new OutputPass();

    instance.addPass(renderPass);
    instance.addPass(bokehPass);
    instance.addPass(bloomPass);
    instance.addPass(lensPass);
    instance.addPass(outputPass);

    return instance;
  }, [gl, scene, camera, size.width, size.height]);

  useEffect(() => {
    composer.setSize(size.width, size.height);
    return () => {
      composer.dispose();
    };
  }, [composer, size.width, size.height]);

  useFrame((state, delta) => {
    const safeDelta = Math.min(delta, 1 / 20);
    const progressVelocity = Math.abs(scrollProgress - previousProgress.current) / Math.max(safeDelta, 1 / 240);
    previousProgress.current = scrollProgress;
    const actFive = reactorActive ? 1 : 0;
    const actSix = cosmicActive ? 1 : 0;
    const opticalWindow = actFive || actSix ? 1 : 0;
    const transfer = THREE.MathUtils.smoothstep(progressVelocity, 0.025, 0.32) * opticalWindow;
    transitionEnergy.current = THREE.MathUtils.damp(transitionEnergy.current, transfer, 5.5, safeDelta);
    actFourWarpEnergy.current = THREE.MathUtils.damp(actFourWarpEnergy.current, actFourWarping ? 1 : 0, actFourWarping ? 7.5 : 4.5, safeDelta);

    if (bokehPassRef.current) {
      const focalPoint = actFiveFocusPoint(scrollProgress);
      const actFourTarget = ACT_FOUR_PROJECT_STATIONS[THREE.MathUtils.clamp(Math.round(actFourProjectIndex), 0, ACT_FOUR_PROJECT_STATIONS.length - 1)].clone();
      if (actFourActive) focalPoint.copy(actFourTarget);
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      const focalDepth = Math.max(0.25, focalPoint.sub(camera.position).dot(forward));
      const bokehUniforms = bokehPassRef.current.materialBokeh.uniforms;
      bokehUniforms.focus.value = focalDepth;
      const focusWeight = actFourActive ? 0.72 : actFive;
      bokehUniforms.aperture.value = depthOfFieldEnabled ? ACT_FIVE_BOKEH_APERTURE * focusWeight : 0;
      bokehUniforms.maxblur.value = depthOfFieldEnabled ? (actFourActive ? 0.0032 : 0.004) : 0;
      bokehPassRef.current.enabled = depthOfFieldEnabled && (reactorActive === true || actFourActive);
    }
    if (lensPassRef.current) {
      lensPassRef.current.uniforms.uChromatic.value = actFive
        ? 0.00018 + transitionEnergy.current * 0.00115
        : actSix ? transitionEnergy.current * 0.00135 : actFourWarpEnergy.current * 0.0024 + (actFourActive ? 0.00012 : 0);
      lensPassRef.current.uniforms.uVignette.value = actFive * 0.18 + actSix * transitionEnergy.current * 0.08 + (actFourActive ? 0.11 : 0) + actFourWarpEnergy.current * 0.08;
      lensPassRef.current.enabled = reactorActive === true || cosmicActive === true || actFourActive || actFourWarping;
    }

    if (bloomPassRef.current) {
      const targetStrength = cosmicActive ? COSMIC_STRENGTH : reactorActive || actFourActive ? REACTOR_STRENGTH : hologramActive ? HOLOGRAM_STRENGTH : DEFAULT_STRENGTH;
      const targetRadius = cosmicActive ? COSMIC_RADIUS : reactorActive || actFourActive ? REACTOR_RADIUS : hologramActive ? HOLOGRAM_RADIUS : DEFAULT_RADIUS;
      const targetThreshold = cosmicActive ? COSMIC_THRESHOLD : reactorActive || actFourActive ? REACTOR_THRESHOLD : hologramActive ? HOLOGRAM_THRESHOLD : DEFAULT_THRESHOLD;

      bloomStrength.current = THREE.MathUtils.lerp(
        bloomStrength.current,
        targetStrength,
        LERP_FACTOR
      );
      bloomRadius.current = THREE.MathUtils.lerp(
        bloomRadius.current,
        targetRadius,
        LERP_FACTOR
      );
      bloomThreshold.current = THREE.MathUtils.lerp(
        bloomThreshold.current,
        targetThreshold,
        LERP_FACTOR
      );

      bloomPassRef.current.strength = bloomStrength.current;
      bloomPassRef.current.radius = bloomRadius.current;
      bloomPassRef.current.threshold = bloomThreshold.current;
    }

    composer.render();
  }, 1);

  return null;
}
