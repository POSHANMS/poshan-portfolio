"use client";

import { Html, Line, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { ActFourPhase } from "@/types/actFour";
import { JOURNEY_MILESTONES } from "@/utils/constants";

const PARTICLE_COUNT = 10000;
const AMBIENT_EMBER_COUNT = 400;
// The Act V composition has its own local origin while remaining in the shared
// world coordinates used by the portfolio's other acts and scroll camera.
const ACT_FIVE_ORIGIN: [number, number, number] = [0, 0, -5.15];

const MONOLITHS = [
  {
    tag: "01 // FOUNDATION",
    title: "COMPUTER SCIENCE ENGINEERING",
    body: JOURNEY_MILESTONES[0].body,
    telemetry: "SYS.STATUS: VERIFIED // CORE ARCHITECTURE",
    position: [-6.16, 0.85, 2.87] as [number, number, number],
    lookAt: [0, 0.4, 9.5] as [number, number, number],
    roll: 0.04,
  },
  {
    tag: "02 // ARCHITECTURE",
    title: "REAL-TIME FULL-STACK SYSTEMS",
    body: JOURNEY_MILESTONES[1].body,
    telemetry: "STACK: REACT + FLASK // POSTGRESQL + REDIS",
    position: [-2.55, -0.45, 6.3] as [number, number, number],
    lookAt: [0, -0.2, 10.5] as [number, number, number],
    roll: -0.03,
  },
  {
    tag: "03 // INTELLIGENCE",
    title: "AGENTIC AI & DEEP LEARNING",
    body: "Built ZaminSaathi as a three-agent land-document assistant for the Kaggle x Google 5-Day AI Agents course. Also built the Flask backend for HealthGPT, connecting trained ML and CNN models to an eight-condition prediction system.",
    telemetry: "AI PIPELINE: ZAMINSAATHI // HEALTHGPT",
    position: [2.55, 0.55, 6.3] as [number, number, number],
    lookAt: [0, 0.2, 10.5] as [number, number, number],
    roll: 0.03,
  },
  {
    tag: "04 // EXECUTION",
    title: "SECURITY, HARDWARE & PRACTICE",
    body: "Completed a Deloitte Cyber Security virtual internship, practiced log analysis and vulnerability assessment, and solved 110+ DSA problems. Build and delivery practice includes Docker, GitHub, Vercel, Railway, Render, and Cloudinary.",
    telemetry: "SECURITY PRACTICE // LOG ANALYSIS + LABS",
    position: [6.16, -0.65, 2.87] as [number, number, number],
    lookAt: [0, -0.3, 9.5] as [number, number, number],
    roll: -0.04,
  },
] as const;

const coreVertexShader = /* glsl */ `
  varying vec3 vNormalView;
  varying vec3 vViewPosition;
  varying float vNoise;
  uniform float uTime;
  uniform float uScrollVelocity;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    float field = snoise(position * 1.6 + vec3(uTime * 0.45));
    float displacement = field * (0.22 + uScrollVelocity * 0.35);
    vec3 displaced = position + normal * displacement;
    vNoise = field;
    vNormalView = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const coreFragmentShader = /* glsl */ `
  varying vec3 vNormalView;
  varying vec3 vViewPosition;
  varying float vNoise;
  void main() {
    float heat = smoothstep(-0.18, 0.72, vNoise);
    vec3 base = vec3(0.071, 0.008, 0.024);
    vec3 crimson = vec3(1.0, 0.102, 0.208);
    vec3 hot = vec3(1.0, 0.38, 0.28);
    vec3 color = mix(base, crimson, heat);
    color = mix(color, hot, smoothstep(0.48, 0.92, vNoise) * 0.64);
    float fresnel = pow(1.0 - abs(dot(normalize(vNormalView), normalize(vViewPosition))), 2.8);
    color += vec3(1.0, 0.035, 0.12) * fresnel * 1.8;
    gl_FragColor = vec4(color, 0.9);
  }
`;

const swarmVertexShader = /* glsl */ `
  attribute float aPhase;
  attribute float aSpeed;
  attribute float aSize;
  attribute float aColorMix;
  uniform float uTime;
  uniform float uScrollVelocity;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 pos = position;
    float angle = uTime * aSpeed;
    float cy = cos(angle), sy = sin(angle);
    pos.xz = mat2(cy, -sy, sy, cy) * pos.xz;
    float tilt = 0.22;
    float cx = cos(tilt), sx = sin(tilt);
    pos.yz = mat2(cx, -sx, sx, cx) * pos.yz;
    pos.x += sin(uTime * 1.4 + aPhase + pos.y * 0.8) * 0.18;
    pos.y += cos(uTime * 1.2 + aPhase + pos.z * 0.8) * 0.18;
    pos.z += sin(uTime * 1.6 + aPhase + pos.x * 0.8) * 0.18;
    float pulse = 1.0 + sin(uTime * 1.8 + aPhase * 0.5) * 0.06 + uScrollVelocity * 0.15;
    pos *= pulse;
    vec3 red = vec3(1.0, 0.118, 0.22);
    vec3 orange = vec3(1.0, 0.333, 0.2);
    vec3 white = vec3(1.0, 0.9, 0.88);
    vColor = aColorMix < 0.62
      ? mix(red, orange, aColorMix / 0.62)
      : mix(orange, white, (aColorMix - 0.62) / 0.38);
    vAlpha = 0.6 + 0.4 * sin(uTime * 3.0 + aPhase);
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = min(6.0, aSize * (180.0 / max(40.0, -mvPosition.z)) * 0.75);
  }
