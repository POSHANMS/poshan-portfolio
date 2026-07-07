"use client";

import React, { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";

type AuthoredNode = [number, number, number];
type AuthoredConnection = [number, number];

const authoredNodes: AuthoredNode[] = [
  [-16.5, 8.2, -24],
  [-14.1, 10.6, -25.5],
  [-11.2, 8.9, -24.8],
  [-12.7, 6.4, -26.2],
  [-2.8, 13.2, -32],
  [-0.6, 15.1, -33.4],
  [2.4, 13.8, -32.6],
  [0.8, 11.4, -34.2],
  [11.8, 10.1, -28.5],
  [14.2, 12.2, -29.2],
  [17.1, 10.8, -30.4],
  [15.6, 7.8, -29.6],
  [23.5, 17.4, -38],
  [26.2, 19.2, -39.5],
  [29.6, 17.8, -40.8],
  [27.5, 15.4, -39.8],
  [-25.6, 18.4, -42],
  [-22.8, 20.1, -43.5],
  [-19.6, 17.5, -42.4],
  [34.5, 6.8, -35.2],
  [38.1, 8.7, -36.4],
  [41.0, 6.0, -37.2],
];

const authoredConnections: AuthoredConnection[] = [
  [0, 1],
  [1, 2],
  [1, 3],
  [4, 5],
  [5, 6],
  [6, 7],
  [8, 9],
  [9, 10],
  [9, 11],
  [12, 13],
  [13, 14],
  [13, 15],
  [16, 17],
  [17, 18],
  [19, 20],
  [20, 21],
];

function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function createStarShader(opacity: number) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uOpacity: { value: opacity },
      uTime: { value: 0 },
    },
    vertexShader: `
      uniform float uTime;
      attribute float aSize;
      attribute float aPhase;
      attribute vec3 color;
      varying vec3 vColor;
      varying float vTwinkle;

      void main() {
        vColor = color;
        vTwinkle = 0.72 + 0.28 * sin(uTime * 1.45 + aPhase);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = aSize * vTwinkle * (52.0 / max(1.0, -mvPosition.z));
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      varying vec3 vColor;
      varying float vTwinkle;

      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float d = length(uv);
        float core = smoothstep(0.5, 0.04, d);
        float halo = smoothstep(0.5, 0.16, d) * 0.52;
        if (core <= 0.001) discard;
        vec3 glow = mix(vColor, vec3(1.0, 0.18, 0.28), halo * 0.32);
        gl_FragColor = vec4(glow, (core + halo) * uOpacity * vTwinkle);
      }
    `,
    transparent: true,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

