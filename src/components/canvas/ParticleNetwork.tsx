"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function ParticleNetwork() {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const particleCount = 350;

  const [positions, velocities, sizes, connectionIndices] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);
    const sz = new Float32Array(particleCount);
    const connections: number[] = [];

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      // Spread in mid-ground
      pos[idx] = (Math.random() - 0.5) * 30;
      pos[idx + 1] = (Math.random() - 0.5) * 10;
      pos[idx + 2] = -6 - Math.random() * 22;
      
      // Very slow drift
      vel[idx] = (Math.random() - 0.5) * 0.004;
      vel[idx + 1] = (Math.random() - 0.5) * 0.004;
      vel[idx + 2] = (Math.random() - 0.5) * 0.001;
      
      sz[i] = 0.08 + Math.random() * 0.30;
    }

    // Create connections between close particles
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      let connectionsMade = 0;
      
      for (let j = i + 1; j < particleCount && connectionsMade < 2; j++) {
        const j3 = j * 3;
        const dx = pos[i3] - pos[j3];
        const dy = pos[i3 + 1] - pos[j3 + 1];
        const dz = pos[i3 + 2] - pos[j3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (dist < 4.5) {
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
      uMouseActive: { value: 0.0 },
      uColor: { value: new THREE.Color("#ff4455") },
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
    
    const targetX = state.pointer.x * 12;
    const targetY = state.pointer.y * 8;

    materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    materialRef.current.uniforms.uMouse.value.x = THREE.MathUtils.lerp(
      materialRef.current.uniforms.uMouse.value.x, targetX, 0.07
    );
    materialRef.current.uniforms.uMouse.value.y = THREE.MathUtils.lerp(
      materialRef.current.uniforms.uMouse.value.y, targetY, 0.07
    );

    const mx = materialRef.current.uniforms.uMouse.value.x;
    const my = materialRef.current.uniforms.uMouse.value.y;
    
    // Detect mouse movement for scatter effect
    const mouseDelta = Math.abs(state.pointer.x - state.pointer.x) + Math.abs(state.pointer.y - state.pointer.y);
    const isMouseMoving = mouseDelta > 0.001;
    materialRef.current.uniforms.uMouseActive.value = THREE.MathUtils.lerp(
      materialRef.current.uniforms.uMouseActive.value,
      isMouseMoving ? 1.0 : 0.0,
      0.05
    );
    const mouseActive = materialRef.current.uniforms.uMouseActive.value;

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;

      // Gentle drift
      posArray[idx] += velocities[idx];
      posArray[idx + 1] += velocities[idx + 1];
      posArray[idx + 2] += velocities[idx + 2];

      const px = posArray[idx];
      const py = posArray[idx + 1];
      const pz = posArray[idx + 2];

      const dx = mx - px;
      const dy = my - py;
      const distToMouse = Math.sqrt(dx * dx + dy * dy);

      if (distToMouse < 10.0) {
        if (mouseActive > 0.3) {
          // MOUSE MOVING: SCATTER particles away
          const scatterForce = (10.0 - distToMouse) * 0.015 * mouseActive;
          posArray[idx] -= (dx / distToMouse) * scatterForce;
          posArray[idx + 1] -= (dy / distToMouse) * scatterForce;
        } else {
          // MOUSE STILL: ATTRACT and ORBIT in small circles
          if (distToMouse > 0.5) {
            const attractStrength = 0.004;
            posArray[idx] += (dx / distToMouse) * attractStrength;
            posArray[idx + 1] += (dy / distToMouse) * attractStrength;
            
            // Small circular orbit
            const orbitSpeed = 0.012;
            const tangentX = -dy / distToMouse;
            const tangentY = dx / distToMouse;
            posArray[idx] += tangentX * orbitSpeed * (10.0 - distToMouse);
            posArray[idx + 1] += tangentY * orbitSpeed * (10.0 - distToMouse);
          }
        }
      }

      // Soft boundaries
      if (Math.abs(posArray[idx]) > 18) {
        posArray[idx] *= 0.95;
        velocities[idx] *= -0.5;
      }
      if (Math.abs(posArray[idx + 1]) > 7) {
        posArray[idx + 1] *= 0.95;
        velocities[idx + 1] *= -0.5;
      }
      if (posArray[idx + 2] > -3 || posArray[idx + 2] < -28) {
        velocities[idx + 2] *= -0.5;
      }
    }

    // Update line positions
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
    uniform float uMouseActive;
    varying float vAlpha;
    varying float vMouseActive;
    
    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      float twinkle = 0.4 + 0.35 * sin(uTime * 1.5 + position.x * 8.0);
      vAlpha = twinkle;
      vMouseActive = uMouseActive;
      gl_PointSize = aSize * (20.0 / -mvPosition.z);
    }
  `;

  const fragmentShader = `
    uniform vec3 uColor;
    varying float vAlpha;
    varying float vMouseActive;
    
    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      if (dist > 0.5) discard;
      float alpha = smoothstep(0.5, 0.12, dist) * vAlpha;
      
      // Color shifts when mouse is active
      vec3 calmColor = mix(vec3(1.0, 0.85, 0.85), vec3(1.0, 0.5, 0.5), smoothstep(0.0, 0.35, dist));
      vec3 activeColor = mix(vec3(1.0, 0.6, 0.6), vec3(1.0, 0.2, 0.3), smoothstep(0.0, 0.35, dist));
      vec3 color = mix(calmColor, activeColor, vMouseActive);
      
      gl_FragColor = vec4(color, alpha * 0.60);
    }
  `;

  return (
    <group>
      {/* Particle points */}
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

      {/* Connection lines - subtle */}
      <lineSegments ref={linesRef} geometry={lineGeometry}>
        <lineBasicMaterial
          color="#881122"
          transparent
          opacity={0.06}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}