`;

const swarmFragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.05, d) * vAlpha;
    gl_FragColor = vec4(vColor * (1.1 + (1.0 - d * 2.0) * 0.65), alpha);
  }
`;

function seeded(index: number, salt: number) {
  const value = Math.sin((index + salt) * 91.731) * 43758.5453;
  return value - Math.floor(value);
}

function MonolithCard({ index, active }: { index: number; active: boolean }) {
  const item = MONOLITHS[index];
  return (
    <Html transform center distanceFactor={5} position={[0, 0, 0.052]} zIndexRange={[120, 0]}>
      <article
        className="relative flex h-[344px] w-[544px] flex-col overflow-hidden rounded-[4px] border px-7 py-6 text-left text-white"
        style={{
          background: "linear-gradient(135deg, rgba(22, 6, 12, 0.86) 0%, rgba(8, 2, 5, 0.92) 100%)",
          backdropFilter: "blur(18px) saturate(165%)",
          WebkitBackdropFilter: "blur(18px) saturate(165%)",
          borderColor: `rgba(255, 38, 70, ${active ? 0.95 : 0.42})`,
          boxShadow: "0 20px 50px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.14), 0 0 28px rgba(255,26,53,0.22)",
          transform: `scale(${active ? 1.06 : 1})`,
          transition: "transform 500ms cubic-bezier(.2,.75,.2,1), border-color 400ms ease, box-shadow 400ms ease",
        }}
      >
        <div className={`act-five-glass-sheen pointer-events-none absolute inset-y-0 left-0 ${active ? "act-five-glass-sheen-active" : ""}`} aria-hidden="true" />
        <div className="relative flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.24em] text-[#ff8b9c]">
          <span>{item.tag}</span>
          <span className="text-white/50">ACT V / FIELD NOTES</span>
        </div>
        <h3 className="relative mt-6 max-w-[440px] text-[28px] font-black uppercase leading-[1.05] tracking-[-0.025em] text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.85)]">
          {item.title}
        </h3>
        <p className="relative mt-5 max-w-[470px] text-[15px] leading-[1.7] text-white/85 [text-shadow:0_2px_8px_rgba(0,0,0,0.85)]">
          {item.body}
        </p>
        <div className="relative mt-auto border-t border-[#ff2646]/30 pt-4 font-mono text-[10px] uppercase tracking-[0.15em] text-[#ff9cab]">
          {item.telemetry}
        </div>
      </article>
    </Html>
  );
}

