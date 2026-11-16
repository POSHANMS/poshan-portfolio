"use client";

import { Html, RoundedBox } from "@react-three/drei";
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
const MONOLITH_ORBIT_RADIUS = 10.5;
const MONOLITH_ORBIT_ANGLES = [-78, -26, 26, 78] as const;

function monolithOrbitPosition(angleDegrees: number, height: number): [number, number, number] {
  const angle = THREE.MathUtils.degToRad(angleDegrees);
  return [
    Math.sin(angle) * MONOLITH_ORBIT_RADIUS,
    height,
    Math.cos(angle) * MONOLITH_ORBIT_RADIUS,
  ];
}

const MONOLITH_POSITIONS = [
  monolithOrbitPosition(MONOLITH_ORBIT_ANGLES[0], 0.6),
  monolithOrbitPosition(MONOLITH_ORBIT_ANGLES[1], -0.5),
  monolithOrbitPosition(MONOLITH_ORBIT_ANGLES[2], 0.5),
  monolithOrbitPosition(MONOLITH_ORBIT_ANGLES[3], -0.4),
];

const MONOLITHS = [
  {
    tag: "01 // FOUNDATION",
    title: "COMPUTER SCIENCE ENGINEERING",
    body: `${JOURNEY_MILESTONES[0].body} Core systems, algorithms, architecture, and disciplined engineering foundations shape the work.`,
    telemetry: "VERIFIED // CORE ARCHITECTURE",
    metrics: ["B.E. CSE '26", "CGPA 8.16", "NAVKIS COLLEGE", "CORE SYSTEMS"],
    position: MONOLITH_POSITIONS[0],
  },
  {
    tag: "02 // ARCHITECTURE",
    title: "REAL-TIME FULL-STACK SYSTEMS",
    body: "Production web and cloud systems engineered with Python, Flask, React, Supabase, PostgreSQL, Redis, and Three.js.",
    telemetry: "FULL-STACK BUILD // REAL-TIME SERVICES",
    metrics: ["PYTHON & FLASK", "REACT & THREE.JS", "POSTGRESQL + REDIS", "SUPABASE"],
    position: MONOLITH_POSITIONS[1],
  },
  {
    tag: "03 // INTELLIGENCE",
    title: "AGENTIC AI & DEEP LEARNING",
    body: "Multi-agent MCP architectures like ZaminSaathi and multi-stage CNN clinical pipelines like HealthGPT.",
    telemetry: "NEURAL ENGINE: ACTIVE // MULTI-AGENT MCP",
    metrics: ["ZAMINSAATHI MCP", "HEALTHGPT CNN", "MULTI-AGENT AI", "DEEP LEARNING"],
    position: MONOLITH_POSITIONS[2],
  },
  {
    tag: "04 // EXECUTION",
    title: "SECURITY, HARDWARE & PRACTICE",
    body: "Cyber security, ethical hacking, ESP8266 automated hardware systems, rapid hackathon execution, and 110+ DSA problems. Build and delivery practice includes Docker, GitHub, Vercel, Railway, Render, and Cloudinary.",
    telemetry: "SEC.PROTOCOL: HARDENED // FIELD TESTED",
    metrics: ["110+ DSA SOLVED", "35+ TRYHACKME", "ESP8266 HARDWARE", "DOCKER & CI/CD"],
    position: MONOLITH_POSITIONS[3],
  },
] as const;

const coreVertexShader = /* glsl */ `
  varying vec3 vNormalView;
  varying vec3 vViewPosition;
  varying float vNoise;
  uniform float uTime;
  uniform float uScrollVelocity;
  uniform float uReveal;

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
  uniform float uReveal;
  void main() {
    float structure = smoothstep(-0.16, 0.72, vNoise);
    float ridgeField = abs(sin((vNoise * 2.7 + vNormalView.x * 0.65 - vNormalView.y * 0.48) * 18.0));
    float magmaVeins = 1.0 - smoothstep(0.025, 0.105, ridgeField);
    vec3 obsidian = vec3(0.035, 0.0, 0.008);
    vec3 volcanic = vec3(0.11, 0.002, 0.018);
    vec3 crimson = vec3(1.0, 0.0, 0.075);
    vec3 color = mix(obsidian, volcanic, structure * 0.28);
    color = mix(color, crimson, magmaVeins * (0.58 + structure * 0.34));
    float fresnel = pow(1.0 - abs(dot(normalize(vNormalView), normalize(vViewPosition))), 3.2);
    color += vec3(1.0, 0.0, 0.11) * fresnel * 1.65;
    gl_FragColor = vec4(color, 0.94 * uReveal);
  }
`;

