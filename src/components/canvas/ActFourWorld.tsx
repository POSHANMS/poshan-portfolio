"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { ActFourPhase } from "@/types/actFour";
import { ACT_FOUR_FOLD_POSES, ACT_FOUR_WARP_IN_DURATION_MS, WORMHOLE_CURVE, WORMHOLE_PATH_LENGTH, WORMHOLE_TUBE_RADIUS } from "@/animations/scrollCamera";
import { PROJECTS } from "@/utils/constants";
import ActFourExterior from "./ActFourExterior";

const WARP_PARTICLE_COUNT = 1_200;
const WORMHOLE_RING_COUNT = 32;
const WARP_NEEDLE_COUNT = 640;
const WARP_IN_DURATION_SECONDS = ACT_FOUR_WARP_IN_DURATION_MS / 1000;
const WARP_VAULT_CUTOVER_SECONDS = WARP_IN_DURATION_SECONDS * 0.755;
const VAULT_GOLD = "#fff2cf";
const VAULT_AMBER = "#ffbe55";
const VAULT_CRIMSON = "#ff3554";

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

type SheetInstance = { matrix: THREE.Matrix4; color: THREE.Color };

function buildSheets(axis: "depth" | "vertical" | "cross") {
  const dummy = new THREE.Object3D();
  const sheets: SheetInstance[] = [];
  const add = (position: THREE.Vector3, scale: THREE.Vector3, rotation: THREE.Euler, color: string) => {
    dummy.position.copy(position); dummy.scale.copy(scale); dummy.rotation.copy(rotation); dummy.updateMatrix();
    sheets.push({ matrix: dummy.matrix.clone(), color: new THREE.Color(color) });
  };
  const stationColor = (index: number, goldCount: number, total: number) => index % total < goldCount ? VAULT_GOLD : VAULT_CRIMSON;
  ACT_FOUR_FOLD_POSES.forEach(({ target }, stationIndex) => {
    const wallZ = target.z - 2.6;
    const centerY = target.y + 4.5;
    if (axis === "depth") {
      const columns = [-18, -12, -6, 0, 6, 12, 18];
      columns.forEach((offset, index) => add(
        new THREE.Vector3(target.x + offset, centerY, wallZ),
        new THREE.Vector3(0.115, 18, 1), new THREE.Euler(),
        stationColor(index + stationIndex, 7, 12),
      ));
      [-3, 1, 5, 9, 13].forEach((offset, index) => add(
        new THREE.Vector3(target.x, target.y + offset, wallZ),
        new THREE.Vector3(40, 0.095, 1), new THREE.Euler(),
        stationColor(index + stationIndex + 8, 7, 12),
      ));
    } else if (axis === "vertical") {
      [-18, -9, 9, 18].forEach((offset, index) => add(
        new THREE.Vector3(target.x + offset, centerY, target.z - 15),
        new THREE.Vector3(30, 18, 1), new THREE.Euler(0, Math.PI / 2, 0),
        stationColor(index + stationIndex, 2, 4),
      ));
    } else {
      [target.y + 12.8, target.y + 10.5, target.y - 1.8, target.y - 4.8].forEach((y, index) => add(
        new THREE.Vector3(target.x, y, target.z - 15),
        new THREE.Vector3(42, 30, 1), new THREE.Euler(-Math.PI / 2, 0, 0),
        stationColor(index + stationIndex, 3, 4),
      ));
    }
  });
  return sheets;
}

