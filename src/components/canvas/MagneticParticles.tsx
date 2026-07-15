"use client";

import React, { useMemo, useRef, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMousePosition } from "@/hooks/useMousePosition";

/*
 * CometTrail Particle System — "Overkill" Edition
 * 
 * Two layers working together:
 * 
 * 1. AMBIENT FIELD (1200 particles):
 *    Slowly drifting cosmic dust across the viewport.
 *    Gentle twinkle. Constant soft glow. Sets the atmosphere.
 *
 * 2. COMET TRAIL (400 particles, recycled ring buffer):
 *    As the user moves their mouse, particles spawn at the cursor
 *    position and drift away behind the cursor path like a glowing
 *    comet tail. Features:
 *    - Speed-sensitive: faster mouse = longer, brighter trail
 *    - Directional drift: particles eject opposite to mouse velocity
 *    - Color temperature shift: fresh sparks are bright white-hot,
 *      they cool down through red → dark crimson as they age
 *    - Size decay: large bright spark → shrinking dying ember
 *    - Gravity pull: old particles slowly drift downward
 *    - Turbulence: subtle random jitter so the trail feels organic
 *    - Afterglow: particles don't just disappear, they fade out with
 *      a soft bloom-friendly glow
 */

const AMBIENT_COUNT = 2500;
const TRAIL_COUNT = 1500;
const TOTAL = AMBIENT_COUNT + TRAIL_COUNT;