function Monolith({ index, active }: { index: number; active: boolean }) {
  const item = MONOLITHS[index];
  const group = useRef<THREE.Group>(null);
  const bracketGeometry = useMemo(() => {
    const positions: number[] = [];
    const w = 1.72;
    const h = 1.08;
    const len = 0.22;
    const points = [
      [-w, h, -w + len, h], [-w, h, -w, h - len],
      [w, h, w - len, h], [w, h, w, h - len],
      [-w, -h, -w + len, -h], [-w, -h, -w, -h + len],
      [w, -h, w - len, -h], [w, -h, w, -h + len],
    ];
    for (const [x1, y1, x2, y2] of points) positions.push(x1, y1, 0.055, x2, y2, 0.055);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
  }, []);

  useLayoutEffect(() => {
    if (group.current) {
      const target = new THREE.Vector3(...item.lookAt);
      const position = new THREE.Vector3(...item.position);
      const orientation = new THREE.Matrix4().lookAt(target, position, new THREE.Vector3(0, 1, 0));
      group.current.quaternion.setFromRotationMatrix(orientation);
      group.current.rotateZ(item.roll);
    }
  }, [item.lookAt, item.position, item.roll]);

  return (
    <group ref={group} position={item.position}>
      <RoundedBox args={[3.4, 2.15, 0.08]} radius={0.075} smoothness={3}>
        <meshPhysicalMaterial
          color="#090306"
          emissive="#22040a"
          emissiveIntensity={active ? 0.62 : 0.4}
          transmission={0.85}
          transparent
          opacity={0.88}
          roughness={0.15}
          metalness={0.2}
          ior={1.45}
          thickness={0.6}
          depthWrite={false}
        />
      </RoundedBox>
      <lineSegments geometry={bracketGeometry}>
        <lineBasicMaterial color="#ff2244" transparent opacity={active ? 0.95 : 0.48} toneMapped={false} />
      </lineSegments>
      <MonolithCard index={index} active={active} />
    </group>
  );
}

function Tether({ position }: { position: [number, number, number] }) {
  const points = useMemo(() => {
    const start = new THREE.Vector3(position[0] * 0.92, position[1] * 0.92, position[2] * 0.92);
    const mid = start.clone().multiplyScalar(0.58).add(new THREE.Vector3(0, 0.2, 0));
    return new THREE.CatmullRomCurve3([start, mid, new THREE.Vector3(0, 0, 0)]).getPoints(32);
  }, [position]);
  return <Line points={points} color="#ff2244" transparent opacity={0.25} lineWidth={1} />;
}