function LightSheetSet({ axis }: { axis: "depth" | "vertical" | "cross" }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const shader = useRef<THREE.ShaderMaterial>(null);
  const { pointer, camera } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const ground = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 4.2), []);
  const hit = useMemo(() => new THREE.Vector3(), []);
  const pointerWorld = useMemo(() => new THREE.Vector2(0, -60), []);
  const sheets = useMemo(() => buildSheets(axis), [axis]);
  useEffect(() => {
    if (!mesh.current) return;
    sheets.forEach((sheet, index) => { mesh.current?.setMatrixAt(index, sheet.matrix); mesh.current?.setColorAt(index, sheet.color); });
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  }, [sheets]);
  useFrame(({ clock }) => {
    if (!shader.current) return;
    raycaster.setFromCamera(pointer, camera);
    if (raycaster.ray.intersectPlane(ground, hit)) pointerWorld.set(hit.x, hit.z);
    shader.current.uniforms.uTime.value = clock.getElapsedTime();
    shader.current.uniforms.uPointer.value.copy(pointerWorld);
  });
  return <instancedMesh ref={mesh} args={[undefined, undefined, sheets.length]} frustumCulled={false} renderOrder={4}>
    <planeGeometry args={[1, 1]} />
    <shaderMaterial ref={shader} transparent depthWrite={false} depthTest side={THREE.DoubleSide} blending={THREE.AdditiveBlending} toneMapped={false}
      uniforms={{ uTime: { value: 0 }, uPointer: { value: pointerWorld.clone() } }}
      vertexShader={`varying vec2 vUv;varying vec3 vColor;varying vec3 vWorld;void main(){vUv=uv;vColor=instanceColor;vec4 world=modelMatrix*instanceMatrix*vec4(position,1.0);vWorld=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}`}
      fragmentShader={`uniform float uTime;uniform vec2 uPointer;varying vec2 vUv;varying vec3 vColor;varying vec3 vWorld;void main(){float core=exp(-pow((vUv.y-0.5)/0.2,2.0));float flow=0.64+0.36*(0.5+0.5*sin(vUv.x*74.0-uTime*1.6+sin(vUv.x*15.0-uTime*0.28)*1.2));float filaments=0.86+0.14*sin(vUv.x*231.0-uTime*2.2);float ends=smoothstep(0.0,0.08,vUv.x)*(1.0-smoothstep(0.92,1.0,vUv.x));float shimmer=exp(-dot(vWorld.xz-uPointer,vWorld.xz-uPointer)*0.012);float emission=core*flow*filaments*ends;float alpha=smoothstep(0.02,0.18,core)*ends*(0.26+emission*0.86)*(0.7+shimmer*0.45);if(alpha<0.012)discard;gl_FragColor=vec4(vColor*emission*(0.9+shimmer*0.4),alpha);}`}
    />
  </instancedMesh>;
}

function buildLatticeFilaments() {
  const dummy = new THREE.Object3D();
  const filaments: SheetInstance[] = [];
  const add = (position: THREE.Vector3, size: THREE.Vector3, color: string) => {
    dummy.position.copy(position); dummy.scale.copy(size); dummy.rotation.set(0, 0, 0); dummy.updateMatrix();
    filaments.push({ matrix: dummy.matrix.clone(), color: new THREE.Color(color) });
  };
  ACT_FOUR_FOLD_POSES.forEach(({ target }, stationIndex) => {
    const wallZ = target.z - 2.75;
    const centerY = target.y + 4.5;
    [-18, -12, -6, 0, 6, 12, 18].forEach((offset, index) => add(
      new THREE.Vector3(target.x + offset, centerY, wallZ),
      new THREE.Vector3(0.045, 18, 0.045),
      (index + stationIndex) % 12 < 7 ? VAULT_GOLD : VAULT_CRIMSON,
    ));
    [-3, 1, 5, 9, 13].forEach((offset, index) => add(
      new THREE.Vector3(target.x, target.y + offset, wallZ),
      new THREE.Vector3(40, 0.035, 0.045),
      (index + stationIndex + 7) % 12 < 7 ? VAULT_GOLD : VAULT_CRIMSON,
    ));
    [-18, -9, 9, 18].forEach((offset, index) => add(
      new THREE.Vector3(target.x + offset, centerY, target.z - 15),
      new THREE.Vector3(0.045, 18, 30),
      (index + stationIndex) % 4 < 2 ? VAULT_GOLD : VAULT_CRIMSON,
    ));
    [target.y + 12.8, target.y + 10.5, target.y - 1.8, target.y - 4.8].forEach((y, index) => add(
      new THREE.Vector3(target.x, y, target.z - 15),
      new THREE.Vector3(42, 0.035, 30),
      (index + stationIndex) % 4 < 3 ? VAULT_GOLD : VAULT_CRIMSON,
    ));

  });
  return filaments;
}

