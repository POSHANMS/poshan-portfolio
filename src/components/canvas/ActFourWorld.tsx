"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SimplexNoise } from "three/addons/math/SimplexNoise.js";
import type { ActFourPhase } from "@/types/actFour";
import { ACT_FOUR_PROJECT_STATIONS, ACT_FOUR_SINGULARITY_POSITION } from "@/animations/actFourChoreography";
import { ACT_FOUR_WARP_IN_DURATION_MS, WORMHOLE_CURVE, WORMHOLE_PATH_LENGTH, WORMHOLE_TUBE_RADIUS } from "@/animations/scrollCamera";
import ActFourExterior from "./ActFourExterior";
import ActFourSculpture from "./ActFourSculptures";

const WARP_PARTICLE_COUNT = 1_200;
const WORMHOLE_RING_COUNT = 32;
const WARP_NEEDLE_COUNT = 640;
const WARP_IN_DURATION_SECONDS = ACT_FOUR_WARP_IN_DURATION_MS / 1000;
const WARP_VAULT_CUTOVER_SECONDS = WARP_IN_DURATION_SECONDS * 0.77;
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
      // Keep every streak in the outer annulus so the throat stays readable.
      const radius = 0.59 + seeded(index, 2) * 0.38;
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

  useFrame((state) => {
    if (!groupRef.current || !materialRef.current) return;
    const time = state.clock.getElapsedTime();
    const camera = state.camera as THREE.PerspectiveCamera;
    const aspect = state.size.width / Math.max(1, state.size.height);
    const charge = phase === "act4_exterior" ? clamp(warpCharge.current ?? 0) : phase === "act4_warp_out" ? 0.74 : 0;
    const isActive = (phase === "act4_exterior" && charge > 0.02) || phase === "act4_warp_out";
    groupRef.current.visible = isActive;
    const age = (performance.now() - phaseStartedAt.current) / 1000;
    const stageFade = phase === "act4_warp_out" ? smoothstep(0.22, 0.38, age) * (1 - smoothstep(1.04, 1.12, age)) : 1;
    const targetOpacity = isActive ? (0.28 + charge * 0.25) * stageFade : 0;
    materialRef.current.opacity = targetOpacity;
    if (!isActive) return;
    const position = geometry.getAttribute("position") as THREE.BufferAttribute;
    const halfHeightAt = (depth: number) => Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * depth;
    const tailSpan = 0.012 + charge * 0.035;
    const travelSpeed = 0.08 + charge * 1.12;
    const motionTime = time;
    particles.forEach((particle, index) => {
      const travel = (particle.phaseOffset + motionTime * travelSpeed * particle.speed * 0.16) % 1;
      const pathPoint = (depth: number, radial: number) => {
        const halfHeight = halfHeightAt(depth);
        const halfWidth = halfHeight * aspect;
        const angle = particle.angle + motionTime * 0.11 * particle.speed + Math.sin(motionTime * 0.8 + particle.phaseOffset * 6.28) * particle.curve;
        return new THREE.Vector3(Math.cos(angle) * halfWidth * radial, Math.sin(angle) * halfHeight * radial, -depth);
      };
      const depth = THREE.MathUtils.lerp(72, 3, travel);
      const head = pathPoint(depth, particle.radius);
      const tail = pathPoint(depth, Math.max(0.555, particle.radius - tailSpan));
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
  const geometry = useMemo(() => new THREE.TubeGeometry(WORMHOLE_CURVE, 140, WORMHOLE_TUBE_RADIUS, 48, false), []);
  const phaseStartedAt = useRef(performance.now());
  useEffect(() => { phaseStartedAt.current = performance.now(); }, [phase]);
  const isWarpIn = phase === "act4_warp_in";
  useFrame(({ clock }) => {
    if (!material.current) return;
    material.current.uniforms.uTime.value = clock.getElapsedTime();
    const age = (performance.now() - phaseStartedAt.current) / 1000;
    const progress = clamp(age / WARP_IN_DURATION_SECONDS);
    material.current.uniforms.uTubeVisibility.value = isWarpIn ? smoothstep(0.23, 0.31, progress) : 0;
    if (group.current) group.current.visible = isWarpIn && progress >= 0.22 && progress < 0.79;
  });
  return (
    <group ref={group} visible={false}>
      <mesh geometry={geometry} frustumCulled={false} renderOrder={12}>
        <shaderMaterial
          ref={material}
          uniforms={{ uTime: { value: 0 }, uTubeVisibility: { value: 0 } }}
          transparent={false}
          side={THREE.BackSide}
          depthTest
          depthWrite
          toneMapped={false}
          vertexShader={`varying vec2 vUv;varying float vDistFromCamera;void main(){vUv=uv;vec4 worldPos=modelMatrix*vec4(position,1.0);vDistFromCamera=distance(cameraPosition,worldPos.xyz);gl_Position=projectionMatrix*viewMatrix*worldPos;}`}
          fragmentShader={`uniform float uTime;uniform float uTubeVisibility;varying vec2 vUv;varying float vDistFromCamera;float hash21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash21(i),hash21(i+vec2(1.0,0.0)),f.x),mix(hash21(i+vec2(0.0,1.0)),hash21(i+1.0),f.x),f.y);}float fbm(vec2 p){float sum=0.0,amp=0.5;for(int i=0;i<4;i++){sum+=noise(p)*amp;p=mat2(1.62,-1.18,1.18,1.62)*p+vec2(3.7,5.2);amp*=0.5;}return sum;}void main(){float lengthAxis=vUv.x;float around=vUv.y+lengthAxis*1.45;float flow=fbm(vec2(around*8.5+uTime*0.07,lengthAxis*12.0-uTime*2.5));float turbulence=fbm(vec2(around*17.0-uTime*0.1,lengthAxis*21.0-uTime*1.9));float goldVeins=pow(max(0.0,0.5+0.5*sin(around*118.0+flow*4.2+sin(lengthAxis*12.0-uTime*0.7)*0.34+turbulence*0.22)),23.0);float rubyVeins=pow(max(0.0,0.5+0.5*sin(around*76.0-flow*3.1+lengthAxis*2.0-uTime*0.45)),18.0);float gaps=smoothstep(0.25,0.62,flow);float fog=1.0-smoothstep(7.0,${(WORMHOLE_PATH_LENGTH * 0.94).toFixed(2)},vDistFromCamera);vec3 voidColor=vec3(0.0078,0.0039,0.0196);vec3 obsidian=vec3(0.0196,0.0039,0.0314);vec3 wallColor=vec3(0.0941,0.0078,0.0431);vec3 gold=vec3(1.0,0.745,0.333);vec3 ruby=vec3(0.878,0.118,0.282);vec3 plasma=gold*goldVeins*0.92+ruby*rubyVeins*0.38;vec3 nearWall=mix(obsidian,wallColor+plasma*gaps,clamp(uTubeVisibility,0.0,1.0));vec3 color=mix(voidColor,nearWall,fog);gl_FragColor=vec4(color,1.0);}`}
        />
      </mesh>
    </group>
  );
}

function WormholeLandmarks({ phase }: { phase: ActFourPhase }) {
  const instances = useRef<THREE.InstancedMesh>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const layout = useMemo(() => {
    const frames = WORMHOLE_CURVE.computeFrenetFrames(140, false);
    const zAxis = new THREE.Vector3(0, 0, 1);
    return Array.from({ length: WORMHOLE_RING_COUNT }, (_, index) => {
      const u = 0.04 + index * (0.93 / (WORMHOLE_RING_COUNT - 1));
      const frameIndex = Math.min(140, Math.round(u * 140));
      dummy.position.copy(WORMHOLE_CURVE.getPointAt(u));
      dummy.quaternion.setFromUnitVectors(zAxis, frames.tangents[frameIndex]);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      return { matrix: dummy.matrix.clone(), color: new THREE.Color(index % 2 === 0 ? "#ffd882" : "#ff2e55") };
    });
  }, [dummy]);
  useEffect(() => {
    if (!instances.current) return;
    layout.forEach((ring, index) => {
      instances.current?.setMatrixAt(index, ring.matrix);
      instances.current?.setColorAt(index, ring.color);
    });
    instances.current.instanceMatrix.needsUpdate = true;
    if (instances.current.instanceColor) instances.current.instanceColor.needsUpdate = true;
  }, [layout]);
  const phaseStartedAt = useRef(performance.now());
  useEffect(() => { phaseStartedAt.current = performance.now(); }, [phase]);
  useFrame(() => {
    const progress = clamp((performance.now() - phaseStartedAt.current) / (WARP_IN_DURATION_SECONDS * 1000));
    const active = phase === "act4_warp_in" && progress >= 0.22 && progress < 0.79;
    if (!instances.current || !material.current) return;
    instances.current.visible = active;
    material.current.uniforms.uOpacity.value = 0.78 * smoothstep(0.24, 0.30, progress) * (1 - smoothstep(0.75, 0.79, progress));
  });
  return (
    <instancedMesh ref={instances} args={[undefined, undefined, WORMHOLE_RING_COUNT]} frustumCulled={false} renderOrder={14}>
      <torusGeometry args={[WORMHOLE_TUBE_RADIUS * 0.93, 0.055, 8, 48]} />
      <shaderMaterial
        ref={material}
        uniforms={{ uOpacity: { value: 0 } }}
        vertexShader={`varying vec3 vColor;varying vec3 vRingCenter;void main(){vec4 center=modelMatrix*instanceMatrix*vec4(0.0,0.0,0.0,1.0);vec4 worldPosition=modelMatrix*instanceMatrix*vec4(position,1.0);vRingCenter=center.xyz;vColor=instanceColor;gl_Position=projectionMatrix*viewMatrix*worldPosition;}`}
        fragmentShader={`uniform float uOpacity;varying vec3 vColor;varying vec3 vRingCenter;void main(){float cameraDistance=distance(vRingCenter,cameraPosition);float nearFade=smoothstep(2.0,6.5,cameraDistance);gl_FragColor=vec4(vColor,uOpacity*nearFade);}`}
        transparent
        depthTest
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

function WarpNeedles({ phase }: { phase: ActFourPhase }) {
  const instances = useRef<THREE.InstancedMesh>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const layout = useMemo(() => {
    const frames = WORMHOLE_CURVE.computeFrenetFrames(140, false);
    const zAxis = new THREE.Vector3(0, 0, 1);
    return Array.from({ length: WARP_NEEDLE_COUNT }, (_, index) => {
      const u = 0.025 + seeded(index, 91) * 0.95;
      const frameIndex = Math.min(140, Math.floor(u * 140));
      const normal = frames.normals[frameIndex];
      const binormal = frames.binormals[frameIndex];
      const tangent = frames.tangents[frameIndex];
      const angle = seeded(index, 92) * Math.PI * 2;
      const radius = WORMHOLE_TUBE_RADIUS * (0.64 + seeded(index, 93) * 0.26);
      const radial = normal.clone().multiplyScalar(Math.cos(angle) * radius).addScaledVector(binormal, Math.sin(angle) * radius);
      const position = WORMHOLE_CURVE.getPointAt(u).add(radial);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(zAxis, tangent);
      const length = 4 + seeded(index, 94) * 2;
      const color = new THREE.Color(index % 5 === 0 ? "#ff3554" : index % 3 === 0 ? "#fff6e5" : "#ffd27d");
      dummy.position.copy(position);
      dummy.quaternion.copy(quaternion);
      dummy.scale.set(1, 1, length);
      dummy.updateMatrix();
      return { matrix: dummy.matrix.clone(), position, quaternion, length, color };
    });
  }, [dummy]);
  useEffect(() => {
    if (!instances.current) return;
    layout.forEach((needle, index) => {
      instances.current?.setMatrixAt(index, needle.matrix);
      instances.current?.setColorAt(index, needle.color);
    });
    instances.current.instanceMatrix.needsUpdate = true;
    if (instances.current.instanceColor) instances.current.instanceColor.needsUpdate = true;
  }, [layout]);
  const phaseStartedAt = useRef(performance.now());
  useEffect(() => { phaseStartedAt.current = performance.now(); }, [phase]);
  useFrame(() => {
    const progress = clamp((performance.now() - phaseStartedAt.current) / (WARP_IN_DURATION_SECONDS * 1000));
    const active = phase === "act4_warp_in" && progress >= 0.24 && progress < 0.79;
    if (!instances.current || !material.current) return;
    instances.current.visible = active;
    const dissolve = smoothstep(0.74, 0.79, progress);
    const reveal = smoothstep(0.24, 0.29, progress);
    material.current.uniforms.uOpacity.value = reveal * (1 - dissolve);
    layout.forEach((needle, index) => {
      dummy.position.copy(needle.position);
      dummy.quaternion.copy(needle.quaternion);
      dummy.scale.set(1, 1, needle.length);
      dummy.updateMatrix();
      instances.current?.setMatrixAt(index, dummy.matrix);
    });
    instances.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={instances} args={[undefined, undefined, WARP_NEEDLE_COUNT]} frustumCulled={false} renderOrder={16}>
      <boxGeometry args={[0.012, 0.012, 1]} />
      <shaderMaterial
        ref={material}
        uniforms={{ uOpacity: { value: 0 } }}
        vertexShader={`varying vec3 vColor;varying vec3 vNeedleCenter;varying float vAlong;void main(){vec4 center=modelMatrix*instanceMatrix*vec4(0.0,0.0,0.0,1.0);vec4 worldPosition=modelMatrix*instanceMatrix*vec4(position,1.0);vNeedleCenter=center.xyz;vColor=instanceColor;vAlong=clamp(position.z+0.5,0.0,1.0);gl_Position=projectionMatrix*viewMatrix*worldPosition;}`}
        fragmentShader={`uniform float uOpacity;varying vec3 vColor;varying vec3 vNeedleCenter;varying float vAlong;void main(){float distanceToCamera=distance(vNeedleCenter,cameraPosition);float nearFade=smoothstep(1.8,5.5,distanceToCamera);float endTaper=smoothstep(0.0,0.16,vAlong)*(1.0-smoothstep(0.84,1.0,vAlong));gl_FragColor=vec4(vColor,uOpacity*nearFade*endTaper);}`}
        transparent
        depthTest
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

function WormholeExitAperture({ phase }: { phase: ActFourPhase }) {
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const light = useRef<THREE.PointLight>(null);
  const quaternion = useMemo(() => new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1), WORMHOLE_CURVE.getTangentAt(1),
  ), []);
  const position = useMemo(() => WORMHOLE_CURVE.getPointAt(1), []);
  const phaseStartedAt = useRef(performance.now());
  useEffect(() => { phaseStartedAt.current = performance.now(); }, [phase]);
  useFrame(() => {
    const progress = clamp((performance.now() - phaseStartedAt.current) / (WARP_IN_DURATION_SECONDS * 1000));
    const appear = smoothstep(0.72, 0.76, progress) * (1 - smoothstep(0.76, 0.79, progress));
    if (group.current) {
      group.current.visible = phase === "act4_warp_in" && progress >= 0.72 && progress < 0.79;
      group.current.position.copy(position);
      group.current.quaternion.copy(quaternion);
      group.current.scale.setScalar(0.35 + appear * 0.65);
    }
    if (material.current) material.current.uniforms.uOpacity.value = appear;
    if (light.current) light.current.intensity = appear * 10;
  });
  return (
    <group ref={group} visible={false}>
      <mesh>
        <circleGeometry args={[WORMHOLE_TUBE_RADIUS, 64]} />
        <shaderMaterial
          ref={material}
          uniforms={{ uOpacity: { value: 0 } }}
          transparent
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
          vertexShader={`varying vec2 vPortalUv;void main(){vPortalUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`}
          fragmentShader={`uniform float uOpacity;varying vec2 vPortalUv;void main(){vec2 p=(vPortalUv-0.5)*2.0;float r2=dot(p,p);float halo=exp(-r2*3.2);float core=exp(-r2*12.0);vec3 warmGold=vec3(1.0,0.66,0.27);vec3 whiteGold=vec3(1.0,0.96,0.84);vec3 glowColor=mix(warmGold,whiteGold,core);float glowAlpha=max(halo*0.42,core*0.92)*uOpacity;gl_FragColor=vec4(glowColor,glowAlpha);}`}
        />
      </mesh>
      <pointLight ref={light} color="#fff0cf" intensity={0} distance={40} decay={1.5} />
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
    const exit = phase === "act4_warp_out" ? smoothstep(0.68, 0.84, elapsed) * (1 - smoothstep(1.05, 1.16, elapsed)) : 0;
    material.current.uniforms.uOpacity.value = THREE.MathUtils.damp(material.current.uniforms.uOpacity.value, exit * 0.24, 10, delta);
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

function buildVaultRibGeometry() {
  const floorY = -3.65;
  const springY = -3.38;
  const outerRadius = 22;
  const innerRadius = 21.05;
  const shape = new THREE.Shape();
  shape.moveTo(-outerRadius, floorY);
  shape.lineTo(-outerRadius, springY);
  for (let index = 1; index <= 48; index += 1) {
    const angle = Math.PI - (index / 48) * Math.PI;
    shape.lineTo(Math.cos(angle) * outerRadius, springY + Math.sin(angle) * outerRadius);
  }
  shape.lineTo(outerRadius, floorY);
  shape.lineTo(innerRadius, floorY);
  shape.lineTo(innerRadius, springY);
  for (let index = 1; index <= 48; index += 1) {
    const angle = (index / 48) * Math.PI;
    shape.lineTo(Math.cos(angle) * innerRadius, springY + Math.sin(angle) * innerRadius);
  }
  shape.lineTo(-innerRadius, floorY);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 1.05,
    steps: 1,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.12,
    bevelThickness: 0.1,
  });
  geometry.translate(0, 0, -0.525);
  geometry.computeVertexNormals();
  return geometry;
}

function buildVaultRibAccentGeometry() {
  const springY = -3.38;
  const innerRadius = 21.05;
  const points = Array.from({ length: 49 }, (_, index) => {
    const angle = (index / 48) * Math.PI;
    return new THREE.Vector3(Math.cos(angle) * innerRadius, springY + Math.sin(angle) * innerRadius, 0.54);
  });
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 96, 0.024, 6, false);
}

function buildVaultStars() {
  const count = 420;
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const y = seeded(index, 71) * 2 - 1;
    const angle = seeded(index, 72) * Math.PI * 2;
    const radius = 86 + seeded(index, 73) * 72;
    const horizontal = Math.sqrt(1 - y * y);
    positions.set([Math.cos(angle) * horizontal * radius, y * radius, Math.sin(angle) * horizontal * radius], index * 3);
    sizes[index] = 0.13 + seeded(index, 74) * 0.2;
    phases[index] = seeded(index, 75) * Math.PI * 2;
    const tint = seeded(index, 76);
    const color = tint > 0.86 ? new THREE.Color("#bdd9ff") : tint > 0.68 ? new THREE.Color("#ffe6ce") : new THREE.Color("#dce6f5");
    colors.set([color.r, color.g, color.b], index * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  return geometry;
}

function VaultDistantStars() {
  const material = useRef<THREE.ShaderMaterial>(null);
  const geometry = useMemo(buildVaultStars, []);
  useFrame(({ clock }) => {
    if (material.current) material.current.uniforms.uTime.value = clock.getElapsedTime();
  });
  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        transparent
        depthWrite={false}
        toneMapped={false}
        uniforms={{ uTime: { value: 0 } }}
        vertexShader={`attribute float aSize;attribute float aPhase;attribute vec3 aColor;uniform float uTime;varying float vTwinkle;varying vec3 vColor;void main(){vec4 mvPosition=modelViewMatrix*vec4(position,1.0);vColor=aColor;vTwinkle=0.56+0.44*(0.5+0.5*sin(uTime*0.7+aPhase));gl_PointSize=clamp(aSize*(700.0/max(-mvPosition.z,1.0)),0.65,2.6);gl_Position=projectionMatrix*mvPosition;}`}
        fragmentShader={`varying float vTwinkle;varying vec3 vColor;void main(){float radius=length(gl_PointCoord-0.5);float disc=1.0-smoothstep(0.26,0.5,radius);if(disc<0.01)discard;gl_FragColor=vec4(vColor*vTwinkle,disc*vTwinkle*0.78);}`}
      />
    </points>
  );
}

function ObservatoryVault({ phase, projectIndex }: { phase: ActFourPhase; projectIndex: number }) {
  const dome = useRef<THREE.Group>(null);
  const gradientMaterial = useRef<THREE.ShaderMaterial>(null);
  const keyLight = useRef<THREE.PointLight>(null);
  const floorMaterial = useRef<THREE.ShaderMaterial>(null);
  const canopyWire = useRef<THREE.ShaderMaterial>(null);
  const ribAccentMaterial = useRef<THREE.MeshStandardMaterial>(null);
  const activeStationPosition = useMemo(() => new THREE.Vector3(), []);
  const ribGeometry = useMemo(buildVaultRibGeometry, []);
  const ribAccentGeometry = useMemo(buildVaultRibAccentGeometry, []);
  const active = phase === "act4_warp_in" || phase === "act4_vault" || phase === "act4_warp_out";
  const phaseStartedAt = useRef(performance.now());
  const previousPhase = useRef(phase);
  const reveal = useRef(0);
  const color = useMemo(() => new THREE.Color(PROJECT_ACCENTS[projectIndex] ?? PROJECT_ACCENTS[0]), [projectIndex]);
  useFrame(({ clock }, delta) => {
    if (previousPhase.current !== phase) { previousPhase.current = phase; phaseStartedAt.current = performance.now(); }
    const phaseAge = (performance.now() - phaseStartedAt.current) / 1000;
    const revealTarget = phase === "act4_warp_in" ? smoothstep(1.25, 1.55, phaseAge) : active ? 1 : 0;
    reveal.current = THREE.MathUtils.damp(reveal.current, revealTarget, 14, delta);
    if (dome.current) dome.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.035) * 0.012;
    activeStationPosition.copy(ACT_FOUR_PROJECT_STATIONS[projectIndex] ?? ACT_FOUR_PROJECT_STATIONS[0]).sub(DOME_CENTER);
    if (floorMaterial.current) {
      floorMaterial.current.uniforms.uTime.value = clock.getElapsedTime();
      floorMaterial.current.uniforms.uReveal.value = reveal.current;
      floorMaterial.current.uniforms.uAccent.value.lerp(color, 1 - Math.exp(-delta * 1.8));
      floorMaterial.current.uniforms.uActiveStationPos.value.copy(activeStationPosition);
    }
    if (keyLight.current) {
      keyLight.current.color.lerp(color, 1 - Math.exp(-delta * 1.8));
      keyLight.current.position.set(activeStationPosition.x, activeStationPosition.y + 3.8, activeStationPosition.z + 1.5);
      const arrivalProgress = phaseAge / WARP_IN_DURATION_SECONDS;
      const energyLock = phase === "act4_warp_in" && projectIndex === 0
        ? 1 + Math.sin(clamp((arrivalProgress - 0.82) / 0.14) * Math.PI * 5) * 0.16 * (1 - smoothstep(0.94, 0.98, arrivalProgress))
        : 1;
      keyLight.current.intensity = 4.6 * reveal.current * energyLock;
    }
    if (ribAccentMaterial.current) ribAccentMaterial.current.emissive.copy(color);
    if (canopyWire.current) {
      canopyWire.current.uniforms.uAccent.value.lerp(color, 1 - Math.exp(-delta * 1.8));
      canopyWire.current.uniforms.uOpacity.value = 0.08 * reveal.current;
    }
    if (gradientMaterial.current) {
      gradientMaterial.current.uniforms.uAccent.value.lerp(color, 1 - Math.exp(-delta * 1.8));
      gradientMaterial.current.uniforms.uTime.value = clock.getElapsedTime();
      gradientMaterial.current.uniforms.uReveal.value = reveal.current;
    }
  });
  return (
    <group position={DOME_CENTER} visible={active}>
      <group ref={dome}>
        <mesh frustumCulled={false}>
          <icosahedronGeometry args={[170, 5]} />
          <shaderMaterial ref={gradientMaterial} side={THREE.BackSide} transparent depthWrite={false} toneMapped={false}
            vertexShader={`varying vec3 vLocal;void main(){vLocal=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`}
            fragmentShader={`uniform vec3 uAccent;uniform float uReveal;uniform float uTime;varying vec3 vLocal;float hash31(vec3 p){p=fract(p*0.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(hash31(i),hash31(i+vec3(1,0,0)),f.x),mix(hash31(i+vec3(0,1,0)),hash31(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash31(i+vec3(0,0,1)),hash31(i+vec3(1,0,1)),f.x),mix(hash31(i+vec3(0,1,1)),hash31(i+vec3(1,1,1)),f.x),f.y),f.z);}float fbm(vec3 p){float sum=0.0;float amp=0.5;for(int i=0;i<4;i++){sum+=noise3(p)*amp;p=p*2.03+vec3(7.1,3.7,5.3);amp*=0.5;}return sum;}void main(){float zenith=smoothstep(-0.12,0.92,vLocal.y);vec3 base=mix(vec3(0.0035,0.0055,0.011),vec3(0.0018,0.0028,0.006),zenith);float horizon=pow(1.0-abs(vLocal.y),2.0);vec3 drift=vec3(uTime*0.0015,uTime*0.001,-uTime*0.0012);float mist=fbm(vLocal*8.0+drift);float veil=smoothstep(0.48,0.76,mist)*horizon;float atmosphericGlow=veil*0.10+horizon*0.012;vec3 color=base+uAccent*atmosphericGlow;gl_FragColor=vec4(color,0.97*uReveal);}`}
            uniforms={{ uAccent: { value: color }, uReveal: { value: 0 }, uTime: { value: 0 } }} />
        </mesh>
        <mesh frustumCulled={false}>
          <icosahedronGeometry args={[169, 3]} />
          <shaderMaterial
            ref={canopyWire}
            wireframe
            transparent
            side={THREE.BackSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
            uniforms={{ uAccent: { value: color }, uOpacity: { value: 0 } }}
            vertexShader={`varying vec3 vWorldPosition; varying vec3 vWorldNormal; void main(){vec4 world=modelMatrix*vec4(position,1.0);vWorldPosition=world.xyz;vWorldNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*world;}`}
            fragmentShader={`uniform vec3 uAccent;uniform float uOpacity;varying vec3 vWorldPosition;varying vec3 vWorldNormal;void main(){vec3 viewDir=normalize(cameraPosition-vWorldPosition);float fresnel=pow(1.0-abs(dot(normalize(vWorldNormal),viewDir)),2.0);float fade=1.0-smoothstep(65.0,150.0,distance(cameraPosition,vWorldPosition));float alpha=min(0.08,uOpacity*(0.18+fresnel*0.7))*fade;if(alpha<0.003)discard;gl_FragColor=vec4(mix(vec3(0.025,0.032,0.047),uAccent,0.18+fresnel*0.28),alpha);}`}
          />
        </mesh>
      </group>
      <mesh position={[0, -3.4, 0]} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
        <planeGeometry args={[180, 320]} />
        <shaderMaterial ref={floorMaterial} transparent depthWrite={false} side={THREE.DoubleSide} toneMapped={false}
          uniforms={{ uTime: { value: 0 }, uReveal: { value: 0 }, uAccent: { value: color }, uActiveStationPos: { value: activeStationPosition.clone() } }}
          vertexShader={`varying vec2 vDeck;void main(){vDeck=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`}
          fragmentShader={`uniform float uTime;uniform float uReveal;uniform vec3 uAccent;uniform vec3 uActiveStationPos;varying vec2 vDeck;float hash21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float line(float x,float halfWidth){float d=abs(fract(x+0.5)-0.5);return 1.0-smoothstep(halfWidth,halfWidth+0.01,d);}void main(){vec2 p=vec2(vDeck.x,-vDeck.y);vec3 worldPos=vec3(p.x,${(DOME_CENTER.y - 3.4).toFixed(1)},p.y+${DOME_CENTER.z.toFixed(1)});float dist=distance(cameraPosition,worldPos);float fog=1.0-smoothstep(34.0,176.0,dist);float sideFade=1.0-smoothstep(64.0,92.0,abs(p.x));float seams=max(line((p.x+90.0)/6.0,0.012),line((p.y+160.0)/9.0,0.012))*0.045;float guideL=exp(-pow((p.x-0.24)/0.035,2.0));float guideR=exp(-pow((p.x+0.24)/0.035,2.0));float runway=(guideL+guideR)*0.022;vec2 poolDelta=p-uActiveStationPos.xz;float radial=dot(poolDelta*vec2(0.58,0.3),poolDelta*vec2(0.58,0.3));float pool=exp(-radial*0.62);float spec=exp(-radial*2.4)*(0.96+0.04*sin(uTime*0.55+length(poolDelta)*1.7));float brushed=(hash21(floor(p*vec2(76.0,18.0)+vec2(uTime*0.02,0.0)))-0.5)*0.0008;vec3 base=vec3(0.0032,0.0042,0.0075);vec3 color=base+vec3(seams*0.045+runway+brushed)+uAccent*(pool*0.075+spec*0.09)+vec3(0.20,0.23,0.31)*spec*0.018;float alpha=uReveal*fog*sideFade;gl_FragColor=vec4(max(color,vec3(0.0)),alpha);}`}
        />
      </mesh>
      {Array.from({ length: 8 }, (_, index) => <group key={`vault-rib-${index}`} position={[0, 0, 32 - index * 25.5]}>
        <mesh geometry={ribGeometry}>
          <meshStandardMaterial color="#121722" metalness={0.88} roughness={0.32} emissive={color} emissiveIntensity={0.035} />
        </mesh>
        <mesh geometry={ribAccentGeometry}>
          <meshStandardMaterial ref={index === 0 ? ribAccentMaterial : undefined} color="#10141d" emissive={color} emissiveIntensity={0.65} metalness={0.88} roughness={0.32} />
        </mesh>
      </group>)}
      <pointLight ref={keyLight} position={[2.6, 3.5, 27]} color={color} intensity={4.6} distance={30} decay={2} />
      <VaultDistantStars />
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
  const seeds = useMemo(() => Array.from({ length: 950 }, (_, index) => {
    const angle = seeded(index, 21) * Math.PI * 2;
    const radius = 3 + seeded(index, 22) * 17;
    return { x: Math.cos(angle) * radius, y: -2 + seeded(index, 20) * 20, z: 28 - seeded(index, 26) * 178, phase: seeded(index, 24) * Math.PI * 2, size: 0.018 + seeded(index, 25) * 0.045, color: new THREE.Color(PROJECT_ACCENTS[projectIndex] ?? PROJECT_ACCENTS[0]).multiplyScalar(0.22 + seeded(index, 23) * 0.24) };
  }), [projectIndex]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const curl = useMemo(() => new THREE.Vector3(), []);
  const noiseFields = useMemo(() => [101, 211, 307].map((seed) => new SimplexNoise({ random: seededRandom(seed) })), []);
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
    const reveal = phase === "act4_warp_in" ? smoothstep(1.25, 1.55, phaseAge) : active ? 1 : 0;
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

function AttenuatedStation({ index, focusIndex, station, children }: {
  index: number;
  focusIndex: React.RefObject<number>;
  station: THREE.Vector3;
  children: React.ReactNode;
}) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    const root = group.current;
    if (!root) return;
    const delta = Math.abs(index - (focusIndex.current ?? 0));
    root.visible = delta < 1.5;
    const attenuation = delta < 0.5 ? 1 : 1 - smoothstep(0.5, 1, delta) * 0.92;
    root.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          const values = material.userData as { vaultOpacity?: number; vaultTransparent?: boolean; vaultDepthWrite?: boolean; vaultVisible?: boolean };
          if (values.vaultOpacity === undefined) {
            values.vaultOpacity = material.opacity;
            values.vaultTransparent = material.transparent;
            values.vaultDepthWrite = material.depthWrite;
            values.vaultVisible = material.visible;
          }
          material.transparent = values.vaultTransparent || attenuation < 1;
          material.opacity = (values.vaultOpacity ?? material.opacity) * attenuation;
          material.depthWrite = attenuation < 1 ? false : values.vaultDepthWrite ?? true;
          material.visible = material instanceof THREE.ShaderMaterial && attenuation < 0.99 ? false : values.vaultVisible ?? true;
        });
      } else if (object instanceof THREE.PointLight || object instanceof THREE.SpotLight) {
        const values = object.userData as { vaultIntensity?: number };
        if (values.vaultIntensity === undefined) values.vaultIntensity = object.intensity;
        object.intensity = values.vaultIntensity * attenuation;
        object.visible = attenuation > 0.02;
      }
    });
  });
  return <group ref={group} position={station}><>{children}</></group>;
}

