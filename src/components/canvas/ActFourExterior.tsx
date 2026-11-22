"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { ActFourPhase } from "@/types/actFour";
import { ACT_FOUR_CORE_POSITION } from "@/animations/actFourChoreography";

const SPARK_COUNT = 250;
type ChargeSource = number | { current: number };
const readCharge = (charge: ChargeSource) => typeof charge === "number" ? charge : charge.current;

function unit(index: number, salt: number) {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

const horizonVertex = `
  varying vec3 vNormalView;
  varying vec3 vViewPosition;
  varying vec3 vLocalPosition;
  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vNormalView = normalize(normalMatrix * normal);
    vViewPosition = -viewPosition.xyz;
    vLocalPosition = position;
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const horizonFragment = `
  uniform float uTime;
  uniform float uCharge;
  varying vec3 vNormalView;
  varying vec3 vViewPosition;
  varying vec3 vLocalPosition;
  float hash31(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }
  float noise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash31(i), b = hash31(i + vec3(1.0, 0.0, 0.0));
    float c = hash31(i + vec3(0.0, 1.0, 0.0)), d = hash31(i + vec3(1.0, 1.0, 0.0));
    float e = hash31(i + vec3(0.0, 0.0, 1.0)), f1 = hash31(i + vec3(1.0, 0.0, 1.0));
    float g = hash31(i + vec3(0.0, 1.0, 1.0)), h = hash31(i + vec3(1.0, 1.0, 1.0));
    return mix(mix(mix(a,b,f.x),mix(c,d,f.x),f.y),mix(mix(e,f1,f.x),mix(g,h,f.x),f.y),f.z);
  }
  void main() {
    vec3 n = normalize(vNormalView);
    vec3 v = normalize(vViewPosition);
    float fresnel = pow(1.0 - max(dot(n, v), 0.0), 4.5);
    float turbulence = noise3(vLocalPosition * 5.5 + vec3(0.0, uTime * 0.04, -uTime * 0.025));
    float photonRing = smoothstep(0.91, 0.985, fresnel + (turbulence - 0.5) * 0.008);
    float edgeGlow = exp(-pow((1.0 - fresnel) * 28.0, 2.0));
    float pulse = 0.94 + 0.06 * sin(uTime * (0.7 + uCharge * 4.0) + turbulence * 4.0);
    vec3 gold = vec3(1.0, 0.93, 0.76);
    vec3 crimson = vec3(0.85, 0.018, 0.075);
    vec3 color = mix(crimson, gold, smoothstep(0.76, 0.94, fresnel));
    float alpha = (photonRing * 0.9 + edgeGlow * 0.16) * pulse;
    gl_FragColor = vec4(color * (2.1 + uCharge * 3.4), alpha);
  }
`;

const diskVertex = `
  varying vec2 vPosition;
  varying vec2 vUv;
  void main() {
    vPosition = position.xy;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Hash, value noise and five FBM octaves create turbulent gas in polar space.
// The polar angle advances with time; the radius-dependent drift keeps inner
// material orbiting faster than the outer filaments.
const diskFragment = `
  uniform float uTime;
  uniform float uCharge;
  uniform float uOpacity;
  uniform float uSwirlSpeed;
  uniform float uInnerRatio;
  uniform float uOuterRadius;
  varying vec2 vPosition;
  varying vec2 vUv;
  float hash21(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453123); }
  float noise21(vec2 p) {
    vec2 i=floor(p), f=fract(p);
    f=f*f*(3.0-2.0*f);
    return mix(mix(hash21(i),hash21(i+vec2(1.0,0.0)),f.x),mix(hash21(i+vec2(0.0,1.0)),hash21(i+1.0),f.x),f.y);
  }
  float fbm(vec2 p) {
    float value=0.0, amplitude=0.5;
    for(int octave=0;octave<5;octave++) {
      value += amplitude * noise21(p);
      p = mat2(1.62,-1.18,1.18,1.62) * p + vec2(7.1,3.7);
      amplitude *= 0.5;
    }
    return value;
  }
  void main() {
    vec2 p=vPosition/max(uOuterRadius,0.001);
    float r=length(p);
    float theta=atan(p.y,p.x);
    float orbit=1.0/sqrt(max(r,0.16));
    float timeAngle=uTime*uSwirlSpeed*(0.2+0.12*orbit);
    vec2 polar=vec2(theta*1.7-r*2.6-timeAngle*0.35, r*7.0);
    float broad=fbm(polar*0.76+vec2(-uTime*0.055,uTime*0.025));
    float fine=fbm(polar*1.75+vec2(uTime*0.075,-uTime*0.045));
    float armPhase=theta*3.0-r*17.0-timeAngle*0.5+(broad-0.5)*2.8;
    float arm=pow(max(0.0,0.5+0.5*cos(armPhase)),3.0);
    float cloudField=broad*0.58+fine*0.27+arm*0.3;
    float cloud=smoothstep(0.31,0.67,cloudField);
    float inner=uInnerRatio;
    float outerFade=1.0-smoothstep(0.28,0.49,r);
    float innerFade=smoothstep(inner-0.035,inner+0.055,r);
    float filaments=0.48+0.52*pow(max(0.0,0.5+0.5*sin(armPhase*2.0+broad*8.0+uTime*(0.26+orbit*0.14))),2.0);
    float gas=(0.08+cloud*0.72+arm*0.18)*mix(0.72,1.0,filaments)*(0.7+fine*0.5);
    float innerHeat=1.0-smoothstep(inner+0.025,inner+0.105,r);
    vec3 whiteGold=vec3(1.0,0.9569,0.8235);
    vec3 amber=vec3(1.0,0.5333,0.1333);
    vec3 ember=vec3(0.9020,0.2706,0.0627);
    vec3 deepCrimson=vec3(0.4902,0.0549,0.1333);
    float plasma=smoothstep(0.26,0.78,cloud+arm*0.22);
    vec3 color=mix(deepCrimson,ember,plasma);
    color=mix(color,amber,smoothstep(0.38,0.82,gas+arm*0.24));
    color=mix(color,whiteGold,innerHeat*0.88);
    // Relativistic beaming: the approaching left side is about 25% hotter.
    float doppler=0.82+0.28*smoothstep(-0.15,0.85,-p.x);
    float chargeHeat=1.0+uCharge*1.2;
    float alpha=gas*innerFade*outerFade*uOpacity*doppler*(0.78+uCharge*0.12);
    if(alpha<0.012) discard;
    gl_FragColor=vec4(color*chargeHeat*(0.24+gas*0.24),alpha);
  }
`;

const lensingFragment = `
  uniform float uTime;
  uniform float uCharge;
  uniform float uCoreRadius;
  varying vec2 vUv;
  float hash21(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  float noise21(vec2 p) {
    vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(hash21(i),hash21(i+vec2(1.0,0.0)),f.x),mix(hash21(i+vec2(0.0,1.0)),hash21(i+1.0),f.x),f.y);
  }
  void main() {
    vec2 p=(vUv-0.5)*vec2(uCoreRadius*6.2,uCoreRadius*4.8);
    float angle=atan(p.y,p.x);
    float radius=length(p);
    float warp=noise21(vec2(angle*4.0+uTime*0.08,radius*0.7))*0.045;
    float photon=exp(-pow((radius-(uCoreRadius+0.12+warp))*30.0,2.0));
    float arcRadius=uCoreRadius+0.40+warp*1.6;
    float arc=exp(-pow((radius-arcRadius)*8.5,2.0));
    float crown=smoothstep(0.40,0.82,abs(p.y)/max(radius,0.001));
    float upperLowerArc=arc*crown;
    float asymmetry=0.8+0.2*smoothstep(0.0,0.9,-p.x);
    vec3 gold=vec3(1.0,0.9569,0.8235);
    vec3 amber=vec3(1.0,0.5333,0.1333);
    vec3 color=mix(amber,gold,clamp(photon+upperLowerArc*0.6,0.0,1.0));
    float alpha=(photon*0.82+upperLowerArc*0.62)*asymmetry*(0.82+uCharge*1.5);
    gl_FragColor=vec4(color,alpha);
  }
`;

export function EventHorizon({ radius = 2.1, charge }: { radius?: number; charge: ChargeSource }) {
  const ring = useRef<THREE.ShaderMaterial>(null);
  useFrame(({ clock }) => {
    if (!ring.current) return;
    ring.current.uniforms.uTime.value = clock.getElapsedTime();
    ring.current.uniforms.uCharge.value = readCharge(charge);
  });
  return (
    <group>
      <mesh>
        <sphereGeometry args={[radius, 96, 64]} />
        <meshBasicMaterial color="#000000" toneMapped={false} />
      </mesh>
      <mesh scale={1.012}>
        <sphereGeometry args={[radius, 96, 64]} />
        <shaderMaterial ref={ring} vertexShader={horizonVertex} fragmentShader={horizonFragment} uniforms={{ uTime: { value: 0 }, uCharge: { value: readCharge(charge) } }} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function AccretionPlasmaDisk({
  innerRadius,
  outerRadius,
  charge,
  active = true,
}: {
  innerRadius: number;
  outerRadius: number;
  charge: ChargeSource;
  active?: boolean;
}) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uCharge: { value: 0 },
    uOpacity: { value: 0 },
    uSwirlSpeed: { value: 1 },
    uInnerRatio: { value: innerRadius / outerRadius },
    uOuterRadius: { value: outerRadius },
  }), [innerRadius, outerRadius]);
  useFrame(({ clock }, delta) => {
    if (!material.current) return;
    const time = clock.getElapsedTime();
    material.current.uniforms.uTime.value = time;
    const liveCharge = readCharge(charge);
    material.current.uniforms.uCharge.value = THREE.MathUtils.damp(material.current.uniforms.uCharge.value, liveCharge, 5, delta);
    material.current.uniforms.uOpacity.value = THREE.MathUtils.damp(material.current.uniforms.uOpacity.value, active ? 1 : 0, 4, delta);
    material.current.uniforms.uSwirlSpeed.value = THREE.MathUtils.damp(material.current.uniforms.uSwirlSpeed.value, 1 + liveCharge * 5, 4, delta);
  });
  return (
    // The XY disk faces the scene camera; the parent applies the diagonal
    // 0.34 / -0.36 rad cant so its broad gaseous face remains readable.
    <group visible={active}>
      <mesh frustumCulled={false}>
        <planeGeometry args={[outerRadius * 2, outerRadius * 2]} />
        <shaderMaterial ref={material} vertexShader={diskVertex} fragmentShader={diskFragment} uniforms={uniforms} transparent blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <PhotonSparks innerRadius={innerRadius} outerRadius={outerRadius} charge={charge} active={active} />
    </group>
  );
}