function StationPortalFrames() {
  return <>
    {ACT_FOUR_FOLD_POSES.map(({ target, camera }, index) => {
      const frame = new THREE.Object3D();
      frame.position.copy(target);
      frame.lookAt(camera);
      const quaternion = frame.quaternion.toArray() as [number, number, number, number];
      const gold = index % 2 === 0 ? VAULT_GOLD : VAULT_AMBER;
      const red = VAULT_CRIMSON;
      const rails = [
        { x: -4.1, y: 0, w: 0.035, h: 5.4, color: gold },
        { x: 4.1, y: 0, w: 0.035, h: 5.4, color: red },
        { x: -5.5, y: 0, w: 0.022, h: 7.4, color: gold },
        { x: 5.5, y: 0, w: 0.022, h: 7.4, color: red },
        { x: 0, y: 2.7, w: 8.2, h: 0.035, color: gold },
        { x: 0, y: -2.7, w: 8.2, h: 0.035, color: red },
        { x: 0, y: 3.8, w: 11, h: 0.022, color: gold },
        { x: 0, y: -3.8, w: 11, h: 0.022, color: red },
        { x: -2.9, y: 1.35, w: 0.02, h: 2.7, color: gold },
        { x: 2.9, y: -1.35, w: 0.02, h: 2.7, color: gold },
      ];
      return <group key={`station-frame-${index}`} position={target.toArray()} quaternion={quaternion}>
        {rails.map((rail, railIndex) => <mesh key={railIndex} position={[rail.x, rail.y, 0.15]} renderOrder={10}>
          <boxGeometry args={[rail.w, rail.h, 0.025]} />
          <meshBasicMaterial color={rail.color} transparent opacity={0.62} depthTest={false} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>)}
      </group>;
    })}
  </>;
}

function FindItArrivalCurtain({ projectIndex }: { projectIndex: number }) {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const direction = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, clock }) => {
    if (!mesh.current || !material.current) return;
    camera.getWorldDirection(direction);
    mesh.current.position.copy(camera.position).addScaledVector(direction, 18);
    mesh.current.quaternion.copy(camera.quaternion);
    material.current.uniforms.uTime.value = clock.getElapsedTime();
  });
  if (projectIndex !== 0) return null;
  return <mesh ref={mesh} renderOrder={1} frustumCulled={false}>
    <planeGeometry args={[34, 20]} />
    <shaderMaterial ref={material} transparent depthTest={false} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false}
      uniforms={{ uTime: { value: 0 } }}
      vertexShader={`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`}
      fragmentShader={`uniform float uTime;varying vec2 vUv;void main(){vec2 uv=vUv;float edge=smoothstep(0.0,0.16,uv.y)*(1.0-smoothstep(0.84,1.0,uv.y));float curtains=pow(0.5+0.5*sin(uv.x*116.0+sin(uv.x*17.0-uTime*0.14)*2.1),13.0);float broad=exp(-pow((uv.x-0.18)/0.24,2.0))*0.22+exp(-pow((uv.x-0.86)/0.2,2.0))*0.18;float crossing=exp(-pow((uv.y-0.3-sin(uv.x*5.0-uTime*0.12)*0.035)/0.07,2.0))*0.22+exp(-pow((uv.y-0.68+sin(uv.x*4.0-uTime*0.1)*0.04)/0.08,2.0))*0.16;float centerKeep=0.48+0.52*smoothstep(0.12,0.72,abs(uv.x-0.5));float energy=(curtains*0.24+broad+crossing)*edge*centerKeep;vec3 gold=vec3(1.0,0.72,0.34);vec3 red=vec3(1.0,0.06,0.16);vec3 color=mix(gold,red,smoothstep(0.48,0.94,uv.x));gl_FragColor=vec4(color,clamp(energy,0.0,0.58));}`}
  /></mesh>;
}

function LatticeFilaments() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const material = useRef<THREE.MeshBasicMaterial>(null);
  const filaments = useMemo(buildLatticeFilaments, []);
  useEffect(() => {
    if (!mesh.current) return;
    filaments.forEach((entry, index) => {
      mesh.current?.setMatrixAt(index, entry.matrix);
      mesh.current?.setColorAt(index, entry.color);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  }, [filaments]);
  useFrame(({ clock }) => {
    if (!mesh.current || !material.current) return;
    const pulse = 0.78 + Math.sin(clock.getElapsedTime() * 1.4) * 0.045;
    material.current.opacity = pulse;
  });
  return <instancedMesh ref={mesh} args={[undefined, undefined, filaments.length]} frustumCulled={false} renderOrder={6}>
    <boxGeometry args={[1, 1, 1]} />
    <meshBasicMaterial ref={material} vertexColors transparent opacity={0.78} depthTest depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
  </instancedMesh>;
}

function BeamIntersectionFlare() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const layout = useMemo(() => {
    const dummy = new THREE.Object3D(); const entries: SheetInstance[] = [];
    for (let z = 10; z >= -130; z -= 20) for (const x of [-24, -12, 0, 12, 24]) {
      dummy.position.set(x, 3.4, z); dummy.scale.setScalar(0.11); dummy.updateMatrix();
      entries.push({ matrix: dummy.matrix.clone(), color: (Math.abs(x / 12 + z / 20) % 2) < 1 ? new THREE.Color(VAULT_AMBER) : new THREE.Color(VAULT_CRIMSON) });
    }
    return entries;
  }, []);
  useEffect(() => {
    if (!mesh.current) return;
    layout.forEach((entry, index) => { mesh.current?.setMatrixAt(index, entry.matrix); mesh.current?.setColorAt(index, entry.color); });
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  }, [layout]);
  return <instancedMesh ref={mesh} args={[undefined, undefined, layout.length]} frustumCulled={false}>
    <sphereGeometry args={[1, 8, 6]} /><meshBasicMaterial vertexColors transparent opacity={0.32} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
  </instancedMesh>;
}

