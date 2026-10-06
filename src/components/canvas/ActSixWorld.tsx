"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { DeviceTier } from "@/hooks/useDeviceSize";

const ARM_COUNT = 4;
const INITIAL_SIMULATION_SECONDS = 18;
const MAX_SIMULATION_SECONDS = 30;

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.max(minimum, Math.min(maximum, value));
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const amount = clamp((value - edge0) / (edge1 - edge0));
  return amount * amount * (3 - 2 * amount);
}

function random(index: number, salt: number) {
  const value = Math.sin((index + salt) * 127.1 + salt * 311.7) * 43758.5453123;
  return value - Math.floor(value);
}

const galaxyVertexShader = `
  attribute float aRadius;
  attribute float aArm;
  attribute float aSpread;
  attribute float aHeight;
  attribute float aPhase;
  attribute float aSize;
  attribute vec3 aColor;

  uniform float uTime;
  uniform float uReveal;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vCoreEnergy;

  void main() {
    // Differential rotation: material nearest the core advances fastest.
    float radiusRatio = clamp(aRadius / 5.8, 0.0, 1.0);
    float angularVelocity = mix(1.34, 0.075, pow(radiusRatio, 0.54));
    float turbulence =
      sin(aPhase + uTime * 0.33 + aRadius * 3.4) * 0.072 +
      sin(aPhase * 2.7 - uTime * 0.19 + aRadius * 7.8) * 0.034;
    float armAngle = aArm * 1.57079632679 + aRadius * 1.24 + aSpread + uTime * angularVelocity + turbulence;
    float breathing = sin(aPhase * 1.9 + uTime * 0.26 + aRadius * 2.3) * (0.018 + radiusRatio * 0.038);
    float radius = max(0.015, aRadius + breathing);

    // The compressed Y axis and live depth build an oblique galaxy disk.
    vec3 worldPosition = vec3(
      cos(armAngle) * radius,
      sin(armAngle) * radius * 0.49,
      aHeight + sin(armAngle * 2.0 + aPhase + uTime * 0.17) * (0.035 + radiusRatio * 0.09)
    );
    vec4 modelPosition = modelMatrix * vec4(worldPosition, 1.0);
    vec4 modelViewPosition = viewMatrix * modelPosition;

    vColor = aColor;
    vAlpha = uReveal * (0.9 + 0.1 * sin(aPhase + uTime * 0.7));
    vCoreEnergy = 1.0 - smoothstep(0.18, 1.42, aRadius);
    gl_Position = projectionMatrix * modelViewPosition;
    gl_PointSize = aSize * (44.0 / max(5.0, -modelViewPosition.z));
  }
`;

const galaxyFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vCoreEnergy;

  void main() {
    vec2 point = gl_PointCoord - 0.5;
    float distanceToCenter = length(point);
    float particle = smoothstep(0.5, 0.06, distanceToCenter);
    float halo = smoothstep(0.55, 0.14, distanceToCenter) * 0.26;
    float alpha = (particle + halo) * vAlpha * (0.36 + vCoreEnergy * 0.20);
    if (alpha < 0.012) discard;
    gl_FragColor = vec4(vColor * (1.16 + halo * 0.9 + vCoreEnergy * 1.55), alpha);
  }
