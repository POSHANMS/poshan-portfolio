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

type LightRibbon = {
  matrix: THREE.Matrix4;
  seed: number;
  phase: number;
  alpha: number;
  crimson: number;
};

function buildStationLightStrata(stationIndex: number) {
  const pose = ACT_FOUR_FOLD_POSES[stationIndex] ?? ACT_FOUR_FOLD_POSES[0];
  const forward = pose.target.clone().sub(pose.camera).normalize();
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
  const up = new THREE.Vector3().crossVectors(right, forward).normalize();
  const origin = pose.camera;
  const ribbons: LightRibbon[] = [];
  type Axis = "vertical" | "depth-horizontal" | "depth-vertical" | "horizontal";
  const addRibbon = (
    axis: Axis,
    index: number,
    rightOffset: number,
    upOffset: number,
    depth: number,
    length: number,
    width: number,
    alphaMin: number,
    alphaMax: number,
    crimson: boolean,
  ) => {
    const position = origin.clone()
      .addScaledVector(right, rightOffset)
      .addScaledVector(up, upOffset)
      .addScaledVector(forward, depth);
    // Every plane maps local X to its transverse UV and local Y to the shaft direction.
    const across = axis === "vertical" || axis === "depth-horizontal" ? right.clone()
      : axis === "depth-vertical" ? up.clone() : up.clone();
    const along = axis === "vertical" ? up.clone()
      : axis === "depth-horizontal" || axis === "depth-vertical" ? forward.clone() : right.clone();
    const normal = new THREE.Vector3().crossVectors(across, along).normalize();
    const basis = new THREE.Matrix4().makeBasis(across, along, normal);
    const quaternion = new THREE.Quaternion().setFromRotationMatrix(basis);
    const scale = new THREE.Vector3(width, length, 1);
    ribbons.push({
      matrix: new THREE.Matrix4().compose(position, quaternion, scale),
      seed: seeded(index + stationIndex * 53, 101),
      phase: seeded(index + stationIndex * 53, 103) * 2.4,
      alpha: alphaMin + seeded(index + stationIndex * 53, 107) * (alphaMax - alphaMin),
      crimson: Number(crimson),
    });
  };

  // 20 central shafts: 13 gold and 7 crimson, with no center keepout.
  const goldWaterfallOffsets = [-3.6, -3.2, -2.8, -2.4, -2.0, -1.6, -1.2, -0.8, -0.4, 0.2, 4.6, 5.7, 6.5];
  goldWaterfallOffsets.forEach((offset, index) => {
    addRibbon("vertical", index, offset, (seeded(index, 131) - 0.5) * 2.2,
      11.5 + seeded(index + stationIndex * 31, 109) * 16.5,
      62 + seeded(index, 113) * 16, 0.38 + seeded(index, 127) * 2.12, 0.30, 0.58, false);
  });

  const crimsonWaterfallOffsets = [0.9, 1.5, 2.1, 2.8, 3.4, 4.2, -4.5];
  crimsonWaterfallOffsets.forEach((offset, index) => {
    addRibbon("vertical", 13 + index, offset, (seeded(index + 20, 133) - 0.5) * 2.2,
      11.5 + seeded(index + stationIndex * 37, 139) * 16.5,
      62 + seeded(index + 20, 141) * 16, 0.38 + seeded(index + 20, 143) * 2.12,
      index === 6 ? 0.22 : 0.30, index === 6 ? 0.34 : 0.58, true);
  });

  // Four quieter outer echoes preserve the black negative-space corners.
  [-9.4, -7.4, 7.6, 10.0].forEach((offset, index) => {
    addRibbon("vertical", 20 + index, offset, (seeded(index + 40, 145) - 0.5) * 2.6,
      12 + seeded(index + stationIndex * 41, 147) * 15,
      64 + seeded(index + 40, 149) * 12, 0.4 + seeded(index + 40, 151) * 1.1,
      0.16, 0.26, index === 3);
  });

  // 18 Z-depth sheets: 10 above/below and 8 flanking, all start at depth 0.8.
  const depthStart = 0.8;
  const depthLength = 56.0 - depthStart;
  const topBottomSheets = [
    { x: -7.5, y: 3.2 }, { x: -3.8, y: 4.2 }, { x: 1.6, y: 5.0 }, { x: 6.8, y: 6.2 }, { x: 9.0, y: 3.7 },
    { x: -8.8, y: -3.2 }, { x: -4.0, y: -4.2 }, { x: 1.0, y: -5.0 }, { x: 6.2, y: -6.0 }, { x: 9.2, y: -3.6 },
  ];
  topBottomSheets.forEach((sheet, index) => {
    const crimson = [3, 6, 9].includes(index);
    addRibbon("depth-horizontal", 24 + index, sheet.x, sheet.y, (depthStart + 56.0) * 0.5,
      depthLength, 0.45 + seeded(index, 157) * 1.75, 0.18, 0.36, crimson);
  });
  const sideSheets = [
    { x: -13.0, y: -3.8 }, { x: -10.0, y: 1.2 }, { x: -7.0, y: 4.5 }, { x: -4.8, y: -1.0 },
    { x: 4.8, y: 0.5 }, { x: 7.0, y: -4.2 }, { x: 10.0, y: 2.7 }, { x: 13.0, y: -0.8 },
  ];
  sideSheets.forEach((sheet, index) => {
    const crimson = index === 2 || index === 5 || index === 7;
    addRibbon("depth-vertical", 34 + index, sheet.x, sheet.y, (depthStart + 56.0) * 0.5,
      depthLength, 0.45 + seeded(index + 20, 159) * 1.75, 0.18, 0.36, crimson);
  });

  // 12 horizontal cross-streams, with four restrained crimson beams.
  const crossStreamHeights = [-4.2, -3.4, -2.6, -1.8, -0.9, 0.1, 1.0, 1.9, 2.8, 3.5, 4.0, 4.4];
  crossStreamHeights.forEach((height, index) => {
    const crimson = [3, 6, 9, 11].includes(index);
    addRibbon("horizontal", 42 + index, (seeded(index, 163) - 0.5) * 5.0, height,
      12.5 + seeded(index + stationIndex * 47, 165) * 23.5,
      46 + seeded(index, 167) * 18, 0.32 + seeded(index, 169) * 1.03,
      0.18, 0.36, crimson);
  });

  const geometry = new THREE.PlaneGeometry(1, 1);
  const attribute = (field: "seed" | "phase" | "alpha" | "crimson") => new THREE.InstancedBufferAttribute(
    new Float32Array(ribbons.map((ribbon) => ribbon[field])), 1,
  );
  geometry.setAttribute("aSeed", attribute("seed"));
  geometry.setAttribute("aPhase", attribute("phase"));
  geometry.setAttribute("aAlpha", attribute("alpha"));
  geometry.setAttribute("aIsCrimson", attribute("crimson"));
  return { ribbons, geometry };
}

