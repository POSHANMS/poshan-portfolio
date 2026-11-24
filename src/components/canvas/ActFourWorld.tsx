"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { ActFourPhase } from "@/types/actFour";
import { ACT_FOUR_STAGE_BASIS, ACT_FOUR_WARP_IN_DURATION_MS, WORMHOLE_CURVE, WORMHOLE_PATH_LENGTH, WORMHOLE_TUBE_RADIUS } from "@/animations/scrollCamera";
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
    for (let index = 0; index < particles.length; index += 1) {
      const particle = particles[index];
      const travel = (particle.phaseOffset + motionTime * travelSpeed * particle.speed * 0.16) % 1;
      const depth = THREE.MathUtils.lerp(72, 3, travel);
      const halfHeight = halfHeightAt(depth);
      const halfWidth = halfHeight * aspect;
      const angle = particle.angle + motionTime * 0.11 * particle.speed + Math.sin(motionTime * 0.8 + particle.phaseOffset * 6.28) * particle.curve;
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);
      const tailRadius = Math.max(0.555, particle.radius - tailSpan);
      position.setXYZ(index * 2, cosAngle * halfWidth * tailRadius, sinAngle * halfHeight * tailRadius, -depth);
      position.setXYZ(index * 2 + 1, cosAngle * halfWidth * particle.radius, sinAngle * halfHeight * particle.radius, -depth);
    }
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
    for (let index = 0; index < layout.length; index += 1) {
      const needle = layout[index];
      dummy.position.copy(needle.position);
      dummy.quaternion.copy(needle.quaternion);
      dummy.scale.set(1, 1, needle.length);
      dummy.updateMatrix();
      instances.current?.setMatrixAt(index, dummy.matrix);
    }
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
  const cameraDirection = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }) => {
    if (!mesh.current) return;
    mesh.current.position.copy(camera.position).addScaledVector(camera.getWorldDirection(cameraDirection), 2.4);
    mesh.current.quaternion.copy(camera.quaternion);
  });
  return <mesh ref={mesh} frustumCulled={false} renderOrder={30}><planeGeometry args={[8, 5]} /><shaderMaterial ref={material} uniforms={{ uTime: { value: 0 }, uOpacity: { value: 0 } }} transparent depthTest={false} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false}
    vertexShader={`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`}
    fragmentShader={`uniform float uTime;uniform float uOpacity;varying vec2 vUv;void main(){vec2 p=vUv-0.5;float radial=exp(-dot(p*vec2(0.9,1.15),p*vec2(0.9,1.15))*18.0);float breath=exp(-pow((p.y+sin(uTime*0.42)*0.008)*18.0,2.0))*exp(-abs(p.x)*3.4);float pulse=0.94+0.06*sin(uTime*1.4);vec3 obsidian=vec3(0.0078,0.0039,0.0157);vec3 champagne=vec3(1.0,0.902,0.702);vec3 color=mix(obsidian,champagne,radial*0.32+breath*0.12);float alpha=clamp(radial*0.46+breath*0.12,0.0,0.58)*uOpacity*pulse;gl_FragColor=vec4(color,alpha);}`}
  /></mesh>;
}

const SINGULARITY_DUST_COUNT = 700;
const SEA_WIDTH = 180;
const SEA_DEPTH_SPAN = 150;
const SEA_NEAR_DEPTH = -10;
const SEA_WATERLINE_OFFSET = -4.2;
const SEA_LOCAL_ORIGIN = ACT_FOUR_STAGE_BASIS.origin.clone().addScaledVector(ACT_FOUR_STAGE_BASIS.up, SEA_WATERLINE_OFFSET);
const SEA_CENTER = SEA_LOCAL_ORIGIN.clone().addScaledVector(ACT_FOUR_STAGE_BASIS.forward, SEA_NEAR_DEPTH + SEA_DEPTH_SPAN * 0.5);
const SEA_ORIENTATION = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(
  ACT_FOUR_STAGE_BASIS.right, ACT_FOUR_STAGE_BASIS.forward, ACT_FOUR_STAGE_BASIS.up,
));
const CORONA_CENTER = ACT_FOUR_STAGE_BASIS.origin.clone()
  .addScaledVector(ACT_FOUR_STAGE_BASIS.right, -0.2)
  .addScaledVector(ACT_FOUR_STAGE_BASIS.forward, 54)
  .addScaledVector(ACT_FOUR_STAGE_BASIS.up, SEA_WATERLINE_OFFSET);
