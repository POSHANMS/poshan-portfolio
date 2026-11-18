"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { DeviceTier } from "@/hooks/useDeviceSize";
import { ACT_FIVE_TIMING } from "@/animations/actFiveChoreography";

const ARM_COUNT = 4;
const INITIAL_SIMULATION_SECONDS = 18;

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
  uniform float uFocusStrength;
  uniform float uFocusRadius;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vCoreEnergy;
  varying float vFocusShock;
  varying float vDustNoise;
  varying float vOuterDust;

  float hash31(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  float noise3(vec3 p) {
    vec3 cell = floor(p);
    vec3 local = fract(p);
    local = local * local * (3.0 - 2.0 * local);
    float a = mix(hash31(cell), hash31(cell + vec3(1.0, 0.0, 0.0)), local.x);
    float b = mix(hash31(cell + vec3(0.0, 1.0, 0.0)), hash31(cell + vec3(1.0, 1.0, 0.0)), local.x);
    float c = mix(hash31(cell + vec3(0.0, 0.0, 1.0)), hash31(cell + vec3(1.0, 0.0, 1.0)), local.x);
    float d = mix(hash31(cell + vec3(0.0, 1.0, 1.0)), hash31(cell + vec3(1.0, 1.0, 1.0)), local.x);
    return mix(mix(a, b, local.y), mix(c, d, local.y), local.z);
  }

  void main() {
    // Preserve the original four-arm galaxy silhouette. Its angular phase
    // advances as one pattern so the arms keep their authored spacing over time.
    float radiusRatio = clamp(aRadius / 5.8, 0.0, 1.0);
    float turbulence =
      sin(aPhase + aRadius * 3.4 + uTime * 0.11) * 0.052 +
      sin(aPhase * 2.7 + aRadius * 7.8 - uTime * 0.073) * 0.026;
    float eddy = noise3(vec3(aPhase * 1.7, aRadius * 2.4, uTime * 0.12)) - 0.5;
    // Differential rotation: the inner bulge turns faster while the outer
    // arms drift more slowly, without changing the authored orbit radii.
    // Keep the galaxy silhouette fixed. Particles stream locally along their
    // authored arm lanes with a bounded phase oscillation instead of rotating
    // the whole structure or accumulating enough shear to erase the gaps.
    float orbitRate = mix(0.42, 0.2, smoothstep(0.65, 1.7, aRadius));
    float stream = sin(uTime * orbitRate + aPhase) * (0.045 + radiusRatio * 0.025);
    float armAngle = aArm * 1.57079632679 + aRadius * 1.24 + aSpread + stream + turbulence + eddy * 0.028;
    // Preserve the authored silhouette and gaps: particles orbit in place
    // instead of breathing radially and slowly turning the galaxy into a disk.
    float radius = max(0.015, aRadius);

    // The compressed Y axis and live depth build an oblique galaxy disk.
    vec3 worldPosition = vec3(
      cos(armAngle) * radius,
      sin(armAngle) * radius * 0.49,
      aHeight + sin(armAngle * 2.0 + aPhase + uTime * 0.17) * (0.035 + radiusRatio * 0.09)
        + eddy * (0.018 + radiusRatio * 0.025)
    );
    vec4 modelPosition = modelMatrix * vec4(worldPosition, 1.0);
    vec4 modelViewPosition = viewMatrix * modelPosition;

    // Softly carve gas lanes into the arms, with slow temporal drift so the
    // dust feels volumetric while every particle remains on its fixed orbit.
    vDustNoise = noise3(worldPosition * vec3(2.2, 4.8, 3.5) + vec3(0.0, uTime * 0.035, 0.0));
    // Keep the nucleus warm, then let irregular blue-violet dust lanes take
    // over farther out. Noise breaks up the color bands into nebular wisps.
    vec3 nebulaBlue = vec3(0.2, 0.58, 1.0);
    vec3 nebulaIce = vec3(0.48, 0.78, 1.0);
    vec3 nebulaIndigo = vec3(0.16, 0.12, 0.58);
    vec3 nebulaViolet = vec3(0.55, 0.2, 0.9);
    vec3 outerPalette = mix(nebulaIndigo, nebulaBlue, smoothstep(0.22, 0.76, vDustNoise));
    outerPalette = mix(outerPalette, nebulaViolet, smoothstep(0.62, 0.9, noise3(worldPosition * 5.4 + vec3(uTime * 0.02))));
    outerPalette = mix(outerPalette, nebulaIce, smoothstep(0.78, 0.96, vDustNoise) * 0.58);
    float outerDust = smoothstep(0.2, 0.78, radiusRatio);
    vOuterDust = outerDust;
    float warmKnot = smoothstep(0.76, 0.94, vDustNoise) * (1.0 - smoothstep(0.34, 0.7, radiusRatio));
    vColor = mix(aColor, outerPalette, outerDust * 0.86);
    vColor = mix(vColor, vec3(1.0, 0.31, 0.12), warmKnot * 0.38);
    vFocusShock = exp(-abs(aRadius - uFocusRadius) * 5.0) * uFocusStrength;
    // Ignite the dense core first, then reveal the four spiral arms outward.
    // This only changes particle visibility; their radii and the final silhouette stay fixed.
    float armIgnition = smoothstep(aRadius * 0.105, aRadius * 0.105 + 0.2, uReveal * 1.35);
    vAlpha = armIgnition * (0.66 + vDustNoise * 0.48) * (0.94 + 0.06 * sin(aPhase + uTime * 0.7));
    vCoreEnergy = 1.0 - smoothstep(0.18, 1.42, aRadius);
    gl_Position = projectionMatrix * modelViewPosition;
    gl_PointSize = aSize * (44.0 / max(5.0, -modelViewPosition.z));
  }
`;

const galaxyFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vCoreEnergy;
  varying float vFocusShock;
  varying float vDustNoise;
  varying float vOuterDust;

  void main() {
    vec2 point = gl_PointCoord - 0.5;
    float distanceToCenter = length(point);
    float particle = smoothstep(0.5, 0.06, distanceToCenter);
    float halo = smoothstep(0.55, 0.14, distanceToCenter) * 0.26;
    float laneDensity = smoothstep(0.12, 0.88, vDustNoise);
    float alpha = (particle + halo) * vAlpha * (0.27 + vCoreEnergy * 0.16) * (0.7 + laneDensity * 0.36);
    if (alpha < 0.012) discard;
    vec3 focusColor = vec3(1.0, 0.77, 0.45);
    gl_FragColor = vec4(mix(vColor * (1.12 + halo * 0.6 + vCoreEnergy * 0.86) * (1.0 + vOuterDust * 0.28), focusColor * 1.38, vFocusShock * 0.72), alpha + vFocusShock * 0.28);
  }
`;

const nebulaCloudVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const nebulaCloudFragmentShader = `
  uniform float uTime;
  uniform float uLayer;
  varying vec2 vUv;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise21(vec2 p) {
    vec2 cell = floor(p);
    vec2 local = fract(p);
    local = local * local * (3.0 - 2.0 * local);
    float a = hash21(cell);
    float b = hash21(cell + vec2(1.0, 0.0));
    float c = hash21(cell + vec2(0.0, 1.0));
    float d = hash21(cell + vec2(1.0, 1.0));
    return mix(mix(a, b, local.x), mix(c, d, local.x), local.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int octave = 0; octave < 4; octave++) {
      value += noise21(p) * amplitude;
      p = p * 2.03 + vec2(13.1, 7.7);
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    p.x *= 1.55;
    float radius = length(p);
    float angle = atan(p.y, p.x);
    float safeRadius = max(radius, 0.035);
    float time = uTime * (0.018 + uLayer * 0.008);
    float fieldNoise = fbm(p * (4.1 + uLayer * 0.8) + vec2(time, -time * 0.62));
    float cloudNoise = fbm(p * (8.3 + uLayer * 1.4) - vec2(time * 0.8, time * 0.34));
    float sceneRadius = safeRadius * 5.95;
    float spiralFlow = sin(time * 0.72 + sceneRadius * 1.4 + fieldNoise * 2.0) * 0.035;
    // Match the gas lanes to the four particle arms (angle = arm + radius*1.24)
    // so the volumetric dust reads as one coherent galaxy, not a second ring set.
    float spiral = angle - sceneRadius * 1.24 + spiralFlow + uLayer * 0.12;

    // Broad gas lanes carry the grand spiral; secondary wisps and turbulent
    // knots break their edges so the result reads as a nebula, not a ring mesh.
    float broadArms = pow(max(cos(spiral * 4.0), 0.0), 2.1);
    float fineArms = pow(max(cos(spiral * 4.0 + 0.08), 0.0), 7.0);
    float secondaryWisps = pow(max(cos(spiral * 8.0 + 0.7), 0.0), 9.0);
    float radialFade = 1.0 - smoothstep(0.74, 1.13, radius);
    float innerGlow = exp(-radius * 3.4);
    float starFormingKnots = smoothstep(0.58, 0.86, cloudNoise) * fineArms;
    float dustLane = pow(max(cos(spiral * 4.0 - 0.52), 0.0), 13.0)
      * smoothstep(0.18, 0.44, radius) * radialFade;

    vec3 indigo = vec3(0.075, 0.105, 0.30);
    vec3 blue = vec3(0.12, 0.33, 0.68);
    vec3 violet = vec3(0.29, 0.13, 0.43);
    vec3 amber = vec3(0.72, 0.31, 0.09);
    vec3 gold = vec3(1.0, 0.73, 0.34);
    vec3 outerGas = mix(indigo, blue, smoothstep(0.28, 0.74, fieldNoise));
    outerGas = mix(outerGas, violet, smoothstep(0.58, 0.86, cloudNoise) * 0.62);
    vec3 gasColor = mix(outerGas, mix(amber, gold, fieldNoise), innerGlow * 0.82);
    gasColor = mix(gasColor, vec3(0.012, 0.016, 0.034), dustLane * 0.78);

    float armVolume = radialFade * (0.25 * broadArms + 0.32 * fineArms + 0.12 * secondaryWisps);
    float turbulentHaze = radialFade * fieldNoise * 0.19;
    float knotGlow = starFormingKnots * radialFade * 0.16;
    float alpha = clamp((armVolume * (0.58 + fieldNoise * 0.72) + turbulentHaze + knotGlow + innerGlow * 0.1 + dustLane * 0.06) * (uLayer == 0.0 ? 0.88 : 0.66), 0.0, 0.42);
    if (alpha < 0.006) discard;
    gl_FragColor = vec4(gasColor, alpha);
  }
`;

function NebulaCloudLayers() {
  const farLayer = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uLayer: { value: 0 } },
    vertexShader: nebulaCloudVertexShader,
    fragmentShader: nebulaCloudFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    side: THREE.DoubleSide,
    toneMapped: false,
  }), []);
  const nearLayer = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uLayer: { value: 1 } },
    vertexShader: nebulaCloudVertexShader,
    fragmentShader: nebulaCloudFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    side: THREE.DoubleSide,
    toneMapped: false,
  }), []);

  useFrame(({ clock }) => {
    farLayer.uniforms.uTime.value = clock.elapsedTime;
    nearLayer.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <>
      <mesh position={[0, 0, -0.58]} scale={[1.03, 1.03, 1]} renderOrder={1}>
        <planeGeometry args={[11.9, 7.35, 1, 1]} />
        <primitive object={farLayer} attach="material" />
      </mesh>
      <mesh position={[0, 0, -0.4]} scale={[0.96, 0.96, 1]} renderOrder={1}>
        <planeGeometry args={[11.9, 7.35, 1, 1]} />
        <primitive object={nearLayer} attach="material" />
      </mesh>
    </>
  );
}

