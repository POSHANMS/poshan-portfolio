"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
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

type LightStratum = { matrix: THREE.Matrix4; color: THREE.Color };

const STRATA_GOLD = ["#fff0cc", "#ffbe55", "#c96e14"];
const STRATA_CRIMSON = ["#e01e48", "#9c102e"];

function buildStationLightStrata(stationIndex: number) {
  const pose = ACT_FOUR_FOLD_POSES[stationIndex] ?? ACT_FOUR_FOLD_POSES[0];
  const forward = pose.target.clone().sub(pose.camera).normalize();
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
  const up = new THREE.Vector3().crossVectors(right, forward).normalize();
  const origin = pose.camera;
  const localPoint = (x: number, y: number, depth: number) => origin.clone()
    .addScaledVector(right, x)
    .addScaledVector(up, y)
    .addScaledVector(forward, depth);
  const dummy = new THREE.Object3D();
  const lines: LightStratum[] = [];
  let sequence = stationIndex * 37;
  const addSegment = (start: THREE.Vector3, end: THREE.Vector3) => {
    const direction = end.clone().sub(start);
    dummy.position.copy(start).add(end).multiplyScalar(0.5);
    dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
    dummy.scale.set(0.026, direction.length(), 0.026);
    dummy.updateMatrix();
    const paletteIndex = sequence % 10;
    const color = paletteIndex < 4 ? STRATA_GOLD[0]
      : paletteIndex < 6 ? STRATA_GOLD[1]
        : paletteIndex === 6 ? STRATA_GOLD[2]
          : STRATA_CRIMSON[paletteIndex % 2];
    lines.push({ matrix: dummy.matrix.clone(), color: new THREE.Color(color) });
    sequence += 1;
  };

  const depths = [10, 14, 20, 29, 41, 55, 72];
  const outerOffsets = [-24, -18, -13, -9, -5.2, 5.2, 9, 13, 18, 24];
  const verticalOffsets = [-23, -17, -11, -5.2, 5.2, 11, 17, 23];

  for (const depth of depths) {
    for (const x of outerOffsets) {
      addSegment(localPoint(x, -28, depth), localPoint(x, 28, depth));
    }
    for (const y of verticalOffsets) {
      addSegment(localPoint(-30, y, depth), localPoint(-5.2, y, depth));
      addSegment(localPoint(5.2, y, depth), localPoint(30, y, depth));
    }
  }

  for (const x of outerOffsets) {
    for (const y of verticalOffsets) {
      addSegment(localPoint(x, y, 10), localPoint(x, y, 72));
    }
  }

  return { lines };
}

