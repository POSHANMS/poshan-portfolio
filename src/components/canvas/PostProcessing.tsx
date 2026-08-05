"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import * as THREE from "three";

export interface PostProcessingProps {
  hologramActive?: boolean;
}

const DEFAULT_STRENGTH = 0.32;
const DEFAULT_RADIUS = 0.35;
const DEFAULT_THRESHOLD = 0.40;

const HOLOGRAM_STRENGTH = 0.55;
const HOLOGRAM_RADIUS = 0.45;
const HOLOGRAM_THRESHOLD = 0.35;

const LERP_FACTOR = 0.05;

export default function PostProcessing({ hologramActive }: PostProcessingProps) {
  const { gl, scene, camera, size } = useThree();
  const bloomPassRef = useRef<UnrealBloomPass | null>(null);

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

    const outputPass = new OutputPass();

    instance.addPass(renderPass);
    instance.addPass(bloomPass);
    instance.addPass(outputPass);

    return instance;
  }, [gl, scene, camera]);

  useEffect(() => {
    composer.setSize(size.width, size.height);
    return () => {
      composer.dispose();
    };
  }, [composer, size.width, size.height]);

  useFrame(() => {
    if (bloomPassRef.current) {
      const targetStrength = hologramActive ? HOLOGRAM_STRENGTH : DEFAULT_STRENGTH;
      const targetRadius = hologramActive ? HOLOGRAM_RADIUS : DEFAULT_RADIUS;
      const targetThreshold = hologramActive ? HOLOGRAM_THRESHOLD : DEFAULT_THRESHOLD;

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