`;

/**
 * Act VI's galaxy is shader-driven so the core, arms, and dust can move at
 * distinct rates without rebuilding a large particle buffer every frame.
 */
export default function ActSixWorld({
  scrollProgress,
  deviceTier,
}: {
  scrollProgress: number;
  deviceTier: DeviceTier;
}) {
  const groupRef = useRef<THREE.Group>(null);
  // Start from a wound, asymmetric pose instead of the raw four-arm cross.
  const activeTimeRef = useRef(INITIAL_SIMULATION_SECONDS);
  const reveal = smoothstep(0.956, 0.965, scrollProgress);
  // Geometry is static on the CPU. Lower tiers keep the same field shape while
  // the GPU shader supplies all of the motion, bloom, and atmosphere.
  const particleCount = deviceTier === "mobile" ? 20000 : deviceTier === "tablet" ? 34000 : 46000;

  const geometry = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const radii = new Float32Array(particleCount);
    const arms = new Float32Array(particleCount);
    const spreads = new Float32Array(particleCount);
    const heights = new Float32Array(particleCount);
    const phases = new Float32Array(particleCount);
    const sizes = new Float32Array(particleCount);

    const whiteGold = new THREE.Color("#fff2b7");
    const amber = new THREE.Color("#ff9f1c");
    const orange = new THREE.Color("#e85d04");
    const copper = new THREE.Color("#7a2608");
    const umber = new THREE.Color("#2b0c02");

    for (let index = 0; index < particleCount; index += 1) {
      const randomA = random(index, 17);
      const randomB = random(index, 53);
      const randomC = random(index, 101);
      const selector = random(index, 149);
      const i3 = index * 3;

      let radius: number;
      let height: number;
      let size: number;
      let color: THREE.Color;

      if (selector < 0.24) {
        // Dense, hot central bulge. A cubic distribution packs light into the core.
        radius = Math.pow(randomA, 2.7) * 1.26;
        height = (randomB - 0.5) * (0.52 + radius * 0.18);
        size = 0.42 + randomC * 0.78;
        color = whiteGold.clone().lerp(amber, Math.pow(radius / 1.26, 1.4) * 0.62);
      } else if (selector < 0.92) {
        // The main arms are dense near the centre and broaden gradually into dusty edges.
        const local = (selector - 0.24) / 0.68;
        radius = 0.42 + Math.pow(local, 0.72) * 5.55;
        const width = 0.025 + radius * 0.045;
        height = (randomB - 0.5) * (0.08 + radius * 0.115) + (randomC - 0.5) * width;
        size = 0.12 + randomC * 0.32 + (1 - radius / 6) * 0.28;
        const falloff = clamp((radius - 0.6) / 5.6);
        color = amber.clone()
          .lerp(orange, Math.pow(falloff, 0.74) * 0.78)
          .lerp(copper, Math.pow(falloff, 2.2) * 0.76);
      } else {
        // A faint uneven dust envelope keeps the outer disk from ending abruptly.
        radius = 3.2 + Math.pow(randomA, 0.68) * 2.75;
        height = (randomB - 0.5) * (0.46 + radius * 0.12);
        size = 0.08 + randomC * 0.14;
        color = copper.clone().lerp(umber, randomA * 0.7);
      }

      positions[i3] = 0;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = 0;
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
      radii[index] = radius;
      arms[index] = Math.floor(randomB * ARM_COUNT);
      spreads[index] = (randomC - 0.5) * (0.045 + radius * 0.09);
      heights[index] = height;
      phases[index] = random(index, 211) * Math.PI * 2;
      sizes[index] = size;
    }

    const nextGeometry = new THREE.BufferGeometry();
    nextGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    nextGeometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    nextGeometry.setAttribute("aRadius", new THREE.BufferAttribute(radii, 1));
    nextGeometry.setAttribute("aArm", new THREE.BufferAttribute(arms, 1));
    nextGeometry.setAttribute("aSpread", new THREE.BufferAttribute(spreads, 1));
    nextGeometry.setAttribute("aHeight", new THREE.BufferAttribute(heights, 1));
    nextGeometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    nextGeometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    return nextGeometry;
  }, [particleCount]);

  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uReveal: { value: 0 } },
    vertexShader: galaxyVertexShader,
    fragmentShader: galaxyFragmentShader,
    vertexColors: false,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  }), []);

  useFrame((_state, delta) => {
    // Differential rotation is capped once the arms reach their composed pose.
    // Without this cap, the inner arms eventually shear through every dust lane.
    if (reveal > 0.1) {
      activeTimeRef.current = Math.min(activeTimeRef.current + delta, MAX_SIMULATION_SECONDS);
    }
    material.uniforms.uTime.value = activeTimeRef.current;
    material.uniforms.uReveal.value = THREE.MathUtils.damp(material.uniforms.uReveal.value, reveal, 4.8, delta);

    if (groupRef.current) {
      groupRef.current.visible = material.uniforms.uReveal.value > 0.002;
      groupRef.current.scale.setScalar(THREE.MathUtils.damp(groupRef.current.scale.x, 1.3 + reveal * 0.14, 4.5, delta));
    }
  });

  return (
    <group ref={groupRef} position={[0.18, 0.1, -7.35]} rotation={[0.11, -0.08, 0.27]} scale={0.001}>
      <pointLight color="#ffd07a" intensity={7} distance={12} decay={2} />
      <pointLight position={[-1.3, 0.7, 1.6]} color="#ff7a10" intensity={1.2} distance={9} decay={2} />
      <points geometry={geometry} frustumCulled={false} renderOrder={2}>
        <primitive object={material} attach="material" />
      </points>
    </group>
  );
}
