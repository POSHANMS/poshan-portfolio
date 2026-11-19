"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SimplexNoise } from "three/addons/math/SimplexNoise.js";
import type { ActFourPhase } from "@/types/actFour";
import { ACT_FOUR_PROJECT_STATIONS } from "@/animations/actFourChoreography";
import ActFourExterior from "./ActFourExterior";
import ActFourSculpture from "./ActFourSculptures";

const WARP_PARTICLE_COUNT = 1_900;
const DOME_CENTER = new THREE.Vector3(0, 0, -27);
const PROJECT_ACCENTS = ["#00e5ff", "#8b5cf6", "#f59e0b", "#10b981", "#ff4d6d"];

function clamp(value: number, min = 0, max = 1) { return Math.max(min, Math.min(max, value)); }
function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}
function seeded(index: number, salt: number) {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function seededRandom(seed: number) {
  let value = seed;
  return {
    random: () => {
      value = (value * 16807) % 2147483647;
      return (value - 1) / 2147483646;
    },
  };
}

/** Numerical curl of three 3D Simplex potentials gives a smooth, divergence-free ember field. */
function curlDrift(x: number, y: number, z: number, time: number, fields: SimplexNoise[], target: THREE.Vector3) {
  const px = x * 0.085;
  const py = y * 0.085;
  const pz = z * 0.085;
  const t = time * 0.055;
  const e = 0.018;
  const sample = (field: SimplexNoise, sx: number, sy: number, sz: number) => field.noise3d(sx + t, sy - t * 0.72, sz + t * 0.43);
  const dAzDy = (sample(fields[2], px, py + e, pz) - sample(fields[2], px, py - e, pz)) / (2 * e);
  const dAyDz = (sample(fields[1], px, py, pz + e) - sample(fields[1], px, py, pz - e)) / (2 * e);
  const dAxDz = (sample(fields[0], px, py, pz + e) - sample(fields[0], px, py, pz - e)) / (2 * e);
  const dAzDx = (sample(fields[2], px + e, py, pz) - sample(fields[2], px - e, py, pz)) / (2 * e);
  const dAyDx = (sample(fields[1], px + e, py, pz) - sample(fields[1], px - e, py, pz)) / (2 * e);
  const dAxDy = (sample(fields[0], px, py + e, pz) - sample(fields[0], px, py - e, pz)) / (2 * e);
  return target.set(dAzDy - dAyDz, dAxDz - dAzDx, dAyDx - dAxDy).multiplyScalar(0.035);
}

function WarpStreamParticles({ phase, warpCharge }: { phase: ActFourPhase; warpCharge: React.RefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.LineBasicMaterial>(null);
  const phaseStartedAt = useRef(performance.now());
  useEffect(() => { phaseStartedAt.current = performance.now(); }, [phase]);
  const { geometry, particles } = useMemo(() => {
    const positions = new Float32Array(WARP_PARTICLE_COUNT * 6);
    const colors = new Float32Array(WARP_PARTICLE_COUNT * 6);
    const seeds = Array.from({ length: WARP_PARTICLE_COUNT }, (_, index) => {
      const angle = seeded(index, 1) * Math.PI * 2;
      const radius = 0.72 + seeded(index, 2) * 0.44;
      const depth = seeded(index, 3);
      const speed = 0.76 + seeded(index, 4) * 0.92;
      const phaseOffset = seeded(index, 5);
      const curve = (seeded(index, 6) - 0.5) * 0.22;
      const tailColor = new THREE.Color("#b52e4b");
      const headColor = new THREE.Color("#fff0ce");
      colors.set([tailColor.r, tailColor.g, tailColor.b, headColor.r, headColor.g, headColor.b], index * 6);
      return { angle, radius, depth, speed, phaseOffset, curve };
    });
    const result = new THREE.BufferGeometry();
    result.setAttribute("position", new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    result.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return { geometry: result, particles: seeds };
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current || !materialRef.current) return;
    const time = state.clock.getElapsedTime();
    const camera = state.camera as THREE.PerspectiveCamera;
    const aspect = state.size.width / Math.max(1, state.size.height);
    const charge = phase === "act4_exterior" ? clamp(warpCharge.current ?? 0) : phase === "act4_warp_in" ? 1 : phase === "act4_warp_out" ? 0.74 : 0;
    const isActive = (phase === "act4_exterior" && charge > 0.02) || phase === "act4_warp_in" || phase === "act4_warp_out";
    groupRef.current.visible = isActive;
    const age = (performance.now() - phaseStartedAt.current) / 1000;
    const stageFade = phase === "act4_warp_in" ? 1 - smoothstep(1.62, 2.2, age) : phase === "act4_warp_out" ? smoothstep(0.22, 0.38, age) * (1 - smoothstep(1.04, 1.12, age)) : 1;
    materialRef.current.opacity = THREE.MathUtils.damp(materialRef.current.opacity, isActive ? (0.28 + charge * 0.25) * stageFade : 0, 7, delta);
    if (!isActive) return;
    const position = geometry.getAttribute("position") as THREE.BufferAttribute;
    const halfHeightAt = (depth: number) => Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * depth;
    const tailSpan = 0.012 + charge * 0.035;
    particles.forEach((particle, index) => {
      const travel = (particle.phaseOffset + time * (0.08 + charge * 1.12) * particle.speed) % 1;
      const pathPoint = (age: number) => {
        const depth = THREE.MathUtils.lerp(64, 1.5, age);
        const halfHeight = halfHeightAt(depth);
        const halfWidth = halfHeight * aspect;
        const funnel = Math.pow(age, 1.45);
        const radius = THREE.MathUtils.lerp(particle.radius, 0.44 + seeded(index, 7) * 0.12, funnel);
        const angle = particle.angle + Math.sin(time * 1.1 + particle.phaseOffset * 6.28 + age * 3.2) * particle.curve;
        const inwardLensing = Math.sin(age * Math.PI) * 0.1 * charge;
        return new THREE.Vector3(Math.cos(angle) * halfWidth * (radius - inwardLensing), Math.sin(angle) * halfHeight * (radius - inwardLensing), -depth);
      };
      const head = pathPoint(travel);
      const tail = pathPoint(Math.max(0, travel - tailSpan));
      position.setXYZ(index * 2, tail.x, tail.y, tail.z);
      position.setXYZ(index * 2 + 1, head.x, head.y, head.z);
    });
    position.needsUpdate = true;
    groupRef.current.position.copy(camera.position);
    groupRef.current.quaternion.copy(camera.quaternion);
  });

  return <group ref={groupRef} renderOrder={18}><lineSegments geometry={geometry} frustumCulled={false} renderOrder={18}><lineBasicMaterial ref={materialRef} vertexColors transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} depthTest={false} toneMapped={false} /></lineSegments></group>;
}

function WormholeTunnel({ phase }: { phase: ActFourPhase }) {
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const { camera } = useThree();
  const phaseStartedAt = useRef(performance.now());
  useEffect(() => { phaseStartedAt.current = performance.now(); }, [phase]);
  const visible = phase === "act4_warp_in";
  useFrame(({ clock }, delta) => {
    if (!material.current) return;
    material.current.uniforms.uTime.value = clock.getElapsedTime();
    const age = (performance.now() - phaseStartedAt.current) / 1000;
    const stageFade = visible ? smoothstep(0.5, 0.7, age) * (1 - smoothstep(1.62, 2.2, age)) : 0;
    material.current.uniforms.uOpacity.value = THREE.MathUtils.damp(material.current.uniforms.uOpacity.value, stageFade * 0.88, 7.5, delta);
    if (visible && group.current) {
      group.current.position.copy(camera.position);
      group.current.quaternion.copy(camera.quaternion);
    }
  });
  return (
    <group ref={group} visible={visible}>
      <mesh rotation={[Math.PI / 2, 0, 0]} frustumCulled={false}>
        <cylinderGeometry args={[6, 6, 80, 48, 32, true]} />
        <shaderMaterial ref={material} uniforms={{ uTime: { value: 0 }, uOpacity: { value: 0 } }} transparent side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false}
          vertexShader={`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`}
          fragmentShader={`uniform float uTime;uniform float uOpacity;varying vec2 vUv;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.0),f.x),f.y);}float fbm(vec2 p){float v=0.0,a=0.5;for(int i=0;i<5;i++){v+=a*n(p);p=mat2(1.62,-1.18,1.18,1.62)*p+vec2(4.2,2.7);a*=0.5;}return v;}void main(){vec2 uv=vUv;float radial=abs(uv.x-0.5)*2.0;float edgeFade=1.0-smoothstep(0.68,1.0,radial);float endFade=smoothstep(0.0,0.13,uv.y)*(1.0-smoothstep(0.84,1.0,uv.y));float flow=fbm(vec2(uv.x*8.0+uTime*0.18,uv.y*11.0-uTime*2.7));float ribbon=pow(max(0.0,0.5+0.5*sin(uv.x*52.0+flow*8.0-uTime*3.1)),10.0);float turbulence=fbm(vec2(uv.x*19.0-uTime*0.12,uv.y*23.0-uTime*1.8));vec3 crimson=vec3(0.58,0.018,0.065);vec3 amber=vec3(1.0,0.31,0.09);vec3 cyan=vec3(0.025,0.66,0.88);vec3 color=mix(crimson,amber,smoothstep(0.48,0.88,flow));color=mix(color,cyan,smoothstep(0.78,0.98,turbulence)*0.34);float depthFade=1.0-smoothstep(0.3,0.85,abs(uv.y-0.5)*2.0);float alpha=(0.16+ribbon*0.38+turbulence*0.16)*edgeFade*endFade*uOpacity*(0.42+depthFade*0.58);gl_FragColor=vec4(color*(0.75+flow),alpha);}`}
        />
      </mesh>
    </group>
  );
}

