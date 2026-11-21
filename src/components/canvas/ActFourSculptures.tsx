"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const ACCENTS = ["#00e5ff", "#8b5cf6", "#f59e0b", "#10b981", "#ff4d6d"];

function useAccent(index: number) {
  return useMemo(() => new THREE.Color(ACCENTS[index] ?? ACCENTS[0]), [index]);
}

function buildTelemetryTicks() {
  const positions: number[] = [];
  for (let index = 0; index < 72; index += 1) {
    const angle = index / 72 * Math.PI * 2;
    const inner = 1.92;
    const outer = inner + (index % 6 === 0 ? 0.18 : 0.075);
    positions.push(Math.cos(angle) * inner, -2.16, Math.sin(angle) * inner);
    positions.push(Math.cos(angle) * outer, -2.16, Math.sin(angle) * outer);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return geometry;
}

function TelemetryTicks({ color }: { color: THREE.Color }) {
  const ring = useRef<THREE.Group>(null);
  const geometry = useMemo(buildTelemetryTicks, []);
  useFrame(({ clock }) => { if (ring.current) ring.current.rotation.y = clock.getElapsedTime() * 0.018; });
  return (
    <group ref={ring}>
      <lineSegments geometry={geometry}><lineBasicMaterial color={color} transparent opacity={0.32} depthWrite={false} blending={THREE.AdditiveBlending} /></lineSegments>
      <mesh position={[0, -2.16, 0]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[1.9, 0.006, 4, 144]} /><meshBasicMaterial color={color} transparent opacity={0.28} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
    </group>
  );
}

function ProjectorBase({ color }: { color: THREE.Color }) {
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const beam = useRef<THREE.ShaderMaterial>(null);
  useFrame(({ clock }, delta) => {
    rings.current.forEach((ring, index) => {
      if (ring) ring.rotation.y += delta * (index % 2 === 0 ? 0.12 : -0.16);
    });
    if (beam.current) beam.current.uniforms.uTime.value = clock.getElapsedTime();
  });
  return (
    <group>
      {[1.8, 1.45, 1.1].map((radius, index) => (
        <mesh key={radius} ref={(node) => { rings.current[index] = node; }} position={[0, -2.2 + index * 0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius, index === 0 ? 0.014 : 0.009, 8, 128]} />
          <meshStandardMaterial color="#171a20" metalness={0.99} roughness={0.28} emissive={color} emissiveIntensity={index === 1 ? 0.09 : 0.045} />
        </mesh>
      ))}
      <mesh position={[0, -0.55, 0]}>
        <planeGeometry args={[2.8, 3.2]} />
        <shaderMaterial ref={beam} uniforms={{ uTime: { value: 0 }, uColor: { value: color } }} transparent depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} toneMapped={false}
          vertexShader={`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`}
          fragmentShader={`uniform float uTime; uniform vec3 uColor; varying vec2 vUv; void main(){vec2 p=(vUv-0.5)*2.0;float radial=exp(-p.x*p.x*5.5);float vertical=exp(-pow((p.y+0.1)*1.25,2.0))*smoothstep(-1.0,-0.86,p.y)*(1.0-smoothstep(0.62,0.92,p.y));float shimmer=0.97+0.03*sin(vUv.y*18.0-uTime*0.7);float alpha=min(0.12,radial*vertical*0.09)*shimmer;if(alpha<0.001)discard;gl_FragColor=vec4(uColor,alpha);}`}
        />
      </mesh>
    </group>
  );
}