function StationLightStrata({
  stationIndex,
  projectIndex,
  foldFromIndex,
  foldStartedAt,
  isFolding,
  exitOpacityRef,
}: {
  stationIndex: number;
  projectIndex: number;
  foldFromIndex: number;
  foldStartedAt: number;
  isFolding: boolean;
  exitOpacityRef: React.RefObject<number>;
}) {
  const ribbonMesh = useRef<THREE.InstancedMesh>(null);
  const ribbonMaterial = useRef<THREE.ShaderMaterial>(null);
  const layout = useMemo(() => buildStationLightStrata(stationIndex), [stationIndex]);
  useEffect(() => {
    if (!ribbonMesh.current) return;
    layout.ribbons.forEach((ribbon, index) => {
      ribbonMesh.current?.setMatrixAt(index, ribbon.matrix);
    });
    ribbonMesh.current.instanceMatrix.needsUpdate = true;
  }, [layout]);
  useEffect(() => () => layout.geometry.dispose(), [layout]);

  useFrame(({ clock }) => {
    if (!ribbonMesh.current || !ribbonMaterial.current) return;
    const t = isFolding && foldStartedAt > 0
      ? clamp((performance.now() - foldStartedAt) / 900)
      : 1;
    const eased = smoothstep(0, 1, t);
    const weight = isFolding
      ? stationIndex === foldFromIndex ? 1 - eased : stationIndex === projectIndex ? eased : 0
      : stationIndex === projectIndex ? 1 : 0;
    const visible = weight > 0.001;
    ribbonMesh.current.visible = visible;
    ribbonMaterial.current.uniforms.uTime.value = clock.getElapsedTime();
    ribbonMaterial.current.uniforms.uOpacity.value = weight * exitOpacityRef.current;
  });

  return (
    <instancedMesh ref={ribbonMesh} args={[layout.geometry, undefined, layout.ribbons.length]} frustumCulled={false} renderOrder={4}>
      <shaderMaterial
        ref={ribbonMaterial}
        uniforms={{ uTime: { value: 0 }, uOpacity: { value: 0 } }}
        transparent
        depthTest
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
        // d = 2*(u-0.5); the three Gaussian widths form aura, shaft, and continuous core.
        vertexShader={"attribute float aSeed;attribute float aPhase;attribute float aAlpha;attribute float aIsCrimson;varying vec2 vUv;varying float vSeed;varying float vPhase;varying float vAlpha;varying float vIsCrimson;void main(){vUv=uv;vSeed=aSeed;vPhase=aPhase;vAlpha=aAlpha;vIsCrimson=aIsCrimson;vec4 world=modelMatrix*instanceMatrix*vec4(position,1.0);gl_Position=projectionMatrix*viewMatrix*world;}"}
        fragmentShader={"uniform float uTime;uniform float uOpacity;varying vec2 vUv;varying float vSeed;varying float vPhase;varying float vAlpha;varying float vIsCrimson;void main(){float d=(vUv.x-0.5)*2.0;float halo=exp(-d*d*3.0);float shaft=exp(-d*d*22.0);float core=exp(-d*d*180.0);float ends=smoothstep(0.0,0.14,vUv.y)*smoothstep(1.0,0.86,vUv.y);float drift=0.88+0.12*sin(vUv.y*2.4-uTime*(0.5+vPhase)+vSeed*6.28318);float profile=halo*0.38+shaft*0.72+core*0.95;vec3 goldCol=(vec3(0.58,0.24,0.04)*halo*0.38+vec3(0.96,0.64,0.20)*shaft*0.72+vec3(1.0,0.88,0.62)*core*0.95)/max(profile,0.0001);vec3 crimsonCol=(vec3(0.45,0.03,0.09)*halo*0.38+vec3(0.92,0.14,0.27)*shaft*0.72+vec3(1.0,0.46,0.48)*core*0.95)/max(profile,0.0001);vec3 col=mix(goldCol,crimsonCol,step(0.5,vIsCrimson));float alpha=clamp(profile*drift*ends*uOpacity*vAlpha,0.0,1.0);gl_FragColor=vec4(col,alpha);}"}
      />
    </instancedMesh>
  );
}