function PhotonSparks({ innerRadius, outerRadius, charge, active }: { innerRadius: number; outerRadius: number; charge: ChargeSource; active: boolean }) {
  const points = useRef<THREE.Points>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const attributes = useMemo(() => {
    const positions = new Float32Array(SPARK_COUNT * 3);
    const phases = new Float32Array(SPARK_COUNT);
    const sizes = new Float32Array(SPARK_COUNT);
    for (let i = 0; i < SPARK_COUNT; i += 1) {
      const radius = THREE.MathUtils.lerp(innerRadius, outerRadius, unit(i, 1));
      const angle = unit(i, 2) * Math.PI * 2;
      positions.set([Math.cos(angle) * radius, (unit(i, 3) - 0.5) * outerRadius * 0.018, Math.sin(angle) * radius], i * 3);
      phases[i] = unit(i, 4) * Math.PI * 2;
      sizes[i] = 1.1 + unit(i, 5) * 2.1;
    }
    return { positions, phases, sizes };
  }, [innerRadius, outerRadius]);
  const sparkUniforms = useMemo(() => ({ uTime: { value: 0 }, uCharge: { value: 0 }, uOpacity: { value: 0 } }), []);
  useFrame(({ clock }, delta) => {
    if (!points.current || !material.current) return;
    material.current.uniforms.uTime.value = clock.getElapsedTime();
    const liveCharge = readCharge(charge);
    material.current.uniforms.uCharge.value = THREE.MathUtils.damp(material.current.uniforms.uCharge.value, liveCharge, 5, delta);
    material.current.uniforms.uOpacity.value = THREE.MathUtils.damp(material.current.uniforms.uOpacity.value, active ? 0.92 : 0, 4, delta);
      // Individual photon positions are orbited in the vertex shader; the disk group stays locked.
  });
  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[attributes.positions, 3]} />
        <bufferAttribute attach="attributes-aPhase" args={[attributes.phases, 1]} />
        <bufferAttribute attach="attributes-aSize" args={[attributes.sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial ref={material} uniforms={sparkUniforms} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false}
        vertexShader={`attribute float aPhase; attribute float aSize; uniform float uTime; uniform float uCharge; varying float vGlow; void main(){ vec3 p=position; float r=length(p.xz); float a=atan(p.z,p.x)+uTime*(0.12+0.32/sqrt(max(r,1.0)))*(1.0+uCharge*4.0)+aPhase*0.08; p.x=cos(a)*r; p.z=sin(a)*r; p.y+=sin(aPhase+uTime*1.4)*0.018; vec4 mv=modelViewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mv; gl_PointSize=clamp(aSize*(150.0/max(1.0,-mv.z))*(1.0+uCharge*0.55),0.8,3.5); vGlow=0.55+0.45*sin(aPhase+uTime*2.2); }`}
        fragmentShader={`uniform float uOpacity; varying float vGlow; void main(){ float d=length(gl_PointCoord-0.5); float core=1.0-smoothstep(0.12,0.5,d); if(core<0.01) discard; gl_FragColor=vec4(1.0,0.74+0.22*vGlow,0.52,core*uOpacity);}`}
      />
    </points>
  );
}

function LensingHalo({ charge, coreRadius = 2.1, showArcs = true }: { charge: ChargeSource; coreRadius?: number; showArcs?: boolean }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const arcGeometry = useMemo(() => showArcs && coreRadius > 5 ? [
    { rx: coreRadius * 1.16, ry: coreRadius * 1.58, z: -coreRadius * 0.12, tube: Math.max(0.018, coreRadius * 0.018) },
    { rx: coreRadius * 1.34, ry: coreRadius * 1.86, z: coreRadius * 0.06, tube: Math.max(0.012, coreRadius * 0.009) },
  ].map(({ rx, ry, z, tube }) => {
    const points = Array.from({ length: 129 }, (_, index) => {
      const angle = index / 128 * Math.PI * 2;
      return new THREE.Vector3(Math.cos(angle) * rx, Math.sin(angle) * ry, z + Math.sin(angle * 2) * coreRadius * 0.035);
    });
    const path = new THREE.CatmullRomCurve3(points, true, "centripetal");
    return new THREE.TubeGeometry(path, 256, tube, 8, true);
  }) : [], [coreRadius, showArcs]);
  useFrame(({ clock }) => {
    if (!material.current) return;
    material.current.uniforms.uTime.value = clock.getElapsedTime();
    material.current.uniforms.uCharge.value = readCharge(charge);
  });
  return (
    <group>
      <mesh position={[0, 0, -coreRadius - 0.08]} frustumCulled={false} renderOrder={-1}>
        <planeGeometry args={[coreRadius * 6.2, coreRadius * 4.8]} />
        <shaderMaterial ref={material} vertexShader={`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`} fragmentShader={lensingFragment} uniforms={{ uTime: { value: 0 }, uCharge: { value: readCharge(charge) }, uCoreRadius: { value: coreRadius } }} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      {arcGeometry.map((geometry, index) => <mesh key={index} geometry={geometry} renderOrder={index + 1}>
        <meshBasicMaterial color={index === 0 ? "#fff0c9" : "#ff8c42"} transparent opacity={index === 0 ? 0.78 : 0.38} blending={THREE.AdditiveBlending} depthTest depthWrite={false} toneMapped={false} />
      </mesh>)}
    </group>
  );
}