function StationLightStrata({
  stationIndex,
  projectIndex,
  foldFromIndex,
  foldStartedAt,
  isFolding,
}: {
  stationIndex: number;
  projectIndex: number;
  foldFromIndex: number;
  foldStartedAt: number;
  isFolding: boolean;
}) {
  const haloMesh = useRef<THREE.InstancedMesh>(null);
  const glowMesh = useRef<THREE.InstancedMesh>(null);
  const coreMesh = useRef<THREE.InstancedMesh>(null);
  const haloMaterial = useRef<THREE.ShaderMaterial>(null);
  const glowMaterial = useRef<THREE.ShaderMaterial>(null);
  const coreMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const layout = useMemo(() => buildStationLightStrata(stationIndex), [stationIndex]);
  useEffect(() => {
    if (!haloMesh.current || !glowMesh.current || !coreMesh.current) return;
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const sourceScale = new THREE.Vector3();
    const instance = new THREE.Object3D();
    const passes = [
      { mesh: haloMesh.current, width: 0.82, depth: 0.3 },
      { mesh: glowMesh.current, width: 0.26, depth: 0.12 },
      { mesh: coreMesh.current, width: 0.05, depth: 0.05 },
    ];
    layout.lines.forEach((line, index) => {
      line.matrix.decompose(position, quaternion, sourceScale);
      for (const pass of passes) {
        instance.position.copy(position);
        instance.quaternion.copy(quaternion);
        instance.scale.set(pass.width, sourceScale.y, pass.depth);
        instance.updateMatrix();
        pass.mesh.setMatrixAt(index, instance.matrix);
        pass.mesh.setColorAt(index, line.color);
      }
    });
    for (const pass of passes) {
      pass.mesh.instanceMatrix.needsUpdate = true;
      if (pass.mesh.instanceColor) pass.mesh.instanceColor.needsUpdate = true;
    }
  }, [layout]);

  useFrame(({ clock }) => {
    if (!haloMesh.current || !glowMesh.current || !coreMesh.current || !haloMaterial.current || !glowMaterial.current || !coreMaterial.current) return;
    const t = isFolding && foldStartedAt > 0
      ? clamp((performance.now() - foldStartedAt) / 900)
      : 1;
    const eased = smoothstep(0, 1, t);
    const weight = isFolding
      ? stationIndex === foldFromIndex ? 1 - eased : stationIndex === projectIndex ? eased : 0
      : stationIndex === projectIndex ? 1 : 0;
    const visible = weight > 0.001;
    haloMesh.current.visible = visible;
    glowMesh.current.visible = visible;
    coreMesh.current.visible = visible;
    for (const material of [haloMaterial.current, glowMaterial.current]) {
      material.uniforms.uTime.value = clock.getElapsedTime();
      material.uniforms.uOpacity.value = weight;
    }
    coreMaterial.current.opacity = weight * 0.48;
  });

  return (
    <>
      <instancedMesh ref={haloMesh} args={[undefined, undefined, layout.lines.length]} frustumCulled={false} renderOrder={4}>
        <boxGeometry args={[1, 1, 1]} />
        <shaderMaterial ref={haloMaterial} uniforms={{ uTime: { value: 0 }, uOpacity: { value: 0 } }} transparent depthTest depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} toneMapped={false}
          vertexShader={"varying vec3 vColor;varying vec2 vUv;void main(){vColor=instanceColor;vUv=uv;vec4 world=modelMatrix*instanceMatrix*vec4(position,1.0);gl_Position=projectionMatrix*viewMatrix*world;}"}
          fragmentShader={"uniform float uTime;uniform float uOpacity;varying vec3 vColor;varying vec2 vUv;void main(){float transverse=exp(-pow((vUv.x-0.5)*2.2,2.0));float pulse=0.82+0.18*sin(uTime*0.8+vUv.y*8.0+vColor.r*2.0);float alpha=transverse*pulse*uOpacity*0.24;gl_FragColor=vec4(vColor*pulse,alpha);}"} />
      </instancedMesh>
      <instancedMesh ref={glowMesh} args={[undefined, undefined, layout.lines.length]} frustumCulled={false} renderOrder={5}>
        <boxGeometry args={[1, 1, 1]} />
        <shaderMaterial ref={glowMaterial} uniforms={{ uTime: { value: 0 }, uOpacity: { value: 0 } }} transparent depthTest depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} toneMapped={false}
          vertexShader={"varying vec3 vColor;varying vec2 vUv;void main(){vColor=instanceColor;vUv=uv;vec4 world=modelMatrix*instanceMatrix*vec4(position,1.0);gl_Position=projectionMatrix*viewMatrix*world;}"}
          fragmentShader={"uniform float uTime;uniform float uOpacity;varying vec3 vColor;varying vec2 vUv;void main(){float filament=0.76+0.24*sin(vUv.y*26.0-uTime*1.45);float pulse=0.88+0.12*sin(uTime*0.9+vColor.r*3.0);float alpha=filament*pulse*uOpacity*0.48;gl_FragColor=vec4(vColor*filament*pulse*1.65,alpha);}"} />
      </instancedMesh>
      <instancedMesh ref={coreMesh} args={[undefined, undefined, layout.lines.length]} frustumCulled={false} renderOrder={6}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial ref={coreMaterial} color="#ffffff" vertexColors transparent opacity={0} depthTest depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} toneMapped={false} />
      </instancedMesh>
    </>
  );
}