const CORONA_ORIENTATION = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(
  ACT_FOUR_STAGE_BASIS.right, ACT_FOUR_STAGE_BASIS.up, ACT_FOUR_STAGE_BASIS.forward.clone().negate(),
));
const ANALYTICAL_ECLIPSE_GLSL = `
  vec4 sampleEclipseSky(vec2 point, float time) {
    float lx = point.x;
    float ly = point.y;
    float R = 10.2;
    float r = length(vec2(lx, ly)) / R;
    float ang = atan(ly, lx);
    float aboveWater = step(0.0, ly) * smoothstep(-0.02, 0.03, ly);

    float upWeight = smoothstep(0.02, 0.78, max(0.0, ly) / R);
    float innerRim = pow(smoothstep(0.46, 0.995, r), 2.1) * (0.45 + 0.55 * upWeight);
    float tightInnerLip = pow(smoothstep(0.86, 0.998, r), 2.8);
    vec3 domeColor = vec3(0.004, 0.001, 0.003)
      + vec3(0.46, 0.045, 0.012) * innerRim
      + vec3(0.72, 0.14, 0.022) * tightInnerLip;
    float domeAlpha = 1.0 - smoothstep(0.990, 1.006, r);

    float dOut = max(0.0, r - 1.0);
    float plasma = 0.92 + 0.08 * sin(ang * 4.0 - time * 0.4) * cos(ang * 3.0 + time * 0.25);
    float lip = exp(-pow(dOut * 16.0, 2.0));
    float innerHalo = exp(-dOut * 5.0) * plasma;
    float midHalo = exp(-dOut * 2.15) * plasma;
    float farMist = exp(-dOut * 1.15);
    float horizonGlaze = exp(-abs(ly) * 0.22) * exp(-abs(lx) * 0.055) * smoothstep(0.95, 1.08, r);

    vec3 coronaColor = vec3(1.00, 0.95, 0.74) * lip * 1.25
      + vec3(1.00, 0.68, 0.16) * innerHalo * 1.05
      + vec3(0.82, 0.34, 0.04) * midHalo * 0.62
      + vec3(0.32, 0.05, 0.01) * farMist * 0.28
      + vec3(0.55, 0.12, 0.02) * horizonGlaze * 0.42;
    coronaColor = min(coronaColor, vec3(1.0));
    float outerAlpha = clamp(lip * 1.25 + innerHalo * 1.05 + midHalo * 0.62
      + farMist * 0.28 + horizonGlaze * 0.42, 0.0, 1.0);
    float outerFade = 1.0 - smoothstep(2.8, 4.6, dOut);
    float edgeFade = (1.0 - smoothstep(40.0, 47.5, abs(lx)))
      * (1.0 - smoothstep(20.0, 27.5, max(ly, 0.0)));
    float alpha = max(domeAlpha, outerAlpha * outerFade) * aboveWater * edgeFade;
    return vec4(mix(coronaColor, domeColor, domeAlpha), alpha);
  }
`;
const SEA_VERTEX_SHADER = `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;
const SEA_FRAGMENT_SHADER = `
  uniform float uTime;
  uniform float uVaultOpacity;
  uniform float uShockwaveTime;
  uniform vec3 uCameraPos;
  uniform vec3 uStageRight;
  uniform vec3 uStageUp;
  uniform vec3 uStageForward;
  uniform vec3 uEclipseCenter;
  uniform vec4 uPointerRipples[6];
  varying vec2 vUv;
  varying vec3 vWorldPos;

  ${ANALYTICAL_ECLIPSE_GLSL}

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float valueNoise2D(vec2 p) {
    vec2 cell = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(cell);
    float b = hash21(cell + vec2(1.0, 0.0));
    float c = hash21(cell + vec2(0.0, 1.0));
    float d = hash21(cell + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float orientedWave(vec2 p, float angle, float frequency, float speed, float time) {
    vec2 direction = vec2(cos(angle), sin(angle));
    return sin(dot(p, direction) * frequency + time * speed);
  }

  float liquidHeight(vec2 xz, float time) {
    float microFade = 1.0 - smoothstep(38.0, 108.0, max(xz.y, 0.0));
    vec2 base = vec2(xz.x * 0.56, xz.y);
    vec2 warp = vec2(
      valueNoise2D(base * 0.18 + vec2(time * 0.018, 3.7)),
      valueNoise2D(base * 0.18 + vec2(-2.9, -time * 0.015))
    ) - 0.5;
    vec2 p = base + warp * 0.86;
    float broad = 0.25 * orientedWave(p, 0.244, 0.24, 0.22, time)
      + 0.19 * orientedWave(p, -0.332, 0.43, -0.28, time)
      + 0.14 * orientedWave(p, 0.541, 0.76, 0.34, time)
      + 0.10 * orientedWave(p, -0.471, 1.18, -0.39, time)
      + 0.065 * orientedWave(p, 0.733, 1.82, 0.48, time) * microFade
      + 0.042 * orientedWave(p, -0.628, 2.55, -0.54, time) * microFade;
    float noiseSwell = (valueNoise2D(p * 0.24 + vec2(time * 0.012, -time * 0.009)) - 0.5) * 0.22;
    float noiseRipples = (valueNoise2D(p * 1.12 + vec2(-time * 0.046, time * 0.038)) - 0.5) * 0.10 * microFade;
    float fineShimmer = (valueNoise2D(p * 2.6 + vec2(time * 0.075, -time * 0.061)) - 0.5) * 0.035 * microFade;
    return broad + noiseSwell + noiseRipples + fineShimmer;
  }

  float rightPoolEnvelope(float r) {
    return (1.0 - smoothstep(4.15, 4.6, r)) * smoothstep(0.25, 0.9, r);
  }

  void main() {
    float x = (vUv.x - 0.5) * 180.0;
    float depth = vUv.y * 150.0 - 10.0;
    vec2 seaXZ = vec2(x, depth);
    float waveAmp = mix(0.43, 0.14, smoothstep(8.0, 82.0, depth));
    float epsilon = 0.055;
    float h = liquidHeight(seaXZ, uTime) * waveAmp;
    float dHx = (liquidHeight(seaXZ + vec2(epsilon, 0.0), uTime)
      - liquidHeight(seaXZ - vec2(epsilon, 0.0), uTime)) / (2.0 * epsilon);
    float dHz = (liquidHeight(seaXZ + vec2(0.0, epsilon), uTime)
      - liquidHeight(seaXZ - vec2(0.0, epsilon), uTime)) / (2.0 * epsilon);

    vec2 sculptureCenter = vec2(6.0, 15.0);
    vec2 sculptureDelta = seaXZ - sculptureCenter;
    float sculptureR = length(sculptureDelta);
    vec2 sculptureDirection = sculptureR > 0.001 ? sculptureDelta / sculptureR : vec2(0.0);
    float sculptureEnvelope = rightPoolEnvelope(sculptureR);
    float ripWave = sin(sculptureR * 4.8 - uTime * 1.15);
    dHx += sculptureDirection.x * ripWave * sculptureEnvelope * 0.24;
    dHz += sculptureDirection.y * ripWave * sculptureEnvelope * 0.24;
    float lightFacing = 0.25 + 0.75 * (1.0 - smoothstep(-0.25, 0.95, sculptureDirection.x));
    float rippleSpecular = pow(max(0.0, ripWave), 10.0) * sculptureEnvelope * (0.28 + 0.55 * lightFacing);

    float pointerEnergy = 0.0;
    vec2 pointerGradient = vec2(0.0);
    for (int i = 0; i < 6; i++) {
      float age = uTime - uPointerRipples[i].z;
      float ringR = age * 4.2;
      vec2 rippleDelta = seaXZ - uPointerRipples[i].xy;
      float dist = max(length(rippleDelta), 0.001);
      float crest = exp(-pow((dist - ringR) / 0.16, 2.0)) * exp(-age * 1.25)
        * step(0.0, age) * (1.0 - smoothstep(1.8, 1.9, age));
      pointerEnergy += crest * uPointerRipples[i].w;
      float crestSlope = -2.0 * (dist - ringR) / (0.16 * 0.16) * crest * uPointerRipples[i].w;
      pointerGradient += rippleDelta / dist * crestSlope;
    }
    dHx += pointerGradient.x * 0.015;
    dHz += pointerGradient.y * 0.015;

    float shockAge = uTime - uShockwaveTime;
    float shockR = shockAge * 18.0;
    float shockDist = length(seaXZ - sculptureCenter);
    float shockCrest = exp(-pow((shockDist - shockR) / 0.28, 2.0)) * exp(-shockAge * 1.6)
      * step(0.0, shockAge) * (1.0 - smoothstep(2.6, 2.9, shockAge));
    vec2 shockDirection = shockDist > 0.001 ? (seaXZ - sculptureCenter) / shockDist : vec2(0.0);
    float shockSlope = -2.0 * (shockDist - shockR) / (0.28 * 0.28) * shockCrest;
    dHx += shockDirection.x * shockSlope * 0.02;
    dHz += shockDirection.y * shockSlope * 0.02;

    vec3 N = normalize(uStageUp - dHx * waveAmp * uStageRight - dHz * waveAmp * uStageForward);
    vec3 surface = vWorldPos + uStageUp * (h + ripWave * sculptureEnvelope * 0.025);
    vec3 V = normalize(surface - uCameraPos);
    vec3 viewToCamera = -V;
    vec3 ray = reflect(V, N);
    float rayUp = dot(ray, uStageUp);
    if (rayUp < 0.001) ray = normalize(ray + uStageUp * (0.001 - rayUp));
    float fresnel = 0.14 + 0.86 * pow(1.0 - max(dot(viewToCamera, N), 0.0), 3.6);

    vec3 reflectedSky = vec3(0.003, 0.002, 0.004);
    float reflectedCoverage = 0.0;
    float planeDenom = dot(ray, uStageForward);
    if (abs(planeDenom) > 0.0001) {
      float hitT = dot(uEclipseCenter - surface, uStageForward) / planeDenom;
      if (hitT > 0.0) {
        vec3 hit = surface + ray * hitT;
        vec3 hitLocal = hit - uEclipseCenter;
        vec2 hitPoint = vec2(dot(hitLocal, uStageRight), dot(hitLocal, uStageUp));
        vec2 blurOffset = clamp(vec2(dHx, dHz) * 0.42, vec2(-0.52), vec2(0.52));
        vec4 reflectionTap0 = sampleEclipseSky(hitPoint, uTime);
        vec4 reflectionTap1 = sampleEclipseSky(hitPoint + blurOffset, uTime);
        vec4 reflectionTap2 = sampleEclipseSky(hitPoint - blurOffset, uTime);
        reflectedCoverage = reflectionTap0.a * 0.50 + reflectionTap1.a * 0.25 + reflectionTap2.a * 0.25;
        reflectedSky = reflectionTap0.rgb * reflectionTap0.a * 0.50
          + reflectionTap1.rgb * reflectionTap1.a * 0.25
          + reflectionTap2.rgb * reflectionTap2.a * 0.25;
        float flankTint = exp(-pow((abs(hitPoint.x) - 10.8) / 2.4, 2.0)) * smoothstep(0.0, 1.0, hitPoint.y);
        reflectedSky += vec3(0.14, 0.012, 0.006) * flankTint * reflectedCoverage;
      }
    }

    float reflectionMask = 1.0 - smoothstep(68.0, 102.0, depth);
    float reflection = fresnel * reflectedCoverage * reflectionMask;
    vec3 reflectedColor = reflectedSky / max(reflectedCoverage, 0.001);
    vec3 lightDirection = normalize(uEclipseCenter - surface);
    float eclipseFacing = max(dot(N, lightDirection), 0.0);
    float wetGlint = pow(max(dot(reflect(-lightDirection, N), viewToCamera), 0.0), 42.0) * eclipseFacing;
    float pointerGlint = pow(max(pointerEnergy, 0.0), 2.0) * 0.035;
    float shockGlint = shockCrest * 0.08;
    vec3 color = vec3(0.003, 0.002, 0.004)
      + reflectedColor * reflection
      + vec3(1.0, 0.94, 0.72) * wetGlint * 0.075
      + vec3(1.0, 0.74, 0.28) * rippleSpecular * 0.16
      + vec3(1.0, 0.82, 0.46) * pointerGlint
      + vec3(1.0, 0.74, 0.28) * shockGlint
      + vec3(0.62, 0.035, 0.045) * shockGlint * 0.35;
    color = min(color, vec3(1.0));

    float edgeX = smoothstep(0.0, 0.08, vUv.x) * (1.0 - smoothstep(0.92, 1.0, vUv.x));
    float farHorizonFade = 1.0 - smoothstep(0.78, 1.0, vUv.y);
    float alpha = edgeX * farHorizonFade * uVaultOpacity;
    gl_FragColor = vec4(color, alpha);
  }
`;
const CORONA_VERTEX_SHADER = `
  varying vec3 vLocalPos;
  void main() {
    vLocalPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const CORONA_FRAGMENT_SHADER = `
  uniform float uTime;
  uniform float uVaultOpacity;
  varying vec3 vLocalPos;
  ${ANALYTICAL_ECLIPSE_GLSL}
  void main() {
    vec4 eclipse = sampleEclipseSky(vLocalPos.xy, uTime);
    gl_FragColor = vec4(eclipse.rgb, eclipse.a * uVaultOpacity);
  }
`;
const DUST_VERTEX_SHADER = `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aSize;
  attribute float aSeed;
  attribute float aOpacity;
  varying vec3 vColor;
  varying float vOpacity;
  void main() {
    vec3 p = position;
    p += vec3(
      sin(uTime * 0.12 + aSeed * 6.28318) * 0.075,
      sin(uTime * 0.11 + aSeed * 4.7) * 0.11,
      cos(uTime * 0.095 + aSeed * 9.1) * 0.10
    );
    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = clamp(aSize * uPixelRatio * (36.0 / max(4.0, -mvPosition.z)), 1.4, 3.4);
    vColor = color;
    vOpacity = aOpacity;
  }
`;
const DUST_FRAGMENT_SHADER = `
  uniform float uVaultOpacity;
  varying vec3 vColor;
  varying float vOpacity;
  void main() {
    float radius = length(gl_PointCoord - 0.5);
    float pin = 1.0 - smoothstep(0.16, 0.5, radius);
    gl_FragColor = vec4(vColor, pin * vOpacity * uVaultOpacity);
  }
`;
const SEA_RIPPLE_COUNT = 6;

function ObsidianMirrorSea({ exitOpacityRef, shockwaveStartedAtRef }: {
  exitOpacityRef: React.RefObject<number>;
  shockwaveStartedAtRef: React.RefObject<number>;
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const rippleSlot = useRef(0);
  const lastSpawnAt = useRef(Number.NEGATIVE_INFINITY);
  const lastHit = useRef(new THREE.Vector2());
  const hasLastHit = useRef(false);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uVaultOpacity: { value: 1 },
    uShockwaveTime: { value: -10 },
    uCameraPos: { value: new THREE.Vector3() },
    uStageRight: { value: ACT_FOUR_STAGE_BASIS.right },
    uStageUp: { value: ACT_FOUR_STAGE_BASIS.up },
    uStageForward: { value: ACT_FOUR_STAGE_BASIS.forward },
    uEclipseCenter: { value: CORONA_CENTER },
    uPointerRipples: { value: Array.from({ length: SEA_RIPPLE_COUNT }, () => new THREE.Vector4(-1000, -1000, -100, 0)) },
  }), []);
  const hitPoint = useMemo(() => new THREE.Vector3(), []);
  const hitOffset = useMemo(() => new THREE.Vector3(), []);
  const seaPlane = useMemo(
    () => new THREE.Plane().setFromNormalAndCoplanarPoint(ACT_FOUR_STAGE_BASIS.up, SEA_LOCAL_ORIGIN),
    [],
  );
  useFrame(({ clock, pointer, camera, raycaster }) => {
    const time = clock.getElapsedTime();
    if (!materialRef.current) return;
    uniforms.uTime.value = time;
    uniforms.uVaultOpacity.value = exitOpacityRef.current;
    uniforms.uCameraPos.value.copy(camera.position);
    const shockStart = shockwaveStartedAtRef.current;
    const shockAge = shockStart < 0 ? -10 : performance.now() / 1000 - shockStart;
    uniforms.uShockwaveTime.value = time - shockAge;
    raycaster.setFromCamera(pointer, camera);
    if (!raycaster.ray.intersectPlane(seaPlane, hitPoint)) { hasLastHit.current = false; return; }
    hitOffset.subVectors(hitPoint, SEA_LOCAL_ORIGIN);
    const localX = hitOffset.dot(ACT_FOUR_STAGE_BASIS.right);
    const localDepth = hitOffset.dot(ACT_FOUR_STAGE_BASIS.forward);
    const dx = localX - lastHit.current.x;
    const dy = localDepth - lastHit.current.y;
    if (!hasLastHit.current) {
      lastHit.current.set(localX, localDepth);
      hasLastHit.current = true;
      return;
    }
    const movedEnough = dx * dx + dy * dy > 1.44;
    if (movedEnough && time - lastSpawnAt.current > 0.09) {
      uniforms.uPointerRipples.value[rippleSlot.current].set(localX, localDepth, time, 0.72);
      rippleSlot.current = (rippleSlot.current + 1) % SEA_RIPPLE_COUNT;
      lastHit.current.set(localX, localDepth);
      lastSpawnAt.current = time;
      hasLastHit.current = true;
    }
  });
  return (
    <mesh position={SEA_CENTER} quaternion={SEA_ORIENTATION} scale={[1, SEA_DEPTH_SPAN / SEA_WIDTH, 1]} frustumCulled={false} renderOrder={2}>
      <planeGeometry args={[SEA_WIDTH, SEA_WIDTH, 1, 1]} />
      <shaderMaterial ref={materialRef} uniforms={uniforms} transparent depthTest depthWrite={false} blending={THREE.NormalBlending} toneMapped={false} vertexShader={SEA_VERTEX_SHADER} fragmentShader={SEA_FRAGMENT_SHADER} />
    </mesh>
  );
}

function HorizonEclipseCorona({ exitOpacityRef }: { exitOpacityRef: React.RefObject<number> }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uVaultOpacity: { value: 1 } }), []);
  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.getElapsedTime();
    uniforms.uVaultOpacity.value = exitOpacityRef.current;
  });
  return (
    <mesh position={CORONA_CENTER} quaternion={CORONA_ORIENTATION} frustumCulled={false} renderOrder={2}>
      <planeGeometry args={[96, 56, 1, 1]} />
      <shaderMaterial ref={materialRef} uniforms={uniforms} transparent depthTest depthWrite={false} blending={THREE.NormalBlending} toneMapped={false} vertexShader={CORONA_VERTEX_SHADER} fragmentShader={CORONA_FRAGMENT_SHADER} />
    </mesh>
  );
}