const swarmVertexShader = /* glsl */ `
  attribute float aPhase;
  attribute float aSpeed;
  attribute float aSize;
  attribute float aColorMix;
  uniform float uTime;
  uniform float uScrollVelocity;
  uniform float uReveal;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 pos = position;
    float angle = uTime * aSpeed;
    float cy = cos(angle), sy = sin(angle);
    pos.xz = mat2(cy, -sy, sy, cy) * pos.xz;
    float tilt = 0.22;
    float cx = cos(tilt), sx = sin(tilt);
    pos.y *= 0.68;
    pos.yz = mat2(cx, -sx, sx, cx) * pos.yz;
    pos.x += sin(uTime * 1.4 + aPhase + pos.y * 0.8) * 0.18;
    pos.y += cos(uTime * 1.2 + aPhase + pos.z * 0.8) * 0.18;
    pos.z += sin(uTime * 1.6 + aPhase + pos.x * 0.8) * 0.18;
    float pulse = 1.0 + sin(uTime * 1.8 + aPhase * 0.5) * 0.06 + uScrollVelocity * 0.15;
    pos *= pulse;
    vec3 blood = vec3(0.72, 0.0, 0.075);
    vec3 crimson = vec3(1.0, 0.018, 0.12);
    vec3 rose = vec3(0.84, 0.008, 0.045);
    vec3 spark = vec3(1.0, 0.025, 0.055);
    vColor = aColorMix < 0.45
      ? mix(blood, crimson, aColorMix / 0.45)
      : aColorMix < 0.9
        ? mix(crimson, rose, (aColorMix - 0.45) / 0.45)
        : mix(rose, spark, (aColorMix - 0.9) / 0.1);
    vAlpha = (0.6 + 0.4 * sin(uTime * 3.0 + aPhase)) * uReveal;
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

function RingSystem({ radius, index, visibility }: { radius: number; index: number; visibility: number }) {
  const orbit = useRef<THREE.Group>(null);
  const ticks = useRef<THREE.Group>(null);
  const instancedTicks = useRef<THREE.InstancedMesh>(null);
  const ringMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const nodeMaterials = useRef<THREE.MeshBasicMaterial[]>([]);
  const tickGeometry = useMemo(() => new THREE.BoxGeometry(0.026, 0.13, 0.026), []);
  const tickMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ff6b7a", transparent: true, opacity: 0.88, toneMapped: false }), []);
  useLayoutEffect(() => {
    if (!instancedTicks.current) return;
    const dummy = new THREE.Object3D();
    const count = 72;
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2;
      dummy.position.set(Math.cos(angle) * (radius + 0.12), Math.sin(angle) * (radius + 0.12), 0);
      dummy.rotation.set(0, 0, angle);
      dummy.scale.set(1, i % 6 === 0 ? 1.55 : 0.8, 1);
      dummy.updateMatrix();
      instancedTicks.current.setMatrixAt(i, dummy.matrix);
    }
    instancedTicks.current.instanceMatrix.needsUpdate = true;
  }, [radius]);
  useFrame((_, delta) => {
    if (orbit.current) orbit.current.rotation.z += (index % 2 === 0 ? 1 : -1) * (0.1 + index * 0.018) * delta;
    if (ticks.current) ticks.current.rotation.z -= (0.16 + index * 0.025) * delta;
    if (ringMaterial.current) ringMaterial.current.opacity = 0.92 * visibility;
    tickMaterial.opacity = 0.88 * visibility;
    nodeMaterials.current.forEach((material) => { material.opacity = visibility; });
  });
  const tilts: [number, number, number][] = [[0.45, 0.08, 0.24], [-0.56, 0.3, -0.38], [1.1, -0.18, 0.13]];
  return (
    <group rotation={tilts[index]}>
      <group ref={orbit}>
        <mesh>
          <torusGeometry args={[radius, 0.032, 16, 128]} />
          <meshBasicMaterial ref={ringMaterial} color="#ff1738" transparent opacity={0.92} toneMapped={false} />
        </mesh>
        {[0, 1, 2, 3].map((node) => {
          const angle = node * Math.PI / 2;
          return <mesh key={node} position={[Math.cos(angle) * radius, Math.sin(angle) * radius, 0]}>
            <sphereGeometry args={[0.07, 12, 12]} />
            <meshBasicMaterial ref={(material) => { if (material) nodeMaterials.current[node] = material; }} color="#ff314e" transparent opacity={visibility} toneMapped={false} />
          </mesh>;
        })}
      </group>
      <group ref={ticks}>
        <instancedMesh ref={instancedTicks} args={[tickGeometry, tickMaterial, 72]} frustumCulled={false} />
      </group>
    </group>
  );
}

function PolarFloorGrid({ visibility }: { visibility: number }) {
  const material = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    uniforms: { uTime: { value: 0 }, uReveal: { value: 0 } },
    vertexShader: `varying vec2 vGrid; void main(){ vGrid=uv*28.0-14.0; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform float uTime; uniform float uReveal; varying vec2 vGrid; void main(){ float radius=length(vGrid); float ring=1.0-smoothstep(0.018,0.09,abs(fract(radius*1.35)-0.5)); float angle=atan(vGrid.y,vGrid.x); float ray=1.0-smoothstep(0.008,0.035,abs(sin(angle*36.0))); float ticks=1.0-smoothstep(0.01,0.04,abs(fract(angle*72.0/6.28318)-0.5)); float edge=1.0-smoothstep(9.0,14.0,radius); float pulse=0.86+0.14*sin(uTime*0.45-radius*0.4); float lines=max(ring*0.62, max(ray*0.18,ticks*0.16)); float alpha=lines*edge*0.22*pulse*uReveal; gl_FragColor=vec4(1.0,0.018,0.12,alpha); }`,
  }), []);
  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.getElapsedTime();
    material.uniforms.uReveal.value = visibility;
  });
  return (
    <mesh position={[0, -2.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[28, 28, 1, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

function MonolithCard({ index, focus, opacity, progress, visibility }: { index: number; focus: number; opacity: number; progress: number; visibility: number }) {
  const item = MONOLITHS[index];
  return (
    <Html transform center distanceFactor={3.2} position={[0, 0, 0.072]} zIndexRange={[120, 0]}>
      <article
        className="relative flex h-[344px] w-[544px] flex-col overflow-hidden rounded-[4px] border px-7 py-5 text-left text-white"
        style={{
          backgroundImage: "linear-gradient(rgba(255, 40, 75, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 40, 75, 0.05) 1px, transparent 1px), linear-gradient(118deg, transparent 30%, rgba(255,60,90,.08) 48%, transparent 62%), radial-gradient(120% 100% at 0% 50%, rgba(255, 18, 52, 0.18) 0%, rgba(14, 3, 8, 0.92) 55%, rgba(6, 1, 4, 0.96) 100%)",
          opacity: opacity * visibility,
          borderColor: `rgba(255, 36, 70, ${0.28 + focus * 0.68})`,
          boxShadow: `0 24px 60px rgba(0, 0, 0, 0.9), inset 0 0 32px rgba(255, 20, 55, ${0.14 + focus * 0.08}), inset 1px 1px 0 rgba(255, 255, 255, 0.16), 0 0 ${8 + focus * 30}px rgba(255,20,52,${0.08 + focus * 0.36})`,
          backgroundSize: "24px 24px, 24px 24px, 100% 100%, 100% 100%",
          transition: "opacity 260ms ease, border-color 320ms ease, box-shadow 320ms ease",
        }}
      >
        <div className="act-five-glass-sheen act-five-glass-sheen-active pointer-events-none absolute inset-y-0 left-0" aria-hidden="true" />
        <div className="relative flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.24em] text-[#ff7189]">
          <span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-[#ff2446] shadow-[0_0_12px_#ff2446]" />{item.tag}</span>
          <span className="text-white/55">ACT V // FIELD NOTES</span>
        </div>
        <h3 className="relative mt-5 max-w-[440px] text-[28px] font-black uppercase leading-[1.05] tracking-[-0.025em] text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.85)]">
          {item.title}
        </h3>
        <p className="relative mt-4 max-w-[470px] text-[15px] leading-[1.55] text-white/85 [text-shadow:0_2px_8px_rgba(0,0,0,0.85)]">
          {item.body}
        </p>
        <ul className="relative mt-4 grid grid-cols-2 gap-2" aria-label={`${item.tag} metrics`}>
          {item.metrics.map((metric) => (
            <li key={metric} className="w-fit max-w-full rounded-sm border border-[#ff2446]/35 bg-[#19050b]/70 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#ffd5dc] shadow-[inset_0_0_12px_rgba(255,23,56,0.08)]">
              {metric}
            </li>
          ))}
        </ul>
        <div className="relative mt-auto border-t border-[#ff2646]/35 pt-3 font-mono text-[10px] uppercase tracking-[0.15em] text-[#ff9cab]">
          <div className="mb-2 flex items-center justify-between gap-5">
            <span className="min-w-0 truncate"><span className="mr-2 text-[#ff2446]">SYS.STATUS</span>{item.telemetry}</span>
            <span className="shrink-0 rounded-sm border border-[#ff2446]/55 bg-[#19050b]/80 px-2 py-1 text-[12px] font-bold tracking-[0.18em] text-white shadow-[0_0_14px_rgba(255,23,56,0.2)]">0{index + 1} / 04</span>
          </div>
          <div className="flex h-[3px] gap-[3px]" aria-hidden="true">
            {Array.from({ length: 32 }, (_, tick) => <i key={tick} className="flex-1" style={{ background: tick / 32 < progress ? "#ff2446" : "rgba(255,36,70,.18)", boxShadow: tick / 32 < progress && focus > 0.5 ? "0 0 6px rgba(255,36,70,.75)" : "none" }} />)}
          </div>
        </div>
      </article>
    </Html>
  );
}

function Monolith({ index, continuousIndex, progress, visibility }: { index: number; continuousIndex: number; progress: number; visibility: number }) {
  const item = MONOLITHS[index];
  const cardGroupRef = useRef<THREE.Group>(null);
  const previousQuaternion = useRef(new THREE.Quaternion());
  const facingQuaternion = useRef(new THREE.Quaternion());
  const offsetQuaternion = useRef(new THREE.Quaternion());
  const basePosition = useMemo(() => new THREE.Vector3(...item.position), [item.position]);
  const bracketGeometry = useMemo(() => {
    const positions: number[] = [];
    const w = 1.7;
    const h = 1.075;
    const len = 0.22;
    const points = [
      [-w, h, -w + len, h], [-w, h, -w, h - len],
      [w, h, w - len, h], [w, h, w, h - len],
      [-w, -h, -w + len, -h], [-w, -h, -w, -h + len],
      [w, -h, w - len, -h], [w, -h, w, -h + len],
    ];
    for (const [x1, y1, x2, y2] of points) positions.push(x1, y1, 0.085, x2, y2, 0.085);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
  }, []);

  const distance = Math.abs(continuousIndex - index);
  const focus = Math.max(0, 1 - distance * 1.35);
  const recede = THREE.MathUtils.smoothstep(distance, 0.52, 0.98);
  const visualOpacity = (1 - THREE.MathUtils.smoothstep(distance, 0.16, 0.78))
    * (1 - THREE.MathUtils.smoothstep(distance, 1.15, 1.65));

  useFrame(({ camera, pointer }, delta) => {
    if (!cardGroupRef.current) return;

    // Face the active card directly toward the camera. A world-up vector keeps
    // the card upright; no roll or negative scale can invert its text.
    cardGroupRef.current.up.set(0, 1, 0);
    previousQuaternion.current.copy(cardGroupRef.current.quaternion);
    cardGroupRef.current.lookAt(camera.position);
    facingQuaternion.current.copy(cardGroupRef.current.quaternion);
    offsetQuaternion.current.setFromEuler(new THREE.Euler(
      THREE.MathUtils.degToRad(3 + pointer.y * 2),
      0.18 + THREE.MathUtils.degToRad(pointer.x * 2),
      0,
      "YXZ",
    ));
    facingQuaternion.current.multiply(offsetQuaternion.current);
    cardGroupRef.current.quaternion.copy(previousQuaternion.current).slerp(facingQuaternion.current, 1 - Math.exp(-10 * delta));

    const radial = new THREE.Vector3(basePosition.x, 0, basePosition.z).normalize();
    const targetPosition = basePosition.clone().addScaledVector(radial, recede * 2.2);
    cardGroupRef.current.position.lerp(targetPosition, 1 - Math.exp(-7 * delta));
    const targetScale = THREE.MathUtils.lerp(0.86, 1, focus);
    const scale = THREE.MathUtils.damp(cardGroupRef.current.scale.x, targetScale, 9, delta);
    cardGroupRef.current.scale.setScalar(scale);
  });

  const bracketBars = [
    [-1.58, 1.02, 0.22, 0.045], [-1.68, 0.92, 0.045, 0.2],
    [1.58, 1.02, 0.22, 0.045], [1.68, 0.92, 0.045, 0.2],
    [-1.58, -1.02, 0.22, 0.045], [-1.68, -0.92, 0.045, 0.2],
    [1.58, -1.02, 0.22, 0.045], [1.68, -0.92, 0.045, 0.2],
  ] as const;

  return (
    <group ref={cardGroupRef} position={item.position}>
      <RoundedBox args={[3.4, 2.15, 0.12]} radius={0.075} smoothness={4}>
        <meshPhysicalMaterial
          color="#090205"
          emissive="#31000d"
          emissiveIntensity={0.1 + focus * 0.42}
          transmission={0}
          transparent
          opacity={0.96 * visualOpacity * visibility}
          roughness={0.26}
          metalness={0.38}
          clearcoat={0.8}
          clearcoatRoughness={0.2}
          depthWrite
        />
      </RoundedBox>
      <lineSegments geometry={bracketGeometry}>
        <lineBasicMaterial color="#ff2446" transparent opacity={(0.14 + focus * 0.86) * visibility} toneMapped={false} />
      </lineSegments>
      {bracketBars.map(([x, y, width, height], barIndex) => (
        <mesh key={barIndex} position={[x, y, 0.09]}>
          <boxGeometry args={[width, height, 0.035]} />
          <meshStandardMaterial color="#ff2446" emissive="#ff1238" emissiveIntensity={0.3 + focus * 1.5} transparent opacity={visibility} toneMapped={false} />
        </mesh>
      ))}
      <MonolithCard index={index} focus={focus} opacity={visualOpacity} progress={index === Math.round(continuousIndex) ? progress : 0} visibility={visibility} />
    </group>
  );
}

function Tether({ position, focus }: { position: [number, number, number]; focus: number }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const points = useMemo(() => {
      const start = new THREE.Vector3(position[0] - Math.sign(position[0]) * 1.48, position[1] - 0.55, position[2]);
    const mid = start.clone().multiplyScalar(0.58).add(new THREE.Vector3(0, -0.12, 0));
    return new THREE.CatmullRomCurve3([new THREE.Vector3(0, -0.4, 0), mid, start]).getPoints(64);
  }, [position]);
  const beamGeometry = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 64, 0.025, 8, false), [points]);
  useFrame(({ clock }) => {
    if (material.current) {
      material.current.uniforms.uTime.value = clock.getElapsedTime();
      material.current.uniforms.uFocus.value = focus;
    }
  });
  return (
    <mesh>
      <primitive object={beamGeometry} attach="geometry" />
      <shaderMaterial
        ref={material}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
        uniforms={{ uTime: { value: 0 }, uFocus: { value: focus } }}
        vertexShader="varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }"
        fragmentShader="uniform float uTime; uniform float uFocus; varying vec2 vUv; void main(){ float pulse=pow(max(0.0, sin(vUv.x*18.0-uTime*2.4)), 8.0); float alpha=(0.10+pulse*0.88)*uFocus; gl_FragColor=vec4(1.0,0.0+0.02*pulse,0.09+0.04*pulse,alpha); }"
      />
    </mesh>
  );
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
  const coreLightRef = useRef<THREE.PointLight>(null);
  const emberRef = useRef<THREE.Points>(null);
  const shockwaveRef = useRef<THREE.Mesh>(null);
  const lastProgress = useRef(scrollProgress);
  const scrollVelocity = useRef(0);

  const coreMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uScrollVelocity: { value: 0 }, uReveal: { value: 0 } },
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
    uniforms: { uTime: { value: 0 }, uScrollVelocity: { value: 0 }, uReveal: { value: 0 } },
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

  const reveal = THREE.MathUtils.smoothstep(scrollProgress, 0.902, 0.922)
    * (1 - THREE.MathUtils.smoothstep(scrollProgress, 0.958, 0.975));
  const active = actFourPhase !== "inside" && actFourPhase !== "warping";
  const visible = active ? reveal : 0;
  const localProgress = THREE.MathUtils.clamp((scrollProgress - 0.915) / (0.975 - 0.915), 0, 1);
  // Hold each monolith while its HUD checkpoint is live, blending focus only
  // over the final part of each camera swoop.
  const checkpointStops = [0, 0.17, 0.34, 0.51, 0.68];
  const checkpointBlendStarts = [0, 0.12, 0.29, 0.46, 0.63];
  let continuousIndex = 3;
  for (let index = 0; index < 4; index += 1) {
    if (localProgress <= checkpointBlendStarts[index + 1]) {
      const blend = THREE.MathUtils.smoothstep(localProgress, checkpointBlendStarts[index + 1], checkpointStops[index + 1]);
      continuousIndex = index + blend;
      break;
    }
  }
  const activeIndex = Math.min(3, Math.floor(continuousIndex + 0.5));
  const activeCheckpointProgress = (() => {
    const start = checkpointStops[activeIndex];
    const end = checkpointBlendStarts[activeIndex + 1] ?? 0.68;
    return THREE.MathUtils.clamp((localProgress - start) / Math.max(0.001, end - start), 0, 1);
  })();

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    const velocity = THREE.MathUtils.clamp(Math.abs(scrollProgress - lastProgress.current) / Math.max(delta, 1 / 120), 0, 1.5);
    lastProgress.current = scrollProgress;
    scrollVelocity.current = THREE.MathUtils.damp(scrollVelocity.current, velocity, 4, delta);
    if (rootRef.current) {
      rootRef.current.visible = visible > 0.001;
    }
    coreMaterial.uniforms.uTime.value = time;
    coreMaterial.uniforms.uScrollVelocity.value = scrollVelocity.current;
    coreMaterial.uniforms.uReveal.value = visible;
    swarmMaterial.uniforms.uTime.value = time;
    swarmMaterial.uniforms.uScrollVelocity.value = scrollVelocity.current;
    swarmMaterial.uniforms.uReveal.value = visible;

    if (coreRef.current) coreRef.current.rotation.y = time * 0.12;
    if (coreLightRef.current) coreLightRef.current.intensity = (3.8 + Math.sin(time * 2.2) * 0.36) * visible;
    if (emberRef.current) {
      emberRef.current.rotation.y += delta * 0.009;
      emberRef.current.rotation.x = Math.sin(time * 0.08) * 0.025;
    }
    if (shockwaveRef.current) {
      const pulse = 1 + (Math.sin(time * 1.2) * 0.5 + 0.5) * 0.12;
      shockwaveRef.current.scale.setScalar(pulse);
      const material = shockwaveRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = (0.2 + (Math.sin(time * 1.2) * 0.5 + 0.5) * 0.2) * visible;
    }
  });

  return (
    <group ref={rootRef} position={ACT_FIVE_ORIGIN}>
      <PolarFloorGrid visibility={visible} />
      <ambientLight intensity={0.08 * visible} color="#24050a" />
      <group position={[0, -0.55, 0]}>
        <pointLight ref={coreLightRef} color="#ff102e" intensity={3.8} distance={20} decay={1.6} />
        <pointLight position={[0, 3.8, -3.5]} color="#ff183a" intensity={1.5 * visible} distance={16} />
        <directionalLight position={[-8, -5, 6]} color="#5a0719" intensity={0.45 * visible} />
        <mesh ref={coreRef}>
          <icosahedronGeometry args={[1.65, 5]} />
          <primitive object={coreMaterial} attach="material" />
        </mesh>
        <points geometry={swarm} frustumCulled={false} renderOrder={2}>
          <primitive object={swarmMaterial} attach="material" />
        </points>
        {[2.4, 3.1, 3.9].map((radius, index) => <RingSystem key={radius} radius={radius} index={index} visibility={visible} />)}
        <mesh ref={shockwaveRef} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.4, 0.012, 8, 180]} />
          <meshBasicMaterial color="#ff263f" transparent opacity={0.18 * visible} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
        <points ref={emberRef} geometry={emberField} frustumCulled={false}>
          <pointsMaterial color="#ff263f" size={0.018} transparent opacity={0.22 * visible} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </points>
      </group>

      {MONOLITHS.map((monolith, index) => (
        <group key={monolith.tag}>
          <Tether position={monolith.position as [number, number, number]} focus={Math.max(0, 1 - Math.abs(continuousIndex - index) * 1.35) * visible} />
          <Monolith index={index} continuousIndex={continuousIndex} progress={activeIndex === index ? activeCheckpointProgress : 0} visibility={visible} />
        </group>
      ))}
    </group>
  );
}
