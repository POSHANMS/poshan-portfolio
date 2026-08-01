"use client";

import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { WormholeValues } from "@/animations/wormholeLaptop";

interface WormholeLaptopEntryProps {
  wormholeValues: WormholeValues;
  isActive: boolean;
}

// ═══════════════════════════════════════════════════════════════════════
// DIMENSIONAL RIFT SHADER
// Chromatic-separated event horizon with organic energy pulse
// ═══════════════════════════════════════════════════════════════════════
const riftVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const riftFragmentShader = `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uScale;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec2 uv = vUv;
    float t = uTime;
    
    // Torus UV: x = around the ring, y = across the tube
    float angle = uv.x * 6.28318;
    float tube = uv.y;
    
    // Event horizon core — brilliant white-hot center
    float core = exp(-pow((tube - 0.5) * 4.0, 2.0)) * 1.2;
    
    // Energy veins pulsing around the ring
    float veins = sin(angle * 12.0 + t * 4.0) * 0.5 + 0.5;
    veins = pow(veins, 4.0) * smoothstep(0.3, 0.5, tube) * smoothstep(0.7, 0.5, tube);
    
    // Chromatic aberration separation
    float r = core * 1.0 + veins * 0.9;
    float g = core * 0.2 + veins * 0.3;
    float b = core * 0.4 + veins * 0.6;
    
    // Fresnel rim glow — intense at glancing angles
    vec3 viewDir = normalize(vViewPosition);
    vec3 normal = normalize(vNormal);
    float fresnel = pow(1.0 - abs(dot(normal, viewDir)), 3.0);
    
    // Pulsing singularity beat
    float pulse = sin(t * 6.0) * 0.25 + 0.75;
    
    float alpha = (core * 0.95 + veins * 0.7 + fresnel * 0.6) * uOpacity * pulse;
    if (alpha < 0.005) discard;
    
    vec3 color = vec3(r, g, b) + fresnel * vec3(0.8, 0.1, 0.2);
    gl_FragColor = vec4(color, alpha);
  }
`;

// ═══════════════════════════════════════════════════════════════════════
// ACCRETION PARTICLE SHADER
// Particles swirl inward during gravity, explode on shockwave
// ═══════════════════════════════════════════════════════════════════════
const particleVertexShader = `
  attribute float aPhase;
  attribute float aSpeed;
  varying float vAlpha;
  uniform float uTime;
  uniform float uGravitation;
  uniform float uShockwave;
  
  void main() {
    vAlpha = 0.6 + 0.4 * sin(uTime * 2.0 + aPhase);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size scales with gravitational intensity
    float sizeBoost = 1.0 + uGravitation * 1.5 + uShockwave * 2.0;
    gl_PointSize = (3.0 + aSpeed * 2.0) * sizeBoost * (20.0 / max(1.0, -mvPosition.z));
    gl_PointSize = min(gl_PointSize, 32.0);
  }
`;

const particleFragmentShader = `
  varying float vAlpha;
  uniform float uShockwave;
  
  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;
    
    float core = smoothstep(0.5, 0.0, dist);
    float glow = smoothstep(0.5, 0.15, dist) * 0.5;
    
    // Shockwave particles glow white-hot
    vec3 color = mix(vec3(1.0, 0.08, 0.15), vec3(1.0, 0.9, 0.8), uShockwave);
    float alpha = (core + glow) * vAlpha * (0.8 + uShockwave * 0.4);
    
    gl_FragColor = vec4(color, alpha);
  }
`;

