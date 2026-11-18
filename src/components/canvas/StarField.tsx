"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ═══════════════════════════════════════════════════════════════════════
// REALISTIC CONSTELLATIONS — Clean stick-figure asterisms
// No messy crossing lines. Recognizable mythological shapes.
// ═══════════════════════════════════════════════════════════════════════
const clusters = [
  {
    // ORION — The Hunter: belt of 3, shoulders, knees
    name: "orion",
    nodes: [
      [-7.0,  9.0, -22.0],  // 0 left shoulder
      [-5.0,  9.0, -22.0],  // 1 belt left
      [-3.0,  9.0, -22.0],  // 2 belt center
      [-1.0,  9.0, -22.0],  // 3 belt right
      [-6.0, 12.5, -23.0],  // 4 right shoulder
      [-4.0, 12.5, -23.0],  // 5 (unused spacer)
      [-5.5,  6.0, -21.0],  // 6 left knee
      [-2.5,  6.0, -21.0],  // 7 right knee
    ] as [number, number, number][],
    connections: [[0,1],[1,2],[2,3],[0,4],[3,4],[1,6],[2,7]] as [number, number][]
  },
  {
    // BIG DIPPER — Handle + bowl
    name: "dipper",
    nodes: [
      [10.0, 11.0, -26.0],  // 0 handle end
      [12.0, 11.5, -26.0],  // 1 handle mid
      [14.0, 11.0, -26.0],  // 2 bowl top-left
      [15.5,  9.0, -26.0],  // 3 bowl top-right
      [15.0,  7.0, -26.0],  // 4 bowl bottom-right
      [13.0,  6.5, -26.0],  // 5 bowl bottom-left
      [11.5,  7.5, -26.0],  // 6 bowl inner-left
    ] as [number, number, number][],
    connections: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,2]] as [number, number][]
  },
  {
    // CASSIOPEIA — Classic W in the sky
    name: "cassiopeia",
    nodes: [
      [-2.0, 13.5, -24.0],  // 0
      [-1.0, 11.0, -24.0],  // 1
      [ 0.0, 12.5, -24.0],  // 2
      [ 1.0, 11.0, -24.0],  // 3
      [ 2.0, 13.5, -24.0],  // 4
    ] as [number, number, number][],
    connections: [[0,1],[1,2],[2,3],[3,4]] as [number, number][]
  },
  {
    // CYGNUS — Northern Cross
    name: "cygnus",
    nodes: [
      [ 6.0, 16.0, -28.0],  // 0 head
      [ 6.0, 13.5, -28.0],  // 1 neck
      [ 6.0, 11.0, -28.0],  // 2 body
      [ 6.0,  8.5, -28.0],  // 3 lower body
      [ 4.5,  7.5, -28.0],  // 4 left wing
      [ 7.5,  7.5, -28.0],  // 5 right wing
    ] as [number, number, number][],
    connections: [[0,1],[1,2],[2,3],[3,4],[3,5]] as [number, number][]
  },
  {
    // LEO — Sickle mane + triangular body
    name: "leo",
    nodes: [
      [-12.0,  7.5, -25.0],  // 0 nose
      [-10.5,  9.0, -25.0],  // 1 mane top
      [-10.0,  6.5, -25.0],  // 2 mane bottom
      [-8.5,  8.0, -25.0],  // 3 neck
      [-8.0,  5.5, -25.0],  // 4 hind
    ] as [number, number, number][],
    connections: [[0,1],[1,2],[2,0],[1,3],[3,4]] as [number, number][]
  },
  {
    // CANIS MAJOR — Winter triangle
    name: "canis",
    nodes: [
      [16.0,  8.5, -30.0],  // 0
      [18.5, 10.0, -30.0],  // 1
      [17.5,  6.5, -30.0],  // 2
    ] as [number, number, number][],
    connections: [[0,1],[1,2],[2,0]] as [number, number][]
  },
  {
    // HERCULES — Keystone box
    name: "hercules",
    nodes: [
      [20.0, 10.5, -32.0],  // 0 top-left
      [22.0, 10.5, -32.0],  // 1 top-right
      [22.0,  8.0, -32.0],  // 2 bottom-right
      [20.0,  8.0, -32.0],  // 3 bottom-left
      [21.0, 13.0, -31.0],  // 4 arm
    ] as [number, number, number][],
    connections: [[0,1],[1,2],[2,3],[3,0],[1,4]] as [number, number][]
  },
];