function CosmicDustVeil({ exitOpacityRef }: { exitOpacityRef: React.RefObject<number> }) {
  const geometry = useMemo(() => {
    const positions = new Float32Array(SINGULARITY_DUST_COUNT * 3);
    const colors = new Float32Array(SINGULARITY_DUST_COUNT * 3);
    const sizes = new Float32Array(SINGULARITY_DUST_COUNT);
    const seeds = new Float32Array(SINGULARITY_DUST_COUNT);
    const opacities = new Float32Array(SINGULARITY_DUST_COUNT);
    for (let index = 0; index < SINGULARITY_DUST_COUNT; index += 1) {
      let x = 2.8;
      let up = -2.8;
      let depth = 10.0;
      let domeDistance = 0;
      for (let attempt = 0; attempt < 40; attempt += 1) {
        x = 2.8 + seeded(index + attempt * SINGULARITY_DUST_COUNT, 523) * (13.5 - 2.8);
        up = -2.8 + seeded(index + attempt * SINGULARITY_DUST_COUNT, 527) * (7.5 + 2.8);
        depth = 10.0 + seeded(index + attempt * SINGULARITY_DUST_COUNT, 521) * 16.0;
        domeDistance = Math.hypot(x + 0.2, up);
        if (up < 0.0 || domeDistance >= 11.4) break;
      }
      if (up >= 0.0 && domeDistance < 11.4) {
        x = 13.5;
        up = 7.5;
        domeDistance = Math.hypot(x + 0.2, up);
      }
      positions.set([
        ACT_FOUR_STAGE_BASIS.origin.x + ACT_FOUR_STAGE_BASIS.right.x * x + ACT_FOUR_STAGE_BASIS.forward.x * depth + ACT_FOUR_STAGE_BASIS.up.x * (SEA_WATERLINE_OFFSET + up),
        ACT_FOUR_STAGE_BASIS.origin.y + ACT_FOUR_STAGE_BASIS.right.y * x + ACT_FOUR_STAGE_BASIS.forward.y * depth + ACT_FOUR_STAGE_BASIS.up.y * (SEA_WATERLINE_OFFSET + up),
        ACT_FOUR_STAGE_BASIS.origin.z + ACT_FOUR_STAGE_BASIS.right.z * x + ACT_FOUR_STAGE_BASIS.forward.z * depth + ACT_FOUR_STAGE_BASIS.up.z * (SEA_WATERLINE_OFFSET + up),
      ], index * 3);
      const tint = seeded(index, 529);
      const color = new THREE.Color(tint > 0.982 ? "#B80A18" : tint > 0.82 ? "#FFF4D2" : "#FFBE45");
      colors.set([color.r, color.g, color.b], index * 3);
      sizes[index] = 0.45 + seeded(index, 531);
      seeds[index] = seeded(index, 533);
      const edgeFade = Math.min(
        smoothstep(2.8, 4.0, x),
        1.0 - smoothstep(12.4, 13.5, x),
        smoothstep(-2.8, -1.5, up),
        1.0 - smoothstep(6.2, 7.5, up),
        smoothstep(10.0, 12.5, depth),
        1.0 - smoothstep(23.5, 26.0, depth),
        up >= 0.0 ? smoothstep(11.4, 13.2, domeDistance) : 1.0,
      );
      opacities[index] = (0.52 + seeded(index, 535) * 0.38) * edgeFade;
    }
    const result = new THREE.BufferGeometry();
    result.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    result.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    result.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    result.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    result.setAttribute("aOpacity", new THREE.BufferAttribute(opacities, 1));
    return result;
  }, []);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { gl } = useThree();
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uPixelRatio: { value: Math.min(gl.getPixelRatio(), 1.5) },
    uVaultOpacity: { value: 1 },
  }), [gl]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.getElapsedTime();
    uniforms.uPixelRatio.value = Math.min(gl.getPixelRatio(), 1.5);
    uniforms.uVaultOpacity.value = exitOpacityRef.current;
  });
  return (
    <points geometry={geometry} frustumCulled={false} renderOrder={3}>
      <shaderMaterial ref={materialRef} uniforms={uniforms} vertexColors transparent depthTest depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} vertexShader={DUST_VERTEX_SHADER} fragmentShader={DUST_FRAGMENT_SHADER} />
    </points>
  );
}