function BreachFlash({ phase }: { phase: ActFourPhase }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const phaseStart = useRef(0);
  const lastPhase = useRef(phase);
  useFrame(({ clock }, delta) => {
    if (!material.current) return;
    const time = clock.getElapsedTime();
    if (lastPhase.current !== phase) { lastPhase.current = phase; phaseStart.current = time; }
    const elapsed = time - phaseStart.current;
    const entry = phase === "act4_warp_in" ? smoothstep(1.62, 1.78, elapsed) * (1 - smoothstep(1.96, 2.2, elapsed)) : 0;
    const exit = phase === "act4_warp_out" ? smoothstep(0.68, 0.84, elapsed) * (1 - smoothstep(1.05, 1.16, elapsed)) : 0;
    material.current.uniforms.uOpacity.value = THREE.MathUtils.damp(material.current.uniforms.uOpacity.value, Math.max(entry, exit) * 0.24, 10, delta);
    material.current.uniforms.uTime.value = time;
  });
  return <FlashInFrontOfCamera material={material} />;
}

function FlashInFrontOfCamera({ material }: { material: React.RefObject<THREE.ShaderMaterial | null> }) {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame(({ camera }) => {
    if (!mesh.current) return;
    mesh.current.position.copy(camera.position).add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(2.4));
    mesh.current.quaternion.copy(camera.quaternion);
  });
  return <mesh ref={mesh} frustumCulled={false} renderOrder={30}><planeGeometry args={[8, 5]} /><shaderMaterial ref={material} uniforms={{ uTime: { value: 0 }, uOpacity: { value: 0 } }} transparent depthTest={false} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false}
    vertexShader={`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`}
    fragmentShader={`uniform float uTime;uniform float uOpacity;varying vec2 vUv;void main(){vec2 p=vUv-0.5;float center=exp(-dot(p*vec2(1.0,0.82),p*vec2(1.0,0.82))*24.0);float flare=exp(-abs(p.y)*28.0)*exp(-abs(p.x)*4.0);vec3 color=mix(vec3(0.62,0.025,0.09),vec3(1.0,0.64,0.29),center);float pulse=0.92+0.08*sin(uTime*2.0);gl_FragColor=vec4(color,(center*0.52+flare*0.18)*uOpacity*pulse);}`}
  /></mesh>;
}