function buildStardust() {
  const count = 1_400;
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  const bases = ACT_FOUR_FOLD_POSES.map((pose) => {
    const forward = pose.target.clone().sub(pose.camera).normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    const up = new THREE.Vector3().crossVectors(right, forward).normalize();
    return { origin: pose.camera, forward, right, up };
  });

  for (let i = 0; i < count; i += 1) {
    if (i < 1_100) {
      const base = bases[Math.floor(i / 220)];
      const point = base.origin.clone()
        .addScaledVector(base.forward, 8 + seeded(i, 33) * 72)
        .addScaledVector(base.right, (seeded(i, 31) - 0.5) * 58)
        .addScaledVector(base.up, (seeded(i, 32) - 0.5) * 46);
      positions.set(point.toArray(), i * 3);
    } else {
      positions.set([-30 + seeded(i, 31) * 60, -25 + seeded(i, 32) * 50, 8 - seeded(i, 33) * 165], i * 3);
    }
    sizes[i] = 0.075 + seeded(i, 34) * 0.13;
    phases[i] = seeded(i, 35) * Math.PI * 2;
    const tint = seeded(i, 36);
    const color = new THREE.Color(tint > 0.88 ? "#fff8e8" : "#ffe8b5");
    colors.set([color.r, color.g, color.b], i * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  return geometry;
}

function CathedralStardust() {
  const material = useRef<THREE.ShaderMaterial>(null);
  const geometry = useMemo(buildStardust, []);
  useFrame(({ clock }) => {
    if (material.current) material.current.uniforms.uTime.value = clock.getElapsedTime();
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
        uniforms={{ uTime: { value: 0 }, uExitOpacity: { value: 1 } }}
        vertexShader={"attribute float aSize;attribute float aPhase;attribute vec3 aColor;uniform float uTime;varying float vTwinkle;varying vec3 vColor;void main(){vec3 p=position;p.x+=sin(uTime*0.14+aPhase)*0.12;p.y+=cos(uTime*0.11+aPhase*1.7)*0.09;p.z+=sin(uTime*0.08+aPhase*0.7)*0.08;vec4 mv=modelViewMatrix*vec4(p,1.0);vColor=aColor;vTwinkle=0.72+0.28*sin(uTime*1.1+aPhase);gl_PointSize=clamp(aSize*(900.0/max(-mv.z,1.0)),1.5,7.0);gl_Position=projectionMatrix*mv;}"}
        fragmentShader={"uniform float uExitOpacity;varying float vTwinkle;varying vec3 vColor;void main(){float d=length(gl_PointCoord-0.5);float core=1.0-smoothstep(0.08,0.5,d);float halo=1.0-smoothstep(0.2,0.5,d);float alpha=(core*0.78+halo*0.34)*vTwinkle*uExitOpacity;if(alpha<0.012)discard;gl_FragColor=vec4(vColor*vTwinkle*uExitOpacity,alpha);}"}
      />
    </points>
  );
}

function ActiveStationFrame({ index, projectIndex }: { index: number; projectIndex: number }) {
  const pose = ACT_FOUR_FOLD_POSES[index] ?? ACT_FOUR_FOLD_POSES[0];
  const transform = useMemo(() => {
    const object = new THREE.Object3D();
    object.position.copy(pose.target);
    object.up.set(0, 1, 0);
    object.lookAt(pose.camera);
    return {
      position: pose.target.toArray() as [number, number, number],
      quaternion: object.quaternion.toArray() as [number, number, number, number],
    };
  }, [pose]);
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(6.8, 3.85, 0.035)), []);
  if (index !== projectIndex) return null;
  return (
    <group position={transform.position} quaternion={transform.quaternion}>
      <lineSegments geometry={edges} scale={1.004} renderOrder={7}>
        <lineBasicMaterial color="#ffbe55" transparent opacity={0.62} depthTest depthWrite={false} toneMapped={false} />
      </lineSegments>
      <lineSegments geometry={edges} scale={1.009} renderOrder={8}>
        <lineBasicMaterial color="#9c102e" transparent opacity={0.36} depthTest depthWrite={false} toneMapped={false} />
      </lineSegments>
    </group>
  );
}

function TesseractCathedral({
  projectIndex,
  foldFromIndex,
  foldStartedAt,
  isFolding,
}: {
  projectIndex: number;
  foldFromIndex: number;
  foldStartedAt: number;
  isFolding: boolean;
}) {
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
        />
      ))}
      <CathedralStardust />
      {ACT_FOUR_FOLD_POSES.map((_, index) => (
        <ActiveStationFrame key={"active-station-frame-" + index} index={index} projectIndex={projectIndex} />
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
    <group ref={vaultLayer} visible={phase === "act4_vault" || phase === "act4_warp_out"}><TesseractCathedral projectIndex={projectIndex} foldFromIndex={foldFromIndex} foldStartedAt={foldStartedAt} isFolding={isFolding} /></group>
    <BreachFlash phase={phase} />
  </group>;
}