function FindItSculpture({ color }: { color: THREE.Color }) {
  const root = useRef<THREE.Group>(null);
  const pulse = useRef<THREE.ShaderMaterial>(null);
  const beacons = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const lat = -0.8 + (i / 5) * 1.6;
    const angle = i * 2.399963;
    const radius = 0.94;
    return new THREE.Vector3(Math.cos(angle) * Math.cos(lat) * radius, Math.sin(lat) * radius, Math.sin(angle) * Math.cos(lat) * radius);
  }), []);
  useFrame(({ clock, pointer }) => {
    if (root.current) {
      root.current.rotation.y = clock.getElapsedTime() * 0.12 + pointer.x * 0.06;
      root.current.rotation.x = pointer.y * -0.06;
    }
    if (pulse.current) pulse.current.uniforms.uTime.value = clock.getElapsedTime();
  });
  return (
    <group ref={root}>
      <mesh>
        <icosahedronGeometry args={[0.9, 3]} />
        <meshPhysicalMaterial color="#05242d" emissive={color} emissiveIntensity={0.08} metalness={0.28} roughness={0.3} transmission={0.22} thickness={0.8} transparent opacity={0.72} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[0.91, 2]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.24} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[0.918, 3]} />
        <shaderMaterial ref={pulse} uniforms={{ uTime: { value: 0 }, uColor: { value: color } }} transparent blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide}
          vertexShader={`varying vec3 vLocal; void main(){vLocal=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`}
          fragmentShader={`uniform float uTime;uniform vec3 uColor;varying vec3 vLocal;void main(){float wave=fract(uTime*0.22);float band=exp(-pow((length(vLocal.xz)-wave)*42.0,2.0));gl_FragColor=vec4(uColor,band*0.65);}`}
        />
      </mesh>
      {[0, 1].map((index) => <mesh key={index} rotation={[0.7 + index * 0.8, 0.3 + index * 1.1, 0.4]}><torusGeometry args={[1.08 + index * 0.1, 0.009, 5, 120]} /><meshBasicMaterial color={color} transparent opacity={0.52} blending={THREE.AdditiveBlending} toneMapped={false} /></mesh>)}
      {beacons.map((point, index) => (
        <group key={index} position={point}>
          <mesh><sphereGeometry args={[0.075, 12, 10]} /><meshBasicMaterial color="#e9fdff" toneMapped={false} /></mesh>
          <mesh position={[0, 0.16, 0]}><cylinderGeometry args={[0.008, 0.02, 0.27, 6]} /><meshBasicMaterial color={color} transparent opacity={0.6} blending={THREE.AdditiveBlending} /></mesh>
          <pointLight color={color} intensity={0.22} distance={0.65} />
        </group>
      ))}
    </group>
  );
}