export default function WormholeLaptopEntry({
  wormholeValues,
  isActive,
}: WormholeLaptopEntryProps) {
  const riftRef = useRef<THREE.Mesh>(null);
  const shockwaveRef = useRef<THREE.Mesh>(null);
  const shockwave2Ref = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const singularityMeshRef = useRef<THREE.Mesh>(null);

  const { viewport } = useThree();
  const laptopX = Math.max(0.8, viewport.width * 0.08);

  // Rift shader material (persistent, updated via uniforms)
  const riftMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: riftVertexShader,
      fragmentShader: riftFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uScale: { value: 1 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
  }, []);

  // Accretion disk particles
  const { particlePositions, particlePhases, particleSpeeds } = useMemo(() => {
    const count = 600;
    const pos = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.3 + Math.random() * 4.5;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
      phases[i] = Math.random() * Math.PI * 2;
      speeds[i] = 0.5 + Math.random() * 1.0;
    }
    return { particlePositions: pos, particlePhases: phases, particleSpeeds: speeds };
  }, []);

  const particleUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uGravitation: { value: 0 },
    uShockwave: { value: 0 },
  }), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const v = wormholeValues;

    if (!isActive) return;

    // Update rift shader
    riftMaterial.uniforms.uTime.value = t;
    riftMaterial.uniforms.uOpacity.value = v.riftOpacity;
    riftMaterial.uniforms.uScale.value = v.riftScale;

    // Animate rift mesh
    if (riftRef.current) {
      const s = v.riftScale * 1.6;
      riftRef.current.scale.set(s, s, s);
      riftRef.current.rotation.x = Math.PI / 2;
      riftRef.current.rotation.z = v.riftRotation;
    }

    // Inner singularity glow disc
    if (singularityMeshRef.current) {
      const mat = singularityMeshRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = v.riftOpacity * 0.5;
      const s = v.riftScale * 1.1;
      singularityMeshRef.current.scale.set(s, s, s);
    }

    // Shockwave expansion
    if (shockwaveRef.current) {
      const r = v.shockwaveRadius;
      shockwaveRef.current.scale.set(r, r, r);
      const mat = shockwaveRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = v.shockwaveOpacity * 0.35;
    }

    if (shockwave2Ref.current) {
      const r = v.shockwaveRadius * 0.85;
      shockwave2Ref.current.scale.set(r, r, r);
      const mat = shockwave2Ref.current.material as THREE.MeshBasicMaterial;
      mat.opacity = v.energyRingOpacity * 0.25;
    }

    // Singularity point light — casts real-time floor reflections
    if (lightRef.current) {
      lightRef.current.intensity = v.singularityGlow * 10;
      lightRef.current.distance = 12 + v.singularityGlow * 15;
      lightRef.current.color.setHSL(0.02, 1.0, 0.5 + v.singularityGlow * 0.1);
    }

    // Accretion particle dynamics
    if (particlesRef.current) {
      particleUniforms.uTime.value = t;
      particleUniforms.uGravitation.value = v.gravitationStrength;
      particleUniforms.uShockwave.value = v.shockwaveOpacity > 0.2 ? 1 : 0;

      const posAttr = particlesRef.current.geometry.attributes.position;
      const posArray = posAttr.array as Float32Array;
      const grav = v.gravitationStrength;
      const shock = v.shockwaveOpacity > 0.15 ? v.shockwaveOpacity : 0;

      for (let i = 0; i < 600; i++) {
        const i3 = i * 3;
        let x = posArray[i3];
        let z = posArray[i3 + 2];
        const dist = Math.sqrt(x * x + z * z);
        const angle = Math.atan2(z, x);

        if (grav > 0.01 && shock < 0.2) {
          // Gravitational accretion — spiral inward
          const pull = (1.0 - Math.min(dist / 4.5, 1.0)) * grav * 0.06;
          x -= Math.cos(angle) * pull;
          z -= Math.sin(angle) * pull;
          // Orbital spiral
          const spiral = grav * 0.025 * (1.0 + Math.random() * 0.5);
          x += Math.cos(angle + Math.PI / 2) * spiral;
          z += Math.sin(angle + Math.PI / 2) * spiral;
        }

        if (shock > 0.01) {
          // Shockwave ejection — explode outward
          const push = shock * 0.12;
          x += Math.cos(angle) * push * (0.8 + Math.random() * 0.4);
          z += Math.sin(angle) * push * (0.8 + Math.random() * 0.4);
          posArray[i3 + 1] += shock * 0.02; // lift slightly
        }

        // Reset particles that went too far
        if (dist > 8) {
          const newAngle = Math.random() * Math.PI * 2;
          const newRadius = 0.5 + Math.random() * 4;
          posArray[i3] = Math.cos(newAngle) * newRadius;
          posArray[i3 + 2] = Math.sin(newAngle) * newRadius;
          posArray[i3 + 1] = (Math.random() - 0.5) * 0.2;
        } else {
          posArray[i3] = x;
          posArray[i3 + 2] = z;
        }
      }
      posAttr.needsUpdate = true;
    }
  });

  if (!isActive) return null;

  const v = wormholeValues;

  return (
    <group position={[laptopX + 0.2, -2.14, -1.24]}>

      {/* ═══ DIMENSIONAL RIFT — Rotating event horizon ring ═══ */}
      <mesh ref={riftRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1, 0.12, 32, 120]} />
        <primitive object={riftMaterial} attach="material" />
      </mesh>

      {/* Inner singularity disc — pure void glow */}
      <mesh ref={singularityMeshRef} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.9, 64]} />
        <meshBasicMaterial
          color="#ff0033"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* ═══ ACCRETION PARTICLES — Swirling energy matter ═══ */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particlePositions, 3]} />
          <bufferAttribute attach="attributes-aPhase" args={[particlePhases, 1]} />
          <bufferAttribute attach="attributes-aSpeed" args={[particleSpeeds, 1]} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={particleVertexShader}
          fragmentShader={particleFragmentShader}
          uniforms={particleUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* ═══ SHOCKWAVE RINGS — Expanding floor energy ═══ */}
      <mesh ref={shockwaveRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.96, 1.0, 160]} />
        <meshBasicMaterial
          color="#ff1744"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh ref={shockwave2Ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[0.97, 1.0, 160]} />
        <meshBasicMaterial
          color="#ff4466"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ═══ SINGULARITY LIGHT — Casts real-time floor reflections ═══ */}
      <pointLight
        ref={lightRef}
        position={[0, 0.8, 0]}
        color="#ff1744"
        intensity={0}
        distance={30}
        decay={2}
      />

      {/* Secondary fill light for the rift rim */}
      <pointLight
        position={[0, 0.2, 0]}
        color="#ff8a80"
        intensity={v.riftOpacity * 3}
        distance={8}
        decay={2}
      />

      {/* ═══ FLOOR WARP GLOW — Grid depression illumination ═══ */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[2.5, 64]} />
        <meshBasicMaterial
          color="#ff0033"
          transparent
          opacity={v.floorWarp * 0.2}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <circleGeometry args={[1.2, 48]} />
        <meshBasicMaterial
          color="#ff2244"
          transparent
          opacity={v.floorWarp * 0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Landing impact flash disc — white-hot burst on touchdown */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
        <circleGeometry args={[0.6, 48]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={v.landingImpact * 0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
