"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function ParticleNetwork() {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const particleCount = 400;

  const [positions, velocities, sizes, connectionIndices] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);
    const sz = new Float32Array(particleCount);
    const connections: number[] = [];

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      pos[idx] = (Math.random() - 0.5) * 40;
      pos[idx + 1] = (Math.random() - 0.5) * 12;
      pos[idx + 2] = -8 - Math.random() * 28;
      
      vel[idx] = (Math.random() - 0.5) * 0.003;
      vel[idx + 1] = (Math.random() - 0.5) * 0.003;
      vel[idx + 2] = (Math.random() - 0.5) * 0.001;
      
      sz[i] = 0.06 + Math.random() * 0.35;
    }

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      let connectionsMade = 0;
      
      for (let j = i + 1; j < particleCount && connectionsMade < 1; j++) {
        const j3 = j * 3;
        const dx = pos[i3] - pos[j3];
        const dy = pos[i3 + 1] - pos[j3 + 1];
        const dz = pos[i3 + 2] - pos[j3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (dist < 5.0) {
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

  const prevMouseRef = useRef({ x: 0, y: 0 });
  const mouseVelRef = useRef({ x: 0, y: 0 });

  useFrame((state) => {
    if (!pointsRef.current || !materialRef.current || !linesRef.current) return;

    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position;
    const posArray = posAttr.array as Float32Array;
    
    const lineGeo = linesRef.current.geometry;
    const linePosAttr = lineGeo.attributes.position;
    const linePosArray = linePosAttr.array as Float32Array;
    
    const targetX = state.pointer.x * 15;
    const targetY = state.pointer.y * 10;

    materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    materialRef.current.uniforms.uMouse.value.x = THREE.MathUtils.lerp(
      materialRef.current.uniforms.uMouse.value.x, targetX, 0.06
    );
    materialRef.current.uniforms.uMouse.value.y = THREE.MathUtils.lerp(
      materialRef.current.uniforms.uMouse.value.y, targetY, 0.06
    );

    const mx = materialRef.current.uniforms.uMouse.value.x;
    const my = materialRef.current.uniforms.uMouse.value.y;
    
    const mouseVelX = state.pointer.x - prevMouseRef.current.x;
    const mouseVelY = state.pointer.y - prevMouseRef.current.y;
    mouseVelRef.current.x = THREE.MathUtils.lerp(mouseVelRef.current.x, mouseVelX, 0.1);
    mouseVelRef.current.y = THREE.MathUtils.lerp(mouseVelRef.current.y, mouseVelY, 0.1);
    prevMouseRef.current.x = state.pointer.x;
    prevMouseRef.current.y = state.pointer.y;
    
    const mouseSpeed = Math.sqrt(mouseVelRef.current.x * mouseVelRef.current.x + mouseVelRef.current.y * mouseVelRef.current.y);
    const isMouseMoving = mouseSpeed > 0.002;
    
    materialRef.current.uniforms.uMouseActive.value = THREE.MathUtils.lerp(
      materialRef.current.uniforms.uMouseActive.value,
      isMouseMoving ? 1.0 : 0.0,
      0.08
    );
    const mouseActive = materialRef.current.uniforms.uMouseActive.value;

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;

      posArray[idx] += velocities[idx];
      posArray[idx + 1] += velocities[idx + 1];
      posArray[idx + 2] += velocities[idx + 2];

      const px = posArray[idx];
      const py = posArray[idx + 1];
      const pz = posArray[idx + 2];

      const dx = mx - px;
      const dy = my - py;
      const distToMouse = Math.sqrt(dx * dx + dy * dy);

      if (distToMouse < 12.0) {
        if (mouseActive > 0.2) {
          const scatterForce = (12.0 - distToMouse) * 0.025 * mouseActive;
          posArray[idx] -= (dx / (distToMouse + 0.1)) * scatterForce;
          posArray[idx + 1] -= (dy / (distToMouse + 0.1)) * scatterForce;
        } else {
          if (distToMouse > 1.0) {
            const attractStrength = 0.006;
            posArray[idx] += (dx / (distToMouse + 0.1)) * attractStrength;
            posArray[idx + 1] += (dy / (distToMouse + 0.1)) * attractStrength;
            
            const orbitSpeed = 0.02;
            const tangentX = -dy / (distToMouse + 0.1);
            const tangentY = dx / (distToMouse + 0.1);
            const orbitStrength = Math.min(1.0, 12.0 / (distToMouse + 1.0));
            posArray[idx] += tangentX * orbitSpeed * orbitStrength;
            posArray[idx + 1] += tangentY * orbitSpeed * orbitStrength;
          }
        }
      }

      if (Math.abs(posArray[idx]) > 22) {
        posArray[idx] *= 0.98;
        velocities[idx] *= -0.3;
      }
      if (Math.abs(posArray[idx + 1]) > 8) {
        posArray[idx + 1] *= 0.98;
        velocities[idx + 1] *= -0.3;
      }
      if (posArray[idx + 2] > -2 || posArray[idx + 2] < -35) {
        velocities[idx + 2] *= -0.3;
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
    uniform float uMouseActive;
    varying float vAlpha;
    varying float vMouseActive;
    varying float vDist;
    
    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      float twinkle = 0.35 + 0.4 * sin(uTime * 1.2 + position.x * 6.0 + position.y * 4.0);
      vAlpha = twinkle;
      vMouseActive = uMouseActive;
      vDist = length(position.xy);
      gl_PointSize = aSize * (25.0 / max(2.0, -mvPosition.z));
    }
  `;

  const fragmentShader = `
    uniform vec3 uColor;
    varying float vAlpha;
    varying float vMouseActive;
    varying float vDist;
    
    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      if (dist > 0.5) discard;
      
      float core = smoothstep(0.5, 0.0, dist);
      float glow = smoothstep(0.5, 0.15, dist) * 0.5;
      float alpha = (core + glow) * vAlpha;
      
      vec3 calmColor = mix(vec3(1.0, 0.80, 0.80), vec3(1.0, 0.45, 0.45), smoothstep(0.0, 0.4, dist));
      vec3 activeColor = mix(vec3(1.0, 0.55, 0.55), vec3(1.0, 0.15, 0.25), smoothstep(0.0, 0.4, dist));
      vec3 color = mix(calmColor, activeColor, vMouseActive);
      
      color = mix(color, vec3(1.0, 0.3, 0.3), smoothstep(10.0, 25.0, vDist) * 0.3);
      
      gl_FragColor = vec4(color, alpha * 0.65);
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

      <lineSegments ref={linesRef} geometry={lineGeometry}>
        <lineBasicMaterial
          color="#661122"
          transparent
          opacity={0.04}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}