function ContainmentRing({ index, charge, coreRadius = 2.1 }: { index: number; charge: ChargeSource; coreRadius?: number }) {
  const metal = useRef<THREE.MeshStandardMaterial>(null);
  const axis = useMemo(() => [new THREE.Euler(0.34, 0.02, 0.08), new THREE.Euler(1.13, 0.7, 0.38), new THREE.Euler(0.68, 1.18, -0.55)][index], [index]);
  useFrame(() => { if (metal.current) metal.current.emissiveIntensity = 0.3 + readCharge(charge) * 0.48; });
  const ringRadius = coreRadius * (1.22 + index * 0.17);
  return (
    <group rotation={axis}>
      <mesh>
        <torusGeometry args={[ringRadius, Math.max(0.018, coreRadius * 0.009), 8, 280]} />
        <meshStandardMaterial ref={metal} color={index === 1 ? "#625044" : "#24151a"} metalness={0.97} roughness={0.2} emissive="#5b1c16" emissiveIntensity={0.3} />
      </mesh>
      <mesh>
        <torusGeometry args={[ringRadius, Math.max(0.008, coreRadius * 0.0038), 5, 280]} />
        <meshBasicMaterial color={index === 1 ? "#ffbd7a" : "#a92b36"} transparent opacity={index === 1 ? 0.5 : 0.34} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

function AnamorphicFlare({ charge }: { charge: ChargeSource }) {
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  useFrame(({ camera, clock }) => {
    if (!group.current || !material.current) return;
    group.current.position.set(0, 0, 2.24);
    group.current.quaternion.copy(camera.quaternion);
    const angle = Math.abs(camera.getWorldDirection(new THREE.Vector3()).z);
    group.current.scale.set(1, 0.72 + angle * 0.28, 1);
    material.current.uniforms.uTime.value = clock.getElapsedTime();
    material.current.uniforms.uOpacity.value = 0.1 + readCharge(charge) * 0.18;
  });
  return <group ref={group}><mesh renderOrder={12}><planeGeometry args={[7.2, 0.9]} /><shaderMaterial ref={material} transparent depthTest={false} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} uniforms={{ uTime: { value: 0 }, uOpacity: { value: 0.1 } }} vertexShader="varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}" fragmentShader={`uniform float uTime; uniform float uOpacity; varying vec2 vUv; void main(){vec2 p=vUv-0.5; float beam=exp(-abs(p.y)*42.0)*exp(-abs(p.x)*2.6); float glint=exp(-length(p*vec2(1.2,6.0))*15.0); vec3 c=mix(vec3(0.35,0.5,1.0),vec3(1.0,0.48,0.22),smoothstep(-0.45,0.42,p.x)); float pulse=0.94+0.06*sin(uTime*1.4); gl_FragColor=vec4(c,(beam*0.32+glint*0.18)*uOpacity*pulse);}`} /></mesh></group>;
}

function LensDust({ charge, active }: { charge: ChargeSource; active: boolean }) {
  const group = useRef<THREE.Group>(null);
  const instances = useRef<THREE.InstancedMesh>(null);
  const seeds = useMemo(() => Array.from({ length: 42 }, (_, index) => ({
    x: (unit(index, 41) - 0.5) * 8.6,
    y: (unit(index, 42) - 0.5) * 5.4,
    z: -0.45 - unit(index, 43) * 2.1,
    size: 0.012 + unit(index, 44) * 0.04,
    phase: unit(index, 45) * Math.PI * 2,
    speed: 0.025 + unit(index, 46) * 0.08,
    tint: new THREE.Color().setHSL(0.075 + unit(index, 47) * 0.04, 0.62, 0.64 + unit(index, 48) * 0.2),
  })), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const dustMaterial = useMemo(() => new THREE.ShaderMaterial({
    transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 }, uCharge: { value: 0 } },
    vertexShader: `varying vec2 vUv; varying vec3 vColor; void main(){vUv=uv;vColor=instanceColor;vec4 mv=modelViewMatrix*instanceMatrix*vec4(position,1.0);gl_Position=projectionMatrix*mv;}`,
    fragmentShader: `uniform float uTime; uniform float uOpacity; uniform float uCharge; varying vec2 vUv; varying vec3 vColor; void main(){vec2 p=vUv-0.5; float d=length(p*vec2(1.0,0.86)); float halo=exp(-d*9.0); float core=exp(-d*30.0); float shimmer=0.76+0.24*sin(uTime*1.7+d*16.0); float a=(halo*0.28+core*0.72)*uOpacity*shimmer*(0.52+uCharge*0.45); gl_FragColor=vec4(vColor*(0.72+core*0.8),a);}`,
  }), []);
  useFrame(({ camera, clock }, delta) => {
    if (!group.current || !instances.current) return;
    group.current.position.copy(camera.position);
    group.current.quaternion.copy(camera.quaternion);
    const t = clock.getElapsedTime();
    for (let index = 0; index < seeds.length; index += 1) {
      const mote = seeds[index];
      dummy.position.set(mote.x + Math.sin(t * mote.speed + mote.phase) * 0.12, mote.y + Math.cos(t * mote.speed * 0.8 + mote.phase) * 0.09, mote.z);
      const liveCharge = readCharge(charge);
      const scale = mote.size * (0.76 + 0.24 * Math.sin(t * 0.8 + mote.phase)) * (1 + liveCharge * 0.16);
      dummy.scale.set(scale, scale, 1);
      dummy.rotation.z = mote.phase + t * 0.02;
      dummy.updateMatrix();
      instances.current.setMatrixAt(index, dummy.matrix);
      instances.current.setColorAt(index, mote.tint);
    }
    instances.current.instanceMatrix.needsUpdate = true;
    if (instances.current.instanceColor) instances.current.instanceColor.needsUpdate = true;
    dustMaterial.uniforms.uTime.value = t;
    dustMaterial.uniforms.uOpacity.value = THREE.MathUtils.damp(dustMaterial.uniforms.uOpacity.value, active ? 0.7 : 0, 4, delta);
    dustMaterial.uniforms.uCharge.value = readCharge(charge);
  });
  return <group ref={group} visible={active}><instancedMesh ref={(mesh) => {
    instances.current = mesh;
    if (mesh && mesh.instanceColor === null) {
      mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(seeds.length * 3).fill(1), 3);
    }
  }} args={[undefined, undefined, seeds.length]} frustumCulled={false}><planeGeometry args={[1,1]} /><primitive object={dustMaterial} attach="material" /></instancedMesh></group>;
}

// Exterior Gargantua is rendered as one camera-facing raymarch surface. The
// ray is bent toward the shadow by a Schwarzschild-inspired weak-field term;
// every ray then samples the tilted, differentially rotating plasma disk.
const exteriorVertex = `
  uniform mat4 uWorldToLocal;
  varying vec3 vPlanePoint;
  varying vec2 vQuadUv;
  void main() {
    vec4 worldPoint = modelMatrix * vec4(position, 1.0);
    vec4 localPoint = uWorldToLocal * worldPoint;
    vPlanePoint = localPoint.xyz;
    vQuadUv = position.xy * 0.5 + 0.5;
    gl_Position = projectionMatrix * viewMatrix * worldPoint;
  }
`;