function buildTerrain() {
  const segments = 32;
  const size = 3.2;
  const positions = new Float32Array((segments + 1) * (segments + 1) * 3);
  const indices: number[] = [];
  for (let z = 0; z <= segments; z += 1) {
    for (let x = 0; x <= segments; x += 1) {
      const u = x / segments;
      const v = z / segments;
      const px = (u - 0.5) * size;
      const pz = (v - 0.5) * size;
      const peakA = Math.exp(-((px - 0.5) ** 2 + (pz + 0.25) ** 2) * 2.0);
      const peakB = Math.exp(-((px + 0.72) ** 2 + (pz - 0.55) ** 2) * 1.8);
      const py = peakA * 0.42 + peakB * 0.28 + Math.sin(px * 3.4) * Math.cos(pz * 2.7) * 0.035;
      const offset = (z * (segments + 1) + x) * 3;
      positions.set([px, py, pz], offset);
      if (x < segments && z < segments) {
        const a = z * (segments + 1) + x;
        const b = a + 1;
        const c = a + segments + 1;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function ZaminSculpture({ color }: { color: THREE.Color }) {
  const root = useRef<THREE.Group>(null);
  const scanner = useRef<THREE.Mesh>(null);
  const terrain = useMemo(buildTerrain, []);
  const agents = useMemo(() => [new THREE.Vector3(-0.9, 0.9, -0.7), new THREE.Vector3(0, 1.12, 0.25), new THREE.Vector3(0.92, 0.83, -0.45)], []);
  const links = useMemo(() => agents.map((point) => {
    const finish = new THREE.Vector3(point.x * 0.72, 0.18, point.z * 0.72);
    const mid = point.clone().lerp(finish, 0.5).add(new THREE.Vector3(0, 0.38, 0.15));
    return new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(point, mid, finish), 32, 0.012, 6, false);
  }), [agents]);
  useFrame(({ clock, pointer }) => {
    if (root.current) { root.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.23) * 0.09 + pointer.x * 0.05; root.current.rotation.x = -pointer.y * 0.055; }
    if (scanner.current) scanner.current.position.y = 0.13 + (Math.sin(clock.getElapsedTime() * 1.1) * 0.5 + 0.5) * 0.65;
  });
  return (
    <group ref={root} rotation={[-0.18, 0, 0]}>
      <mesh geometry={terrain} position={[0, -0.22, 0]}><meshStandardMaterial color="#171126" metalness={0.34} roughness={0.4} emissive={color} emissiveIntensity={0.12} side={THREE.DoubleSide} /></mesh>
      <mesh geometry={terrain} position={[0, -0.205, 0]}><meshBasicMaterial color={color} wireframe transparent opacity={0.48} /></mesh>
      <mesh ref={scanner} position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[3.3, 3.3]} /><meshBasicMaterial color={color} transparent opacity={0.13} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
      {links.map((geometry, index) => <mesh key={index} geometry={geometry}><meshBasicMaterial color={color} transparent opacity={0.58} blending={THREE.AdditiveBlending} toneMapped={false} /></mesh>)}
      {agents.map((point, index) => <group key={index} position={point}><mesh><octahedronGeometry args={[0.22, 0]} /><meshPhysicalMaterial color="#201344" emissive={color} emissiveIntensity={0.34} metalness={0.35} roughness={0.2} clearcoat={1} /></mesh><mesh scale={1.16}><octahedronGeometry args={[0.22, 0]} /><meshBasicMaterial color={color} wireframe transparent opacity={0.68} /></mesh><pointLight color={color} intensity={0.3} distance={1.4} /></group>)}
    </group>
  );
}

function HostelSculpture({ color }: { color: THREE.Color }) {
  const root = useRef<THREE.Group>(null);
  const towers = useMemo(() => [
    { x: -0.78, z: -0.5, w: 0.42, d: 0.46, h: 1.55 }, { x: -0.26, z: -0.56, w: 0.48, d: 0.5, h: 2.05 },
    { x: 0.34, z: -0.48, w: 0.5, d: 0.48, h: 1.42 }, { x: 0.83, z: -0.42, w: 0.38, d: 0.42, h: 1.86 },
    { x: -0.62, z: 0.2, w: 0.44, d: 0.44, h: 1.2 }, { x: 0.02, z: 0.25, w: 0.56, d: 0.52, h: 1.68 },
    { x: 0.67, z: 0.3, w: 0.42, d: 0.46, h: 1.32 },
  ], []);
  useFrame(({ clock, pointer }, delta) => {
    if (!root.current) return;
    root.current.rotation.y = THREE.MathUtils.damp(root.current.rotation.y, pointer.x * 0.07 + Math.sin(clock.getElapsedTime() * 0.12) * 0.025, 2.4, delta);
    root.current.rotation.x = THREE.MathUtils.damp(root.current.rotation.x, -pointer.y * 0.04, 2.4, delta);
  });
  return (
    <group ref={root}>
      {towers.map((tower, index) => <group key={index} position={[tower.x, -2.18 + tower.h / 2, tower.z]}>
        <mesh>
          <boxGeometry args={[tower.w, tower.h, tower.d]} />
          <meshPhysicalMaterial color="#101720" metalness={0.36} roughness={0.16} transmission={0.52} thickness={0.8} transparent opacity={0.25} clearcoat={1} clearcoatRoughness={0.08} emissive={color} emissiveIntensity={0.08} />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(tower.w, tower.h, tower.d)]} />
          <lineBasicMaterial color={color} transparent opacity={0.72} toneMapped={false} />
        </lineSegments>
        {Array.from({ length: Math.max(2, Math.floor(tower.h * 2)) }, (_, floor) => <mesh key={floor} position={[0, -tower.h / 2 + 0.24 + floor * 0.38, tower.d / 2 + 0.006]}>
          <planeGeometry args={[tower.w * 0.54, 0.045]} />
          <meshBasicMaterial color={color} transparent opacity={0.36 + 0.18 * Math.sin(floor + index)} toneMapped={false} />
        </mesh>)}
      </group>)}
      <mesh position={[0, -2.2, 0]}><boxGeometry args={[2.55, 0.08, 2.55]} /><meshStandardMaterial color="#10131a" metalness={0.92} roughness={0.25} emissive={color} emissiveIntensity={0.16} /></mesh>
    </group>
  );
}

