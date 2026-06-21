"use client";

import React from "react";
import { EffectComposer, Bloom, DepthOfField, ChromaticAberration, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

export default function PostProcessing() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.8}
        luminanceThreshold={0.9}
        luminanceSmoothing={0.02}
        mipmapBlur={true}
      />

      <ChromaticAberration
        offset={new THREE.Vector2(0.0012, 0.0012)}
        radialModulation={false}
        modulationOffset={0.0}
      />

      <DepthOfField
        focusDistance={0.012}
        focalLength={0.18}
        bokehScale={3.0}
        height={480}
      />

      <Vignette
        offset={0.1}
        darkness={0.55}
        eskil={false}
      />
    </EffectComposer>
  );
}