const exteriorFragment = `
  uniform float uTime;
  uniform float uFlowPhase;
  uniform float uCharge;
  uniform float uDiskTilt;
  uniform vec3 uCameraLocal;
  uniform vec2 uPlaneSize;
  uniform vec2 uPointer;
  varying vec3 vPlanePoint;
  varying vec2 vQuadUv;

  const float SHADOW_RADIUS = 1.85;
  const float DISK_INNER = 2.02;
  const float DISK_OUTER = 5.4;

  float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float noise21(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
               mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.52;
    for (int octave = 0; octave < 4; octave++) {
      value += noise21(p) * amplitude;
      p = mat2(1.62, -1.18, 1.18, 1.62) * p + vec2(7.1, 3.7);
      amplitude *= 0.48;
    }
    return value;
  }
  vec3 rotateDisk(vec3 p) {
    float cz = cos(-0.314), sz = sin(-0.314);
    p = vec3(cz * p.x - sz * p.y, sz * p.x + cz * p.y, p.z);
    float cx = cos(0.23), sx = sin(0.23);
    return vec3(p.x, cx * p.y - sx * p.z, sx * p.y + cx * p.z);
  }
  vec3 filmic(vec3 x) {
    // ACES fitted curve: (x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14).
    return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
  }

  void main() {
    {
    // Stable screen-space silhouette, with the raymarch pass below retained
    // for the capture/lensing field. Keep the shadow geometry fixed; only its
    // plasma field and lensing cues respond to time, pointer, and warp charge.
    vec2 p = (vQuadUv - 0.5) * 2.0;
    float tilt = uDiskTilt;
    float ca = cos(tilt), sa = sin(tilt);
    vec2 diskUv = vec2(ca * p.x - sa * p.y, sa * p.x + ca * p.y);
    float charge = clamp(uCharge, 0.0, 1.0);
    float chargeShear = pow(charge, 1.8);
    // Pointer parallax shears only the plasma sampling coordinates; the
    // event-horizon silhouette remains centered and locked in place.
    float yaw = uPointer.x * 0.0610865;
    float pitch = uPointer.y * 0.0610865;
    vec2 plasmaUv = vec2(diskUv.x + yaw * diskUv.y * 0.22, diskUv.y - pitch * diskUv.x * 0.22);
    float diskR = length(vec2(plasmaUv.x / 0.92, plasmaUv.y / 0.39));
    float angle = atan(plasmaUv.y / 0.39, plasmaUv.x / 0.92);
    float inverseRootRadius = 1.0 / sqrt(max(diskR, 0.14));
    float inverseRootOuter = 1.0 / sqrt(1.0);
    float inverseRootInner = 1.0 / sqrt(0.14);
    float keplerMix = clamp((inverseRootRadius - inverseRootOuter) / (inverseRootInner - inverseRootOuter), 0.0, 1.0);
    float angularVel = mix(0.9, 3.2, keplerMix);
    float spiralPhase = angle + log(max(diskR, 0.08)) * 4.2 - uFlowPhase * angularVel;
    float radialDrift = uFlowPhase * 0.25;
    float rSampleA = diskR + radialDrift;
    float rSampleB = diskR + radialDrift * 0.68;
    // Rotate the disk coordinates directly instead of sampling FBM with raw
    // atan(): this periodic transform cannot cut the noise field at +/-PI.
    float twistA = log(max(diskR, 0.08)) * 4.2 - uFlowPhase * angularVel;
    float twistB = twistA - 0.32;
    vec2 diskCoord = vec2(plasmaUv.x / 0.92, plasmaUv.y / 0.39);
    mat2 flowRotationA = mat2(cos(twistA), -sin(twistA), sin(twistA), cos(twistA));
    mat2 flowRotationB = mat2(cos(twistB), -sin(twistB), sin(twistB), cos(twistB));
    vec2 swirledA = flowRotationA * diskCoord;
    vec2 swirledB = flowRotationB * diskCoord;
    vec2 polarA = vec2(swirledA.x * 3.8 + rSampleA * 10.5, swirledA.y * 15.0);
    vec2 polarB = vec2(swirledB.x * 6.1 - rSampleB * 7.2, swirledB.y * 22.0);
    float cloud = fbm(polarA + vec2(-uFlowPhase * 0.18, uFlowPhase * 0.055));
    float detail = fbm(polarB + vec2(uFlowPhase * 0.12, -uFlowPhase * 0.085));
    float turbulence = smoothstep(0.19, 0.78, cloud * 0.68 + detail * 0.5);
    float clumpField = smoothstep(0.34, 0.7, cloud * 0.62 + detail * 0.52);
    float dustLane = smoothstep(0.25, 0.58, cloud * 0.55 + detail * 0.48);
    float armPhase = diskR * 64.0 - spiralPhase * 5.0 + (cloud - 0.45) * 12.0;
    float filamentWave = 0.5 + 0.5 * sin(armPhase);
    // Keep a deliberate 4:1 luminance floor between dark dust lanes and hot streams.
    float filaments = mix(0.25, 1.0, pow(filamentWave, 9.0));
    // Carry the luminous inner filaments close enough to the shadow that the
    // diagonal disk joins the photon rim instead of appearing detached.
    float innerEdge = smoothstep(0.17, 0.255, diskR);
    float outerEdge = 1.0 - smoothstep(0.88, 1.06, diskR);
    float gas = innerEdge * outerEdge * (0.16 + turbulence * 0.7) * filaments;
    gas *= mix(0.08, 1.72, clumpField) * mix(0.2, 1.0, dustLane);
    vec3 gasColor = mix(vec3(0.34, 0.025, 0.045), vec3(0.82, 0.16, 0.045), turbulence);
    gasColor = mix(gasColor, vec3(1.0, 0.48, 0.12), smoothstep(0.42, 0.82, turbulence + filaments * 0.22));
    float innerHeat = exp(-pow((diskR - 0.34) * 15.0, 2.0));
    vec3 whiteGold = vec3(1.0, 0.94, 0.78);
    gasColor = mix(gasColor, whiteGold, innerHeat * (0.12 + turbulence * 0.24 + charge * 0.42));
    float approachingSide = 1.0 - smoothstep(-0.2, 0.9, plasmaUv.x / 0.92);
    float doppler = 1.0 + 0.2 * approachingSide;
    gasColor *= doppler * (1.0 + charge * 1.35);

    const float shadowRadius = 0.235;
    float radial = length(p);
    float shadow = 1.0 - smoothstep(shadowRadius - 0.004, shadowRadius + 0.004, radial);
    float highChargeShimmer = charge > 0.65 ? sin(uTime * 28.0 + spiralPhase * 5.0) * 0.035 * smoothstep(0.65, 1.0, charge) : 0.0;
    float coronaBreath = 1.0 + 0.04 * sin(uTime * 0.82 + cloud * 3.0);
    vec2 lensP = p + vec2(yaw, pitch) * 0.22;
    float lensRadial = length(lensP);
    // The rim phase uses the exact inner-disk Kepler rate and direction.
    float rimAngle = atan(lensP.y, lensP.x) - uFlowPhase * 3.2;
    float rimSurgeA = pow(max(0.0, cos(rimAngle)), 18.0);
    float rimSurgeB = pow(max(0.0, cos(rimAngle - 2.0943951)), 18.0);
    float rimSurgeC = pow(max(0.0, cos(rimAngle - 4.1887902)), 18.0);
    float rimSurges = clamp(rimSurgeA + rimSurgeB + rimSurgeC, 0.0, 1.0);
    float rimWarp = 0.012 * sin(rimAngle * 4.0 + uTime * 1.7 + cloud * 2.0);
    float photonRadius = shadowRadius * (1.045 + rimWarp);
    float photon = exp(-pow((radial - photonRadius) * 92.0, 2.0)) * (0.62 + charge * 1.8 + rimSurges * 1.45) * coronaBreath;
    float glintAngle = atan(p.y, p.x) + yaw * 0.5 + pitch * 0.35;
    float glintA = pow(max(0.0, cos(glintAngle - uFlowPhase * 3.2)), 34.0);
    float glintB = pow(max(0.0, cos(glintAngle - uFlowPhase * 3.2 + 2.08)), 38.0);
    float glintC = pow(max(0.0, cos(glintAngle - uFlowPhase * 3.2 - 2.17)), 42.0);
    float travelingGlints = (glintA + glintB + glintC) * (0.18 + charge * 0.28);
    photon += travelingGlints * exp(-pow((radial - shadowRadius * 1.045) * 82.0, 2.0));
    // Let the soft lensed arcs follow the same diagonal plane as the disk.
    // Pointer parallax shifts only this light field; the core silhouette stays locked.
    vec2 lensDiskUv = vec2(ca * lensP.x - sa * lensP.y, sa * lensP.x + ca * lensP.y);
    float arcRadius = shadowRadius * (1.19 + charge * 0.18);
    float arcBand = exp(-pow((lensRadial - arcRadius) * 32.0, 2.0));
    float arcMask = smoothstep(0.16, 0.72, abs(lensDiskUv.y) / max(lensRadial, 0.001));
    float arc = arcBand * arcMask * (0.14 + turbulence * 0.1) * coronaBreath;
    float diskAngle = atan(diskUv.y, diskUv.x);
    float symmetricContact = pow(abs(cos(diskAngle)), 28.0);
    // Broad bilateral contact blend: the angular lobes sit on both ends of the
    // tilted disk axis; the Gaussian feathers into the rim near its shadow edge.
    float contactEnvelope = pow(abs(cos(diskAngle)), 14.0)
      * exp(-pow((radial - shadowRadius * 1.025) * 24.0, 2.0));
    // Matched straight plasma streaks extend from each shadow contact along
    // the tilted disk axis; the black core occludes only their hidden middle.
    float axisCoreFade = smoothstep(shadowRadius * 0.98, shadowRadius * 1.045, radial);
    float axisOuterFade = 1.0 - smoothstep(0.68, 0.86, radial);
    float bilateralStreak = exp(-pow(plasmaUv.y / (0.39 * 0.085), 2.0))
      * axisCoreFade * axisOuterFade;
    float contactBand = exp(-pow((radial - shadowRadius * 1.005) * 48.0, 2.0));
    float rimJoin = symmetricContact * contactBand * (0.38 + turbulence * 0.2 + charge * 0.38) * coronaBreath;
    float contactPlasma = contactEnvelope;
    gas = max(gas, contactPlasma * (0.42 + turbulence * 0.14) * outerEdge);
    gasColor = mix(gasColor, mix(vec3(1.0, 0.48, 0.16), whiteGold, 0.68), contactEnvelope * 0.58);
    float shockwaveA = fract(uFlowPhase * 0.18);
    float shockwaveB = fract(uFlowPhase * 0.18 + 0.5);
    float shockRadiusA = mix(shadowRadius * 1.075, shadowRadius * 1.34, shockwaveA);
    float shockRadiusB = mix(shadowRadius * 1.075, shadowRadius * 1.34, shockwaveB);
    float energyWaveA = exp(-pow((lensRadial - shockRadiusA) * 112.0, 2.0));
    float energyWaveB = exp(-pow((lensRadial - shockRadiusB) * 112.0, 2.0));
    float energyWave = (energyWaveA + energyWaveB) * charge * 0.2;

    vec3 color = gasColor * gas;
    float alpha = gas * 0.84;
    color *= 1.0 - shadow;
    // Keep both junctions warm and luminous; Doppler beaming adds only a
    // restrained ~20% lift to the approaching side while the opposite side stays lit.
    color += mix(vec3(1.0, 0.48, 0.16), whiteGold, 0.68 + turbulence * 0.1)
      * contactEnvelope * (0.58 + charge * 0.2) * doppler * (1.0 - shadow);
    color += mix(vec3(1.0, 0.58, 0.28), whiteGold, 0.72 + turbulence * 0.12)
      * bilateralStreak * (0.34 + turbulence * 0.14) * doppler * (1.0 - shadow);
    // An opaque black shadow keeps stars fully occluded at the center.
    alpha = max(alpha * (1.0 - shadow), shadow);
    alpha = max(alpha, bilateralStreak * (0.3 + turbulence * 0.1) * (1.0 - shadow));
    // The near-side plasma crosses the void as a broad, feathered turbulent belt.
    float beltCoreFade = smoothstep(0.17, 0.28, diskR);
    float beltOuterFade = 1.0 - smoothstep(0.82, 0.99, diskR);
    float frontBelt = exp(-pow(plasmaUv.y / 0.39 / 0.2, 2.0))
      * smoothstep(0.16, 0.28, abs(plasmaUv.x) / 0.92) * beltCoreFade * beltOuterFade;
    float streamClumps = mix(0.12, 0.92, clumpField) * (0.58 + filaments * 0.42);
    vec3 frontColor = mix(vec3(0.64, 0.17, 0.035), vec3(1.0, 0.72, 0.34), smoothstep(0.72, 1.08, turbulence + filaments * 0.12 + charge * 0.4));
    color += frontColor * frontBelt * (0.012 + turbulence * 0.03 + filaments * 0.012) * streamClumps * (1.0 + charge * 1.2) * (1.0 - shadow);
    alpha = max(alpha, frontBelt * (0.025 + turbulence * 0.045) * (1.0 - shadow));
    alpha = max(alpha, contactPlasma * (0.46 + charge * 0.18) * (1.0 - shadow));
    vec3 photonColor = mix(vec3(1.0, 0.48, 0.12), whiteGold, smoothstep(0.15, 1.05, photon + rimSurges * 0.85 + charge * 0.7));
    float pulseWaves = energyWave * (0.5 + 0.5 * sin(uFlowPhase * 8.0 + radial * 62.0));
    color += photonColor * photon * 0.72 + whiteGold * travelingGlints * 0.7 + whiteGold * rimSurges * contactBand * 0.92 + photonColor * rimJoin + vec3(1.0, 0.52, 0.22) * arc * coronaBreath + whiteGold * (pulseWaves + highChargeShimmer * photon);
    alpha = max(alpha, max(photon * 0.94 + travelingGlints * 0.3, max(rimJoin * 0.72, arc * 0.72 + pulseWaves)));
    // Supplemental Act-IV-only star points fill the lower negative space.
    // They are composited behind the opaque shadow and dimmed by dense plasma.
    vec2 starGrid = vQuadUv * vec2(144.0, 81.0);
    vec2 starCell = floor(starGrid);
    vec2 starLocal = fract(starGrid);
    vec2 starOffset = vec2(hash21(starCell + 17.0), hash21(starCell + 53.0));
    float starSeed = hash21(starCell + 91.0);
    float starSize = mix(0.018, 0.058, starSeed);
    float starDistance = length(starLocal - starOffset);
    float starPoint = (1.0 - smoothstep(starSize * 0.3, starSize, starDistance)) * step(0.978, hash21(starCell + 29.0));
    float starTwinkle = 0.68 + 0.32 * sin(uTime * (0.8 + starSeed * 1.8) + starSeed * 6.2831853);
    float lowerSpaceBias = mix(0.22, 1.0, smoothstep(0.02, 0.82, -p.y));
    float plasmaOcclusion = 1.0 - smoothstep(0.08, 0.52, gas);
    float rimOcclusion = smoothstep(shadowRadius * 1.08, shadowRadius * 1.24, radial);
    float backgroundStars = starPoint * starTwinkle * lowerSpaceBias * plasmaOcclusion * rimOcclusion;
    color += vec3(0.72, 0.79, 0.92) * backgroundStars * 0.19;
    alpha = max(alpha, backgroundStars * 0.82);
    float edge = max(abs(p.x), abs(p.y));
    alpha *= 1.0 - smoothstep(0.78, 0.99, edge);
    if (radial < shadowRadius * 0.992) {
      color = vec3(0.0);
      alpha = 1.0;
    }
    if (edge > 0.995 || alpha < 0.003) discard;
    gl_FragColor = vec4(filmic(color * (0.9 + charge * 1.35)), clamp(alpha, 0.0, 1.0));
    return;
    }

    vec3 rayOrigin = uCameraLocal;
    // Rays originate at the real camera. A virtual eye displaced away from
    // the core changes the ray bundle and can make every pixel converge onto
    // the shadow, producing an oversized captured silhouette.
    vec3 rayDirection = normalize(vPlanePoint - rayOrigin);
    float parallax = 0.0523599;
    rayDirection = normalize(rayDirection + vec3(uPointer.x, uPointer.y, 0.0) * parallax);
    vec3 initialRayDirection = rayDirection;

    float charge = clamp(uCharge, 0.0, 1.0);
    float swirl = mix(1.0, 5.5, smoothstep(0.0, 1.0, charge));
    float travel = 0.0;
    float plasmaAlpha = 0.0;
    vec3 plasmaColor = vec3(0.0);
    float photonEmission = 0.0;
    bool captured = false;
    bool touchedScene = false;

    // 64 adaptive integration steps keep the lens smooth near the shadow and
    // traverse the broad disk quickly; rays exit early beyond the scene.
    for (int stepIndex = 0; stepIndex < 64; stepIndex++) {
      vec3 position = rayOrigin + rayDirection * travel;
      float radius = length(position);
      if (radius < SHADOW_RADIUS * 1.012) {
        captured = true;
        touchedScene = true;
        break;
      }
      if (travel > 30.0 || (radius > 18.0 && dot(position, rayDirection) > 0.0)) break;

      float stepLength = clamp((radius - SHADOW_RADIUS) * 0.082, 0.035, 0.42);
      vec3 radial = position / max(radius, 0.001);
      vec3 transverse = radial - rayDirection * dot(radial, rayDirection);
      float bend = 1.5 * SHADOW_RADIUS / max(radius * radius, 0.01);
      rayDirection = normalize(rayDirection - transverse * bend * stepLength);

      vec3 diskPoint = rotateDisk(position);
      float diskRadius = length(diskPoint.xz);
      float thickness = mix(0.075, 0.14, charge) * (1.0 + 0.028 * diskRadius);
      float planeDensity = exp(-abs(diskPoint.y) / thickness);
      if (diskRadius > DISK_INNER && diskRadius < DISK_OUTER && planeDensity > 0.012) {
        touchedScene = true;
        float theta = atan(diskPoint.z, diskPoint.x);
        float radial01 = (diskRadius - DISK_INNER) / (DISK_OUTER - DISK_INNER);
        float kepler = swirl / pow(max(diskRadius / SHADOW_RADIUS, 1.0), 0.75);
        float twistedAngle = theta + uTime * (0.115 + kepler * 0.13);
        float diskTwist = log(max(diskRadius / SHADOW_RADIUS, 0.08)) * 4.2 - uFlowPhase * kepler;
        vec2 flowCoord = mat2(cos(diskTwist), -sin(diskTwist), sin(diskTwist), cos(diskTwist)) * diskPoint.xz;
        vec2 polar = vec2(flowCoord.x * 2.3 + radial01 * 5.4, flowCoord.y * 8.0);
        float cloud = fbm(polar + vec2(uTime * 0.045, -uTime * 0.028));
        float detail = fbm(polar * 2.15 + vec2(-uTime * 0.08, uTime * 0.06));
        float filamentPhase = diskRadius * 19.0 - twistedAngle * 2.8 + (cloud - 0.48) * 5.0;
        float filaments = 0.56 + 0.44 * pow(0.5 + 0.5 * sin(filamentPhase), 5.0);
        float turbulence = smoothstep(0.22, 0.76, cloud * 0.72 + detail * 0.42);
        float innerGlow = exp(-pow((diskRadius - DISK_INNER - 0.18) * 1.65, 2.0));
        float outerFade = 1.0 - smoothstep(DISK_OUTER * 0.78, DISK_OUTER, diskRadius);
        float density = planeDensity * (0.24 + turbulence * 0.82) * filaments * outerFade;
        float frontFacing = smoothstep(-0.72, 0.82, dot(rayDirection, vec3(0.0, 0.0, 1.0)));
        float sampleAlpha = clamp(density * stepLength * 0.34, 0.0, 0.18);
        vec3 ember = vec3(0.42, 0.035, 0.075);
        vec3 redOrange = vec3(0.85, 0.16, 0.055);
        vec3 amber = vec3(1.0, 0.48, 0.12);
        vec3 whiteGold = vec3(1.0, 0.94, 0.78);
        vec3 gas = mix(ember, redOrange, smoothstep(0.18, 0.62, turbulence));
        gas = mix(gas, amber, smoothstep(0.36, 0.82, turbulence + filaments * 0.24));
        gas = mix(gas, whiteGold, clamp(innerGlow * (0.04 + turbulence * 0.16), 0.0, 0.24));
        // Relativistic Doppler beaming heats the approaching left side by ~30%.
        float doppler = 0.78 + 0.42 * smoothstep(-0.15, 0.92, -diskPoint.x / DISK_OUTER);
        gas *= doppler * (0.84 + frontFacing * 0.28) * (1.0 + charge * 0.75);
        plasmaColor += gas * sampleAlpha * (1.0 - plasmaAlpha);
        plasmaAlpha += sampleAlpha * (1.0 - plasmaAlpha);
      }

      if (radius < SHADOW_RADIUS * 1.55) {
        float photonDistance = abs(radius - SHADOW_RADIUS * 1.065);
        float photonNoise = noise21(position.xy * 3.2 + vec2(uTime * 0.07, -uTime * 0.045));
        photonEmission = max(photonEmission,
          exp(-photonDistance * (23.0 - charge * 3.5)) * (0.62 + photonNoise * 0.54) * (1.0 + charge * 3.8));
      }
      travel += stepLength;
    }

    // An exact tilted-plane sample supplements the bent integration. It keeps
    // the broad foreground belt crisp even when adaptive steps skim the thin gas.
    float directFrontAmount = 0.0;
    vec3 diskOrigin = rotateDisk(rayOrigin);
    vec3 diskDirection = rotateDisk(initialRayDirection);
    float planeDistance = -diskOrigin.y / (abs(diskDirection.y) < 0.0005 ? 0.0005 : diskDirection.y);
    if (planeDistance > 0.0 && (!captured || planeDistance < travel + 0.08)) {
      vec3 directDiskPoint = diskOrigin + diskDirection * planeDistance;
      float directRadius = length(directDiskPoint.xz);
      if (directRadius > DISK_INNER && directRadius < DISK_OUTER) {
        float directTheta = atan(directDiskPoint.z, directDiskPoint.x);
        float direct01 = (directRadius - DISK_INNER) / (DISK_OUTER - DISK_INNER);
        float directKepler = swirl / pow(max(directRadius / SHADOW_RADIUS, 1.0), 0.75);
        float directAngle = directTheta + uTime * (0.115 + directKepler * 0.13);
        float directTwist = log(max(directRadius / SHADOW_RADIUS, 0.08)) * 4.2 - uFlowPhase * directKepler;
        vec2 directFlowCoord = mat2(cos(directTwist), -sin(directTwist), sin(directTwist), cos(directTwist)) * directDiskPoint.xz;
        vec2 directPolar = vec2(directFlowCoord.x * 2.3 + direct01 * 5.4, directFlowCoord.y * 8.0);
        float directCloud = fbm(directPolar + vec2(uTime * 0.045, -uTime * 0.028));
        float directDetail = fbm(directPolar * 2.15 + vec2(-uTime * 0.08, uTime * 0.06));
        float directTurbulence = smoothstep(0.22, 0.76, directCloud * 0.72 + directDetail * 0.42);
        float directFilament = 0.34 + 0.66 * pow(0.5 + 0.5 * sin(directRadius * 19.0 - directAngle * 2.8 + (directCloud - 0.48) * 5.0), 8.0);
        float directInnerHeat = exp(-pow((directRadius - DISK_INNER - 0.22) * 1.8, 2.0));
        float directOuterFade = 1.0 - smoothstep(DISK_OUTER * 0.74, DISK_OUTER, directRadius);
        float directDoppler = 0.78 + 0.42 * smoothstep(-0.15, 0.92, -directDiskPoint.x / DISK_OUTER);
        vec3 directColor = mix(vec3(0.48, 0.035, 0.075), vec3(0.88, 0.2, 0.055), directTurbulence);
        directColor = mix(directColor, vec3(1.0, 0.48, 0.12), smoothstep(0.34, 0.8, directTurbulence + directFilament * 0.2));
        directColor = mix(directColor, vec3(1.0, 0.95, 0.82), directInnerHeat * (0.04 + directTurbulence * 0.12));
        directColor *= directDoppler * (1.0 + charge * 0.72);
        float directAlpha = directOuterFade * (0.1 + directTurbulence * 0.18) * directFilament;
        directFrontAmount = directAlpha;
        plasmaColor = mix(plasmaColor / max(plasmaAlpha, 0.001), directColor, directAlpha) * max(plasmaAlpha, directAlpha);
        plasmaAlpha = max(plasmaAlpha, directAlpha);
        touchedScene = true;
      }
    }

    vec2 screenPoint = (vQuadUv - 0.5) * 2.0;
    float edgeDistance = max(abs(screenPoint.x), abs(screenPoint.y));
    float edgeFade = 1.0 - smoothstep(0.68, 0.98, edgeDistance);
    vec3 color = plasmaColor / max(plasmaAlpha, 0.001);
    float alpha = plasmaAlpha;
    float impact = length(cross(rayOrigin, initialRayDirection));
    // The exact silhouette is also evaluated analytically so the shadow
    // remains a clean, centered black circle even at oblique camera angles.
    if (impact < SHADOW_RADIUS * 1.08) {
      captured = true;
      if (directFrontAmount < 0.5) {
        plasmaColor = vec3(0.0);
        plasmaAlpha = 0.0;
      }
    } else {
      // The adaptive integrator can over-bend grazing paths at this screen
      // resolution; keep the opaque silhouette tied to the photon shadow.
      captured = false;
    }
    photonEmission = max(photonEmission, exp(-pow((impact - SHADOW_RADIUS * 1.12) * 5.0, 2.0)) * (0.72 + charge * 2.6));
    if (photonEmission > 0.012) {
      vec3 photon = mix(vec3(1.0, 0.40, 0.20), vec3(1.0, 0.97, 0.84), smoothstep(0.35, 1.5, photonEmission));
      color += photon * photonEmission * 0.78;
      alpha = max(alpha, clamp(photonEmission * 0.88, 0.0, 1.0));
      touchedScene = true;
    }
    if (captured) {
      // Fully opaque void: the captured ray hides stars and scenery behind it.
      vec3 foreground = plasmaAlpha > 0.025 ? filmic((plasmaColor / max(plasmaAlpha, 0.001)) * (0.82 + charge * 0.7)) : vec3(0.0);
      gl_FragColor = vec4(foreground, 1.0);
      return;
    }
    if (!touchedScene || alpha < 0.004) discard;
    alpha = clamp(alpha * edgeFade, 0.0, 0.98);
    color = filmic(color * (0.52 + charge * 0.68));
    gl_FragColor = vec4(color, alpha);
  }
`;