const dissolveVertexShader = `
  attribute float aSeed;
  uniform float uTime;
  uniform float uProgress;
  uniform vec3 uCore;
  varying float vFade;
  void main() {
    float eased = 1.0 - pow(1.0 - uProgress, 3.2);
    float spiralAngle = aSeed * 37.0 + uTime * (3.0 + eased * 5.0);
    vec3 orbit = vec3(sin(spiralAngle), cos(aSeed * 23.0 + uTime * 4.1), sin(aSeed * 51.0 + uTime * 3.4)) * (0.08 + eased * 0.62) * (1.0 - eased);
    vec3 p = mix(position, uCore, eased) + orbit * (1.0 - eased);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (1.3 + aSeed * 2.4) * (36.0 / max(4.0, -mv.z));
    vFade = 1.0 - smoothstep(0.76, 1.0, uProgress);
  }
`;

const dissolveFragmentShader = `
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float alpha = (1.0 - smoothstep(0.16, 0.5, d)) * vFade;
    if (alpha < 0.015) discard;
    gl_FragColor = vec4(1.0, 0.47 + (1.0 - d) * 0.26, 0.13, alpha);
  }
`;

/**
 * Act VI's spiral stays at one authored angle while gas and particles stream
 * within the arms, preserving the same galaxy silhouette throughout Contact.
 */