function buildStardust(stationIndex: number, count = 2500) {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  const pose = ACT_FOUR_FOLD_POSES[stationIndex] ?? ACT_FOUR_FOLD_POSES[0];
  const forward = pose.target.clone().sub(pose.camera).normalize();
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
  const up = new THREE.Vector3().crossVectors(right, forward).normalize();

  for (let i = 0; i < count; i += 1) {
    const flank = i < Math.round(count * 0.65);
    const side = seeded(i, stationIndex * 17 + 31) < 0.5 ? -1 : 1;
    const x = side * (flank
      ? 1.4 + seeded(i, stationIndex * 19 + 32) * 10.1
      : 9.0 + seeded(i, stationIndex * 23 + 33) * 13.0);
    const y = flank
      ? -13.5 + seeded(i, stationIndex * 29 + 34) * 27.0
      : -15.0 + seeded(i, stationIndex * 31 + 35) * 30.0;
    const depth = flank
      ? 6.0 + seeded(i, stationIndex * 37 + 36) * 36.0
      : 8.0 + seeded(i, stationIndex * 41 + 37) * 40.0;
    const point = pose.camera.clone()
      .addScaledVector(forward, depth)
      .addScaledVector(right, x)
      .addScaledVector(up, y);
    positions.set(point.toArray(), i * 3);
    sizes[i] = 0.45 + seeded(i, 43) * 1.0;
    phases[i] = seeded(i, 47) * Math.PI * 2;
    const tint = seeded(i, 53);
    const color = new THREE.Color(tint > 0.975 ? "#ff3b5c" : tint > 0.91 ? "#fff4d8" : tint > 0.48 ? "#ffd27d" : "#d97820");
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
    const t = isFolding && foldStartedAt > 0 ? clamp((performance.now() - foldStartedAt) / 900) : 1;
    const eased = smoothstep(0, 1, t);
    const weight = isFolding
      ? stationIndex === foldFromIndex ? 1 - eased : stationIndex === projectIndex ? eased : 0
      : stationIndex === projectIndex ? 1 : 0;
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
        // Projected point size scales with DPR and inversely with camera-space depth.
        vertexShader={"attribute float aSize;attribute float aPhase;attribute vec3 aColor;uniform float uTime;uniform float uPixelRatio;varying float vTwinkle;varying vec3 vColor;void main(){vec3 p=position;p.x+=sin(uTime*0.14+aPhase)*0.12;p.y+=cos(uTime*0.11+aPhase*1.7)*0.09;p.z+=sin(uTime*0.08+aPhase*0.7)*0.08;vec4 mvPosition=modelViewMatrix*vec4(p,1.0);vColor=aColor;vTwinkle=0.82+0.18*sin(uTime*1.1+aPhase);gl_PointSize=clamp(aSize*uPixelRatio*(46.0/max(2.5,-mvPosition.z)),1.2*uPixelRatio,3.6*uPixelRatio);gl_Position=projectionMatrix*mvPosition;}"}
        fragmentShader={"uniform float uOpacity;varying float vTwinkle;varying vec3 vColor;void main(){float d=length(gl_PointCoord-0.5)*2.0;if(d>1.0)discard;float glow=exp(-d*d*7.5);float alpha=glow*vTwinkle*uOpacity*0.92;gl_FragColor=vec4(vColor,alpha);}"}
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
    [-4.8, 4.7, 13.5, 1.8], [-1.2, 5.5, 16.0, 1.5], [4.7, -4.5, 15.0, 2.0], [2.0, -5.2, 17.0, 1.6],
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
        fragmentShader={"uniform float uTime;uniform float uOpacity;varying vec2 vUv;void main(){vec2 p=(vUv-0.5)*2.0;float r=length(p);float glow=exp(-r*r*6.5);float core=exp(-r*r*30.0);float pulse=0.94+0.06*sin(uTime*0.8+vUv.x*2.0);vec3 warm=mix(vec3(1.0,0.62,0.22),vec3(1.0,0.92,0.72),core);float alpha=0.36*glow*uOpacity*pulse;gl_FragColor=vec4(warm,alpha);}"}
      />
    </instancedMesh>
  );
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
        />
      ))}
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