function ObsidianSingularityInterior({ exitOpacityRef, shockwaveStartedAtRef }: {
  exitOpacityRef: React.RefObject<number>;
  shockwaveStartedAtRef: React.RefObject<number>;
}) {
  return (
    <group>
      <ObsidianMirrorSea exitOpacityRef={exitOpacityRef} shockwaveStartedAtRef={shockwaveStartedAtRef} />
      <HorizonEclipseCorona exitOpacityRef={exitOpacityRef} />
      <CosmicDustVeil exitOpacityRef={exitOpacityRef} />
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
  const vaultMaterials = useRef<THREE.Material[]>([]);
  const vaultLights = useRef<(THREE.PointLight | THREE.AmbientLight)[]>([]);
  const previousProjectIndex = useRef(projectIndex);
  const shockwaveStartedAtRef = useRef(-1);
  useEffect(() => {
    if (previousProjectIndex.current === projectIndex) return;
    previousProjectIndex.current = projectIndex;
    shockwaveStartedAtRef.current = performance.now() / 1000;
  }, [projectIndex]);
  useEffect(() => { phaseStartedAt.current = performance.now(); previousPhase.current = phase; }, [phase]);
  useEffect(() => {
    const vault = vaultLayer.current;
    if (!vault) return;
    const materials: THREE.Material[] = [];
    const lights: (THREE.PointLight | THREE.AmbientLight)[] = [];
    vault.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points) {
        const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
        for (let index = 0; index < objectMaterials.length; index += 1) materials.push(objectMaterials[index]);
      }
      if (object instanceof THREE.PointLight || object instanceof THREE.AmbientLight) lights.push(object);
    });
    vaultMaterials.current = materials;
    vaultLights.current = lights;
    return () => { vaultMaterials.current = []; vaultLights.current = []; };
  }, []);
  useFrame(() => {
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
      for (let index = 0; index < vaultMaterials.current.length; index += 1) {
        const material = vaultMaterials.current[index];
        if (material instanceof THREE.ShaderMaterial && (material.uniforms.uVaultOpacity || material.uniforms.uExitOpacity)) {
          if (material.uniforms.uVaultOpacity) material.uniforms.uVaultOpacity.value = vaultOpacity;
          if (material.uniforms.uExitOpacity) material.uniforms.uExitOpacity.value = vaultOpacity;
          continue;
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
      }
      for (let index = 0; index < vaultLights.current.length; index += 1) {
        const light = vaultLights.current[index];
        const savedIntensity = light.userData.actFourExitFadeIntensity as number | undefined;
        if (isWarpingOut && vaultOpacity < 1) {
          if (savedIntensity === undefined) light.userData.actFourExitFadeIntensity = light.intensity;
          light.intensity = (savedIntensity ?? light.intensity) * vaultOpacity;
        } else if (savedIntensity !== undefined) {
          light.intensity = savedIntensity;
          delete light.userData.actFourExitFadeIntensity;
        }
      }
    }
  });
  return <group>
    <group ref={exteriorLayer} visible={phase === "act4_exterior"}><ActFourExterior phase={phase} warpCharge={warpCharge} /></group>
    <group ref={tunnelLayer}><WormholeTunnel phase={phase} /><WormholeLandmarks phase={phase} /></group>
    <WarpStreamParticles phase={phase} warpCharge={warpCharge} /><WarpNeedles phase={phase} />
    <group ref={vaultLayer} visible={phase === "act4_vault" || phase === "act4_warp_out"}><ObsidianSingularityInterior exitOpacityRef={vaultOpacityRef} shockwaveStartedAtRef={shockwaveStartedAtRef} /></group>
    <BreachFlash phase={phase} />
  </group>;
}