function RaymarchedExterior({ charge, radius = 1.85, flowPhase, diskTilt }: { charge: ChargeSource; radius?: number; flowPhase: React.MutableRefObject<number>; diskTilt: React.MutableRefObject<number> }) {
  const mesh = useRef<THREE.Mesh>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const pointer = useRef(new THREE.Vector2());
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uFlowPhase: { value: 0 },
    uCharge: { value: 0 },
    uDiskTilt: { value: -0.314 },
    uCameraLocal: { value: new THREE.Vector3() },
    uPlaneSize: { value: new THREE.Vector2(18, 18) },
    uPointer: { value: new THREE.Vector2() },
    uWorldToLocal: { value: new THREE.Matrix4() },
  }), []);
  useFrame(({ camera, pointer: cursor, clock }, delta) => {
    if (!mesh.current || !material.current) return;
    const parent = mesh.current.parent;
    if (!parent) return;
    parent.updateWorldMatrix(true, false);
    uniforms.uWorldToLocal.value.copy(parent.matrixWorld).invert();
    const cameraLocal = camera.getWorldPosition(new THREE.Vector3()).applyMatrix4(uniforms.uWorldToLocal.value);
    uniforms.uCameraLocal.value.copy(cameraLocal);

    // Keep the raymarch surface tight around the disk to bound GPU fill cost.
    const planeWidth = radius * 10.0;
    const planeHeight = radius * 10.0;
    mesh.current.scale.set(planeWidth * 0.5, planeHeight * 0.5, 1);
    uniforms.uPlaneSize.value.set(planeWidth, planeHeight);
    // Keep the plane camera-facing at rest, while allowing the small parent
    // precession to carry it through a restrained physical tilt.
    mesh.current.quaternion.copy(camera.quaternion);
    if (shadow.current) {
      shadow.current.quaternion.copy(mesh.current.quaternion);
      shadow.current.position.set(0, 0, 0.02);
    }

    pointer.current.x = THREE.MathUtils.damp(pointer.current.x, cursor.x, 3.5, delta);
    pointer.current.y = THREE.MathUtils.damp(pointer.current.y, cursor.y, 3.5, delta);
    uniforms.uPointer.value.copy(pointer.current);
    uniforms.uDiskTilt.value = diskTilt.current;
    uniforms.uCharge.value = THREE.MathUtils.damp(uniforms.uCharge.value, readCharge(charge), 4.5, delta);
    // Integrate velocity instead of multiplying time by charge: when the hold
    // is released, flow slows smoothly without the phase jumping backward.
    const flowSpeed = 1.2 + 8.0 * Math.pow(uniforms.uCharge.value, 1.7);
    flowPhase.current += Math.min(delta, 0.05) * flowSpeed;
    uniforms.uFlowPhase.value = flowPhase.current;
    uniforms.uTime.value = clock.getElapsedTime();
    if (shadow.current) {
      const radiusScale = radius * 5.0 * 0.235 * 0.985;
      shadow.current.scale.setScalar(radiusScale);
    }
  });
  return (
    <>
      {/* Explicitly draw the Act IV lens/composite after the global star points. */}
      <mesh ref={mesh} frustumCulled={false} renderOrder={10}>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial ref={material} vertexShader={exteriorVertex} fragmentShader={exteriorFragment} uniforms={uniforms} transparent blending={THREE.NormalBlending} depthTest depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={shadow} frustumCulled={false} renderOrder={20}>
        <circleGeometry args={[1, 128]} />
        <meshBasicMaterial color="#000000" transparent opacity={1} depthTest depthWrite toneMapped={false} />
      </mesh>
    </>
  );
}

