"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { ActFourPhase } from "@/types/actFour";
import { ACT_FOUR_FOLD_POSES, ACT_FOUR_WARP_IN_DURATION_MS, WORMHOLE_CURVE, WORMHOLE_PATH_LENGTH, WORMHOLE_TUBE_RADIUS } from "@/animations/scrollCamera";
import ActFourExterior from "./ActFourExterior";

const WARP_PARTICLE_COUNT = 1_200;
const WORMHOLE_RING_COUNT = 32;
const WARP_NEEDLE_COUNT = 640;
const WARP_IN_DURATION_SECONDS = ACT_FOUR_WARP_IN_DURATION_MS / 1000;
const WARP_VAULT_CUTOVER_SECONDS = WARP_IN_DURATION_SECONDS * 0.755;
const WARP_OUT_DURATION_SECONDS = 1.1;
const WARP_OUT_VAULT_FADE_SECONDS = 0.45;
function clamp(value: number, min = 0, max = 1) { return Math.max(min, Math.min(max, value)); }
function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}
function seeded(index: number, salt: number) {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
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
    const isActive = phase === "act4_exterior" && charge > 0.02;
    groupRef.current.visible = isActive;
    const targetOpacity = isActive ? 0.28 + charge * 0.25 : 0;
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
    if (group.current) group.current.visible = isWarpIn && progress >= 0.22 && progress < 0.695;
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
    const active = phase === "act4_warp_in" && progress >= 0.22 && progress < 0.695;
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
    const active = phase === "act4_warp_in" && progress >= 0.24 && progress < 0.695;
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

function BreachFlash({ phase }: { phase: ActFourPhase }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const phaseStart = useRef(0);
  const lastPhase = useRef(phase);
  useFrame(({ clock }, delta) => {
    if (!material.current) return;
    const time = clock.getElapsedTime();
    if (lastPhase.current !== phase) { lastPhase.current = phase; phaseStart.current = time; }
    // A centered radial flash reads as a brown oval during exit, so keep this layer off.
    const exit = 0;
    material.current.uniforms.uOpacity.value = THREE.MathUtils.damp(material.current.uniforms.uOpacity.value, exit, 10, delta);
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
    fragmentShader={`uniform float uTime;uniform float uOpacity;varying vec2 vUv;void main(){vec2 p=vUv-0.5;float radial=exp(-dot(p*vec2(0.9,1.15),p*vec2(0.9,1.15))*18.0);float breath=exp(-pow((p.y+sin(uTime*0.42)*0.008)*18.0,2.0))*exp(-abs(p.x)*3.4);float pulse=0.94+0.06*sin(uTime*1.4);vec3 obsidian=vec3(0.0078,0.0039,0.0157);vec3 champagne=vec3(1.0,0.902,0.702);vec3 color=mix(obsidian,champagne,radial*0.32+breath*0.12);float alpha=clamp(radial*0.46+breath*0.12,0.0,0.58)*uOpacity*pulse;gl_FragColor=vec4(color,alpha);}`}
  /></mesh>;
}

const GRID_YAW = 0.34;
const VAULT_PALETTE = { void: "#020103", mirror: "#050306", card: "#08060A", champagne: "#FFF4D2", gold: "#FFBE45", amber: "#E0861A", bronze: "#7A3C0D", ruby: "#FF2A4B", crimson: "#C90F32", wine: "#4A0614", silver: "#E8D8C3", quartz: "#524438" } as const;

type CathedralTextures = {
  waterfall: THREE.CanvasTexture;
  glass: THREE.CanvasTexture;
  nebula: THREE.CanvasTexture;
  glint: THREE.CanvasTexture;
  wings: Array<[THREE.CanvasTexture, THREE.CanvasTexture]>;
};

function toCanvasTexture(canvas: HTMLCanvasElement, renderer: THREE.WebGLRenderer) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return texture;
}

function createCathedralTextures(renderer: THREE.WebGLRenderer): CathedralTextures {
  const makeCanvas = (width: number, height: number) => {
    const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D is required for Act IV cathedral textures.");
    return { canvas, context };
  };
  const fiberCanvas = makeCanvas(512, 512);
  const aura = fiberCanvas.context.createRadialGradient(256, 256, 10, 256, 256, 250);
  aura.addColorStop(0, "rgba(255,255,255,.2)"); aura.addColorStop(.48, "rgba(255,255,255,.06)"); aura.addColorStop(1, "rgba(255,255,255,0)");
  fiberCanvas.context.fillStyle = aura; fiberCanvas.context.fillRect(0, 0, 512, 512); fiberCanvas.context.globalCompositeOperation = "lighter";
  for (let i = 0; i < 32; i += 1) {
    const x = 8 + seeded(i, 307) * 496, width = 1.5 + seeded(i, 311) * 10.5;
    const alpha = (.18 + seeded(i, 313) * .77) * Math.exp(-(((x - 256) / 130) ** 2));
    const fiber = fiberCanvas.context.createLinearGradient(0, 0, 0, 512);
    fiber.addColorStop(0, "rgba(255,255,255,0)"); fiber.addColorStop(.12, `rgba(255,255,255,${alpha * .72})`);
    fiber.addColorStop(.5, `rgba(255,255,255,${alpha})`); fiber.addColorStop(.88, `rgba(255,255,255,${alpha * .72})`); fiber.addColorStop(1, "rgba(255,255,255,0)");
    fiberCanvas.context.fillStyle = fiber; fiberCanvas.context.fillRect(x - width / 2, 0, width, 512);
  }
  const beamCanvas = makeCanvas(512, 256);
  const ends = beamCanvas.context.createLinearGradient(0, 0, 512, 0);
  [[0, 0], [.1, .75], [.24, 1], [.8, 1], [.94, .6], [1, 0]].forEach(([at, alpha]) => ends.addColorStop(at, `rgba(255,255,255,${alpha})`));
  beamCanvas.context.fillStyle = ends; beamCanvas.context.fillRect(0, 0, 512, 256);
  beamCanvas.context.globalCompositeOperation = "destination-in";
  const body = beamCanvas.context.createLinearGradient(0, 16, 0, 240);
  [[0, .02], [.15, .16], [.5, .08], [.86, .16], [1, .02]].forEach(([at, alpha]) => body.addColorStop(at, `rgba(255,255,255,${alpha})`));
  beamCanvas.context.fillStyle = body; beamCanvas.context.fillRect(0, 16, 512, 224); beamCanvas.context.globalCompositeOperation = "source-over";
  for (let i = 0; i < 6; i += 1) { beamCanvas.context.fillStyle = "rgba(255,255,255,.13)"; beamCanvas.context.fillRect(18, 38 + i * 34, 476, i % 2 ? 1 : 1.5); }
  [12, 244].forEach((y) => { const edge = beamCanvas.context.createLinearGradient(0, y - 7, 0, y + 7); edge.addColorStop(0, "rgba(255,255,255,0)"); edge.addColorStop(.5, "rgba(255,255,255,.96)"); edge.addColorStop(1, "rgba(255,255,255,0)"); beamCanvas.context.shadowColor = "rgba(255,244,210,.72)"; beamCanvas.context.shadowBlur = 7; beamCanvas.context.fillStyle = edge; beamCanvas.context.fillRect(0, y - 7, 512, 14); });
  beamCanvas.context.shadowBlur = 0;
  beamCanvas.context.globalCompositeOperation = "destination-in";
  beamCanvas.context.fillStyle = ends;
  beamCanvas.context.fillRect(0, 0, 512, 256);
  beamCanvas.context.globalCompositeOperation = "source-over";
  const nebulaCanvas = makeCanvas(256, 256); nebulaCanvas.context.globalCompositeOperation = "lighter";
  for (let i = 0; i < 8; i += 1) { const x = 64 + seeded(i, 331) * 128, y = 64 + seeded(i, 337) * 128, r = 34 + seeded(i, 347) * 70; const puff = nebulaCanvas.context.createRadialGradient(x, y, 0, x, y, r); puff.addColorStop(0, "rgba(196,134,71,.17)"); puff.addColorStop(.48, "rgba(122,60,13,.11)"); puff.addColorStop(1, "rgba(122,60,13,0)"); nebulaCanvas.context.fillStyle = puff; nebulaCanvas.context.fillRect(0, 0, 256, 256); }
  for (let i = 0; i < 180; i += 1) {
    const x = seeded(i, 353) * 256, y = seeded(i, 359) * 256, radius = 2 + seeded(i, 367) * 12;
    const dust = nebulaCanvas.context.createRadialGradient(x, y, 0, x, y, radius);
    dust.addColorStop(0, `rgba(196,134,71,${0.025 + seeded(i, 373) * 0.045})`);
    dust.addColorStop(1, "rgba(122,60,13,0)");
    nebulaCanvas.context.fillStyle = dust; nebulaCanvas.context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  const glintCanvas = makeCanvas(256, 256); const halo = glintCanvas.context.createRadialGradient(128, 128, 0, 128, 128, 118);
  halo.addColorStop(0, "rgba(255,244,210,.86)"); halo.addColorStop(.04, "rgba(255,244,210,.48)"); halo.addColorStop(.2, "rgba(255,190,69,.18)"); halo.addColorStop(1, "rgba(255,190,69,0)"); glintCanvas.context.fillStyle = halo; glintCanvas.context.fillRect(0, 0, 256, 256);
  const flareLine = glintCanvas.context.createLinearGradient(0, 128, 256, 128); flareLine.addColorStop(0, "rgba(255,244,210,0)"); flareLine.addColorStop(.48, "rgba(255,190,69,.3)"); flareLine.addColorStop(.5, "rgba(255,244,210,.96)"); flareLine.addColorStop(.52, "rgba(255,190,69,.3)"); flareLine.addColorStop(1, "rgba(255,244,210,0)"); glintCanvas.context.fillStyle = flareLine; glintCanvas.context.fillRect(0, 124, 256, 8);
  const verticalFlare = glintCanvas.context.createLinearGradient(128, 0, 128, 256); verticalFlare.addColorStop(0, "rgba(255,244,210,0)"); verticalFlare.addColorStop(.48, "rgba(255,190,69,.2)"); verticalFlare.addColorStop(.5, "rgba(255,244,210,.78)"); verticalFlare.addColorStop(.52, "rgba(255,190,69,.2)"); verticalFlare.addColorStop(1, "rgba(255,244,210,0)"); glintCanvas.context.fillStyle = verticalFlare; glintCanvas.context.fillRect(124, 0, 8, 256);
  const labels = ["FINDIT", "ZAMINSAATHI", "HOSTEL MANAGEMENT SYSTEM", "HEALTHGPT", "NOTEFLASH"];
  const makeWing = (label: string) => { const { canvas, context } = makeCanvas(1024, 320); context.globalAlpha = .32; context.fillStyle = VAULT_PALETTE.champagne; context.textAlign = "center"; context.textBaseline = "middle"; context.font = "600 76px Arial, sans-serif"; context.fillText(label.toUpperCase(), 512, 160, 900); return toCanvasTexture(canvas, renderer); };
  const textures: CathedralTextures = { waterfall: toCanvasTexture(fiberCanvas.canvas, renderer), glass: toCanvasTexture(beamCanvas.canvas, renderer), nebula: toCanvasTexture(nebulaCanvas.canvas, renderer), glint: toCanvasTexture(glintCanvas.canvas, renderer), wings: labels.map((_, i): [THREE.CanvasTexture, THREE.CanvasTexture] => [makeWing(labels[(i + labels.length - 1) % labels.length]), makeWing(labels[(i + 1) % labels.length])]) };
  return textures;
}

type ArchitecturalSlab = {
  matrix: THREE.Matrix4;
  bodyAlpha: number;
  edgeAlpha: number;
  seed: number;
  crimson: number;
};

type LightCurtain = {
  matrix: THREE.Matrix4;
  alpha: number;
  seed: number;
  tone: number;
};

function stationBasis(stationIndex: number) {
  const pose = ACT_FOUR_FOLD_POSES[stationIndex] ?? ACT_FOUR_FOLD_POSES[0];
  const forward = pose.target.clone().sub(pose.camera).normalize();
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
  const up = new THREE.Vector3().crossVectors(right, forward).normalize();
  const gridX = right.clone().multiplyScalar(Math.cos(GRID_YAW)).addScaledVector(forward, Math.sin(GRID_YAW)).normalize();
  const gridZ = right.clone().multiplyScalar(-Math.sin(GRID_YAW)).addScaledVector(forward, Math.cos(GRID_YAW)).normalize();
  return { pose, forward, right, up, gridX, gridZ };
}

function createPlaneMatrix(position: THREE.Vector3, across: THREE.Vector3, along: THREE.Vector3, width: number, length: number) {
  const xAxis = across.clone().normalize();
  const yAxis = along.clone().addScaledVector(xAxis, -along.dot(xAxis)).normalize();
  const normal = new THREE.Vector3().crossVectors(xAxis, yAxis).normalize();
  const basis = new THREE.Matrix4().makeBasis(xAxis, yAxis, normal);
  const quaternion = new THREE.Quaternion().setFromRotationMatrix(basis);
  return new THREE.Matrix4().compose(position, quaternion, new THREE.Vector3(width, length, 1));
}

function createArchitecturalSlabGeometry() {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute([
    -0.5, -0.5, 0, 0.5, -0.5, 0,
    -0.14, 0.5, 0, 0.14, 0.5, 0,
  ], 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute([
    0, 0, 1, 0, 0, 1, 1, 1,
  ], 2));
  geometry.setIndex([0, 1, 2, 1, 3, 2]);
  geometry.computeVertexNormals();
  return geometry;
}

function buildArchitecturalSlabs(stationIndex: number) {
  const { pose, forward, up, gridX, gridZ } = stationBasis(stationIndex);
  const slabs: ArchitecturalSlab[] = [];
  const addSlab = ({ axis, x, y, depth, width, length, crimson = false, index }: {
    axis: "x" | "z"; x: number; y: number; depth: number; width: number; length: number; crimson?: boolean; index: number;
  }) => {
    const across = axis === "x" ? gridX : gridZ;
    const center = pose.camera.clone()
      .addScaledVector(forward, depth)
      .addScaledVector(gridX, x)
      .addScaledVector(up, y);
    slabs.push({
      matrix: createPlaneMatrix(center, across, up, width, length),
      bodyAlpha: 0.05 + seeded(index + stationIndex * 61, 173) * 0.04,
      edgeAlpha: 0.09 + seeded(index + stationIndex * 67, 179) * 0.075,
      seed: seeded(index + stationIndex * 71, 181),
      crimson: Number(crimson),
    });
  };

  // Orthogonal smoked-glass sheets follow only the yawed cathedral grid axes.
  const perspectiveSlabs = [
    { axis: "x" as const, x: 8.8, y: 8.1, width: 7.2, crimson: false },
    { axis: "x" as const, x: -8.8, y: 7.6, width: 6.4, crimson: false },
    { axis: "z" as const, x: -8.8, y: -8.1, width: 8.0, crimson: false },
    { axis: "z" as const, x: 8.8, y: -8.4, width: 7.2, crimson: true },
  ];
  perspectiveSlabs.forEach((slab, index) => addSlab({
    ...slab,
    depth: 29.6,
    length: 56.8,
    index,
  }));

  // Six vertical prism pillars flank the monolith; their long axis is exactly up.
  const pillars = [
    { x: -13.5, depth: 18, width: 2.8, crimson: false },
    { x: 13.2, depth: 22, width: 2.8, crimson: true },
    { x: -14.2, depth: 28, width: 3.2, crimson: false },
    { x: 14.0, depth: 34, width: 3.0, crimson: false },
    { x: -12.8, depth: 40, width: 2.6, crimson: true },
    { x: 13.0, depth: 44, width: 3.0, crimson: false },
  ];
  pillars.forEach((pillar, index) => {
    const center = pose.camera.clone().addScaledVector(gridX, pillar.x).addScaledVector(forward, pillar.depth);
    slabs.push({
      matrix: createPlaneMatrix(center, gridX, up, pillar.width, 48 + seeded(index, 191) * 14),
      bodyAlpha: 0.025 + seeded(index, 193) * 0.02,
      edgeAlpha: 0.07 + seeded(index, 197) * 0.07,
      seed: seeded(index, 199),
      crimson: Number(pillar.crimson),
    });
  });

  const geometry = createArchitecturalSlabGeometry();
  const attributes: Array<[string, Float32Array]> = [
    ["aBodyAlpha", new Float32Array(slabs.map((slab) => slab.bodyAlpha))],
    ["aEdgeAlpha", new Float32Array(slabs.map((slab) => slab.edgeAlpha))],
    ["aGlassSeed", new Float32Array(slabs.map((slab) => slab.seed))],
    ["aGlassCrimson", new Float32Array(slabs.map((slab) => slab.crimson))],
  ];
  attributes.forEach(([name, values]) => geometry.setAttribute(name, new THREE.InstancedBufferAttribute(values, 1)));
  return { slabs, geometry };
}

function buildLightCurtains(stationIndex: number) {
  const { pose, forward, up, gridX } = stationBasis(stationIndex);
  const curtains: LightCurtain[] = [];
  const add = (x: number, width: number, length: number, alpha: number, color: string, index: number) => {
    const center = pose.camera.clone().addScaledVector(gridX, x).addScaledVector(up, (seeded(index, 223) - .5) * .3).addScaledVector(forward, 12.5 + seeded(index, 227) * 13.5);
    const tone = color === VAULT_PALETTE.amber ? 1 : color === VAULT_PALETTE.crimson ? 2 : color === VAULT_PALETTE.ruby ? 3 : color === VAULT_PALETTE.champagne ? 4 : 0;
    curtains.push({ matrix: createPlaneMatrix(center, gridX, up, width, length), alpha, seed: seeded(index + stationIndex * 83, 211), tone });
  };
  // Seventeen zero-degree vertical curtains: gold waterfall, three champagne core fibers, ruby fall, and three gold accents.
  [-2.8, -2.1, -1.35, -.55, .2].forEach((x, i) => add(x, 2.5 + seeded(i, 229) * 2.7, 56 + seeded(i, 233) * 14, .5 + seeded(i, 239) * .12, i % 2 ? VAULT_PALETTE.amber : VAULT_PALETTE.gold, i));
  [-1.9, -.85, .2].forEach((x, i) => add(x, .22 + seeded(i, 379) * .22, 56 + seeded(i, 233) * 14, .66 + seeded(i, 383) * .06, VAULT_PALETTE.champagne, 5 + i));
  [.9, 1.45, 2, 2.6, 3.1, 3.6].forEach((x, i) => add(x, 1.6 + seeded(i, 389) * 1.6, 56 + seeded(i, 233) * 14, .42 + seeded(i, 397) * .22, i % 2 ? VAULT_PALETTE.ruby : VAULT_PALETTE.crimson, 8 + i));
  [4.4, 5, 5.6].forEach((x, i) => add(x, .65 + seeded(i, 401) * .65, 56 + seeded(i, 233) * 14, .3 + seeded(i, 409) * .16, i === 1 ? VAULT_PALETTE.champagne : VAULT_PALETTE.gold, 14 + i));
  const geometry = new THREE.PlaneGeometry(1, 1);
  geometry.setAttribute("aCurtainAlpha", new THREE.InstancedBufferAttribute(new Float32Array(curtains.map((item) => item.alpha)), 1));
  geometry.setAttribute("aCurtainSeed", new THREE.InstancedBufferAttribute(new Float32Array(curtains.map((item) => item.seed)), 1));
   geometry.setAttribute("aCurtainTone", new THREE.InstancedBufferAttribute(new Float32Array(curtains.map((item) => item.tone)), 1));
  return { curtains, geometry };
}

function stationCrossfadeWeight(stationIndex: number, projectIndex: number, foldFromIndex: number, foldStartedAt: number, isFolding: boolean) {
  const t = isFolding && foldStartedAt > 0 ? clamp((performance.now() - foldStartedAt) / 900) : 1;
  const eased = smoothstep(0, 1, t);
  return isFolding
    ? stationIndex === foldFromIndex ? 1 - eased : stationIndex === projectIndex ? eased : 0
    : stationIndex === projectIndex ? 1 : 0;
}

function StationArchitecturalSlabs({ stationIndex, projectIndex, foldFromIndex, foldStartedAt, isFolding, exitOpacityRef }: {
  stationIndex: number; projectIndex: number; foldFromIndex: number; foldStartedAt: number; isFolding: boolean;
  exitOpacityRef: React.RefObject<number>;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const layout = useMemo(() => buildArchitecturalSlabs(stationIndex), [stationIndex]);
  useEffect(() => {
    if (!mesh.current) return;
    layout.slabs.forEach((slab, index) => mesh.current?.setMatrixAt(index, slab.matrix));
    mesh.current.instanceMatrix.needsUpdate = true;
  }, [layout]);
  useEffect(() => () => layout.geometry.dispose(), [layout]);
  useFrame(({ clock }) => {
    if (!mesh.current || !material.current) return;
    const weight = stationCrossfadeWeight(stationIndex, projectIndex, foldFromIndex, foldStartedAt, isFolding);
    mesh.current.visible = weight > 0.001;
    material.current.uniforms.uTime.value = clock.getElapsedTime();
    material.current.uniforms.uOpacity.value = weight * exitOpacityRef.current;
  });
  return <instancedMesh ref={mesh} args={[layout.geometry, undefined, layout.slabs.length]} frustumCulled={false} renderOrder={3}>
    <shaderMaterial
      ref={material}
      uniforms={{ uTime: { value: 0 }, uOpacity: { value: 0 } }}
      transparent depthWrite={false} depthTest side={THREE.DoubleSide} blending={THREE.NormalBlending} toneMapped={false}
      // Rim falloff is exp(-edgeDistance² * 26²); alpha mixes smoked body/rim then applies end, fold, and exit fades.
      vertexShader={"attribute float aBodyAlpha;attribute float aEdgeAlpha;attribute float aGlassSeed;attribute float aGlassCrimson;varying vec2 vUv;varying float vBodyAlpha;varying float vEdgeAlpha;varying float vGlassSeed;varying float vGlassCrimson;void main(){vUv=uv;vBodyAlpha=aBodyAlpha;vEdgeAlpha=aEdgeAlpha;vGlassSeed=aGlassSeed;vGlassCrimson=aGlassCrimson;vec4 world=modelMatrix*instanceMatrix*vec4(position,1.0);gl_Position=projectionMatrix*viewMatrix*world;}"}
  fragmentShader={"uniform float uTime;uniform float uOpacity;varying vec2 vUv;varying float vBodyAlpha;varying float vEdgeAlpha;varying float vGlassSeed;varying float vGlassCrimson;void main(){float edgeL=exp(-pow(vUv.x*26.0,2.0));float edgeR=exp(-pow((1.0-vUv.x)*26.0,2.0));float rim=clamp(edgeL+edgeR,0.0,1.0);float ends=smoothstep(0.0,0.14,vUv.y)*smoothstep(1.0,0.84,vUv.y);float slowSheen=0.5+0.5*cos(vUv.y*4.6+vUv.x*2.2+vGlassSeed*6.28318+uTime*0.12);vec3 goldBody=vec3(0.4784,0.2353,0.0510);vec3 goldSheen=vec3(0.8784,0.5255,0.1020);vec3 goldRim=vec3(1.0,0.7451,0.2706);vec3 rubyBody=vec3(0.2902,0.0235,0.0784);vec3 rubySheen=vec3(0.7882,0.0588,0.1961);vec3 rubyRim=vec3(1.0,0.1647,0.2941);vec3 body=mix(goldBody,rubyBody,vGlassCrimson);vec3 sheen=mix(goldSheen,rubySheen,vGlassCrimson);vec3 edge=mix(goldRim,rubyRim,vGlassCrimson);vec3 col=mix(body,sheen,0.08+slowSheen*0.2);col=mix(col,edge,rim*0.92);float alpha=mix(vBodyAlpha,vEdgeAlpha,rim)*ends*uOpacity;gl_FragColor=vec4(col,alpha);}"}
    />
  </instancedMesh>;
}

function StationLightCurtains({ stationIndex, projectIndex, foldFromIndex, foldStartedAt, isFolding, exitOpacityRef, texture }: {
  stationIndex: number; projectIndex: number; foldFromIndex: number; foldStartedAt: number; isFolding: boolean;
  exitOpacityRef: React.RefObject<number>; texture: THREE.CanvasTexture;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const layout = useMemo(() => buildLightCurtains(stationIndex), [stationIndex]);
  useEffect(() => {
    if (!mesh.current) return;
    layout.curtains.forEach((curtain, index) => mesh.current?.setMatrixAt(index, curtain.matrix));
    mesh.current.instanceMatrix.needsUpdate = true;
  }, [layout]);
  useEffect(() => () => layout.geometry.dispose(), [layout]);
  useFrame(({ clock }) => {
    if (!mesh.current || !material.current) return;
    const weight = stationCrossfadeWeight(stationIndex, projectIndex, foldFromIndex, foldStartedAt, isFolding);
    mesh.current.visible = weight > 0.001;
    material.current.uniforms.uTime.value = clock.getElapsedTime();
    material.current.uniforms.uOpacity.value = weight * exitOpacityRef.current;
  });
  return <instancedMesh ref={mesh} args={[layout.geometry, undefined, layout.curtains.length]} frustumCulled={false} renderOrder={4}>
    <shaderMaterial
      ref={material}
      uniforms={{ uTime: { value: 0 }, uOpacity: { value: 0 }, uMap: { value: texture } }}
      transparent depthTest depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} toneMapped={false}
      // Envelope = exp(-d² * 2.2); alpha multiplies silk, tapered ends, fold weight, and vault exit opacity.
      vertexShader={"attribute float aCurtainAlpha;attribute float aCurtainSeed;attribute float aCurtainTone;varying vec2 vUv;varying float vCurtainAlpha;varying float vCurtainSeed;varying float vCurtainTone;void main(){vUv=uv;vCurtainAlpha=aCurtainAlpha;vCurtainSeed=aCurtainSeed;vCurtainTone=aCurtainTone;vec4 world=modelMatrix*instanceMatrix*vec4(position,1.0);gl_Position=projectionMatrix*viewMatrix*world;}"}
      fragmentShader={"uniform sampler2D uMap;uniform float uTime;uniform float uOpacity;varying vec2 vUv;varying float vCurtainAlpha;varying float vCurtainSeed;varying float vCurtainTone;void main(){vec4 fiber=texture2D(uMap,vUv);float ends=smoothstep(0.0,0.12,vUv.y)*(1.0-smoothstep(0.88,1.0,vUv.y));float flow=0.94+0.06*sin(uTime*0.4+vCurtainSeed*6.28318);vec3 gold=vec3(1.0,0.745,0.27);vec3 amber=vec3(0.878,0.525,0.102);vec3 crimson=vec3(0.788,0.059,0.196);vec3 ruby=vec3(1.0,0.165,0.294);vec3 whiteGold=vec3(1.0,0.957,0.824);vec3 tint=vCurtainTone>3.5?whiteGold:vCurtainTone>2.5?ruby:vCurtainTone>1.5?crimson:vCurtainTone>0.5?amber:gold;gl_FragColor=vec4(tint*fiber.rgb,fiber.a*ends*vCurtainAlpha*uOpacity*flow);}"}
    />
  </instancedMesh>;
}

function StationLightStrata({
  stationIndex,
  projectIndex,
  foldFromIndex,
  foldStartedAt,
  isFolding,
  exitOpacityRef,
  textures,
}: {
  stationIndex: number;
  projectIndex: number;
  foldFromIndex: number;
  foldStartedAt: number;
  isFolding: boolean;
  exitOpacityRef: React.RefObject<number>;
  textures: CathedralTextures;
}) {
  return (
    <>
      <StationArchitecturalSlabs {...{ stationIndex, projectIndex, foldFromIndex, foldStartedAt, isFolding, exitOpacityRef }} />
      <StationLightCurtains {...{ stationIndex, projectIndex, foldFromIndex, foldStartedAt, isFolding, exitOpacityRef }} texture={textures.waterfall} />
    </>
  );
}

function buildStardust(stationIndex: number, count = 2600) {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  const pose = ACT_FOUR_FOLD_POSES[stationIndex] ?? ACT_FOUR_FOLD_POSES[0];
  const forward = pose.target.clone().sub(pose.camera).normalize();
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
  const up = new THREE.Vector3().crossVectors(right, forward).normalize();
  const gridX = right.clone().multiplyScalar(Math.cos(GRID_YAW)).addScaledVector(forward, Math.sin(GRID_YAW)).normalize();

  for (let i = 0; i < count; i += 1) {
    const flank = i < Math.round(count * 0.75);
    const side = seeded(i, stationIndex * 17 + 31) < 0.5 ? -1 : 1;
    const flankSpread = Math.pow(seeded(i, stationIndex * 19 + 32), 1.35);
    const x = side * (flank
      ? 3.2 + flankSpread * 8.5
      : 11.2 + seeded(i, stationIndex * 23 + 33) * 12.0);
    const y = flank
      ? -17.0 + seeded(i, stationIndex * 29 + 34) * 34.0
      : -18.0 + seeded(i, stationIndex * 31 + 35) * 36.0;
    const depth = flank
      ? 6.0 + seeded(i, stationIndex * 37 + 36) * 32.0
      : 36.0 + seeded(i, stationIndex * 41 + 37) * 34.0;
    const point = pose.camera.clone()
      .addScaledVector(forward, depth)
      .addScaledVector(gridX, x)
      .addScaledVector(up, y);
    positions.set(point.toArray(), i * 3);
    sizes[i] = 1.1 + seeded(i, 43) * 1.9;
    phases[i] = seeded(i, 47) * Math.PI * 2;
    const tintSlot = i % 20;
    const color = new THREE.Color(tintSlot < 11 ? VAULT_PALETTE.gold : tintSlot < 16 ? VAULT_PALETTE.amber : tintSlot < 19 ? VAULT_PALETTE.champagne : VAULT_PALETTE.ruby);
    colors.set([color.r, color.g, color.b], i * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  return geometry;
}

function CathedralStardust({ stationIndex, projectIndex, foldFromIndex, foldStartedAt, isFolding, exitOpacityRef }: {
  stationIndex: number;
  projectIndex: number;
  foldFromIndex: number;
  foldStartedAt: number;
  isFolding: boolean;
  exitOpacityRef: React.RefObject<number>;
}) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const gl = useThree((state) => state.gl);
  const geometry = useMemo(() => buildStardust(stationIndex), [stationIndex]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(({ clock }) => {
    if (!material.current) return;
    const weight = stationCrossfadeWeight(stationIndex, projectIndex, foldFromIndex, foldStartedAt, isFolding);
    material.current.uniforms.uTime.value = clock.getElapsedTime();
    material.current.uniforms.uOpacity.value = weight * exitOpacityRef.current;
  });
  return (
    <points geometry={geometry} frustumCulled={false} renderOrder={5}>
      <shaderMaterial
        ref={material}
        transparent
        depthWrite={false}
        depthTest
        toneMapped={false}
        blending={THREE.AdditiveBlending}
        uniforms={{ uTime: { value: 0 }, uOpacity: { value: 0 }, uPixelRatio: { value: Math.min(gl.getPixelRatio(), 2) } }}
        // Perspective scaling retains the requested 1.1–3.0 DPR-scaled pinpoint range.
        vertexShader={"attribute float aSize;attribute float aPhase;attribute vec3 aColor;uniform float uTime;uniform float uPixelRatio;varying float vTwinkle;varying vec3 vColor;void main(){vec3 p=position;p.x+=sin(uTime*0.14+aPhase)*0.12;p.y+=cos(uTime*0.11+aPhase*1.7)*0.09;p.z+=sin(uTime*0.08+aPhase*0.7)*0.08;vec4 mvPosition=modelViewMatrix*vec4(p,1.0);vColor=aColor;vTwinkle=0.82+0.18*sin(uTime*1.1+aPhase);float depthScale=16.0/max(10.0,-mvPosition.z);gl_PointSize=clamp(aSize*uPixelRatio*depthScale,1.1*uPixelRatio,3.0*uPixelRatio);gl_Position=projectionMatrix*mvPosition;}"}
        fragmentShader={"uniform float uOpacity;varying float vTwinkle;varying vec3 vColor;void main(){float d=length(gl_PointCoord-0.5)*2.0;if(d>1.0)discard;float glow=exp(-d*d*5.2);float alpha=glow*vTwinkle*uOpacity;gl_FragColor=vec4(vColor,alpha);}"}
      />
    </points>
  );
}

function buildStationIntersectionFlares(stationIndex: number) {
  const pose = ACT_FOUR_FOLD_POSES[stationIndex] ?? ACT_FOUR_FOLD_POSES[0];
  const forward = pose.target.clone().sub(pose.camera).normalize();
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
  const up = new THREE.Vector3().crossVectors(right, forward).normalize();
  const cameraNormal = forward.clone().negate();
  const points = [
    [-4.8, 4.7, 13.5, 1.1], [-1.2, 5.5, 16.0, 0.95], [4.7, -4.5, 15.0, 1.2], [2.0, -5.2, 17.0, 1.0],
  ] as const;
  const matrices = points.map(([x, y, depth, size]) => {
    const position = pose.camera.clone().addScaledVector(right, x).addScaledVector(up, y).addScaledVector(forward, depth);
    const basis = new THREE.Matrix4().makeBasis(right, up, cameraNormal);
    const quaternion = new THREE.Quaternion().setFromRotationMatrix(basis);
    return new THREE.Matrix4().compose(position, quaternion, new THREE.Vector3(size, size, 1));
  });
  return { geometry: new THREE.PlaneGeometry(1, 1), matrices };
}

function StationIntersectionFlares({ stationIndex, projectIndex, foldFromIndex, foldStartedAt, isFolding, exitOpacityRef }: {
  stationIndex: number;
  projectIndex: number;
  foldFromIndex: number;
  foldStartedAt: number;
  isFolding: boolean;
  exitOpacityRef: React.RefObject<number>;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const layout = useMemo(() => buildStationIntersectionFlares(stationIndex), [stationIndex]);
  useEffect(() => {
    if (!mesh.current) return;
    layout.matrices.forEach((matrix, index) => mesh.current?.setMatrixAt(index, matrix));
    mesh.current.instanceMatrix.needsUpdate = true;
  }, [layout]);
  useEffect(() => () => layout.geometry.dispose(), [layout]);
  useFrame(({ clock }) => {
    if (!mesh.current || !material.current) return;
    const t = isFolding && foldStartedAt > 0 ? clamp((performance.now() - foldStartedAt) / 900) : 1;
    const eased = smoothstep(0, 1, t);
    const weight = isFolding
      ? stationIndex === foldFromIndex ? 1 - eased : stationIndex === projectIndex ? eased : 0
      : stationIndex === projectIndex ? 1 : 0;
    mesh.current.visible = weight > 0.001;
    material.current.uniforms.uTime.value = clock.getElapsedTime();
    material.current.uniforms.uOpacity.value = weight * exitOpacityRef.current;
  });
  return (
    <instancedMesh ref={mesh} args={[layout.geometry, undefined, layout.matrices.length]} frustumCulled={false} renderOrder={6}>
      <shaderMaterial
        ref={material}
        uniforms={{ uTime: { value: 0 }, uOpacity: { value: 0 } }}
        transparent
        depthTest
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
        vertexShader={"varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);}"}
    fragmentShader={"uniform float uTime;uniform float uOpacity;varying vec2 vUv;void main(){vec2 p=(vUv-0.5)*2.0;float r=length(p);float glow=exp(-r*r*6.5);float core=exp(-r*r*30.0);float pulse=0.94+0.06*sin(uTime*0.8+vUv.x*2.0);vec3 warm=mix(vec3(1.0,0.62,0.22),vec3(1.0,0.92,0.72),core);float alpha=0.13*glow*uOpacity*pulse;gl_FragColor=vec4(warm,alpha);}"}
      />
    </instancedMesh>
  );
}

function activeStationWeight(stationIndex: number, projectIndex: number, foldFromIndex: number, foldStartedAt: number, isFolding: boolean, exitOpacity: number) {
  const t = isFolding && foldStartedAt > 0 ? clamp((performance.now() - foldStartedAt) / 900) : 1;
  const eased = smoothstep(0, 1, t);
  const station = isFolding ? stationIndex === foldFromIndex ? 1 - eased : stationIndex === projectIndex ? eased : 0 : stationIndex === projectIndex ? 1 : 0;
  return station * exitOpacity;
}

function CathedralDetails({ stationIndex, projectIndex, foldFromIndex, foldStartedAt, isFolding, exitOpacityRef, textures }: {
  stationIndex: number; projectIndex: number; foldFromIndex: number; foldStartedAt: number; isFolding: boolean;
  exitOpacityRef: React.RefObject<number>; textures: CathedralTextures;
}) {
  const { pose, up, forward, gridX, gridZ } = useMemo(() => stationBasis(stationIndex), [stationIndex]);
  const ringMesh = useRef<THREE.InstancedMesh>(null);
  const ringMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const mirror = useRef<THREE.Mesh>(null);
  const mirrorMaterial = useRef<THREE.ShaderMaterial>(null);
  const beamBody = useRef<Array<THREE.MeshBasicMaterial | null>>([]);
  const beamEdge = useRef<Array<THREE.MeshBasicMaterial | null>>([]);
  const frameFaces = useRef<Array<THREE.MeshBasicMaterial | null>>([]);
  const frameEdges = useRef<Array<THREE.LineBasicMaterial | null>>([]);
  const wingFaces = useRef<Array<THREE.MeshBasicMaterial | null>>([]);
  const wingText = useRef<Array<THREE.MeshBasicMaterial | null>>([]);
  const wingReflections = useRef<Array<THREE.MeshBasicMaterial | null>>([]);
  const wingEdges = useRef<Array<THREE.LineBasicMaterial | null>>([]);
  const nebulaSprites = useRef<Array<THREE.Sprite | null>>([]);
  const flareSprites = useRef<Array<THREE.Sprite | null>>([]);
  const time = useRef(0);
  const ringLayout = useMemo(() => {
    const dummy = new THREE.Object3D();
    const results: Array<{ matrix: THREE.Matrix4; color: THREE.Color }> = [];
    const quaternion = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(gridX, gridZ, up));
    const center = pose.camera.clone().addScaledVector(forward, 16);
    const sets = [[8.8, [5.5, 8.2, 11.4]], [9.6, [5.5, 8.2, 11.4]], [-5.45, [4.8, 7.6, 10.8]]] as const;
    sets.forEach(([height, radii], setIndex) => radii.forEach((radius, ringIndex) => {
      dummy.position.copy(center).addScaledVector(up, height); dummy.quaternion.copy(quaternion); dummy.scale.set(radius, radius, 1); dummy.updateMatrix();
      results.push({ matrix: dummy.matrix.clone(), color: new THREE.Color(setIndex === 2 ? VAULT_PALETTE.amber : ringIndex === 1 ? VAULT_PALETTE.champagne : VAULT_PALETTE.gold) });
    }));
    return results;
  }, [pose, up, forward, gridX, gridZ]);
  const mirrorMatrix = useMemo(() => {
    const position = pose.camera.clone().addScaledVector(forward, 25).addScaledVector(up, -5.5);
    const quaternion = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(gridX, gridZ, up));
    return new THREE.Matrix4().compose(position, quaternion, new THREE.Vector3(64, 64, 1));
  }, [pose, up, forward, gridX, gridZ]);
  const beamLayout = useMemo(() => {
    const config = [
      ["x", 0, 5.4, 24, 62, 2.2, VAULT_PALETTE.quartz, VAULT_PALETTE.silver], ["x", 2.5, 4.7, 20, 58, 1.6, VAULT_PALETTE.quartz, VAULT_PALETTE.silver],
      ["x", 5.2, 2.2, 28, 58, 1.7, VAULT_PALETTE.wine, VAULT_PALETTE.ruby], ["x", 5, -2.4, 24, 62, 2, VAULT_PALETTE.wine, VAULT_PALETTE.ruby],
      ["x", -3, 4.1, 30, 56, 1.6, VAULT_PALETTE.bronze, VAULT_PALETTE.gold], ["x", -4.2, -4.6, 26, 64, 2, VAULT_PALETTE.bronze, VAULT_PALETTE.gold],
      ["x", 0, -5, 22, 64, 2.2, VAULT_PALETTE.bronze, VAULT_PALETTE.gold], ["x", 3, -4.4, 32, 56, 1.5, VAULT_PALETTE.wine, VAULT_PALETTE.ruby],
      ["z", -7, 5, 20, 52, 2, VAULT_PALETTE.quartz, VAULT_PALETTE.silver], ["z", 7.5, 5.2, 24, 58, 2.4, VAULT_PALETTE.quartz, VAULT_PALETTE.gold],
      ["z", -8, 1.2, 26, 56, 1.4, VAULT_PALETTE.wine, VAULT_PALETTE.ruby], ["z", 8, .2, 22, 54, 1.6, VAULT_PALETTE.wine, VAULT_PALETTE.ruby],
      ["z", -7.2, -4.6, 20, 60, 1.8, VAULT_PALETTE.bronze, VAULT_PALETTE.gold], ["z", 7.2, -4.8, 25, 62, 2.2, VAULT_PALETTE.bronze, VAULT_PALETTE.gold],
      ["x", -7, -5.2, 34, 52, 1.2, VAULT_PALETTE.bronze, VAULT_PALETTE.gold], ["x", 7, 5.9, 34, 54, 1.4, VAULT_PALETTE.quartz, VAULT_PALETTE.silver],
    ] as const;
    return config.map(([axis, x, y, depth, length, thickness, body, edge]) => {
      const along = axis === "x" ? gridX : gridZ;
      const center = pose.camera.clone().addScaledVector(gridX, x).addScaledVector(up, y).addScaledVector(forward, depth);
      return {
        matrix: createPlaneMatrix(center, up, along, thickness, length),
        body,
        edge,
        bodyOpacity: body === VAULT_PALETTE.quartz ? .26 : body === VAULT_PALETTE.wine ? .24 : .2,
        edgeOpacity: edge === VAULT_PALETTE.silver ? .42 : edge === VAULT_PALETTE.ruby ? .48 : .38,
      };
    });
  }, [pose, up, forward, gridX, gridZ]);
  const cubeGeometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const cubeEdgeGeometry = useMemo(() => new THREE.EdgesGeometry(cubeGeometry), [cubeGeometry]);
  const cubeLayout = useMemo(() => {
    const quaternion = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(gridX, up, gridZ.clone().negate()));
    return [
      [-11.5, 7.5, 7.5, 5.5, 7.5, 5.5, false], [-9.4, -3.1, 12.5, 4, 6, 4, true],
      [10.2, 5, 10, 5.5, 7.5, 5.5, false], [12, -2, 15.5, 4, 6, 4, true],
    ].map(([x, y, depth, width, height, length, crimson]) => ({
      position: pose.camera.clone().addScaledVector(gridX, x as number).addScaledVector(up, y as number).addScaledVector(forward, depth as number),
      size: new THREE.Vector3(width as number, height as number, length as number), quaternion, crimson: crimson as boolean,
    }));
  }, [pose, up, forward, gridX, gridZ]);
  const wingMatrices = useMemo(() => [-1, 1].map((side) => {
    const center = pose.camera.clone().addScaledVector(gridX, side * 7.4).addScaledVector(up, -.05).addScaledVector(forward, 13.8);
    return createPlaneMatrix(center, gridX.clone().applyAxisAngle(up, side * -.56), up, 3.55, 2.35);
  }), [pose, up, forward, gridX]);
  const nebulaLayout = useMemo(() => [[10, 7.5, 38, 18, 13, .18], [13, 4.3, 44, 15, 12, .16], [8, -7, 36, 17, 12, .16], [-10, -7, 40, 19, 14, .2], [-13, -3.5, 48, 16, 12, .14]].map(([x, y, depth, w, h, alpha]) => ({
    position: pose.camera.clone().addScaledVector(gridX, x!).addScaledVector(up, y!).addScaledVector(forward, depth!), width: w!, height: h!, alpha: alpha!,
  })), [pose, gridX, up, forward]);
  useEffect(() => () => { cubeGeometry.dispose(); cubeEdgeGeometry.dispose(); }, [cubeGeometry, cubeEdgeGeometry]);
  const wingPlaneGeometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  const wingEdgeGeometry = useMemo(() => new THREE.EdgesGeometry(wingPlaneGeometry), [wingPlaneGeometry]);
  useEffect(() => () => { wingPlaneGeometry.dispose(); wingEdgeGeometry.dispose(); }, [wingPlaneGeometry, wingEdgeGeometry]);
  useEffect(() => {
    if (!ringMesh.current) return;
    ringLayout.forEach((ring, i) => { ringMesh.current?.setMatrixAt(i, ring.matrix); ringMesh.current?.setColorAt(i, ring.color); });
    ringMesh.current.instanceMatrix.needsUpdate = true;
    if (ringMesh.current.instanceColor) ringMesh.current.instanceColor.needsUpdate = true;
  }, [ringLayout]);
  useFrame(({ clock }) => {
    const weight = activeStationWeight(stationIndex, projectIndex, foldFromIndex, foldStartedAt, isFolding, exitOpacityRef.current);
    time.current = clock.getElapsedTime();
    if (ringMesh.current && ringMaterial.current) { ringMesh.current.visible = weight > .001; ringMaterial.current.opacity = .42 * weight; }
    if (mirror.current && mirrorMaterial.current) { mirror.current.visible = weight > .001; mirrorMaterial.current.uniforms.uTime.value = time.current; mirrorMaterial.current.uniforms.uOpacity.value = weight; }
    beamBody.current.forEach((material, i) => { if (material) material.opacity = beamLayout[i].bodyOpacity * weight; });
    beamEdge.current.forEach((material, i) => { if (material) material.opacity = beamLayout[i].edgeOpacity * weight; });
    frameFaces.current.forEach((material) => { if (material) material.opacity = .07 * weight; });
    frameEdges.current.forEach((material) => { if (material) material.opacity = .62 * weight; });
    wingFaces.current.forEach((material) => { if (material) material.opacity = .62 * weight; });
    wingText.current.forEach((material) => { if (material) material.opacity = weight; });
    wingReflections.current.forEach((material) => { if (material) material.opacity = .14 * weight; });
    wingEdges.current.forEach((material) => { if (material) material.opacity = .48 * weight; });
    nebulaSprites.current.forEach((sprite, i) => { if (sprite) { sprite.visible = weight > .001; (sprite.material as THREE.SpriteMaterial).opacity = nebulaLayout[i].alpha * weight; } });
    flareSprites.current.forEach((sprite) => { if (sprite) { sprite.visible = weight > .001; (sprite.material as THREE.SpriteMaterial).opacity = .55 * weight; } });
  });
  return <group>
    <mesh ref={mirror} matrix={mirrorMatrix} matrixAutoUpdate={false} frustumCulled={false} renderOrder={1}><planeGeometry args={[1, 1]} />
      <shaderMaterial ref={mirrorMaterial} uniforms={{ uTime: { value: 0 }, uOpacity: { value: 0 } }} transparent depthTest depthWrite={false} side={THREE.DoubleSide} blending={THREE.NormalBlending} toneMapped={false}
        vertexShader={"varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}"}
        fragmentShader={"uniform float uTime;uniform float uOpacity;varying vec2 vUv;void main(){vec2 p=(vUv-.5)*2.0;float edge=1.0-smoothstep(.34,1.0,length(p));float gold=exp(-pow((p.x+.04)*18.0,2.0));float ruby=exp(-pow((p.x-.09)*30.0,2.0));float rings=.5+.5*cos(length(p)*44.0-uTime*.16);float tracks=.5+.5*cos(p.y*64.0);vec3 color=vec3(.0196,.0118,.0235)+vec3(1.0,.745,.27)*gold*.16+vec3(.79,.059,.196)*ruby*.11+vec3(.88,.525,.102)*rings*tracks*.025;gl_FragColor=vec4(color,edge*(.88+gold*.1)*uOpacity);}"}
      />
    </mesh>
    <instancedMesh ref={ringMesh} args={[undefined, undefined, ringLayout.length]} frustumCulled={false} renderOrder={3}>
      <torusGeometry args={[1, .1, 8, 128]} /><meshBasicMaterial ref={ringMaterial} vertexColors transparent opacity={0} blending={THREE.AdditiveBlending} depthTest depthWrite={false} toneMapped={false} />
    </instancedMesh>
    {beamLayout.map((beam, i) => <group key={"orthogonal-beam-" + i} matrix={beam.matrix} matrixAutoUpdate={false}>
      <mesh frustumCulled={false} renderOrder={4}><planeGeometry args={[1, 1]} /><meshBasicMaterial ref={(m) => { beamBody.current[i] = m; }} map={textures.glass} color={beam.body} transparent opacity={0} depthTest depthWrite={false} side={THREE.DoubleSide} /></mesh>
      <mesh frustumCulled={false} renderOrder={5}><planeGeometry args={[1, 1]} /><meshBasicMaterial ref={(m) => { beamEdge.current[i] = m; }} map={textures.glass} color={beam.edge} transparent opacity={0} blending={THREE.AdditiveBlending} depthTest depthWrite={false} side={THREE.DoubleSide} toneMapped={false} /></mesh>
    </group>)}
    {cubeLayout.map((cube, i) => <group key={"cathedral-cube-" + i} position={cube.position} quaternion={cube.quaternion} scale={cube.size}>
      <mesh geometry={cubeGeometry} frustumCulled={false} renderOrder={4}><meshBasicMaterial ref={(m) => { frameFaces.current[i] = m; }} color={cube.crimson ? "#2B060F" : "#2A160B"} transparent opacity={0} side={THREE.DoubleSide} depthTest depthWrite={false} /></mesh>
      <lineSegments geometry={cubeEdgeGeometry} frustumCulled={false} renderOrder={6}><lineBasicMaterial ref={(m) => { frameEdges.current[i] = m; }} color={cube.crimson ? VAULT_PALETTE.ruby : VAULT_PALETTE.gold} transparent opacity={0} depthTest depthWrite={false} toneMapped={false} /></lineSegments>
    </group>)}
    {wingMatrices.map((matrix, i) => <group key={"monolith-wing-" + i} matrix={matrix} matrixAutoUpdate={false}>
      <mesh geometry={wingPlaneGeometry} frustumCulled={false} renderOrder={6}><meshBasicMaterial ref={(m) => { wingFaces.current[i] = m; }} color={VAULT_PALETTE.card} transparent opacity={0} side={THREE.DoubleSide} depthTest depthWrite={false} /></mesh>
      <mesh geometry={wingPlaneGeometry} frustumCulled={false} renderOrder={7}><meshBasicMaterial ref={(m) => { wingText.current[i] = m; }} map={textures.wings[stationIndex][i]} transparent opacity={0} side={THREE.DoubleSide} depthTest depthWrite={false} /></mesh>
      <lineSegments geometry={wingEdgeGeometry} frustumCulled={false} renderOrder={8}><lineBasicMaterial ref={(m) => { wingEdges.current[i] = m; }} color={i ? VAULT_PALETTE.ruby : VAULT_PALETTE.amber} transparent opacity={0} depthTest depthWrite={false} /></lineSegments>
      <mesh geometry={wingPlaneGeometry} position={[0, -4.1, 0]} scale={[1, -1, 1]} frustumCulled={false} renderOrder={1}><meshBasicMaterial ref={(m) => { wingReflections.current[i] = m; }} map={textures.wings[stationIndex][i]} transparent opacity={0} side={THREE.DoubleSide} depthTest depthWrite={false} /></mesh>
    </group>)}
    {nebulaLayout.map((wisp, i) => <sprite key={"nebula-wisp-" + i} ref={(sprite) => { nebulaSprites.current[i] = sprite; }} position={wisp.position} scale={[wisp.width, wisp.height, 1]} frustumCulled={false} renderOrder={0}>
      <spriteMaterial map={textures.nebula} color={VAULT_PALETTE.bronze} transparent opacity={0} depthTest depthWrite={false} />
    </sprite>)}
    {[[-.4, 5, 15.5, 2.2], [.2, -5, 16, 2.4], [-7.2, 0, 16.8, 1.65], [7, .4, 17.4, 1.7]].map(([x, y, depth, size], i) => <sprite key={"anamorphic-flare-" + i} ref={(sprite) => { flareSprites.current[i] = sprite; }} position={pose.camera.clone().addScaledVector(gridX, x!).addScaledVector(up, y!).addScaledVector(forward, depth!)} scale={[size!, size!, 1]} frustumCulled={false} renderOrder={8}>
      <spriteMaterial map={textures.glint} color={VAULT_PALETTE.champagne} transparent opacity={0} blending={THREE.AdditiveBlending} depthTest depthWrite={false} />
    </sprite>)}
  </group>;
}

function TesseractCathedral({
  projectIndex,
  foldFromIndex,
  foldStartedAt,
  isFolding,
  exitOpacityRef,
}: {
  projectIndex: number;
  foldFromIndex: number;
  foldStartedAt: number;
  isFolding: boolean;
  exitOpacityRef: React.RefObject<number>;
}) {
  const renderer = useThree((state) => state.gl);
  const textures = useMemo(() => createCathedralTextures(renderer), [renderer]);
  useEffect(() => () => {
    textures.waterfall.dispose(); textures.glass.dispose(); textures.nebula.dispose(); textures.glint.dispose();
    textures.wings.forEach(([previous, next]) => { previous.dispose(); next.dispose(); });
  }, [textures]);
  return (
    <group>
      {ACT_FOUR_FOLD_POSES.map((_, index) => (
        <StationLightStrata
          key={"station-light-strata-" + index}
          stationIndex={index}
          projectIndex={projectIndex}
          foldFromIndex={foldFromIndex}
          foldStartedAt={foldStartedAt}
          isFolding={isFolding}
          exitOpacityRef={exitOpacityRef}
          textures={textures}
        />
      ))}
      {ACT_FOUR_FOLD_POSES.map((_, index) => <CathedralDetails key={"cathedral-details-" + index} stationIndex={index} projectIndex={projectIndex} foldFromIndex={foldFromIndex} foldStartedAt={foldStartedAt} isFolding={isFolding} exitOpacityRef={exitOpacityRef} textures={textures} />)}
      {ACT_FOUR_FOLD_POSES.map((_, index) => (
        <CathedralStardust
          key={"cathedral-stardust-" + index}
          stationIndex={index}
          projectIndex={projectIndex}
          foldFromIndex={foldFromIndex}
          foldStartedAt={foldStartedAt}
          isFolding={isFolding}
          exitOpacityRef={exitOpacityRef}
        />
      ))}
      {ACT_FOUR_FOLD_POSES.map((_, index) => (
        <StationIntersectionFlares
          key={"station-intersection-flares-" + index}
          stationIndex={index}
          projectIndex={projectIndex}
          foldFromIndex={foldFromIndex}
          foldStartedAt={foldStartedAt}
          isFolding={isFolding}
          exitOpacityRef={exitOpacityRef}
        />
      ))}
    </group>
  );
}

export default function ActFourWorld({ phase, projectIndex, warpCharge }: { phase: ActFourPhase; projectIndex: number; warpCharge: React.RefObject<number> }) {
  const phaseStartedAt = useRef(performance.now());
  const previousPhase = useRef(phase);
  const exteriorLayer = useRef<THREE.Group>(null);
  const tunnelLayer = useRef<THREE.Group>(null);
  const vaultLayer = useRef<THREE.Group>(null);
  const vaultOpacityRef = useRef(1);
  const previousProjectIndex = useRef(projectIndex);
  const foldTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isFolding, setIsFolding] = useState(false);
  const [foldFromIndex, setFoldFromIndex] = useState(projectIndex);
  const [foldStartedAt, setFoldStartedAt] = useState(0);
  useEffect(() => {
    if (phase !== "act4_vault") {
      if (foldTimer.current) clearTimeout(foldTimer.current);
      foldTimer.current = null;
      previousProjectIndex.current = projectIndex;
      setFoldFromIndex(projectIndex);
      setFoldStartedAt(0);
      setIsFolding(false);
      return;
    }
    if (previousProjectIndex.current === projectIndex) return;
    setFoldFromIndex(previousProjectIndex.current);
    setFoldStartedAt(performance.now());
    previousProjectIndex.current = projectIndex;
    if (foldTimer.current) clearTimeout(foldTimer.current);
    setIsFolding(true);
    foldTimer.current = setTimeout(() => { setIsFolding(false); foldTimer.current = null; }, 900);
  }, [phase, projectIndex]);
  useEffect(() => () => { if (foldTimer.current) clearTimeout(foldTimer.current); }, []);
  useEffect(() => { phaseStartedAt.current = performance.now(); previousPhase.current = phase; }, [phase]);
  useFrame((_, delta) => {
    if (previousPhase.current !== phase) { previousPhase.current = phase; phaseStartedAt.current = performance.now(); }
    const age = (performance.now() - phaseStartedAt.current) / 1000;
    const progress = age / WARP_IN_DURATION_SECONDS;
    if (exteriorLayer.current) exteriorLayer.current.visible = phase === "act4_exterior" || (phase === "act4_warp_in" && progress < 0.27);
    if (tunnelLayer.current) tunnelLayer.current.visible = phase === "act4_warp_in" && progress >= 0.22 && progress < 0.695;
    if (vaultLayer.current) {
      const vault = vaultLayer.current;
      const isWarpingOut = phase === "act4_warp_out";
      const exitProgress = isWarpingOut ? clamp(age / WARP_OUT_DURATION_SECONDS) : 0;
      const vaultOpacity = isWarpingOut ? 1 - smoothstep(0, WARP_OUT_VAULT_FADE_SECONDS, exitProgress) : 1;
      vaultOpacityRef.current = vaultOpacity;
      vault.visible = (phase === "act4_warp_in" && age >= WARP_VAULT_CUTOVER_SECONDS)
        || phase === "act4_vault"
        || (isWarpingOut && exitProgress < WARP_OUT_VAULT_FADE_SECONDS);
      vault.traverse((object) => {
        const materials = object instanceof THREE.Mesh || object instanceof THREE.Line
          ? (Array.isArray(object.material) ? object.material : [object.material])
          : [];
        materials.forEach((material) => {
          if (material instanceof THREE.ShaderMaterial && material.uniforms.uExitOpacity) {
            material.uniforms.uExitOpacity.value = vaultOpacity;
            return;
          }
          const saved = material.userData.actFourExitFade as { opacity: number; transparent: boolean; depthWrite: boolean } | undefined;
          if (isWarpingOut && vaultOpacity < 1) {
            if (!saved) {
              material.userData.actFourExitFade = { opacity: material.opacity, transparent: material.transparent, depthWrite: material.depthWrite };
              material.transparent = true;
              material.depthWrite = false;
              material.needsUpdate = true;
            }
            material.opacity = (saved?.opacity ?? material.opacity) * vaultOpacity;
          } else if (saved) {
            material.opacity = saved.opacity;
            material.transparent = saved.transparent;
            material.depthWrite = saved.depthWrite;
            delete material.userData.actFourExitFade;
            material.needsUpdate = true;
          }
        });
        if (object instanceof THREE.PointLight || object instanceof THREE.AmbientLight) {
          const savedIntensity = object.userData.actFourExitFadeIntensity as number | undefined;
          if (isWarpingOut && vaultOpacity < 1) {
            if (savedIntensity === undefined) object.userData.actFourExitFadeIntensity = object.intensity;
            object.intensity = (savedIntensity ?? object.intensity) * vaultOpacity;
          } else if (savedIntensity !== undefined) {
            object.intensity = savedIntensity;
            delete object.userData.actFourExitFadeIntensity;
          }
        }
      });
    }
    void delta; void projectIndex;
  });
  return <group>
    <group ref={exteriorLayer} visible={phase === "act4_exterior"}><ActFourExterior phase={phase} warpCharge={warpCharge} /></group>
    <group ref={tunnelLayer}><WormholeTunnel phase={phase} /><WormholeLandmarks phase={phase} /></group>
    <WarpStreamParticles phase={phase} warpCharge={warpCharge} /><WarpNeedles phase={phase} />
    <group ref={vaultLayer} visible={phase === "act4_vault" || phase === "act4_warp_out"}><TesseractCathedral projectIndex={projectIndex} foldFromIndex={foldFromIndex} foldStartedAt={foldStartedAt} isFolding={isFolding} exitOpacityRef={vaultOpacityRef} /></group>
    <BreachFlash phase={phase} />
  </group>;
}