function buildMicroGrid() {
  const positions: number[] = [];
  const centerX = 2.6;
  const centerZ = -18;
  for (let ring = 1; ring <= 12; ring += 1) {
    const radius = ring * 2.4;
    for (let step = 0; step < 64; step += 1) {
      const a = step / 64 * Math.PI * 2;
      const b = (step + 1) / 64 * Math.PI * 2;
      positions.push(centerX + Math.cos(a) * radius, 0, centerZ + Math.sin(a) * radius, centerX + Math.cos(b) * radius, 0, centerZ + Math.sin(b) * radius);
    }
  }
  for (let ray = 0; ray < 48; ray += 1) {
    const angle = ray / 48 * Math.PI * 2;
    positions.push(centerX, 0, centerZ, centerX + Math.cos(angle) * 30, 0, centerZ + Math.sin(angle) * 30);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return geometry;
}

function ObservatoryVault({ phase, projectIndex }: { phase: ActFourPhase; projectIndex: number }) {
  const dome = useRef<THREE.Group>(null);
  const domeMaterial = useRef<THREE.ShaderMaterial>(null);
  const gradientMaterial = useRef<THREE.ShaderMaterial>(null);
  const keyLight = useRef<THREE.PointLight>(null);
  const floorMaterial = useRef<THREE.MeshStandardMaterial>(null);
  const gridMaterial = useRef<THREE.LineBasicMaterial>(null);
  const accentWire = useRef<THREE.MeshBasicMaterial>(null);
  const reflectionMaterials = useRef<(THREE.ShaderMaterial | null)[]>([]);
  const active = phase === "act4_warp_in" || phase === "act4_vault" || phase === "act4_warp_out";
  const phaseStartedAt = useRef(performance.now());
  const previousPhase = useRef(phase);
  const previousProjectIndex = useRef(projectIndex);
  const projectFlightStartedAt = useRef(performance.now());
  const reveal = useRef(0);
  const geometry = useMemo(buildMicroGrid, []);
  const color = useMemo(() => new THREE.Color(PROJECT_ACCENTS[projectIndex] ?? PROJECT_ACCENTS[0]), [projectIndex]);
  useFrame(({ clock }, delta) => {
    if (previousPhase.current !== phase) { previousPhase.current = phase; phaseStartedAt.current = performance.now(); }
    const phaseAge = (performance.now() - phaseStartedAt.current) / 1000;
    const revealTarget = phase === "act4_warp_in" ? smoothstep(1.62, 1.98, phaseAge) : active ? 1 : 0;
    reveal.current = THREE.MathUtils.damp(reveal.current, revealTarget, 8, delta);
    if (dome.current) dome.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.035) * 0.012;
    if (floorMaterial.current) floorMaterial.current.opacity = reveal.current;
    if (gridMaterial.current) gridMaterial.current.opacity = 0.12 * reveal.current;
    if (keyLight.current) {
      keyLight.current.color.lerp(color, 1 - Math.exp(-delta * 1.8));
      keyLight.current.intensity = 18 * reveal.current;
    }
    if (accentWire.current) accentWire.current.opacity = 0.09 * reveal.current;
    if (domeMaterial.current) {
      domeMaterial.current.uniforms.uAccent.value.lerp(color, 1 - Math.exp(-delta * 1.8));
      domeMaterial.current.uniforms.uOpacity.value = 0.16 * reveal.current;
    }
    if (gradientMaterial.current) {
      gradientMaterial.current.uniforms.uAccent.value.lerp(color, 1 - Math.exp(-delta * 1.8));
      gradientMaterial.current.uniforms.uReveal.value = reveal.current;
    }
    reflectionMaterials.current.forEach((reflection, index) => {
      if (!reflection) return;
      reflection.uniforms.uReveal.value = reveal.current;
      reflection.uniforms.uStrength.value = index === projectIndex ? 0.24 : 0.07;
      reflection.uniforms.uColor.value.set(PROJECT_ACCENTS[index]);
    });
  });
  return (
    <group position={DOME_CENTER} visible={active}>
      <group ref={dome}>
        <mesh frustumCulled={false}>
          <icosahedronGeometry args={[64.55, 4]} />
          <shaderMaterial ref={gradientMaterial} side={THREE.BackSide} transparent depthWrite={false} toneMapped={false}
            vertexShader={`varying vec3 vLocal;void main(){vLocal=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`}
            fragmentShader={`uniform vec3 uAccent;uniform float uReveal;varying vec3 vLocal;void main(){float horizon=pow(1.0-abs(vLocal.y),2.2);float zenith=smoothstep(-0.15,0.9,vLocal.y);vec3 zenithColor=vec3(0.028,0.034,0.061);vec3 horizonColor=mix(vec3(0.051,0.11,0.16),uAccent,0.17);vec3 color=mix(horizonColor,zenithColor,zenith);float glow=horizon*(0.12+0.08*sin(vLocal.x*13.0+vLocal.z*7.0));gl_FragColor=vec4(color+uAccent*glow,0.76*uReveal);}`}
            uniforms={{ uAccent: { value: color }, uReveal: { value: 0 } }} />
        </mesh>
        <mesh frustumCulled={false}>
          <icosahedronGeometry args={[65, 3]} />
          <shaderMaterial
            ref={domeMaterial}
            wireframe
            transparent
            side={THREE.BackSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
            uniforms={{ uAccent: { value: color }, uOpacity: { value: 0 } }}
            vertexShader={`varying vec3 vWorldPosition; varying vec3 vWorldNormal; void main(){vec4 world=modelMatrix*vec4(position,1.0);vWorldPosition=world.xyz;vWorldNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*world;}`}
            fragmentShader={`uniform vec3 uAccent;uniform float uOpacity;varying vec3 vWorldPosition;varying vec3 vWorldNormal;void main(){vec3 viewDir=normalize(cameraPosition-vWorldPosition);float fresnel=pow(1.0-abs(dot(normalize(vWorldNormal),viewDir)),2.1);float distanceFade=1.0-smoothstep(32.0,78.0,distance(cameraPosition,vWorldPosition));float ribFade=mix(0.34,1.0,fresnel);float alpha=uOpacity*ribFade*distanceFade;if(alpha<0.006)discard;vec3 color=mix(vec3(0.08,0.055,0.075),uAccent,0.28+fresnel*0.55);gl_FragColor=vec4(color,alpha);}`}
          />
        </mesh>
        <mesh rotation={[0.16, 0, 0.08]} frustumCulled={false}>
          <icosahedronGeometry args={[64.7, 2]} />
          <meshBasicMaterial ref={accentWire} color="#281321" wireframe transparent opacity={0} side={THREE.BackSide} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
      <mesh position={[0, -3.4, 0]} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
        <planeGeometry args={[150, 150]} />
        <meshStandardMaterial ref={floorMaterial} color="#10121a" metalness={0.88} roughness={0.3} transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
      <lineSegments geometry={geometry} position={[0, -3.37, 0]}>
        <lineBasicMaterial ref={gridMaterial} color="#8b9ba8" transparent opacity={0} depthWrite={false} />
      </lineSegments>
      {ACT_FOUR_PROJECT_STATIONS.map((station, index) => <mesh key={`station-reflection-${index}`} position={[station.x, -3.34, station.z - DOME_CENTER.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.8, 64]} />
        <shaderMaterial ref={(node) => { reflectionMaterials.current[index] = node; }} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false}
          uniforms={{ uColor: { value: new THREE.Color(PROJECT_ACCENTS[index]) }, uStrength: { value: index === projectIndex ? 0.24 : 0.07 }, uReveal: { value: reveal.current } }}
          vertexShader={`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`}
          fragmentShader={`uniform vec3 uColor;uniform float uStrength;uniform float uReveal;varying vec2 vUv;void main(){float radius=length(vUv-0.5)*2.0;float halo=exp(-radius*radius*8.0);float rim=exp(-pow((radius-0.42)*12.0,2.0))*0.14;float alpha=(halo*0.54+rim)*uStrength*uReveal;gl_FragColor=vec4(uColor*(0.5+halo*0.8),alpha);}`} />
      </mesh>)}
      <pointLight ref={keyLight} position={[2.4, 1.2, -68]} color={color} intensity={18} distance={48} decay={2} />
    </group>
  );
}