export default function ParticleNetwork() {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const mouse = useMousePosition(0.12);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const trailIndexRef = useRef(0);
  const velocityRef = useRef({ x: 0, y: 0 });

  const {
    positions, sizes, phases, lifetimes, maxLifetimes,
    trailVelocities, trailColors,
  } = useMemo(() => {
    const pos = new Float32Array(TOTAL * 3);
    const sz = new Float32Array(TOTAL);
    const ph = new Float32Array(TOTAL);
    const life = new Float32Array(TOTAL);
    const maxLife = new Float32Array(TOTAL);
    const tVel = new Float32Array(TRAIL_COUNT * 3);
    const tCol = new Float32Array(TOTAL); // 0=ambient, 0-1=trail age

    // --- Ambient particles ---
    for (let i = 0; i < AMBIENT_COUNT; i++) {
      const idx = i * 3;
      pos[idx]     = (Math.random() - 0.5) * 38;
      pos[idx + 1] = (Math.random() - 0.5) * 22;
      pos[idx + 2] = (Math.random() - 0.5) * 14;
      // Smaller, delicate background stars
      sz[i] = 0.2 + Math.random() * 0.6;
      ph[i] = Math.random() * Math.PI * 2;
      life[i] = -1; // -1 = ambient, always alive
      maxLife[i] = -1;
      tCol[i] = 0;
    }

    // --- Trail particles (all start dead) ---
    for (let i = AMBIENT_COUNT; i < TOTAL; i++) {
      const idx = i * 3;
      pos[idx] = 0;
      pos[idx + 1] = -999; // hidden offscreen
      pos[idx + 2] = 0;
      sz[i] = 0;
      ph[i] = Math.random() * Math.PI * 2;
      life[i] = 0;
      maxLife[i] = 0;
      tCol[i] = 1;
    }

    return {
      positions: pos,
      sizes: sz,
      phases: ph,
      lifetimes: life,
      maxLifetimes: maxLife,
      trailVelocities: tVel,
      trailColors: tCol,
    };
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color("#ff1744") },
    }),
    []
  );

  // Spawn trail particles at cursor position (rocket boost explosion effect)
  const spawnTrail = useCallback(
    (wx: number, wy: number, vx: number, vy: number, speed: number) => {
      // Denser trail: spawn 3-18 particles per frame depending on speed
      const count = Math.min(18, Math.max(3, Math.floor(speed * 25)));

      for (let s = 0; s < count; s++) {
        const i = AMBIENT_COUNT + trailIndexRef.current;
        trailIndexRef.current = (trailIndexRef.current + 1) % TRAIL_COUNT;

        const idx = i * 3;
        const tIdx = (i - AMBIENT_COUNT) * 3;

        // Expanded start scatter for a cloud-like explosion shape
        const scatter = 0.12 + speed * 0.35;
        positions[idx]     = wx + (Math.random() - 0.5) * scatter;
        positions[idx + 1] = wy + (Math.random() - 0.5) * scatter;
        positions[idx + 2] = (Math.random() - 0.5) * 1.0;

        // Eject in a massive 220-degree cone opposite to cursor velocity
        const angle = Math.atan2(-vy, -vx) + (Math.random() - 0.5) * 2.0;
        
        // High-velocity thrust ejection
        const ejectSpeed = (0.04 + speed * 0.14) * (0.6 + Math.random() * 1.2);
        trailVelocities[tIdx]     = Math.cos(angle) * ejectSpeed + (Math.random() - 0.5) * 0.02;
        trailVelocities[tIdx + 1] = Math.sin(angle) * ejectSpeed + (Math.random() - 0.5) * 0.02;
        trailVelocities[tIdx + 2] = (Math.random() - 0.5) * 0.01;

        // Varied small spark sizes
        sizes[i] = 0.3 + Math.random() * 0.9 + speed * 1.0;

        // Snappy spark lifetime: 0.6 to 1.5 seconds
        const baseLife = 0.6 + Math.random() * 0.9;
        maxLifetimes[i] = baseLife;
        lifetimes[i] = baseLife;
      }
    },
    [positions, sizes, lifetimes, maxLifetimes, trailVelocities]
  );

  useFrame((state) => {
    if (!pointsRef.current || !materialRef.current) return;

    const t = state.clock.getElapsedTime();
    const dt = Math.min(state.clock.getDelta(), 0.05); // cap delta
    materialRef.current.uniforms.uTime.value = t;

    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position;
    const posArray = posAttr.array as Float32Array;
    const sizeAttr = geo.attributes.aSize;
    const sizeArray = sizeAttr.array as Float32Array;
    const ageAttr = geo.attributes.aAge;
    const ageArray = ageAttr.array as Float32Array;

    // --- Exact Screen-to-World Translation using R3F state viewport ---
    const { viewport } = state;
    const mx = (mouse.x * viewport.width) / 2;
    const my = (mouse.y * viewport.height) / 2;
    
    const vx = mx - prevMouseRef.current.x;
    const vy = my - prevMouseRef.current.y;
    const speed = Math.sqrt(vx * vx + vy * vy);

    // Smooth velocity for ejection direction
    velocityRef.current.x = THREE.MathUtils.lerp(velocityRef.current.x, vx, 0.3);
    velocityRef.current.y = THREE.MathUtils.lerp(velocityRef.current.y, vy, 0.3);

    prevMouseRef.current.x = mx;
    prevMouseRef.current.y = my;

    // Spawn trail if mouse is moving
    if (speed > 0.01) {
      spawnTrail(mx, my, velocityRef.current.x, velocityRef.current.y, Math.min(speed, 2.0));
    }

    // --- Update ambient particles ---
    for (let i = 0; i < AMBIENT_COUNT; i++) {
      const idx = i * 3;
      // Gentle organic drift
      posArray[idx]     += Math.sin(t * 0.18 + phases[i]) * 0.003;
      posArray[idx + 1] += Math.cos(t * 0.12 + phases[i] * 1.7) * 0.003;
      posArray[idx + 2] += Math.sin(t * 0.1 + phases[i] * 0.5) * 0.001;

      // Twinkle size
      sizeArray[i] = sizes[i] * (0.6 + 0.4 * Math.sin(t * 1.2 + phases[i]));
      ageArray[i] = 0.0; // 0 = ambient (cool, steady glow)
    }

    // --- Update trail particles ---
    for (let i = AMBIENT_COUNT; i < TOTAL; i++) {
      if (lifetimes[i] <= 0) {
        // Dead particle — hide offscreen
        posArray[i * 3 + 1] = -999;
        sizeArray[i] = 0;
        ageArray[i] = 1.0;
        continue;
      }

      lifetimes[i] -= dt;
      const age = 1.0 - (lifetimes[i] / maxLifetimes[i]); // 0=fresh, 1=dying
      ageArray[i] = age;

      const idx = i * 3;
      const tIdx = (i - AMBIENT_COUNT) * 3;

      // Apply velocity
      posArray[idx]     += trailVelocities[tIdx]     * (1.0 - age * 0.7);
      posArray[idx + 1] += trailVelocities[tIdx + 1] * (1.0 - age * 0.7);
      posArray[idx + 2] += trailVelocities[tIdx + 2] * (1.0 - age * 0.5);

      // Gravity: old particles drift down slowly
      posArray[idx + 1] -= age * age * 0.008;

      // Turbulence: random jitter that increases with age for exhaust scattering
      const turb = age * 0.035;
      posArray[idx]     += (Math.random() - 0.5) * turb;
      posArray[idx + 1] += (Math.random() - 0.5) * turb;

      // Velocity drag (slow down over time)
      trailVelocities[tIdx]     *= 0.97;
      trailVelocities[tIdx + 1] *= 0.97;
      trailVelocities[tIdx + 2] *= 0.97;

      // Size: large spark → shrinking ember
      const sizeCurve = 1.0 - age * age; // quadratic decay
      sizeArray[i] = sizes[i] * sizeCurve * (0.3 + 0.7 * (1.0 - age));
    }

    posAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
    ageAttr.needsUpdate = true;
  });

  // --- Shader: vertex ---
  const vertexShader = `
    attribute float aSize;
    attribute float aPhase;
    attribute float aAge;
    uniform float uTime;
    varying float vAge;
    varying float vTwinkle;

    void main() {
      vAge = aAge;
      
      // Ambient particles twinkle; trail particles don't need it
      vTwinkle = aAge < 0.01 
        ? 0.5 + 0.5 * sin(uTime * 1.5 + aPhase) 
        : 1.0;
      
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Depth-based sizing
      gl_PointSize = aSize * vTwinkle * (28.0 / -mvPosition.z);
      
      // Clamp so trail sparks don't get absurdly large up close
      gl_PointSize = min(gl_PointSize, 48.0);
    }
  `;

  // --- Shader: fragment ---
  const fragmentShader = `
    uniform vec3 uColor;
    uniform float uTime;
    varying float vAge;
    varying float vTwinkle;

    void main() {
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      
      // Soft circular mask
      if (dist > 0.5) discard;
      
      // Radial glow: dense hot core, soft halo edge
      float core = smoothstep(0.5, 0.0, dist);
      float halo = smoothstep(0.5, 0.15, dist) * 0.35;
      float brightness = core + halo;
      
      // === COLOR TEMPERATURE based on age ===
      // age 0.0 = ambient steady glow (cool red)
      // age 0.01-0.2 = FRESH trail spark (white-hot, blazing)
      // age 0.2-0.6 = COOLING (bright orange-red)
      // age 0.6-1.0 = DYING ember (deep dark crimson, fading)
      
      vec3 color;
      float alpha;
      
      if (vAge < 0.01) {
        // Ambient particle — steady crimson glow
        color = mix(uColor, vec3(1.0, 0.3, 0.4), smoothstep(0.1, 0.45, coord.x + 0.5));
        alpha = brightness * vTwinkle * 0.72;
      } else {
        // Trail particle — temperature-based coloring
        vec3 whiteHot = vec3(1.0, 0.95, 0.9);        // blazing white
        vec3 hotOrange = vec3(1.0, 0.4, 0.15);        // hot orange
        vec3 warmRed = vec3(0.9, 0.12, 0.08);         // warm red
        vec3 deadEmber = vec3(0.25, 0.02, 0.02);      // dying ember
        
        float age = vAge;
        
        if (age < 0.15) {
          // White-hot spark phase
          float t = age / 0.15;
          color = mix(whiteHot, hotOrange, t);
        } else if (age < 0.45) {
          // Cooling phase
          float t = (age - 0.15) / 0.30;
          color = mix(hotOrange, warmRed, t);
        } else {
          // Dying ember phase
          float t = (age - 0.45) / 0.55;
          color = mix(warmRed, deadEmber, t);
        }
        
        // Fresh sparks are brighter, dying embers are dimmer
        float ageFade = 1.0 - age * age; // quadratic fadeout
        alpha = brightness * ageFade * 1.2;
        
        // Extra core intensity for fresh sparks (the "POP")
        float sparkPop = (1.0 - smoothstep(0.0, 0.2, age)) * core * 0.8;
        alpha += sparkPop;
      }
      
      alpha = clamp(alpha, 0.0, 1.0);
      if (alpha < 0.005) discard;
      
      gl_FragColor = vec4(color, alpha);
    }
  `;

  // Age attribute for all particles
  const ageData = useMemo(() => new Float32Array(TOTAL), []);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        <bufferAttribute attach="attributes-aAge" args={[ageData, 1]} />
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
  );
}