const allNodes = clusters.flatMap(c => c.nodes);

export type CardContrastUniforms = {
  uCardCenter: { value: THREE.Vector2 };
  uCardHalfSize: { value: THREE.Vector2 };
  uCardDim: { value: number };
};

const NO_CARD_CONTRAST: CardContrastUniforms = {
  uCardCenter: { value: new THREE.Vector2(0, 0) },
  uCardHalfSize: { value: new THREE.Vector2(0.22, 0.28) },
  uCardDim: { value: 0 },
};

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export default function StarField({
  starsOpacity = 1,
  showHeroStars = true,
  cardContrast = NO_CARD_CONTRAST,
  cameraFramed = false,
  warpProgress = 0,
  cameraParallax = 0,
  handoffProgress = 0,
}: {
  starsOpacity?: number;
  showHeroStars?: boolean;
  cardContrast?: CardContrastUniforms;
  cameraFramed?: boolean;
  warpProgress?: number;
  cameraParallax?: number;
  handoffProgress?: number;
}) {
  const fieldRef = useRef<THREE.Group>(null);
  const starsRef = useRef<THREE.Points>(null);
  const heroStarsRef = useRef<THREE.Points>(null);

  const { positions, colors, sizes, phases } = useMemo(() => {
    const rand = seededRandom(42);
    const count = 5000;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const ph = new Float32Array(count);

    const palette = [
      new THREE.Color(1.0, 0.92, 0.92),
      new THREE.Color(1.0, 0.78, 0.78),
      new THREE.Color(1.0, 0.65, 0.65),
      new THREE.Color(1.0, 0.45, 0.45),
      new THREE.Color(1.0, 0.25, 0.30),
      new THREE.Color(0.95, 0.55, 0.55),
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] = (rand() - 0.5) * 100;
      pos[i3 + 1] = rand() * 20 - 2;
      pos[i3 + 2] = -8 - rand() * 60;

      const color = palette[Math.floor(rand() * palette.length)];
      col[i3] = color.r;
      col[i3 + 1] = color.g;
      col[i3 + 2] = color.b;

      const r = rand();
      if (r > 0.985) sz[i] = 18 + rand() * 12;
      else if (r > 0.92) sz[i] = 8 + rand() * 6;
      else if (r > 0.72) sz[i] = 3 + rand() * 3;
      else sz[i] = 1 + rand() * 2;

      ph[i] = rand() * Math.PI * 2;
    }

    return { positions: pos, colors: col, sizes: sz, phases: ph };
  }, []);

  const { heroPositions, heroColors, heroSizes, heroPhases } = useMemo(() => {
    const pos = new Float32Array(allNodes.length * 3);
    const col = new Float32Array(allNodes.length * 3);
    const sz = new Float32Array(allNodes.length);
    const ph = new Float32Array(allNodes.length);

    allNodes.forEach((node, i) => {
      pos[i * 3] = node[0];
      pos[i * 3 + 1] = node[1];
      pos[i * 3 + 2] = node[2];
      col[i * 3] = 1.0;
      col[i * 3 + 1] = 0.55 + Math.random() * 0.25;
      col[i * 3 + 2] = 0.5 + Math.random() * 0.25;
      sz[i] = 6 + Math.random() * 4;
      ph[i] = Math.random() * Math.PI * 2;
    });

    return { heroPositions: pos, heroColors: col, heroSizes: sz, heroPhases: ph };
  }, []);

  const starMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uOpacity: { value: 1.0 }, uWarp: { value: 0 }, uHandoff: { value: 0 }, ...cardContrast },
      vertexShader: `
        attribute float aSize;
        attribute float aPhase;
        varying float vAlpha;
        varying vec2 vScreenUv;
        varying vec2 vWarpDirection;
        uniform float uTime;
        uniform float uWarp;
        void main() {
          float twinkle = 0.5 + 0.5 * sin(uTime * 1.2 + aPhase);
          vAlpha = twinkle;
          // Push each star toward the lens on the view-space Z axis during the
          // scroll-authored jump; the fragment shader stretches its bright core
          // along the projected flight direction to form a brief warp trail.
          vec3 warpPosition = position;
          warpPosition.z += uWarp * 7.5;
          vec4 mv = modelViewMatrix * vec4(warpPosition, 1.0);
          vec4 clipPosition = projectionMatrix * mv;
          vWarpDirection = normalize(clipPosition.xy + vec2(0.0001));
          clipPosition.xy += vWarpDirection * uWarp * 0.16 * clipPosition.w;
          gl_Position = clipPosition;
          vScreenUv = clipPosition.xy / clipPosition.w * 0.5 + 0.5;
          float authoredPointSize = aSize * (1.0 + uWarp * 3.5);
          gl_PointSize = min(authoredPointSize, 6.0);
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        varying float vAlpha;
        varying vec2 vScreenUv;
        varying vec2 vWarpDirection;
        uniform vec2 uCardCenter;
        uniform vec2 uCardHalfSize;
        uniform float uCardDim;
        uniform float uWarp;
        uniform float uHandoff;
        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float d = length(uv);
          vec2 direction = normalize(vWarpDirection + vec2(0.0001));
          vec2 perpendicular = vec2(-direction.y, direction.x);
          float along = dot(uv, direction);
          float across = abs(dot(uv, perpendicular));
          float trail = (1.0 - smoothstep(0.012, 0.075, across)) * smoothstep(-0.5, 0.12, along);
          float core = mix(smoothstep(0.5, 0.0, d), trail, uWarp);
          float glow = mix(smoothstep(0.5, 0.2, d) * 0.4, trail * 0.3, uWarp);
          if (core + glow < 0.01) discard;
          vec2 cardUv = (vScreenUv - uCardCenter) / max(uCardHalfSize, vec2(0.001));
          float cardRadius = length(cardUv);
          float cardMask = 1.0 - smoothstep(0.92, 1.2, cardRadius);
          float contrast = mix(1.0, 0.4, cardMask * uCardDim);
          vec3 crimson = vec3(1.0, 0.08, 0.18);
          vec3 amber = vec3(1.0, 0.56, 0.16);
          vec3 starlight = vec3(0.72, 0.84, 1.0);
          vec3 transferColor = mix(crimson, amber, smoothstep(0.0, 0.52, uHandoff));
          transferColor = mix(transferColor, starlight, smoothstep(0.48, 1.0, uHandoff));
          vec3 starColor = mix(vec3(1.0, 0.75, 0.78), transferColor, uHandoff);
          gl_FragColor = vec4(starColor, (core + glow) * vAlpha * uOpacity * contrast);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, [cardContrast]);

  const heroStarMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uOpacity: { value: 1.0 }, uHandoff: { value: 0 }, ...cardContrast },
      vertexShader: `
        attribute float aSize;
        attribute float aPhase;
        varying float vAlpha;
        varying vec2 vScreenUv;
        uniform float uTime;
        void main() {
          float twinkle = 0.6 + 0.4 * sin(uTime * 0.8 + aPhase);
          vAlpha = twinkle;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vec4 clipPosition = projectionMatrix * mv;
          gl_Position = clipPosition;
          vScreenUv = clipPosition.xy / clipPosition.w * 0.5 + 0.5;
          float safeDist = max(8.0, -mv.z);
          gl_PointSize = min(aSize * (60.0 / safeDist), 6.0);
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        varying float vAlpha;
        varying vec2 vScreenUv;
        uniform vec2 uCardCenter;
        uniform vec2 uCardHalfSize;
        uniform float uCardDim;
        uniform float uHandoff;
        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float d = length(uv);
          float core = smoothstep(0.5, 0.0, d);
          float glow = smoothstep(0.5, 0.1, d) * 0.6;
          float ring = smoothstep(0.55, 0.45, d) * smoothstep(0.35, 0.45, d) * 0.3;
          if (core + glow + ring < 0.01) discard;
          vec3 color = mix(vec3(1.0, 0.9, 0.9), vec3(1.0, 0.5, 0.5), glow);
          vec2 cardUv = (vScreenUv - uCardCenter) / max(uCardHalfSize, vec2(0.001));
          float cardRadius = length(cardUv);
          float cardMask = 1.0 - smoothstep(0.92, 1.2, cardRadius);
          float contrast = mix(1.0, 0.4, cardMask * uCardDim);
          vec3 transferColor = mix(vec3(1.0, 0.06, 0.14), vec3(0.7, 0.84, 1.0), smoothstep(0.08, 0.92, uHandoff));
          color = mix(color, transferColor, uHandoff * 0.88);
          gl_FragColor = vec4(color, (core + glow + ring) * vAlpha * 0.85 * uOpacity * contrast);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, [cardContrast]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    starMaterial.uniforms.uTime.value = t;
    starMaterial.uniforms.uOpacity.value = starsOpacity;
    starMaterial.uniforms.uWarp.value = warpProgress;
    starMaterial.uniforms.uHandoff.value = handoffProgress;
    heroStarMaterial.uniforms.uTime.value = t;
    heroStarMaterial.uniforms.uOpacity.value = starsOpacity;
    heroStarMaterial.uniforms.uHandoff.value = handoffProgress;
    if (starsRef.current) starsRef.current.rotation.y = t * 0.0005;
    if (heroStarsRef.current) heroStarsRef.current.rotation.y = t * 0.0005;
    if (fieldRef.current) {
      if (cameraFramed) {
        const cameraAnchor = state.camera.position.clone().multiplyScalar(0.88);
        cameraAnchor.y -= 7;
        if (cameraParallax > 0) {
          const cameraRight = new THREE.Vector3().setFromMatrixColumn(state.camera.matrixWorld, 0).normalize();
          const cameraUp = new THREE.Vector3().setFromMatrixColumn(state.camera.matrixWorld, 1).normalize();
          cameraAnchor.addScaledVector(cameraRight, state.pointer.x * cameraParallax);
          cameraAnchor.addScaledVector(cameraUp, state.pointer.y * cameraParallax);
        }
        fieldRef.current.position.lerp(cameraAnchor, 1 - Math.exp(-3.5 * delta));
        fieldRef.current.quaternion.slerp(state.camera.quaternion, 1 - Math.exp(-3.5 * delta));
      } else {
        fieldRef.current.position.lerp(new THREE.Vector3(0, 0, 0), 1 - Math.exp(-3.5 * delta));
        fieldRef.current.quaternion.slerp(new THREE.Quaternion(), 1 - Math.exp(-3.5 * delta));
      }
    }
  });

  return (
    <group ref={fieldRef}>
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
          <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        </bufferGeometry>
        <primitive object={starMaterial} attach="material" />
      </points>

      {showHeroStars && (
        <points ref={heroStarsRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[heroPositions, 3]} />
            <bufferAttribute attach="attributes-color" args={[heroColors, 3]} />
            <bufferAttribute attach="attributes-aSize" args={[heroSizes, 1]} />
            <bufferAttribute attach="attributes-aPhase" args={[heroPhases, 1]} />
          </bufferGeometry>
          <primitive object={heroStarMaterial} attach="material" />
        </points>
      )}
    </group>
  );
}
