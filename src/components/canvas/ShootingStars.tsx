"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface StarData {
  pos: THREE.Vector3;
  dir: THREE.Vector3;
  speed: number;
  progress: number;
  delay: number;
  trailLength: number;
  active: boolean;
}

const STAR_COUNT = 5;
const TRAIL_SEGMENTS = 28;
const TOTAL_PARTICLES = STAR_COUNT * TRAIL_SEGMENTS;

export default function ShootingStars() {
  const pointsRef = useRef<THREE.Points>(null);
  const headRef = useRef<THREE.Points>(null);

  const stars = useMemo<StarData[]>(() => {
    const data: StarData[] = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      data.push({
        pos: new THREE.Vector3(),
        dir: new THREE.Vector3(),
        speed: 18 + Math.random() * 14,
        progress: 0,
        delay: 0.5 + Math.random() * 4.5,
        trailLength: 5 + Math.random() * 4,
        active: false,
      });
    }
    return data;
  }, []);

  // Trail particle buffers
  const trailPositions = useMemo(() => new Float32Array(TOTAL_PARTICLES * 3), []);
  const trailSizes = useMemo(() => new Float32Array(TOTAL_PARTICLES), []);
  const trailColors = useMemo(() => new Float32Array(TOTAL_PARTICLES * 3), []);
  const trailOpacities = useMemo(() => new Float32Array(TOTAL_PARTICLES), []);

  // Head spark buffers
  const headPositions = useMemo(() => new Float32Array(STAR_COUNT * 3), []);
  const headSizes = useMemo(() => {
    const sz = new Float32Array(STAR_COUNT);
    for (let i = 0; i < STAR_COUNT; i++) sz[i] = 8 + Math.random() * 4;
    return sz;
  }, []);

  const resetStar = (star: StarData) => {
    // Spawn in upper-right sky, arc across to lower-left
    star.pos.set(
      12 + Math.random() * 16,
      7 + Math.random() * 8,
      -14 - Math.random() * 10
    );
    star.progress = 0;
    star.delay = 1.0 + Math.random() * 5.0;
    star.speed = 16 + Math.random() * 14;
    star.trailLength = 5 + Math.random() * 5;
    star.active = false;
    // Direction: left, slightly down, slight Z variation
    star.dir.set(
      -0.92 + (Math.random() - 0.5) * 0.08,
      -0.32 + (Math.random() - 0.5) * 0.12,
      (Math.random() - 0.5) * 0.15
    ).normalize();
  };

  // Initialize all stars offscreen
  stars.forEach(s => resetStar(s));

  const trailUniforms = useMemo(() => ({
    uTime: { value: 0 },
  }), []);

  const headUniforms = useMemo(() => ({
    uTime: { value: 0 },
  }), []);

  useFrame((_, delta) => {
    if (!pointsRef.current || !headRef.current) return;
    const dt = Math.min(delta, 0.05);

    const posAttr = pointsRef.current.geometry.attributes.position;
    const posArray = posAttr.array as Float32Array;
    const sizeAttr = pointsRef.current.geometry.attributes.aSize;
    const sizeArray = sizeAttr.array as Float32Array;
    const colAttr = pointsRef.current.geometry.attributes.aColor;
    const colArray = colAttr.array as Float32Array;
    const opAttr = pointsRef.current.geometry.attributes.aOpacity;
    const opArray = opAttr.array as Float32Array;

    const headPosAttr = headRef.current.geometry.attributes.position;
    const headPosArray = headPosAttr.array as Float32Array;

    stars.forEach((star, si) => {
      const baseIdx = si * TRAIL_SEGMENTS;

      if (star.delay > 0) {
        star.delay -= dt;
        // Hide all trail particles offscreen
        for (let j = 0; j < TRAIL_SEGMENTS; j++) {
          const idx = (baseIdx + j) * 3;
          posArray[idx] = 0;
          posArray[idx + 1] = -999;
          posArray[idx + 2] = 0;
          opArray[baseIdx + j] = 0;
        }
        headPosArray[si * 3] = 0;
        headPosArray[si * 3 + 1] = -999;
        headPosArray[si * 3 + 2] = 0;
        return;
      }

      if (!star.active) {
        star.active = true;
      }

      star.progress += dt * star.speed;

      const head = star.pos.clone().addScaledVector(star.dir, star.progress);

      // Update head spark position
      headPosArray[si * 3] = head.x;
      headPosArray[si * 3 + 1] = head.y;
      headPosArray[si * 3 + 2] = head.z;

      // Build trail: interpolate from head backwards along direction
      for (let j = 0; j < TRAIL_SEGMENTS; j++) {
        const t = j / (TRAIL_SEGMENTS - 1); // 0 = head, 1 = tail
        const distBack = t * star.trailLength;
        const point = head.clone().addScaledVector(star.dir, -distBack);

        const idx = (baseIdx + j) * 3;
        posArray[idx] = point.x;
        posArray[idx + 1] = point.y;
        posArray[idx + 2] = point.z;

        // Size: head is largest, tail shrinks
        const sizeCurve = Math.pow(1 - t, 1.4);
        sizeArray[baseIdx + j] = (3.5 + sizeCurve * 5.5) * (0.8 + Math.random() * 0.05);

        // Color temperature: white-hot head -> orange -> red tail
        const r = 1.0;
        const g = t < 0.25 ? 0.95 - t * 1.8 : Math.max(0.08, 0.5 - t * 0.8);
        const b = t < 0.15 ? 0.85 - t * 4.0 : Math.max(0.02, 0.2 - t * 0.4);
        colArray[idx] = r;
        colArray[idx + 1] = g;
        colArray[idx + 2] = b;

        // Opacity: head bright, tail fades out
        const lifeRatio = Math.min(1.0, star.progress / 10.0);
        const lifeFade = Math.sin(lifeRatio * Math.PI); // fade in then out
        const trailFade = Math.pow(1 - t, 0.7);
        opArray[baseIdx + j] = lifeFade * trailFade;
      }

      // Reset when traveled too far
      if (star.progress > 35.0) {
        resetStar(star);
        // Hide head
        headPosArray[si * 3] = 0;
        headPosArray[si * 3 + 1] = -999;
        headPosArray[si * 3 + 2] = 0;
      }
    });

    posAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    opAttr.needsUpdate = true;
    headPosAttr.needsUpdate = true;
  });

  return (
    <group renderOrder={60}>
      {/* Glowing particle trail */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[trailPositions, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[trailSizes, 1]} />
          <bufferAttribute attach="attributes-aColor" args={[trailColors, 3]} />
          <bufferAttribute attach="attributes-aOpacity" args={[trailOpacities, 1]} />
        </bufferGeometry>
        <shaderMaterial
          uniforms={trailUniforms}
          vertexShader={`
            attribute float aSize;
            attribute vec3 aColor;
            attribute float aOpacity;
            varying vec3 vColor;
            varying float vAlpha;
            void main() {
              vColor = aColor;
              vAlpha = aOpacity;
              vec4 mv = modelViewMatrix * vec4(position, 1.0);
              gl_Position = projectionMatrix * mv;
              gl_PointSize = aSize * (28.0 / max(1.0, -mv.z));
              gl_PointSize = min(gl_PointSize, 64.0);
            }
          `}
          fragmentShader={`
            varying vec3 vColor;
            varying float vAlpha;
            void main() {
              vec2 uv = gl_PointCoord - vec2(0.5);
              float d = length(uv);
              // Soft radial glow with hot core
              float core = smoothstep(0.5, 0.0, d);
              float glow = smoothstep(0.5, 0.18, d) * 0.45;
              float halo = smoothstep(0.5, 0.35, d) * 0.15;
              if (core + glow + halo < 0.01) discard;
              float alpha = (core * 1.0 + glow * 0.7 + halo * 0.3) * vAlpha;
              vec3 finalColor = vColor * (1.0 + core * 0.8);
              gl_FragColor = vec4(finalColor, alpha);
            }
          `}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Bright white-hot head spark */}
      <points ref={headRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[headPositions, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[headSizes, 1]} />
        </bufferGeometry>
        <shaderMaterial
          uniforms={headUniforms}
          vertexShader={`
            attribute float aSize;
            varying float vSize;
            void main() {
              vSize = aSize;
              vec4 mv = modelViewMatrix * vec4(position, 1.0);
              gl_Position = projectionMatrix * mv;
              gl_PointSize = aSize * (32.0 / max(1.0, -mv.z));
              gl_PointSize = min(gl_PointSize, 80.0);
            }
          `}
          fragmentShader={`
            varying float vSize;
            void main() {
              vec2 uv = gl_PointCoord - vec2(0.5);
              float d = length(uv);
              // Intense white-hot core
              float core = smoothstep(0.5, 0.0, d);
              // Warm orange-red glow ring
              float glow = smoothstep(0.5, 0.15, d) * 0.6;
              // Wide faint halo
              float halo = smoothstep(0.5, 0.38, d) * 0.2;
              if (core + glow + halo < 0.01) discard;
              // Color: white core, warm outer
              vec3 color = mix(vec3(1.0, 0.92, 0.85), vec3(1.0, 0.4, 0.15), d * 1.8);
              float alpha = core * 1.0 + glow * 0.8 + halo * 0.25;
              gl_FragColor = vec4(color, alpha);
            }
          `}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}