function HealthSculpture({ color }: { color: THREE.Color }) {
  const root = useRef<THREE.Group>(null);
  const neuronMesh = useRef<THREE.InstancedMesh>(null);
  const wave = useRef<THREE.Mesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const neurons = useMemo(() => Array.from({ length: 20 }, (_, index) => {
    const layer = Math.floor(index / 5);
    const row = index % 5;
    const y = (row - 2) * 0.42 + (layer % 2) * 0.08;
    const x = (row % 2 ? 0.12 : -0.12) * (layer === 0 || layer === 3 ? 1 : 0.6);
    return new THREE.Vector3(x, y, (layer - 1.5) * 0.66);
  }), []);
  const links = useMemo(() => {
    const values: number[] = [];
    for (let layer = 0; layer < 3; layer += 1) {
      for (let row = 0; row < 5; row += 1) {
        for (let next = 0; next < 5; next += 1) {
          if ((row + next + layer) % 2 === 0 || row === next) {
            values.push(...neurons[layer * 5 + row].toArray(), ...neurons[(layer + 1) * 5 + next].toArray());
          }
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(values, 3));
    return geometry;
  }, [neurons]);
  useLayoutEffect(() => {
    const mesh = neuronMesh.current;
    if (!mesh) return;
    neurons.forEach((point, index) => {
      dummy.position.copy(point);
      dummy.scale.setScalar(0.085);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
      mesh.setColorAt(index, new THREE.Color("#d8fff0").lerp(color, 0.5 + (index % 5) * 0.07));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [color, dummy, neurons]);
  useFrame(({ clock, pointer }) => {
    const t = clock.getElapsedTime();
    if (root.current) { root.current.rotation.y = t * 0.1 + pointer.x * 0.045; root.current.rotation.x = pointer.y * -0.04; }
    if (wave.current) {
      const progress = (t * 0.32) % 1;
      wave.current.position.set(0, Math.sin(progress * Math.PI * 2) * 0.2, THREE.MathUtils.lerp(-1.15, 1.15, progress));
      wave.current.scale.setScalar(0.8 + 0.3 * Math.sin(progress * Math.PI));
    }
  });
  return (
    <group ref={root}>
      <lineSegments geometry={links}><lineBasicMaterial color={color} transparent opacity={0.38} blending={THREE.AdditiveBlending} depthWrite={false} /></lineSegments>
      <instancedMesh ref={neuronMesh} args={[undefined, undefined, neurons.length]}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial color="#ffffff" emissive={color} emissiveIntensity={0.62} metalness={0.12} roughness={0.28} />
      </instancedMesh>
      <mesh ref={wave}><sphereGeometry args={[0.1, 16, 12]} /><meshBasicMaterial color="#eafff7" toneMapped={false} /></mesh>
      <pointLight color={color} position={[0, 0, 1.1]} intensity={0.45} distance={3} />
    </group>
  );
}

function NoteFlashSculpture({ color }: { color: THREE.Color }) {
  const root = useRef<THREE.Group>(null);
  const cards = useRef<(THREE.Mesh | null)[]>([]);
  const sparks = useRef<(THREE.Mesh | null)[]>([]);
  const filament = useMemo(() => new THREE.BufferGeometry(), []);
  const filamentPositions = useMemo(() => new Float32Array(7 * 3), []);
  const filamentLine = useMemo(() => new THREE.Line(
    filament,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.52, blending: THREE.AdditiveBlending, depthWrite: false }),
  ), [color, filament]);
  if (!filament.getAttribute("position")) {
    filament.setAttribute("position", new THREE.BufferAttribute(filamentPositions, 3).setUsage(THREE.DynamicDrawUsage));
  }
  useFrame(({ clock, pointer }) => {
    const t = clock.getElapsedTime();
    if (!root.current) return;
    root.current.rotation.y = t * 0.12 + pointer.x * 0.05;
    root.current.rotation.x = pointer.y * -0.045;
    cards.current.forEach((card, index) => {
      if (!card) return;
      const angle = t * 0.22 + (index / 7) * Math.PI * 2;
      card.position.set(Math.cos(angle) * 1.28, Math.sin(angle * 1.4) * 0.82, Math.sin(angle) * 0.74);
      card.lookAt(card.position.clone().multiplyScalar(2));
      card.rotateY(0.18);
      filamentPositions[index * 3] = card.position.x * 0.78;
      filamentPositions[index * 3 + 1] = card.position.y * 0.78;
      filamentPositions[index * 3 + 2] = card.position.z * 0.78;
    });
    filament.attributes.position.needsUpdate = true;
    filament.computeBoundingSphere();
    sparks.current.forEach((spark, index) => {
      if (!spark) return;
      const angle = t * 0.48 + (index / 5) * Math.PI * 2;
      spark.position.set(Math.cos(angle) * 0.78, ((t * 0.62 + index * 0.21) % 1.6) - 0.8, Math.sin(angle) * 0.78);
    });
  });
  return (
    <group ref={root}>
      <mesh><octahedronGeometry args={[0.48, 1]} /><meshPhysicalMaterial color="#4a111d" emissive={color} emissiveIntensity={0.72} metalness={0.56} roughness={0.16} clearcoat={1} /></mesh>
      <mesh scale={1.13}><octahedronGeometry args={[0.48, 1]} /><meshBasicMaterial color={color} wireframe transparent opacity={0.42} /></mesh>
      {Array.from({ length: 7 }, (_, index) => <mesh key={index} ref={(node) => { cards.current[index] = node; }}>
        <boxGeometry args={[0.62, 0.82, 0.08]} />
        <meshPhysicalMaterial color="#34121b" emissive={color} emissiveIntensity={0.12} metalness={0.22} roughness={0.17} transmission={0.28} thickness={0.75} clearcoat={1} transparent opacity={0.9} />
      </mesh>)}
      <primitive object={filamentLine} />
      {Array.from({ length: 5 }, (_, index) => <mesh key={`spark-${index}`} ref={(node) => { sparks.current[index] = node; }}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshBasicMaterial color="#fff0cb" toneMapped={false} />
      </mesh>)}
      <pointLight color={color} intensity={0.7} distance={3.8} />
    </group>
  );
}

export default function ActFourSculpture({ projectIndex }: { projectIndex: number }) {
  const root = useRef<THREE.Group>(null);
  const { pointer } = useThree();
  const color = useAccent(projectIndex);
  useFrame((state, delta) => {
    if (!root.current) return;
    root.current.rotation.y = THREE.MathUtils.damp(root.current.rotation.y, pointer.x * 0.09 + Math.sin(state.clock.getElapsedTime() * 0.12) * 0.035, 2.8, delta);
    root.current.rotation.x = THREE.MathUtils.damp(root.current.rotation.x, -pointer.y * 0.055, 2.8, delta);
  });
  return (
    <group ref={root}>
      <TelemetryTicks color={color} />
      <ProjectorBase color={color} />
      {projectIndex === 0 && <FindItSculpture color={color} />}
      {projectIndex === 1 && <ZaminSculpture color={color} />}
      {projectIndex === 2 && <HostelSculpture color={color} />}
      {projectIndex === 3 && <HealthSculpture color={color} />}
      {projectIndex === 4 && <NoteFlashSculpture color={color} />}
    </group>
  );
}
