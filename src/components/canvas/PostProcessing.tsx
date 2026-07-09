"use client";

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import * as THREE from "three";

// Chromatic Aberration Shader
const chromaticAberrationShader = {
  uniforms: {
    tDiffuse: { value: null },
    uOffset: { value: new THREE.Vector2(0.0015, 0.0015) },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 uOffset;
    varying vec2 vUv;
    
    void main() {
      float r = texture2D(tDiffuse, vUv + uOffset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - uOffset).b;
      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `,
};

export default function PostProcessing() {
  const { gl, scene, camera, size } = useThree();

  const composer = useMemo(() => {
    const instance = new EffectComposer(gl);
    const renderPass = new RenderPass(scene, camera);
    
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      0.3,    // Slightly reduced
      0.35,
      0.42
    );
    
    // Add chromatic aberration
    const chromaticPass = new ShaderPass(chromaticAberrationShader);
    
    const outputPass = new OutputPass();
    
    instance.addPass(renderPass);
    instance.addPass(bloomPass);
    instance.addPass(chromaticPass);
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