function ExteriorPhotonRimSparks({ charge, radius, flowPhase }: { charge: ChargeSource; radius: number; flowPhase: React.MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const sparks = useRef<THREE.InstancedMesh>(null);
  const initialized = useRef(false);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const count = 72;
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vColor;
      void main() {
        vec4 instancePosition = instanceMatrix * vec4(position, 1.0);
        vUv = uv;
        vColor = instanceColor;
        gl_Position = projectionMatrix * modelViewMatrix * instancePosition;
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying vec3 vColor;
      void main() {
        vec2 q = (vUv - 0.5) * 2.0;
        float dash = 1.0 - smoothstep(0.68, 1.0, abs(q.x));
        float hotCore = exp(-q.y * q.y * 34.0);
        float softGlow = exp(-q.y * q.y * 7.0);
        float alpha = dash * (hotCore * 0.96 + softGlow * 0.34);
        if (alpha < 0.012) discard;
        vec3 emitted = vColor * (hotCore * 1.9 + softGlow * 0.9);
        gl_FragColor = vec4(emitted, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthTest: true,
    depthWrite: false,
    toneMapped: false,
  }), []);
  const attributes = useMemo(() => {
    const angles = new Float32Array(count);
    const phases = new Float32Array(count);
    const lengths = new Float32Array(count);
    const colors = new Array<THREE.Color>(count);
    for (let index = 0; index < count; index += 1) {
      angles[index] = unit(index, 71) * Math.PI * 2;
      phases[index] = unit(index, 73) * Math.PI * 2;
      lengths[index] = 0.009 + unit(index, 74) * 0.009;
      colors[index] = new THREE.Color().lerpColors(new THREE.Color("#ffc978"), new THREE.Color("#fff7df"), unit(index, 76));
    }
    return { angles, phases, lengths, colors };
  }, []);
  useFrame(({ camera }) => {
    if (!group.current || !sparks.current) return;
    group.current.quaternion.copy(camera.quaternion);
    group.current.scale.setScalar(radius * 5.0);
    const liveCharge = readCharge(charge);
    if (!initialized.current) {
      for (let index = 0; index < count; index += 1) sparks.current.setColorAt(index, attributes.colors[index]);
      if (sparks.current.instanceColor) sparks.current.instanceColor.needsUpdate = true;
      initialized.current = true;
    }
    for (let index = 0; index < count; index += 1) {
      const angle = attributes.angles[index] + attributes.phases[index] + flowPhase.current * 3.2;
      const photonRadius = 0.235 * 1.05;
      dummy.position.set(Math.cos(angle) * photonRadius, Math.sin(angle) * photonRadius, 0.028);
      dummy.rotation.set(0, 0, angle + Math.PI * 0.5);
      dummy.scale.set(attributes.lengths[index] * (1.0 + liveCharge * 0.65), 0.006 + liveCharge * 0.001, 1);
      dummy.updateMatrix();
      sparks.current.setMatrixAt(index, dummy.matrix);
    }
    sparks.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <group ref={group} renderOrder={21}>
      <instancedMesh
        ref={(mesh) => {
          sparks.current = mesh;
          if (mesh && mesh.instanceColor === null) {
            mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3).fill(1), 3);
          }
        }}
        args={[geometry, material, count]}
        frustumCulled={false}
        renderOrder={21}
      />
    </group>
  );
}

