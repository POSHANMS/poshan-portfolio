"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// TIGHT LOCAL CLUSTERS — only nearby stars connected
const clusters = [
  // Cluster 1: Upper left
  {
    nodes: [[-10, 9, -22], [-8, 11, -24], [-7, 8, -21], [-11, 7, -25], [-9, 10, -23]] as [number, number, number][],
    connections: [[0,1], [1,2], [2,3], [3,0], [1,3], [0,4], [4,2]] as [number, number][]
  },
  // Cluster 2: Upper right (near globe)
  {
    nodes: [[14, 10, -26], [16, 12, -28], [17, 9, -27], [13, 8, -29], [15, 11, -25]] as [number, number, number][],
    connections: [[0,1], [1,2], [2,3], [3,0], [0,4], [4,1]] as [number, number][]
  },
  // Cluster 3: Center
  {
    nodes: [[0, 8, -19], [2, 10, -21], [-1, 6, -20], [1, 9, -18]] as [number, number, number][],
    connections: [[0,1], [1,2], [2,3], [3,0]] as [number, number][]
  },
  // Cluster 4: Left mid
  {
    nodes: [[-6, 12, -28], [-4, 14, -30], [-7, 10, -27]] as [number, number, number][],
    connections: [[0,1], [1,2], [2,0]] as [number, number][]
  },
  // Cluster 5: Right mid
  {
    nodes: [[10, 6, -23], [12, 8, -25], [9, 5, -24]] as [number, number, number][],
    connections: [[0,1], [1,2]] as [number, number][]
  },
  // Cluster 6: Far left
  {
    nodes: [[-14, 8, -32], [-16, 10, -34], [-13, 6, -30]] as [number, number, number][],
    connections: [[0,1], [1,2]] as [number, number][]
  },
  // Cluster 7: Far right
  {
    nodes: [[20, 9, -35], [22, 11, -37], [19, 7, -33]] as [number, number, number][],
    connections: [[0,1], [1,2]] as [number, number][]
  },
];

// Flatten all nodes for rendering
const allNodes = clusters.flatMap(c => c.nodes);

// Build global connections (only short ones between nearby clusters)
const interConnections: [number, number][] = [];
// Connect cluster 1 to cluster 3 (short jump)
interConnections.push([3, 10]); // -11,7,-25 to -1,6,-20
// Connect cluster 2 to cluster 5 (short jump)
interConnections.push([5, 17]); // 16,12,-28 to 12,8,-25
// Connect cluster 3 to cluster 5 (short jump)
interConnections.push([9, 15]); // 2,10,-21 to 10,6,-23

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export default function StarField() {
  const starsRef = useRef<THREE.Points>(null);

  // 5000 ambient stars
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

      // MORE size variation
      const r = rand();
      if (r > 0.98) sz[i] = 0.6 + rand() * 0.4;      // Very bright
      else if (r > 0.9) sz[i] = 0.3 + rand() * 0.2;  // Bright
      else if (r > 0.7) sz[i] = 0.15 + rand() * 0.1; // Medium
      else sz[i] = 0.06 + rand() * 0.06;             // Dim

      ph[i] = rand() * Math.PI * 2;
    }

    return { positions: pos, colors: col, sizes: sz, phases: ph };
  }, []);

  // Build line geometry from clusters
  const lineGeometry = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];

    // Intra-cluster connections (tight)
    clusters.forEach(cluster => {
      cluster.connections.forEach(([a, b]) => {
        const p1 = cluster.nodes[a];
        const p2 = cluster.nodes[b];
        positions.push(...p1, ...p2);
        colors.push(1.0, 0.15, 0.2, 1.0, 0.15, 0.2);
      });
    });

    // Inter-cluster connections (few, deliberate)
    interConnections.forEach(([a, b]) => {
      const p1 = allNodes[a];
      const p2 = allNodes[b];
      positions.push(...p1, ...p2);
      colors.push(0.8, 0.1, 0.15, 0.8, 0.1, 0.15);
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return geo;
  }, []);

  // Constellation star points (brighter)
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
      sz[i] = 0.8 + Math.random() * 0.5;
    });

    return { heroPositions: pos, heroColors: col, heroSizes: sz };
  }, []);

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
          gl_PointSize = aSize * twinkle * (60.0 / max(1.0, -mv.z));
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          float core = smoothstep(0.5, 0.0, d);
          float glow = smoothstep(0.5, 0.1, d) * 0.6;
          if (core < 0.005) discard;
          gl_FragColor = vec4(1.0, 0.85, 0.85, (core + glow) * vAlpha);
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
      {/* Ambient star field */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
          <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        </bufferGeometry>
        <primitive object={starMaterial} attach="material" />
      </points>

      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial 
          vertexColors 
          transparent 
          opacity={0.45} 
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

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