function ObsidianFloor({ projectIndex }: { projectIndex: number }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const { pointer, camera } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 4.2), []);
  const hit = useMemo(() => new THREE.Vector3(), []);
  const pointerWorld = useMemo(() => new THREE.Vector2(0, -60), []);
  const station = ACT_FOUR_FOLD_POSES[projectIndex]?.target ?? ACT_FOUR_FOLD_POSES[0].target;
  useFrame(({ clock }) => {
    if (!material.current) return;
    raycaster.setFromCamera(pointer, camera);
    if (raycaster.ray.intersectPlane(plane, hit)) pointerWorld.set(hit.x, hit.z);
    const uniforms = material.current.uniforms;
    uniforms.uTime.value = clock.getElapsedTime(); uniforms.uPointer.value.copy(pointerWorld); uniforms.uActive.value.set(station.x, station.z);
  });
  return <mesh position={[0, -4.2, -60]} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false} renderOrder={2}>
    <planeGeometry args={[260, 190]} />
    <shaderMaterial ref={material} transparent depthWrite={false} depthTest side={THREE.DoubleSide} toneMapped={false}
      uniforms={{ uTime: { value: 0 }, uPointer: { value: pointerWorld.clone() }, uActive: { value: new THREE.Vector2(station.x, station.z) } }}
      vertexShader={`varying vec3 vWorld;void main(){vec4 world=modelMatrix*vec4(position,1.0);vWorld=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}`}
      fragmentShader={`uniform float uTime;uniform vec2 uPointer;uniform vec2 uActive;varying vec3 vWorld;void main(){vec2 p=vWorld.xz;float pillars=0.0;for(int i=0;i<5;i++){float x=(float(i)-2.0)*12.0;pillars+=exp(-pow((p.x-x)/1.65,2.0))*(0.42+0.08*sin(p.y*0.11-uTime*0.32+float(i)));}float pools=0.0;for(int i=0;i<5;i++){float z=-30.0*float(i);vec2 d=(p-vec2(2.7,z))*vec2(0.34,0.16);pools+=exp(-dot(d,d)*0.32)*0.72;}vec2 activeDelta=(p-uActive)*vec2(0.31,0.2);float activePool=exp(-dot(activeDelta,activeDelta)*0.38);float pointerPool=exp(-dot(p-uPointer,p-uPointer)*0.018);float edge=max(abs(p.x)/130.0,abs(p.y+60.0)/95.0);float edgeFade=1.0-smoothstep(0.76,1.0,edge);float distanceFade=1.0-smoothstep(54.0,150.0,distance(cameraPosition,vWorld));float warm=clamp(pillars*0.34+pools*0.22+activePool*0.36+pointerPool*0.16,0.0,1.0);vec3 color=vec3(0.006,0.004,0.009)+vec3(1.0,0.55,0.19)*warm*0.22+vec3(0.88,0.035,0.12)*clamp(pools*0.08+pointerPool*0.06,0.0,0.2);gl_FragColor=vec4(color,edgeFade*distanceFade*(0.52+warm*0.34));}`}
    />
  </mesh>;
}