export default function StarField() {
  const ambientStarsRef = useRef<THREE.Points>(null);
  const heroStarsRef = useRef<THREE.Points>(null);
  const constellationRef = useRef<THREE.LineSegments>(null);
  const { camera } = useThree();

  const [ambientPositions, ambientColors, ambientSizes, ambientPhases] = useMemo(() => {
    const random = seededRandom(7331);
    const count = 2600;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const palette = [
      new THREE.Color("#ffffff"),
      new THREE.Color("#f5f0e8"),
      new THREE.Color("#ffffff"),
      new THREE.Color("#f5f0e8"),
      new THREE.Color("#ffd89a"),
      new THREE.Color("#cfe8ff"),
    ];

    const exclusionZones = [
      { x1: -0.98, x2: -0.36, y1: -0.42, y2: 0.72 },
      { x1: -0.28, x2: 0.12, y1: -0.2, y2: 0.78 },
      { x1: 0.48, x2: 0.98, y1: -0.52, y2: 0.76 },
    ];

    const candidate = new THREE.Vector3();
    let accepted = 0;
    let attempts = 0;

    while (accepted < count && attempts < count * 12) {
      attempts += 1;
      candidate.set((random() - 0.5) * 128, random() * 44 - 2, -18 - random() * 58);
      const ndc = candidate.clone().project(camera);
      const blocked = exclusionZones.some((zone) => ndc.x > zone.x1 && ndc.x < zone.x2 && ndc.y > zone.y1 && ndc.y < zone.y2);
      if (blocked) continue;

      const i3 = accepted * 3;
      const color = palette[Math.floor(random() * palette.length)];
      const hero = random() > 0.94;

      positions[i3] = candidate.x;
      positions[i3 + 1] = candidate.y;
      positions[i3 + 2] = candidate.z;
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
      sizes[accepted] = hero ? 0.24 + random() * 0.18 : 0.055 + random() * 0.105;
      phases[accepted] = random() * Math.PI * 2;
      accepted += 1;
    }

    return [positions, colors, sizes, phases];
  }, [camera]);

  const [heroPositions, heroColors, heroSizes, heroPhases] = useMemo(() => {
    const positions = new Float32Array(authoredNodes.length * 3);
    const colors = new Float32Array(authoredNodes.length * 3);
    const sizes = new Float32Array(authoredNodes.length);
    const phases = new Float32Array(authoredNodes.length);
    const starColors = [new THREE.Color("#ffffff"), new THREE.Color("#f5f0e8"), new THREE.Color("#ffd89a"), new THREE.Color("#cfe8ff")];

    authoredNodes.forEach((node, index) => {
      const i3 = index * 3;
      const color = starColors[index % starColors.length];
      positions[i3] = node[0];
      positions[i3 + 1] = node[1];
      positions[i3 + 2] = node[2];
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
      sizes[index] = index % 5 === 0 ? 0.42 : 0.26;
      phases[index] = index * 0.73;
    });

    return [positions, colors, sizes, phases];
  }, []);

  const constellationGeometry = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    const crimson = new THREE.Color("#ff1744");
    const burgundy = new THREE.Color("#800010");

    authoredConnections.forEach(([start, end], index) => {
      const a = authoredNodes[start];
      const b = authoredNodes[end];
      const color = index % 3 === 0 ? burgundy : crimson;
      positions.push(a[0], a[1], a[2], b[0], b[1], b[2]);
      colors.push(color.r, color.g, color.b, color.r, color.g, color.b);
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return geometry;
  }, []);

  const ambientMaterial = useMemo(() => createStarShader(0.78), []);
  const heroMaterial = useMemo(() => createStarShader(0.95), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    ambientMaterial.uniforms.uTime.value = t;
    heroMaterial.uniforms.uTime.value = t;
    if (ambientStarsRef.current) ambientStarsRef.current.rotation.y = t * 0.0025;
    if (heroStarsRef.current) heroStarsRef.current.rotation.y = Math.sin(t * 0.12) * 0.008;
    if (constellationRef.current) {
      const material = constellationRef.current.material as THREE.LineBasicMaterial;
      material.opacity = 0.48 + Math.sin(t * 0.65) * 0.08;
    }
  });

  return (
    <group>
      <points ref={ambientStarsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[ambientPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[ambientColors, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[ambientSizes, 1]} />
          <bufferAttribute attach="attributes-aPhase" args={[ambientPhases, 1]} />
        </bufferGeometry>
        <primitive object={ambientMaterial} attach="material" />
      </points>

      <lineSegments ref={constellationRef} geometry={constellationGeometry}>
        <lineBasicMaterial vertexColors transparent opacity={0.52} blending={THREE.AdditiveBlending} depthWrite={false} depthTest={false} />
      </lineSegments>

      <group>
        {authoredConnections.map(([start, end], index) => (
          <Line
            key={`${start}-${end}`}
            points={[authoredNodes[start], authoredNodes[end]]}
            color={index % 3 === 0 ? "#800010" : "#ff1744"}
            lineWidth={index % 3 === 0 ? 0.85 : 1.15}
            transparent
            opacity={index % 3 === 0 ? 0.42 : 0.68}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            depthTest={false}
          />
        ))}
      </group>

      <points ref={heroStarsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[heroPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[heroColors, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[heroSizes, 1]} />
          <bufferAttribute attach="attributes-aPhase" args={[heroPhases, 1]} />
        </bufferGeometry>
        <primitive object={heroMaterial} attach="material" />
      </points>
    </group>
  );
}
