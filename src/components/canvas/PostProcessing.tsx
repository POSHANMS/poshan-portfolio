"use client";

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import * as THREE from "three";

export default function PostProcessing() {
  const { gl, scene, camera, size } = useThree();

  const composer = useMemo(() => {
    const instance = new EffectComposer(gl);
    const renderPass = new RenderPass(scene, camera);

    // Clean bloom — no chromatic aberration, sharp and focused
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      0.25,  // Low strength — only neon edges glow
      0.3,   // Tight radius — no bleed
      0.45   // High threshold — only bright things bloom
    );

    const outputPass = new OutputPass();

    instance.addPass(renderPass);
    instance.addPass(bloomPass);
    instance.addPass(outputPass);

    return instance;
  }, [gl, scene, camera, size.width, size.height]);

  useEffect(() => {
    composer.setSize(size.width, size.height);
    composer.renderToScreen = true;
    return () => composer.dispose();
  }, [composer, size.width, size.height]);

  useFrame((_, delta) => {
    composer.render(delta);
  }, 1);

  return null;
}