function buildStardust() {
  const count = 1_400; const positions = new Float32Array(count * 3); const sizes = new Float32Array(count); const phases = new Float32Array(count); const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    if (i < 1_100) {
      const pose = ACT_FOUR_FOLD_POSES[Math.floor(i / 220)];
      const forward = pose.target.clone().sub(pose.camera).normalize();
      const right = forward.clone().cross(new THREE.Vector3(0, 1, 0)).normalize();
      const up = right.clone().cross(forward).normalize();
      const point = pose.target.clone()
        .addScaledVector(forward, 2.6 + seeded(i, 33) * 12.4)
        .addScaledVector(right, (seeded(i, 31) - 0.5) * 30)
        .addScaledVector(up, (seeded(i, 32) - 0.5) * 17);
      positions.set(point.toArray(), i * 3);
    } else {
      positions.set([-18 + seeded(i, 31) * 40, -4.8 + seeded(i, 32) * 18, 6 - seeded(i, 33) * 138], i * 3);
    }
    sizes[i] = 0.05 + seeded(i, 34) * 0.1; phases[i] = seeded(i, 35) * Math.PI * 2;
    const tint = seeded(i, 36); const color = new THREE.Color(tint > 0.74 ? "#ffffff" : "#ffe8b5");
    colors.set([color.r, color.g, color.b], i * 3);
  }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1)); geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1)); geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  return geometry;
}

function CathedralStardust() {
  const material = useRef<THREE.ShaderMaterial>(null); const geometry = useMemo(buildStardust, []);
  useFrame(({ clock }) => { if (material.current) material.current.uniforms.uTime.value = clock.getElapsedTime(); });
  return <points geometry={geometry} frustumCulled={false} renderOrder={5}>
    <shaderMaterial ref={material} transparent depthWrite={false} depthTest toneMapped={false} blending={THREE.AdditiveBlending} uniforms={{ uTime: { value: 0 } }}
      vertexShader={`attribute float aSize;attribute float aPhase;attribute vec3 aColor;uniform float uTime;varying float vTwinkle;varying vec3 vColor;void main(){vec3 p=position;p.x+=sin(uTime*0.14+aPhase)*0.12;p.y+=cos(uTime*0.11+aPhase*1.7)*0.09;p.z+=sin(uTime*0.08+aPhase*0.7)*0.08;vec4 mv=modelViewMatrix*vec4(p,1.0);vColor=aColor;vTwinkle=0.68+0.32*sin(uTime*1.1+aPhase);gl_PointSize=clamp(aSize*(650.0/max(-mv.z,1.0)),1.1,5.2);gl_Position=projectionMatrix*mv;}`}
      fragmentShader={`varying float vTwinkle;varying vec3 vColor;void main(){float d=length(gl_PointCoord-0.5);float core=1.0-smoothstep(0.08,0.5,d);float halo=1.0-smoothstep(0.2,0.5,d);float alpha=(core*0.78+halo*0.32)*vTwinkle;if(alpha<0.02)discard;gl_FragColor=vec4(vColor*vTwinkle,alpha*0.86);}`}
    />
  </points>;
}

function createSlabTexture(title: string, index: number): THREE.CanvasTexture | null {
  const canvas = document.createElement("canvas"); canvas.width = 1536; canvas.height = 864;
  const context = canvas.getContext("2d"); if (!context) return null;
  context.fillStyle = "rgba(255,190,85,0.78)"; context.font = "600 34px ui-monospace, Consolas, monospace"; context.fillText(`${String(index + 1).padStart(2, "0")} / 05`, 104, 154);
  context.strokeStyle = "rgba(255,190,85,0.62)"; context.lineWidth = 2; context.beginPath(); context.moveTo(104, 196); context.lineTo(1432, 196); context.stroke();
  let size = 100; context.font = `800 ${size}px Inter, Arial, sans-serif`;
  while (context.measureText(title.toUpperCase()).width > 1328 && size > 54) { size -= 4; context.font = `800 ${size}px Inter, Arial, sans-serif`; }
  context.fillStyle = "#f8f2e7"; context.shadowColor = "rgba(255,190,85,0.22)"; context.shadowBlur = 18; context.fillText(title.toUpperCase(), 104, 500, 1328);
  context.shadowBlur = 0; context.fillStyle = "rgba(255,53,84,0.78)"; context.fillRect(104, 570, 150, 5);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4; return texture;
}

