"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function ParticleNetwork() {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const particleCount = 300;

  const [positions, velocities, sizes, connectionIndices] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);
    const sz = new Float32Array(particleCount);
    const connections: number[] = [];

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      // Spread in background area
      pos[idx] = (Math.random() - 0.5) * 35;
      pos[idx + 1] = (Math.random() - 0.5) * 10;
      pos[idx + 2] = -8 - Math.random() * 25;
      
      // Very slow drift
      vel[idx] = (Math.random() - 0.5) * 0.005;
      vel[idx + 1] = (Math.random() - 0.5) * 0.005;
      vel[idx + 2] = (Math.random() - 0.5) * 0.002;
      
      // Small particles
      sz[i] = 0.08 + Math.random() * 0.25;
    }

    // VERY FEW connections — only closest neighbors
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      let connectionsMade = 0;
      
      for (let j = i + 1; j < particleCount && connectionsMade < 2; j++) {
        const j3 = j * 3;
        const dx = pos[i3] - pos[j3];
        const dy = pos[i3 + 1] - pos[j3 + 1];
        const dz = pos[i3 + 2] - pos[j3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (dist < 4.0) {
          connections.push(i, j);
          connectionsMade++;
        }
      }
    }

    return [pos, vel, sz, connections];
  }, []);

  const lineGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const linePositions = new Float32Array(connectionIndices.length * 3);
    
    for (let i = 0; i < connectionIndices.length; i++) {
      const particleIdx = connectionIndices[i];
      const p3 = particleIdx * 3;
      linePositions[i * 3] = positions[p3];
      linePositions[i * 3 + 1] = positions[p3 + 1];
      linePositions[i * 3 + 2] = positions[p3 + 2];
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    return geo;
  }, [connectionIndices, positions]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uColor: { value: new THREE.Color("#cc1133") },
    }),
    []
  );

  useFrame((state) => {
    if (!pointsRef.current || !materialRef.current || !linesRef.current) return;

    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position;
    const posArray = posAttr.array as Float32Array;
    
    const lineGeo = linesRef.current.geometry;
    const linePosAttr = lineGeo.attributes.position;
    const linePosArray = linePosAttr.array as Float32Array;
    
    const targetX = state.pointer.x * 10;
    const targetY = state.pointer.y * 6;

    materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    materialRef.current.uniforms.uMouse.value.x = THREE.MathUtils.lerp(
      materialRef.current.uniforms.uMouse.value.x, targetX, 0.06
    );
    materialRef.current.uniforms.uMouse.value.y = THREE.MathUtils.lerp(
      materialRef.current.uniforms.uMouse.value.y, targetY, 0.06
    );

    const mx = materialRef.current.uniforms.uMouse.value.x;
    const my = materialRef.current.uniforms.uMouse.value.y;

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;

      posArray[idx] += velocities[idx];
      posArray[idx + 1] += velocities[idx + 1];
      posArray[idx + 2] += velocities[idx + 2];

      const px = posArray[idx];
      const py = posArray[idx + 1];
      const pz = posArray[idx + 2];

      // Subtle mouse attraction with orbit
      const dx = mx - px;
      const dy = my - py;
      const distToMouse = Math.sqrt(dx * dx + dy * dy);

      if (distToMouse < 8.0 && distToMouse > 0.5) {
        const attractStrength = 0.005;
        posArray[idx] += (dx / distToMouse) * attractStrength;
        posArray[idx + 1] += (dy / distToMouse) * attractStrength;
        
        const orbitSpeed = 0.015;
        const tangentX = -dy / distToMouse;
        const tangentY = dx / distToMouse;
        posArray[idx] += tangentX * orbitSpeed * (8.0 - distToMouse);
        posArray[idx + 1] += tangentY * orbitSpeed * (8.0 - distToMouse);
      }

      if (Math.abs(posArray[idx]) > 20) {
        posArray[idx] *= 0.95;
        velocities[idx] *= -0.5;
      }
      if (Math.abs(posArray[idx + 1]) > 7) {
        posArray[idx + 1] *= 0.95;
        velocities[idx + 1] *= -0.5;
      }
      if (posArray[idx + 2] > -3 || posArray[idx + 2] < -30) {
        velocities[idx + 2] *= -0.5;
      }
    }

    for (let i = 0; i < connectionIndices.length; i++) {
      const particleIdx = connectionIndices[i];
      const p3 = particleIdx * 3;
      linePosArray[i * 3] = posArray[p3];
      linePosArray[i * 3 + 1] = posArray[p3 + 1];
      linePosArray[i * 3 + 2] = posArray[p3 + 2];
    }

    posAttr.needsUpdate = true;
    linePosAttr.needsUpdate = true;
  });

  const vertexShader = `
    attribute float aSize;
    uniform float uTime;
    varying float vAlpha;
    
    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      float twinkle = 0.4 + 0.3 * sin(uTime * 1.5 + position.x * 8.0);
      vAlpha = twinkle;
      gl_PointSize = aSize * (18.0 / -mvPosition.z);
    }
  `;

  const fragmentShader = `
    uniform vec3 uColor;
    varying float vAlpha;
    
    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      if (dist > 0.5) discard;
      float alpha = smoothstep(0.5, 0.15, dist) * vAlpha;
      vec3 color = mix(vec3(0.9, 0.7, 0.7), vec3(1.0, 0.9, 0.9), smoothstep(0.0, 0.4, dist));
      gl_FragColor = vec4(color, alpha * 0.55);
    }
  `;

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* VERY SUBTLE connection lines */}
      <lineSegments ref={linesRef} geometry={lineGeometry}>
        <lineBasicMaterial
          color="#660010"
          transparent
          opacity={0.03}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}