export default function ActSixWorld({
  scrollProgress,
  deviceTier,
}: {
  scrollProgress: number;
  deviceTier: DeviceTier;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const dissolveRef = useRef<THREE.Points>(null);
  const focusRingRef = useRef<THREE.Mesh>(null);
  const focusStartedAt = useRef<number | null>(null);
  const submitStartedAt = useRef<number | null>(null);
  const submitRequested = useRef(false);
  const dissolveScreenRect = useRef<{ left: number; top: number; width: number; height: number } | null>(null);
  // Start from a wound, asymmetric pose instead of the raw four-arm cross.
  const activeTimeRef = useRef(INITIAL_SIMULATION_SECONDS);
  // Start the galaxy during Act V's final fade so the shared starfield and
  // warm core cover the environment handoff without a black gap.
  const reveal = smoothstep(ACT_FIVE_TIMING.cameraExitStart, ACT_FIVE_TIMING.sceneExit, scrollProgress);
  // Geometry is static on the CPU. Lower tiers keep the same field shape while
  // the GPU shader supplies all of the motion, bloom, and atmosphere.
  const particleCount = deviceTier === "mobile" ? 20000 : deviceTier === "tablet" ? 34000 : 96000;

  useEffect(() => {
    const onFocus = () => { focusStartedAt.current = null; };
    const onSubmit = (event: Event) => {
      const detail = (event as CustomEvent<{ left?: number; top?: number; width?: number; height?: number }>).detail;
      dissolveScreenRect.current = detail && detail.width && detail.height
        ? { left: detail.left ?? 0, top: detail.top ?? 0, width: detail.width, height: detail.height }
        : null;
      submitRequested.current = true;
      submitStartedAt.current = null;
    };
    window.addEventListener("act-six-input-focus", onFocus);
    window.addEventListener("act-six-submit-dissolve", onSubmit);
    return () => {
      window.removeEventListener("act-six-input-focus", onFocus);
      window.removeEventListener("act-six-submit-dissolve", onSubmit);
    };
  }, []);

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
    const orange = new THREE.Color("#e87655");
    const copper = new THREE.Color("#a359a5");
    const umber = new THREE.Color("#26345c");
    const indigo = new THREE.Color("#30226f");
    const nebulaBlue = new THREE.Color("#4388e8");
    const violet = new THREE.Color("#8b55c9");

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
        // Restore the dense original four-arm distribution around the core.
        const local = (selector - 0.24) / 0.68;
        radius = 0.42 + Math.pow(local, 0.72) * 5.55;
        const width = 0.025 + radius * 0.045;
        height = (randomB - 0.5) * (0.08 + radius * 0.115) + (randomC - 0.5) * width;
        size = 0.12 + randomC * 0.32 + (1 - radius / 6) * 0.28;
        const falloff = clamp((radius - 0.6) / 5.6);
        color = amber.clone()
          .lerp(orange, Math.pow(falloff, 0.74) * 0.72)
          .lerp(copper, Math.pow(falloff, 2.2) * 0.52);
        // A minority of the outer-arm dust carries cool reflected nebula light;
        // warm star-forming knots remain scattered through the same spiral arms.
        if (radius > 2.1 && random(index, 313) > 0.34) {
          const coolDust = indigo.clone().lerp(nebulaBlue, random(index, 337) * 0.72)
            .lerp(violet, random(index, 359) * 0.46);
          color.lerp(coolDust, smoothstep(2.1, 5.85, radius) * (0.48 + random(index, 373) * 0.3));
        }
      } else {
        // A faint uneven dust envelope keeps the outer disk from ending abruptly.
        radius = 3.2 + Math.pow(randomA, 0.68) * 2.75;
        height = (randomB - 0.5) * (0.46 + radius * 0.12);
        size = 0.08 + randomC * 0.14;
        color = new THREE.Color("#815fba").lerp(umber, randomA * 0.4)
          .lerp(nebulaBlue, 0.24 + randomC * 0.25)
          .lerp(violet, randomB * 0.24);
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
    uniforms: { uTime: { value: 0 }, uReveal: { value: 0 }, uFocusStrength: { value: 0 }, uFocusRadius: { value: 0 } },
    vertexShader: galaxyVertexShader,
    fragmentShader: galaxyFragmentShader,
    vertexColors: false,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  }), []);

  const dissolveGeometry = useMemo(() => {
    const count = deviceTier === "mobile" ? 520 : 1080;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let index = 0; index < count; index += 1) {
      const seed = random(index, 907);
      // Populate a glass-panel silhouette with quiet horizontal form rows.
      const row = index % 9;
      const inRow = index % 3 === 0;
      positions[index * 3] = (random(index, 911) - 0.5) * 3.45;
      positions[index * 3 + 1] = inRow ? 1.78 - row * 0.42 : (random(index, 919) - 0.5) * 3.85;
      positions[index * 3 + 2] = (random(index, 929) - 0.5) * 0.035;
      seeds[index] = seed;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    return geometry;
  }, [deviceTier]);

  const dissolveMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uProgress: { value: 0 }, uCore: { value: new THREE.Vector3() } },
    vertexShader: dissolveVertexShader,
    fragmentShader: dissolveFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  }), []);

  const focusRingGeometry = useMemo(() => new THREE.TorusGeometry(1, 0.012, 6, 112), []);
  const focusRingMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: "#dcecff",
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
  }), []);

  useFrame((state, delta) => {
    // Keep the authored galaxy pattern alive for the full visit. Its particle
    // coordinates stay fixed in radius; only their orbital phase advances.
    if (reveal > 0.1) {
      activeTimeRef.current += delta;
      // Lock the galaxy's authored camera composition; particles and gas move
      // internally, while the galaxy itself never rotates or drifts on screen.
    }
    material.uniforms.uTime.value = activeTimeRef.current;
    material.uniforms.uReveal.value = THREE.MathUtils.damp(material.uniforms.uReveal.value, reveal, 4.8, delta);
    if (focusStartedAt.current === null && document.activeElement?.closest?.(".act-six-contact-stage")) {
      focusStartedAt.current = state.clock.getElapsedTime();
    }
    const elapsed = state.clock.getElapsedTime();
    const focusElapsed = focusStartedAt.current === null ? 99 : elapsed - focusStartedAt.current;
    const focusPulse = Math.exp(-focusElapsed * 0.58);
    material.uniforms.uFocusStrength.value = focusPulse;
    material.uniforms.uFocusRadius.value = Math.max(0, focusElapsed) * 3.6;
    if (focusRingRef.current) {
      const ringVisible = focusStartedAt.current !== null && focusElapsed < 1.9 && reveal > 0.7;
      const ringRadius = 0.16 + Math.max(0, focusElapsed) * 3.15;
      focusRingRef.current.visible = ringVisible;
      focusRingRef.current.scale.set(ringRadius, ringRadius * 0.49, 1);
      focusRingMaterial.opacity = ringVisible
        ? 0.62 * Math.exp(-focusElapsed * 0.72) * smoothstep(0.015, 0.09, focusElapsed)
        : 0;
    }

    if (submitRequested.current && submitStartedAt.current === null) {
      submitStartedAt.current = elapsed;
    }
    const submitted = submitStartedAt.current !== null;
    const dissolveProgress = submitted ? clamp((elapsed - submitStartedAt.current!) / 1.55) : 0;
    dissolveMaterial.uniforms.uTime.value = elapsed;
    dissolveMaterial.uniforms.uProgress.value = dissolveProgress;
    if (dissolveRef.current) {
      const camera = state.camera;
      const forward = new THREE.Vector3();
      const right = new THREE.Vector3();
      const up = new THREE.Vector3();
      camera.getWorldDirection(forward);
      right.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
      up.setFromMatrixColumn(camera.matrixWorld, 1).normalize();
      const cameraDistance = 5.6;
      const cameraFov = camera instanceof THREE.PerspectiveCamera ? camera.fov : 45;
      const halfViewHeight = Math.tan(THREE.MathUtils.degToRad(cameraFov * 0.5)) * cameraDistance;
      const aspect = state.size.width / Math.max(1, state.size.height);
      const panelRect = dissolveScreenRect.current;
      const panelCenterX = panelRect ? ((panelRect.left + panelRect.width * 0.5) / state.size.width) * 2 - 1 : -0.44;
      const panelCenterY = panelRect ? 1 - ((panelRect.top + panelRect.height * 0.5) / state.size.height) * 2 : 0.012;
      const panelWorldPosition = camera.position.clone()
        .addScaledVector(forward, cameraDistance)
        .addScaledVector(right, panelCenterX * halfViewHeight * aspect)
        .addScaledVector(up, panelCenterY * halfViewHeight);
      if (groupRef.current) {
        // The dissolve plane is nested under the transformed galaxy group, so
        // convert the camera-space panel pose into that parent's local frame.
        groupRef.current.updateWorldMatrix(true, false);
        groupRef.current.worldToLocal(panelWorldPosition);
        const galaxyWorldQuaternion = groupRef.current.getWorldQuaternion(new THREE.Quaternion());
        dissolveRef.current.quaternion.copy(galaxyWorldQuaternion.invert().multiply(camera.quaternion));
        if (panelRect) {
          const parentScale = groupRef.current.scale.x || 1;
          const widthWorld = (panelRect.width / state.size.width) * 2 * halfViewHeight * aspect;
          const heightWorld = (panelRect.height / state.size.height) * 2 * halfViewHeight;
          dissolveRef.current.scale.set(widthWorld / (3.45 * parentScale), heightWorld / (3.85 * parentScale), 1 / parentScale);
        }
      }
      dissolveRef.current.position.copy(panelWorldPosition);
      dissolveRef.current.visible = submitRequested.current && submitted && dissolveProgress < 1;
      dissolveRef.current.updateMatrixWorld();
      if (groupRef.current) {
        const coreWorld = groupRef.current.localToWorld(new THREE.Vector3());
        dissolveMaterial.uniforms.uCore.value.copy(dissolveRef.current.worldToLocal(coreWorld));
      }
    }

    if (groupRef.current) {
      groupRef.current.visible = material.uniforms.uReveal.value > 0.002;
    }
  });

  return (
    <group ref={groupRef} position={[0.18, 0.1, -7.35]} rotation={[0.11, -0.08, 0.27]} scale={1.68}>
      <pointLight color="#ffd07a" intensity={7} distance={12} decay={2} />
      <pointLight position={[-1.3, 0.7, 1.6]} color="#ff7a10" intensity={1.2} distance={9} decay={2} />
      <NebulaCloudLayers />
      <points geometry={geometry} frustumCulled={false} renderOrder={2}>
        <primitive object={material} attach="material" />
      </points>
      <points ref={dissolveRef} geometry={dissolveGeometry} frustumCulled={false} visible={false} renderOrder={20}>
        <primitive object={dissolveMaterial} attach="material" />
      </points>
      <mesh ref={focusRingRef} geometry={focusRingGeometry} material={focusRingMaterial} position={[0, 0, 0.015]} visible={false} renderOrder={10} />
    </group>
  );
}