function TimeSliceSlab({ index, projectIndex, isFolding }: { index: number; projectIndex: number; isFolding: boolean }) {
  const titleMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
  useEffect(() => {
    const nextTexture = createSlabTexture(PROJECTS[index]?.name ?? "Project", index);
    setTexture(nextTexture);
    return () => nextTexture?.dispose();
  }, [index]);
  const pose = ACT_FOUR_FOLD_POSES[index] ?? ACT_FOUR_FOLD_POSES[0];
  const transform = useMemo(() => {
    const object = new THREE.Object3D();
    object.position.copy(pose.target);
    object.up.set(0, 1, 0);
    object.lookAt(pose.camera);
    return { position: pose.target.toArray() as [number, number, number], quaternion: object.quaternion.toArray() as [number, number, number, number] };
  }, [pose]);
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(6.8, 3.85, 0.16)), []);
  useFrame((_, delta) => {
    if (titleMaterial.current) {
      const visibleTitle = index === projectIndex && !isFolding ? 0 : 1;
      titleMaterial.current.opacity = THREE.MathUtils.damp(titleMaterial.current.opacity, visibleTitle, 28, delta);
    }
  });
  return <group position={transform.position} quaternion={transform.quaternion}>
    <mesh renderOrder={3}><boxGeometry args={[6.8, 3.85, 0.16]} /><meshBasicMaterial color="#100d12" transparent opacity={index === projectIndex && !isFolding ? 0.22 : 0.3} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} /></mesh>
    {texture && <mesh position={[0, 0, 0.082]} renderOrder={4}><planeGeometry args={[6.76, 3.81]} /><meshBasicMaterial ref={titleMaterial} map={texture} transparent opacity={index === projectIndex && !isFolding ? 0 : 1} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} /></mesh>}
    <lineSegments geometry={edges} scale={1.006} renderOrder={7}><lineBasicMaterial color={VAULT_GOLD} transparent opacity={0.96} depthTest={false} depthWrite={false} toneMapped={false} /></lineSegments>
    <lineSegments geometry={edges} scale={1.01} renderOrder={8}><lineBasicMaterial color={VAULT_CRIMSON} transparent opacity={0.72} depthTest={false} depthWrite={false} toneMapped={false} /></lineSegments>
  </group>;
}

function TesseractCathedral({ projectIndex, isFolding }: { projectIndex: number; isFolding: boolean }) {
  return <group>
    <FindItArrivalCurtain projectIndex={projectIndex} />
    <LightSheetSet axis="depth" /><LightSheetSet axis="vertical" /><LightSheetSet axis="cross" /><LatticeFilaments /><StationPortalFrames />
    <BeamIntersectionFlare /><ObsidianFloor projectIndex={projectIndex} /><CathedralStardust />
    {ACT_FOUR_FOLD_POSES.map((_, index) => <TimeSliceSlab key={`time-slice-${index}`} index={index} projectIndex={projectIndex} isFolding={isFolding} />)}
    <ambientLight color="#8a7560" intensity={0.18} />
    <pointLight position={[2.6, 4.6, 6]} color={VAULT_GOLD} intensity={24} distance={34} decay={1.5} />
    <pointLight position={[2.8, 5.2, -34]} color={VAULT_AMBER} intensity={30} distance={38} decay={1.5} />
    <pointLight position={[2.4, 4.8, -66]} color={VAULT_GOLD} intensity={28} distance={38} decay={1.5} />
    <pointLight position={[3.1, 5.0, -98]} color={VAULT_CRIMSON} intensity={24} distance={40} decay={1.5} />
    <pointLight position={[2.5, 4.6, -124]} color={VAULT_AMBER} intensity={26} distance={36} decay={1.5} />
  </group>;
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
  useEffect(() => {
    if (phase !== "act4_vault") {
      if (foldTimer.current) clearTimeout(foldTimer.current);
      foldTimer.current = null;
      previousProjectIndex.current = projectIndex;
      setIsFolding(false);
      return;
    }
    if (previousProjectIndex.current === projectIndex) return;
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
    if (tunnelLayer.current) tunnelLayer.current.visible = (phase === "act4_warp_in" && progress >= 0.22 && progress < 0.755) || (phase === "act4_warp_out" && age >= 0.22);
    if (vaultLayer.current) vaultLayer.current.visible = (phase === "act4_warp_in" && age >= WARP_VAULT_CUTOVER_SECONDS) || phase === "act4_vault" || phase === "act4_warp_out";
    void delta; void projectIndex;
  });
  return <group>
    <group ref={exteriorLayer} visible={phase === "act4_exterior"}><ActFourExterior phase={phase} warpCharge={warpCharge} /></group>
    <group ref={tunnelLayer}><WormholeTunnel phase={phase} /><WormholeLandmarks phase={phase} /><WormholeExitAperture phase={phase} /></group>
    <WarpStreamParticles phase={phase} warpCharge={warpCharge} /><WarpNeedles phase={phase} />
    <group ref={vaultLayer} visible={phase === "act4_vault" || phase === "act4_warp_out"}><TesseractCathedral projectIndex={projectIndex} isFolding={isFolding} /></group>
    <BreachFlash phase={phase} />
  </group>;
}