export default function ActFourWorld({ phase, projectIndex, warpCharge }: { phase: ActFourPhase; projectIndex: number; warpCharge: React.RefObject<number> }) {
  const phaseStartedAt = useRef(performance.now());
  const previousPhase = useRef(phase);
  const exteriorLayer = useRef<THREE.Group>(null);
  const tunnelLayer = useRef<THREE.Group>(null);
  const vaultLayer = useRef<THREE.Group>(null);
  const astrolabeRings = useRef<(THREE.Group | null)[]>([]);
  const stationFocus = useRef(projectIndex);
  useEffect(() => {
    phaseStartedAt.current = performance.now();
    previousPhase.current = phase;
  }, [phase]);
  useFrame((_, delta) => {
    if (previousPhase.current !== phase) {
      previousPhase.current = phase;
      phaseStartedAt.current = performance.now();
    }
    const age = (performance.now() - phaseStartedAt.current) / 1000;
    const time = performance.now() * 0.001;
    stationFocus.current = THREE.MathUtils.damp(stationFocus.current, projectIndex, 5.5, delta);
    astrolabeRings.current.forEach((ring, index) => {
      if (ring) ring.rotation.z = (index % 2 === 0 ? 1 : -1) * time * (0.012 + index * 0.004);
    });
    const progress = age / WARP_IN_DURATION_SECONDS;
    if (exteriorLayer.current) exteriorLayer.current.visible = phase === "act4_exterior" || (phase === "act4_warp_in" && progress < 0.27);
    if (tunnelLayer.current) tunnelLayer.current.visible = (phase === "act4_warp_in" && progress >= 0.22 && progress < 0.79) || (phase === "act4_warp_out" && age >= 0.22);
    if (vaultLayer.current) vaultLayer.current.visible = (phase === "act4_warp_in" && age >= WARP_VAULT_CUTOVER_SECONDS) || phase === "act4_vault" || phase === "act4_warp_out";
  });
  return (
    <group>
      <group ref={exteriorLayer} visible={phase === "act4_exterior"}><ActFourExterior phase={phase} warpCharge={warpCharge} /></group>
      <group ref={tunnelLayer}>
        <WormholeTunnel phase={phase} />
        <WormholeLandmarks phase={phase} />
        <WormholeExitAperture phase={phase} />
      </group>
      <WarpStreamParticles phase={phase} warpCharge={warpCharge} />
      <WarpNeedles phase={phase} />
      <group ref={vaultLayer} visible={phase === "act4_vault" || phase === "act4_warp_out"}>
        <mesh position={ACT_FOUR_SINGULARITY_POSITION}><sphereGeometry args={[7, 40, 24]} /><meshBasicMaterial color="#11131a" transparent opacity={0.09} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
        <mesh position={ACT_FOUR_SINGULARITY_POSITION}><sphereGeometry args={[1.15, 48, 32]} /><meshBasicMaterial color="#03050a" /></mesh>
        <mesh position={ACT_FOUR_SINGULARITY_POSITION} scale={1.035}>
          <sphereGeometry args={[1.15, 48, 32]} />
          <shaderMaterial transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false}
            vertexShader={`varying vec3 vNormal;varying vec3 vView;void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);vNormal=normalize(normalMatrix*normal);vView=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`}
            fragmentShader={`varying vec3 vNormal;varying vec3 vView;void main(){float edge=pow(1.0-max(dot(normalize(vNormal),normalize(vView)),0.0),3.4);vec3 color=mix(vec3(0.72,0.055,0.12),vec3(1.0,0.62,0.31),smoothstep(0.68,0.96,edge));gl_FragColor=vec4(color,edge*0.95);}`} />
        </mesh>
        <pointLight position={ACT_FOUR_SINGULARITY_POSITION.clone().add(new THREE.Vector3(0, 0, 1.5))} color="#b4c4dc" intensity={0.45} distance={30} decay={2} />
        {[28, 36, 44].map((radius, index) => <group key={radius} ref={(node) => { astrolabeRings.current[index] = node; }} position={ACT_FOUR_SINGULARITY_POSITION} rotation={index === 0 ? [0.28, 0.05, 0.18] : index === 1 ? [1.08, 0.72, -0.24] : [0.72, -0.5, 0.48]}>
          <mesh><torusGeometry args={[radius, 0.025, 6, 220]} /><meshStandardMaterial color="#151923" metalness={0.98} roughness={0.38} emissive="#344152" emissiveIntensity={0.035} /></mesh>
          <mesh><torusGeometry args={[radius, 0.009, 5, 220]} /><meshBasicMaterial color="#8190a8" transparent opacity={0.07} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
        </group>)}
        <ObservatoryVault phase={phase} projectIndex={projectIndex} />
        <DataEmbers phase={phase} projectIndex={projectIndex} />
        {ACT_FOUR_PROJECT_STATIONS.map((station, index) => <AttenuatedStation key={index} index={index} focusIndex={stationFocus} station={station}>
          <ActFourSculpture projectIndex={index} />
        </AttenuatedStation>)}
      </group>
      <BreachFlash phase={phase} />
    </group>
  );
}