export default function ActFiveWorld({
  scrollProgress,
  actFourPhase,
}: {
  scrollProgress: number;
  actFourPhase: ActFourPhase;
}) {
  const rootRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const emberRef = useRef<THREE.Points>(null);
  const ringRefs = useRef<(THREE.Mesh | null)[]>([]);
  const shockwaveRef = useRef<THREE.Mesh>(null);
  const lastProgress = useRef(scrollProgress);
  const scrollVelocity = useRef(0);

  const coreMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uScrollVelocity: { value: 0 } },
    vertexShader: coreVertexShader,
    fragmentShader: coreFragmentShader,
    transparent: true,
    depthWrite: true,
    toneMapped: false,
  }), []);

  const swarm = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const phases = new Float32Array(PARTICLE_COUNT);
    const speeds = new Float32Array(PARTICLE_COUNT);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const colors = new Float32Array(PARTICLE_COUNT);
    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      const i3 = index * 3;
      const theta = seeded(index, 4) * Math.PI * 2;
      const phi = Math.acos(2 * seeded(index, 8) - 1);
      const radius = 2.3 + seeded(index, 13) * 3.5;
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.cos(phi);
      positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      phases[index] = seeded(index, 23) * Math.PI * 2;
      speeds[index] = 0.4 + seeded(index, 29) * 1.2;
      sizes[index] = 1.5 + seeded(index, 31) * 3;
      colors[index] = seeded(index, 41);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aColorMix", new THREE.BufferAttribute(colors, 1));
    return geometry;
  }, []);

  const swarmMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uScrollVelocity: { value: 0 } },
    vertexShader: swarmVertexShader,
    fragmentShader: swarmFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  }), []);

  const emberField = useMemo(() => {
    const positions = new Float32Array(AMBIENT_EMBER_COUNT * 3);
    for (let index = 0; index < AMBIENT_EMBER_COUNT; index += 1) {
      const i3 = index * 3;
      positions[i3] = (seeded(index, 51) - 0.5) * 28;
      positions[i3 + 1] = (seeded(index, 67) - 0.5) * 16;
      positions[i3 + 2] = (seeded(index, 79) - 0.5) * 28;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);

  const reveal = THREE.MathUtils.smoothstep(scrollProgress, 0.902, 0.92)
    * (1 - THREE.MathUtils.smoothstep(scrollProgress, 0.956, 0.963));
  const active = actFourPhase !== "inside" && actFourPhase !== "warping";
  const visible = active ? reveal : 0;
  const localProgress = THREE.MathUtils.clamp((scrollProgress - 0.91) / (0.956 - 0.91), 0, 1);
  const activeIndex = localProgress < 0.335 ? 0 : localProgress < 0.60 ? 1 : localProgress < 0.865 ? 2 : 3;

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    const velocity = THREE.MathUtils.clamp(Math.abs(scrollProgress - lastProgress.current) / Math.max(delta, 1 / 120), 0, 1.5);
    lastProgress.current = scrollProgress;
    scrollVelocity.current = THREE.MathUtils.damp(scrollVelocity.current, velocity, 4, delta);
    if (rootRef.current) {
      rootRef.current.visible = visible > 0.001;
      rootRef.current.scale.setScalar(THREE.MathUtils.damp(rootRef.current.scale.x, Math.max(0.001, visible), 5, delta));
    }
    coreMaterial.uniforms.uTime.value = time;
    coreMaterial.uniforms.uScrollVelocity.value = scrollVelocity.current;
    swarmMaterial.uniforms.uTime.value = time;
    swarmMaterial.uniforms.uScrollVelocity.value = scrollVelocity.current;

    if (coreRef.current) coreRef.current.rotation.y = time * 0.06;
    if (emberRef.current) {
      emberRef.current.rotation.y += delta * 0.009;
      emberRef.current.rotation.x = Math.sin(time * 0.08) * 0.025;
    }
    ringRefs.current.forEach((ring, index) => {
      if (!ring) return;
      const speed = 1 + scrollVelocity.current * 4;
      const rates = [
        [0.35, 0.12, 0],
        [0, 0, 0.2],
        [0, 0, 0.18],
      ][index];
      if (index === 0) {
        ring.rotation.y += rates[0] * speed * delta;
        ring.rotation.x += rates[1] * speed * delta;
      } else if (index === 1) {
        ring.rotation.y -= 0.25 * speed * delta;
        ring.rotation.z += rates[2] * speed * delta;
      } else {
        ring.rotation.z += rates[2] * speed * delta;
      }
    });
    if (shockwaveRef.current) {
      const pulse = 1 + (Math.sin(time * 1.2) * 0.5 + 0.5) * 0.12;
      shockwaveRef.current.scale.setScalar(pulse);
      const material = shockwaveRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.2 + (Math.sin(time * 1.2) * 0.5 + 0.5) * 0.2;
    }
  });

  return (
    <group ref={rootRef} position={ACT_FIVE_ORIGIN} scale={0.001}>
      <ambientLight intensity={0.08} color="#24050a" />
      <pointLight color="#ff1a35" intensity={6.5} distance={22} decay={1.6} />
      <pointLight position={[0, 4.5, -3.5]} color="#ff5533" intensity={3.2} distance={18} />
      <directionalLight position={[-8, -5, 6]} color="#1a2844" intensity={0.9} />

      <mesh ref={coreRef}>
        <sphereGeometry args={[2.2, 64, 64]} />
        <primitive object={coreMaterial} attach="material" />
      </mesh>
      <points geometry={swarm} frustumCulled={false} renderOrder={2}>
        <primitive object={swarmMaterial} attach="material" />
      </points>

      {[3.1, 3.8, 4.6].map((radius, index) => (
        <mesh
          key={radius}
          ref={(node) => { ringRefs.current[index] = node; }}
          rotation={[[0.45, 0, 0.25], [-0.6, 0.3, -0.4], [1.2, -0.2, 0.15]][index] as [number, number, number]}
        >
          <torusGeometry args={[radius, 0.018, 8, 192]} />
          <meshBasicMaterial color="#ff2a4b" transparent opacity={0.55} toneMapped={false} />
        </mesh>
      ))}
      <mesh ref={shockwaveRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.45, 0.012, 6, 180]} />
        <meshBasicMaterial color="#ff5533" transparent opacity={0.28} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>

      <points ref={emberRef} geometry={emberField} frustumCulled={false}>
        <pointsMaterial color="#ff8590" size={0.028} transparent opacity={0.34} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </points>

      {MONOLITHS.map((monolith, index) => (
        <group key={monolith.tag}>
          <Tether position={monolith.position as [number, number, number]} />
          <Monolith index={index} active={activeIndex === index && visible > 0.7} />
        </group>
      ))}
    </group>
  );
}