function DataEmbers({ phase, projectIndex }: { phase: ActFourPhase; projectIndex: number }) {
  const instances = useRef<THREE.InstancedMesh>(null);
  const material = useRef<THREE.MeshBasicMaterial>(null);
  const { pointer } = useThree();
  const phaseStartedAt = useRef(performance.now());
  const previousPhase = useRef(phase);
  const previousProjectIndex = useRef(projectIndex);
  const projectFlightStartedAt = useRef(performance.now());
  const seeds = useMemo(() => Array.from({ length: 920 }, (_, index) => {
    const angle = seeded(index, 21) * Math.PI * 2;
    const radius = 3 + seeded(index, 22) * 17;
    return { x: Math.cos(angle) * radius, y: -2 + seeded(index, 20) * 20, z: 5 - seeded(index, 26) * 50, phase: seeded(index, 24) * Math.PI * 2, size: 0.025 + seeded(index, 25) * 0.065, color: new THREE.Color(PROJECT_ACCENTS[projectIndex] ?? PROJECT_ACCENTS[0]).multiplyScalar(0.5 + seeded(index, 23) * 0.55) };
  }), [projectIndex]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const curl = useMemo(() => new THREE.Vector3(), []);
  const noiseFields = useMemo(() => [101, 211, 307].map((seed) => new SimplexNoise(seededRandom(seed))), []);
  const active = phase === "act4_vault" || phase === "act4_warp_out" || phase === "act4_warp_in";
  useFrame(({ clock }, delta) => {
    if (!instances.current || !material.current) return;
    if (previousPhase.current !== phase) { previousPhase.current = phase; phaseStartedAt.current = performance.now(); }
    if (previousProjectIndex.current !== projectIndex) {
      previousProjectIndex.current = projectIndex;
      projectFlightStartedAt.current = performance.now();
    }
    const time = clock.getElapsedTime();
    const phaseAge = (performance.now() - phaseStartedAt.current) / 1000;
    const reveal = phase === "act4_warp_in" ? smoothstep(1.62, 1.98, phaseAge) : active ? 1 : 0;
    material.current.opacity = THREE.MathUtils.damp(material.current.opacity, reveal * 0.76, 3.2, delta);
    const mesh = instances.current;
    const pointerX = pointer.x * 8;
    const pointerY = pointer.y * 4;
    for (let index = 0; index < seeds.length; index += 1) {
      const mote = seeds[index];
      curlDrift(mote.x + mote.phase, mote.y, mote.z, time, noiseFields, curl);
      const radius = 1 + 0.012 * Math.sin(time * 0.38 + mote.phase);
      const wake = Math.exp(-((mote.x - pointerX) ** 2 + (mote.y - pointerY) ** 2) / 22);
      const flight = smoothstep(0, 0.18, (performance.now() - projectFlightStartedAt.current) / 1000)
        * (1 - smoothstep(0.66, 0.85, (performance.now() - projectFlightStartedAt.current) / 1000));
      const stretch = Math.sin(flight * Math.PI) * 2.2;
      dummy.position.set(mote.x * radius + curl.x * 0.42 - (mote.y - pointerY) * wake * 0.16, mote.y * radius + curl.y * 0.34 + (mote.x - pointerX) * wake * 0.16, mote.z + curl.z * 0.38);
      const moteSize = mote.size * (0.8 + 0.2 * Math.sin(time + mote.phase));
      dummy.scale.set(moteSize, moteSize, moteSize * (1 + stretch));
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      mesh.setColorAt(index, mote.color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });
  return <instancedMesh ref={instances} args={[undefined, undefined, seeds.length]} visible={phase === "act4_warp_in" || phase === "act4_vault" || phase === "act4_warp_out"} frustumCulled={false}><icosahedronGeometry args={[1, 1]} /><meshBasicMaterial ref={material} vertexColors transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} /></instancedMesh>;
}

export default function ActFourWorld({ phase, projectIndex, warpCharge }: { phase: ActFourPhase; projectIndex: number; warpCharge: React.RefObject<number> }) {
  const phaseStartedAt = useRef(performance.now());
  const previousPhase = useRef(phase);
  const exteriorLayer = useRef<THREE.Group>(null);
  const tunnelLayer = useRef<THREE.Group>(null);
  const vaultLayer = useRef<THREE.Group>(null);
  const astrolabeRings = useRef<(THREE.Group | null)[]>([]);
  useEffect(() => {
    phaseStartedAt.current = performance.now();
    previousPhase.current = phase;
  }, [phase]);
  useFrame(() => {
    if (previousPhase.current !== phase) {
      previousPhase.current = phase;
      phaseStartedAt.current = performance.now();
    }
    const age = (performance.now() - phaseStartedAt.current) / 1000;
    const time = performance.now() * 0.001;
    astrolabeRings.current.forEach((ring, index) => {
      if (ring) ring.rotation.z = (index % 2 === 0 ? 1 : -1) * time * (0.012 + index * 0.004);
    });
    if (exteriorLayer.current) exteriorLayer.current.visible = phase === "act4_exterior" || (phase === "act4_warp_in" && age < 0.55);
    if (tunnelLayer.current) tunnelLayer.current.visible = (phase === "act4_warp_in" && age >= 0.55 && age < 2.2) || (phase === "act4_warp_out" && age >= 0.22);
    if (vaultLayer.current) vaultLayer.current.visible = (phase === "act4_warp_in" && age >= 1.62) || phase === "act4_vault" || phase === "act4_warp_out";
  });
  return (
    <group>
      <group ref={exteriorLayer} visible={phase === "act4_exterior"}><ActFourExterior phase={phase} warpCharge={warpCharge} /></group>
      <group ref={tunnelLayer}>
        <WormholeTunnel phase={phase} />
        <WarpStreamParticles phase={phase} warpCharge={warpCharge} />
      </group>
      <group ref={vaultLayer} visible={phase === "act4_vault" || phase === "act4_warp_out"}>
        <mesh position={[2.4, 1.2, -95]}><sphereGeometry args={[7, 40, 24]} /><meshBasicMaterial color="#2a0d20" transparent opacity={0.16} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
        <mesh position={[2.4, 1.2, -95]}><sphereGeometry args={[1.15, 48, 32]} /><meshBasicMaterial color="#030106" /></mesh>
        <mesh position={[2.4, 1.2, -95]} scale={1.035}>
          <sphereGeometry args={[1.15, 48, 32]} />
          <shaderMaterial transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false}
            vertexShader={`varying vec3 vNormal;varying vec3 vView;void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);vNormal=normalize(normalMatrix*normal);vView=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`}
            fragmentShader={`varying vec3 vNormal;varying vec3 vView;void main(){float edge=pow(1.0-max(dot(normalize(vNormal),normalize(vView)),0.0),3.4);vec3 color=mix(vec3(0.72,0.055,0.12),vec3(1.0,0.62,0.31),smoothstep(0.68,0.96,edge));gl_FragColor=vec4(color,edge*0.95);}`} />
        </mesh>
        <pointLight position={[2.4, 1.2, -93.5]} color="#ff784e" intensity={2.2} distance={36} decay={2} />
        {[9, 12, 15].map((radius, index) => <group key={radius} ref={(node) => { astrolabeRings.current[index] = node; }} position={[2.4, 1.2, -95]} rotation={index === 0 ? [0.28, 0.05, 0.18] : index === 1 ? [1.08, 0.72, -0.24] : [0.72, -0.5, 0.48]}>
          <mesh><torusGeometry args={[radius, 0.018, 6, 220]} /><meshStandardMaterial color="#34404a" metalness={0.94} roughness={0.22} emissive={PROJECT_ACCENTS[index]} emissiveIntensity={0.2} /></mesh>
          <mesh><torusGeometry args={[radius, 0.007, 5, 220]} /><meshBasicMaterial color={PROJECT_ACCENTS[index]} transparent opacity={0.46} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
        </group>)}
        <ObservatoryVault phase={phase} projectIndex={projectIndex} />
        <DataEmbers phase={phase} projectIndex={projectIndex} />
        {ACT_FOUR_PROJECT_STATIONS.map((station, index) => <group key={index} position={station}>
          <ActFourSculpture projectIndex={index} />
        </group>)}
      </group>
      <BreachFlash phase={phase} />
    </group>
  );
}