export default function ActFourExterior({ phase, warpCharge }: { phase: ActFourPhase; warpCharge: React.RefObject<number> }) {
  const motion = useRef<THREE.Group>(null);
  const core = useRef<THREE.Group>(null);
  const charge = useRef(0);
  const flowPhase = useRef(0);
  const diskTilt = useRef(-0.314);
  const pointer = useRef(new THREE.Vector2());
  const active = phase === "act4_exterior" || phase === "act4_warp_in";
  useFrame(({ clock, pointer: cursor }, delta) => {
    if (!core.current || !motion.current) return;
    const t = clock.getElapsedTime();
    pointer.current.x = THREE.MathUtils.damp(pointer.current.x, cursor.x, 2.8, delta);
    pointer.current.y = THREE.MathUtils.damp(pointer.current.y, cursor.y, 2.8, delta);
    const targetCharge = phase === "act4_warp_in" ? 1 : phase === "act4_exterior" ? THREE.MathUtils.clamp(warpCharge.current ?? 0, 0, 1) : 0;
    charge.current = THREE.MathUtils.damp(charge.current, targetCharge, 7, delta);
    core.current.scale.setScalar(THREE.MathUtils.damp(core.current.scale.x, active ? 1 : 0.001, 5.5, delta));
    const idle = 1 - THREE.MathUtils.smoothstep(charge.current, 0.01, 0.08);
    motion.current.position.set(
      ACT_FOUR_CORE_POSITION.x + Math.sin(t * 0.31) * 0.012 * idle,
      ACT_FOUR_CORE_POSITION.y + Math.cos(t * 0.27 + 0.7) * 0.012 * idle,
      ACT_FOUR_CORE_POSITION.z,
    );
    motion.current.rotation.set(
      Math.sin(t * 0.38) * 0.003 * idle,
      pointer.current.x * THREE.MathUtils.degToRad(0.3) * idle,
      Math.sin(t * 0.46) * 0.004 * idle + pointer.current.y * THREE.MathUtils.degToRad(0.3) * idle,
    );
    diskTilt.current = THREE.MathUtils.lerp(-0.314 + Math.sin(t * 0.22) * 0.004 * idle, -0.314, 1 - idle);
  });
  if (!active) return null;
  return (
    <group ref={motion} position={ACT_FOUR_CORE_POSITION}>
      <group ref={core}>
        <pointLight color="#ff254c" intensity={2.8} distance={36} decay={2} />
        <pointLight position={[0, 0.2, 2.2]} color="#ffbd7a" intensity={2.4} distance={22} decay={2} />
        <RaymarchedExterior radius={1.85} charge={charge} flowPhase={flowPhase} diskTilt={diskTilt} />
        <ExteriorPhotonRimSparks radius={1.85} charge={charge} flowPhase={flowPhase} />
        <AnamorphicFlare charge={charge} />
      </group>
      <LensDust charge={charge} active />
    </group>
  );
}

export function InteriorGargantua({ charge }: { charge: number }) {
  const core = useRef<THREE.Group>(null);
  useFrame(({ clock }, delta) => {
    if (!core.current) return;
    const t = clock.getElapsedTime();
    core.current.rotation.y = t * (0.012 + charge * 0.06);
    core.current.scale.setScalar(THREE.MathUtils.damp(core.current.scale.x, 1, 4, delta));
  });
  return (
    <group ref={core} position={new THREE.Vector3(0, 0, -150)}>
        <LensingHalo charge={charge} coreRadius={8.6} />
      <EventHorizon radius={8.6} charge={charge} />
      <AccretionPlasmaDisk innerRadius={9.2} outerRadius={31} charge={charge} />
      {[0, 1, 2].map((index) => <ContainmentRing key={index} index={index} charge={charge} coreRadius={8.6} />)}
    </group>
  );
}
