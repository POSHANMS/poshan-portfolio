"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const clusters = [
  {
    nodes: [[-10, 9, -22], [-8, 11, -24], [-7, 8, -21], [-11, 7, -25], [-9, 10, -23]] as [number, number, number][],
    connections: [[0,1], [1,2], [2,3], [3,0], [1,3], [0,4], [4,2]] as [number, number][]
  },
  {
    nodes: [[14, 10, -26], [16, 12, -28], [17, 9, -27], [13, 8, -29], [15, 11, -25]] as [number, number, number][],
    connections: [[0,1], [1,2], [2,3], [3,0], [0,4], [4,1]] as [number, number][]
  },
  {
    nodes: [[0, 8, -19], [2, 10, -21], [-1, 6, -20], [1, 9, -18]] as [number, number, number][],
    connections: [[0,1], [1,2], [2,3], [3,0]] as [number, number][]
  },
  {
    nodes: [[-6, 12, -28], [-4, 14, -30], [-7, 10, -27]] as [number, number, number][],
    connections: [[0,1], [1,2], [2,0]] as [number, number][]
  },
  {
    nodes: [[10, 6, -23], [12, 8, -25], [9, 5, -24]] as [number, number, number][],
    connections: [[0,1], [1,2]] as [number, number][]
  },
  {
    nodes: [[-14, 8, -32], [-16, 10, -34], [-13, 6, -30]] as [number, number, number][],
    connections: [[0,1], [1,2]] as [number, number][]
  },
  {
    nodes: [[20, 9, -35], [22, 11, -37], [19, 7, -33]] as [number, number, number][],
    connections: [[0,1], [1,2]] as [number, number][]
  },
];

const allNodes = clusters.flatMap(c => c.nodes);
const interConnections: [number, number][] = [[3, 10], [5, 17], [9, 15]];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export default function StarField() {
  const starsRef = useRef<THREE.Points>(null);

  const { positions, colors, sizes, phases } = useMemo(() => {
    const rand = seededRandom(42);
    const count = 5000;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const ph = new Float32Array(count);

    const palette = [
      new THREE.Color(1.0, 0.9, 0.9),
      new THREE.Color(1.0, 0.7, 0.7),
      new THREE.Color(1.0, 0.5, 0.5),
      new THREE.Color(1.0, 0.3, 0.3),
      new THREE.Color(1.0, 0.15, 0.2),
      new THREE.Color(0.9, 0.4, 0.45),
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
      if (r > 0.98) sz[i] = 18 + rand() * 12;
      else if (r > 0.9) sz[i] = 8 + rand() * 6;
      else if (r > 0.7) sz[i] = 3 + rand() * 3;
      else sz[i] = 1 + rand() * 2;

      ph[i] = rand() * Math.PI * 2;
    }

    return { positions: pos, colors: col, sizes: sz, phases: ph };
  }, []);

  const lineGeometry = useMemo(() => {
    const linePos: number[] = [];
    const lineColors: number[] = [];

    clusters.forEach(cluster => {
      cluster.connections.forEach(([a, b]) => {
        const p1 = cluster.nodes[a];
        const p2 = cluster.nodes[b];
        linePos.push(...p1, ...p2);
        lineColors.push(1.0, 0.15, 0.2, 1.0, 0.15, 0.2);
      });
    });

    interConnections.forEach(([a, b]) => {
      const p1 = allNodes[a];
      const p2 = allNodes[b];
      linePos.push(...p1, ...p2);
      lineColors.push(0.8, 0.1, 0.15, 0.8, 0.1, 0.15);
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(linePos, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(lineColors, 3));
    return geo;
  }, []);

  const { heroPositions, heroColors, heroSizes } = useMemo(() => {
    const pos = new Float32Array(allNodes.length * 3);
    const col = new Float32Array(allNodes.length * 3);
    const sz = new Float32Array(allNodes.length);

    allNodes.forEach((node, i) => {
      pos[i * 3] = node[0];
      pos[i * 3 + 1] = node[1];
      pos[i * 3 + 2] = node[2];
      col[i * 3] = 1.0;
      col[i * 3 + 1] = 0.5 + Math.random() * 0.3;
      col[i * 3 + 2] = 0.5 + Math.random() * 0.3;
      sz[i] = 24 + Math.random() * 16;
    });

    return { heroPositions: pos, heroColors: col, heroSizes: sz };
  }, []);

  // Circular star shader — uses length(uv) so stars are round, not square
  const starMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
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
          // aSize already in pixel units, twinkle modulates brightness not size
          gl_PointSize = aSize;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float d = length(uv);
          // Circular discard — anything outside radius 0.5 is transparent
          float core = smoothstep(0.5, 0.0, d);
          float glow = smoothstep(0.5, 0.2, d) * 0.4;
          if (core + glow < 0.01) discard;
          gl_FragColor = vec4(1.0, 0.75, 0.78, (core + glow) * vAlpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    starMaterial.uniforms.uTime.value = t;
    if (starsRef.current) starsRef.current.rotation.y = t * 0.0005;
  });

  return (
    <group>
      {/* Main star field — custom circular shader */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
          <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        </bufferGeometry>
        <primitive object={starMaterial} attach="material" />
      </points>

      {/* Constellation lines — local clusters only */}
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.45}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* Constellation node hero stars */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[heroPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[heroColors, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[heroSizes, 1]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.9}
          vertexColors
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </group>
  );
}
