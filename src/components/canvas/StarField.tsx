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

// 2 faint mythological bridges between constellations
const interConnections: [number, number][] = [
  [3, 10],   // Orion belt -> Big Dipper handle
  [14, 22],  // Cassiopeia -> Cygnus wing
];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export default function StarField({ starsOpacity = 1 }: { starsOpacity?: number }) {
  const starsRef = useRef<THREE.Points>(null);
  const heroStarsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

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

  // Build constellation line geometry
  const lineGeometry = useMemo(() => {
    const linePos: number[] = [];
    const lineColors: number[] = [];
    const lineOpacities: number[] = [];

    clusters.forEach(cluster => {
      cluster.connections.forEach(([a, b], connIdx) => {
        const p1 = cluster.nodes[a];
        const p2 = cluster.nodes[b];
        linePos.push(...p1, ...p2);
        const isMain = connIdx < cluster.connections.length - 1;
        const brightness = isMain ? 1.0 : 0.55;
        lineColors.push(1.0 * brightness, 0.18 * brightness, 0.22 * brightness);
        lineColors.push(1.0 * brightness, 0.18 * brightness, 0.22 * brightness);
        lineOpacities.push(isMain ? 1.0 : 0.45);
        lineOpacities.push(isMain ? 1.0 : 0.45);
      });
    });

    interConnections.forEach(([a, b]) => {
      const p1 = allNodes[a];
      const p2 = allNodes[b];
      linePos.push(...p1, ...p2);
      lineColors.push(0.8, 0.12, 0.15);
      lineColors.push(0.8, 0.12, 0.15);
      lineOpacities.push(0.3);
      lineOpacities.push(0.3);
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(linePos, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(lineColors, 3));
    geo.setAttribute("aOpacity", new THREE.Float32BufferAttribute(lineOpacities, 1));
    return geo;
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
      uniforms: { uTime: { value: 0 }, uOpacity: { value: 1.0 } },
      vertexShader: `
        attribute float aSize;
        attribute float aPhase;
        varying float vAlpha;
        uniform float uTime;
        void main() {
          float twinkle = 0.5 + 0.5 * sin(uTime * 1.2 + aPhase);
          vAlpha = twinkle;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = aSize;
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        varying float vAlpha;
        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float d = length(uv);
          float core = smoothstep(0.5, 0.0, d);
          float glow = smoothstep(0.5, 0.2, d) * 0.4;
          if (core + glow < 0.01) discard;
          gl_FragColor = vec4(1.0, 0.75, 0.78, (core + glow) * vAlpha * uOpacity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  const heroStarMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uOpacity: { value: 1.0 } },
      vertexShader: `
        attribute float aSize;
        attribute float aPhase;
        varying float vAlpha;
        uniform float uTime;
        void main() {
          float twinkle = 0.6 + 0.4 * sin(uTime * 0.8 + aPhase);
          vAlpha = twinkle;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          float safeDist = max(8.0, -mv.z);
          gl_PointSize = aSize * (60.0 / safeDist);
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        varying float vAlpha;
        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float d = length(uv);
          float core = smoothstep(0.5, 0.0, d);
          float glow = smoothstep(0.5, 0.1, d) * 0.6;
          float ring = smoothstep(0.55, 0.45, d) * smoothstep(0.35, 0.45, d) * 0.3;
          if (core + glow + ring < 0.01) discard;
          vec3 color = mix(vec3(1.0, 0.9, 0.9), vec3(1.0, 0.5, 0.5), glow);
          gl_FragColor = vec4(color, (core + glow + ring) * vAlpha * 0.85 * uOpacity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  const lineMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uOpacity: { value: 1.0 } },
      vertexShader: `
        attribute float aOpacity;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uTime;
        void main() {
          vColor = color;
          float pulse = 0.9 + 0.1 * sin(uTime * 1.5 + position.x * 0.5);
          vAlpha = aOpacity * pulse;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec3 finalColor = vColor * 1.2;
          float alpha = vAlpha * 0.55 * uOpacity;
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: false,
    });
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    starMaterial.uniforms.uTime.value = t;
    starMaterial.uniforms.uOpacity.value = starsOpacity;
    heroStarMaterial.uniforms.uTime.value = t;
    heroStarMaterial.uniforms.uOpacity.value = starsOpacity;
    lineMaterial.uniforms.uTime.value = t;
    lineMaterial.uniforms.uOpacity.value = starsOpacity;
    if (starsRef.current) starsRef.current.rotation.y = t * 0.0005;
    if (heroStarsRef.current) heroStarsRef.current.rotation.y = t * 0.0005;
    if (linesRef.current) linesRef.current.rotation.y = t * 0.0005;
  });

  return (
    <group>
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
          <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        </bufferGeometry>
        <primitive object={starMaterial} attach="material" />
      </points>

      <lineSegments ref={linesRef} geometry={lineGeometry}>
        <primitive object={lineMaterial} attach="material" />
      </lineSegments>

      <points ref={heroStarsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[heroPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[heroColors, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[heroSizes, 1]} />
          <bufferAttribute attach="attributes-aPhase" args={[heroPhases, 1]} />
        </bufferGeometry>
        <primitive object={heroStarMaterial} attach="material" />
      </points>
    </group>
  );
}