"use client";

import React, { useMemo, useRef } from "react";
import { Text } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function phase(progress: number, start: number, end: number) {
  const fade = Math.min(0.07, (end - start) * 0.35);
  return smoothstep(start, start + fade, progress) * (1 - smoothstep(end - fade, end, progress));
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function useLaptopX() {
  const { viewport } = useThree();
  return Math.max(0.8, viewport.width * 0.08);
}

function StarWarpTunnel({ scrollProgress }: { scrollProgress: number }) {
  const linesRef = useRef<THREE.LineSegments>(null);
  const materialRef = useRef<THREE.LineBasicMaterial>(null);

  const { geometry, seeds } = useMemo(() => {
    const rand = seededRandom(901);
    const count = 120;
    const positions = new Float32Array(count * 2 * 3);
    const seedData: { x: number; y: number; z: number; len: number; speed: number }[] = [];

    for (let i = 0; i < count; i++) {
      const angle = rand() * Math.PI * 2;
      const radius = 1.2 + rand() * 22;
      const x = Math.cos(angle) * radius;
      const y = 1.5 + Math.sin(angle) * radius * 0.38 + rand() * 7;
      const z = -10 - rand() * 68;
      seedData.push({ x, y, z, len: 0.4 + rand() * 1.9, speed: 0.35 + rand() * 1.2 });

      const i6 = i * 6;
      positions[i6] = x;
      positions[i6 + 1] = y;
      positions[i6 + 2] = z;
      positions[i6 + 3] = x;
      positions[i6 + 4] = y;
      positions[i6 + 5] = z - 1;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return { geometry: geo, seeds: seedData };
  }, []);

  useFrame((state) => {
    const warp = phase(scrollProgress, 0.08, 0.38) + phase(scrollProgress, 0.49, 0.6) * 0.65;
    if (materialRef.current) {
      materialRef.current.opacity = 0.035 + warp * 0.2;
      materialRef.current.color.set(warp > 0.25 ? "#fff0f2" : "#ff1744");
    }

    const attr = geometry.getAttribute("position") as THREE.BufferAttribute;
    const t = state.clock.getElapsedTime();

    for (let i = 0; i < seeds.length; i++) {
      const seed = seeds[i];
      const flow = (t * seed.speed * (2.2 + warp * 7) + scrollProgress * 30) % 78;
      const z = seed.z + flow;
      const stretch = seed.len * (1 + warp * 5);
      const pull = 1 - warp * 0.22;
      const i6 = i * 6;

      attr.setXYZ(i * 2, seed.x * pull, seed.y, z);
      attr.setXYZ(i * 2 + 1, seed.x * (pull * 0.98), seed.y, z - stretch);
    }

    attr.needsUpdate = true;

    if (linesRef.current) {
      linesRef.current.rotation.z = Math.sin(t * 0.18) * 0.02;
    }
  });

  return (
    <lineSegments ref={linesRef} geometry={geometry} renderOrder={-12}>
      <lineBasicMaterial ref={materialRef} color="#ff1744" transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} />
    </lineSegments>
  );
}

function LaptopPortal({ scrollProgress }: { scrollProgress: number }) {
  const laptopX = useLaptopX();
  const groupRef = useRef<THREE.Group>(null);
  const matRefs = useRef<THREE.MeshBasicMaterial[]>([]);
  const ringRefs = useRef<THREE.Mesh[]>([]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const visible = phase(scrollProgress, 0.12, 0.35);

    if (groupRef.current) {
      groupRef.current.scale.setScalar(0.8 + visible * 0.75 + Math.sin(t * 2.1) * 0.025 * visible);
      groupRef.current.rotation.z = t * 0.12;
    }

    matRefs.current.forEach((mat, index) => {
      mat.opacity = visible * (index === 0 ? 0.16 : 0.34);
    });

    ringRefs.current.forEach((ring, index) => {
      ring.rotation.z = t * (0.28 + index * 0.12) * (index % 2 === 0 ? 1 : -1);
    });
  });

  return (
    <group ref={groupRef} position={[laptopX - 0.08, 0.38, -1.52]} rotation={[0.2, -0.18, 0]}>
      <mesh>
        <circleGeometry args={[1.15, 96]} />
        <meshBasicMaterial
          ref={(mat) => {
            if (mat) matRefs.current[0] = mat;
          }}
          color="#ff1744"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {[1.15, 1.42, 1.74].map((radius, index) => (
        <mesh
          key={radius}
          ref={(mesh) => {
            if (mesh) ringRefs.current[index] = mesh;
          }}
        >
          <torusGeometry args={[radius, 0.01 + index * 0.002, 8, 160]} />
          <meshBasicMaterial
            ref={(mat) => {
              if (mat) matRefs.current[index + 1] = mat;
            }}
            color={index === 1 ? "#ffffff" : "#ff1744"}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function EntryProbe({ scrollProgress }: { scrollProgress: number }) {
  const laptopX = useLaptopX();
  const probeRef = useRef<THREE.Group>(null);
  const trailRef = useRef<THREE.LineSegments>(null);
  const mats = useRef<THREE.MeshBasicMaterial[]>([]);

  const trailGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3));
    return geo;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const travel = smoothstep(0.1, 0.255, scrollProgress);
    const visible = phase(scrollProgress, 0.08, 0.31);
    const start = new THREE.Vector3(-2.15, 0.05, 2.25);
    const end = new THREE.Vector3(laptopX - 0.08, 0.38, -1.52);
    const pos = start.lerp(end, travel);

    if (probeRef.current) {
      probeRef.current.position.copy(pos);
      probeRef.current.rotation.set(t * 0.8, t * 1.15, t * 0.5);
      probeRef.current.scale.setScalar(0.42 + visible * 0.2 + Math.sin(t * 5) * 0.015 * visible);
    }

    if (trailRef.current) {
      const attr = trailRef.current.geometry.getAttribute("position") as THREE.BufferAttribute;
      attr.setXYZ(0, -2.15, 0.05, 2.25);
      attr.setXYZ(1, pos.x, pos.y, pos.z);
      attr.needsUpdate = true;
    }

    mats.current.forEach((mat, index) => {
      mat.opacity = visible * (index === 0 ? 0.84 : 0.22);
    });
  });

  return (
    <group>
      <lineSegments ref={trailRef} geometry={trailGeometry}>
        <lineBasicMaterial color="#ffffff" transparent opacity={0.32} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>
      <group ref={probeRef}>
        <mesh>
          <octahedronGeometry args={[0.16, 0]} />
          <meshBasicMaterial
            ref={(mat) => {
              if (mat) mats.current[0] = mat;
            }}
            color="#fff1f4"
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.42, 32, 32]} />
          <meshBasicMaterial
            ref={(mat) => {
              if (mat) mats.current[1] = mat;
            }}
            color="#ff1744"
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}

const aboutShards = [
  { value: "2026", label: "Computer Science Engineering graduate", position: [-1.25, 0.9, -0.72], scale: 1.1 },
  { value: "8.16", label: "CGPA at Navkis College of Engineering", position: [1.05, 0.46, -1.5], scale: 0.92 },
  { value: "FULL STACK", label: "React, Flask, Node, SQL, MongoDB", position: [-1.0, -0.28, -2.25], scale: 0.86 },
  { value: "AI DEV", label: "Google ADK, Gemini, HealthGPT", position: [1.1, -0.82, -3.0], scale: 0.82 },
];

function InteriorWorld({ scrollProgress }: { scrollProgress: number }) {
  const laptopX = useLaptopX();
  const rootRef = useRef<THREE.Group>(null);
  const mats = useRef<THREE.MeshBasicMaterial[]>([]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const visible = phase(scrollProgress, 0.21, 0.56);
    const build = smoothstep(0.25, 0.44, scrollProgress);

    if (rootRef.current) {
      rootRef.current.position.x = laptopX - 0.35;
      rootRef.current.position.z = -3.35 + build * -0.35;
      rootRef.current.rotation.y = Math.sin(t * 0.16) * 0.04;
      rootRef.current.scale.setScalar(0.82 + build * 0.18);
    }

    mats.current.forEach((mat, index) => {
      const flicker = 0.86 + Math.sin(t * 2.5 + index) * 0.14;
      mat.opacity = visible * flicker * (index < 21 ? 0.07 : 0.2);
    });
  });

  return (
    <group ref={rootRef} position={[laptopX - 0.35, 0.1, -3.35]}>
      <mesh position={[0, 0.08, -2.2]} rotation={[0, 0, 0]}>
        <planeGeometry args={[5.2, 3.2]} />
        <meshBasicMaterial
          color="#ff1744"
          transparent
          opacity={phase(scrollProgress, 0.22, 0.54) * 0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {Array.from({ length: 7 }).map((_, index) => {
        const z = -index * 0.72;
        const scale = 1 + index * 0.11;
        return (
          <group key={index} position={[0, 0.35, z]} scale={[scale, scale, 1]}>
            {[
              { position: [0, 1.05, 0], args: [3.2, 0.018, 0.018] },
              { position: [-1.6, 0, 0], args: [0.018, 2.1, 0.018] },
              { position: [1.6, 0, 0], args: [0.018, 2.1, 0.018] },
            ].map((bar, barIndex) => (
              <mesh key={barIndex} position={bar.position as [number, number, number]}>
                <boxGeometry args={bar.args as [number, number, number]} />
                <meshBasicMaterial
                  ref={(mat) => {
                    if (mat) mats.current[index * 3 + barIndex] = mat;
                  }}
                  color={index % 2 ? "#ffffff" : "#ff1744"}
                  transparent
                  opacity={0}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>
            ))}
          </group>
        );
      })}

      {aboutShards.map((item, index) => {
        const reveal = phase(scrollProgress, 0.25 + index * 0.025, 0.55);
        return (
          <group key={item.value} position={item.position as [number, number, number]} scale={item.scale}>
            <mesh rotation={[0, index % 2 === 0 ? 0.12 : -0.12, 0.03]}>
              <planeGeometry args={[1.85, 0.72]} />
              <meshBasicMaterial
                color={index % 2 === 0 ? "#ff1744" : "#ffffff"}
                transparent
                opacity={reveal * 0.12}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </mesh>
            <Text
              position={[-0.78, 0.08, 0.02]}
              fontSize={0.22}
              letterSpacing={0.02}
              anchorX="left"
              anchorY="middle"
              color="#fff6f7"
              material-transparent
              material-opacity={reveal}
            >
              {item.value}
            </Text>
            <Text
              position={[-0.78, -0.18, 0.02]}
              fontSize={0.075}
              letterSpacing={0.04}
              anchorX="left"
              anchorY="middle"
              color="#ffd2d8"
              material-transparent
              material-opacity={reveal * 0.8}
            >
              {item.label}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

const skillNodes = [
  { label: "PYTHON", position: [-3.3, 1.65, -1.2], color: "#ff6b7f" },
  { label: "REACT", position: [-1.55, 2.78, -2.2], color: "#ff1744" },
  { label: "FLASK API", position: [1.55, 2.36, -2.0], color: "#ffffff" },
  { label: "SQL DATA", position: [3.2, 0.72, -1.1], color: "#ff8a95" },
  { label: "AI AGENTS", position: [1.65, -0.86, -1.4], color: "#ff3355" },
  { label: "SHIP", position: [-2.3, -0.72, -1.2], color: "#ffd0d7" },
];

function SkillConstellation({ scrollProgress }: { scrollProgress: number }) {
  const laptopX = useLaptopX();
  const rootRef = useRef<THREE.Group>(null);
  const lineRef = useRef<THREE.LineSegments>(null);
  const nodeMats = useRef<THREE.MeshBasicMaterial[]>([]);
  const lineMat = useRef<THREE.LineBasicMaterial>(null);

  const lineGeometry = useMemo(() => {
    const positions: number[] = [];
    const center = [0, 0.55, -1.4];
    skillNodes.forEach((node, index) => {
      positions.push(...center, ...node.position);
      const next = skillNodes[(index + 1) % skillNodes.length].position;
      positions.push(...node.position, ...next);
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const visible = phase(scrollProgress, 0.54, 0.82);
    if (rootRef.current) {
      rootRef.current.position.x = laptopX;
      rootRef.current.rotation.y = Math.sin(t * 0.24) * 0.12 + smoothstep(0.55, 0.82, scrollProgress) * 0.22;
      rootRef.current.position.y = Math.sin(t * 0.7) * 0.05;
      rootRef.current.scale.setScalar(0.92 + visible * 0.16);
    }
    if (lineMat.current) lineMat.current.opacity = visible * 0.56;
    nodeMats.current.forEach((mat, index) => {
      mat.opacity = visible * (0.55 + Math.sin(t * 1.8 + index) * 0.18);
    });
  });

  return (
    <group ref={rootRef} position={[laptopX, 0, -1.34]}>
      <lineSegments ref={lineRef} geometry={lineGeometry}>
        <lineBasicMaterial ref={lineMat} color="#ff1744" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>
      {skillNodes.map((node, index) => (
        <group key={node.label} position={node.position as [number, number, number]}>
          <mesh>
            <sphereGeometry args={[0.055, 18, 18]} />
            <meshBasicMaterial
              ref={(mat) => {
                if (mat) nodeMats.current[index] = mat;
              }}
              color={node.color}
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          <Text
            position={[0.14, 0.02, 0]}
            fontSize={0.105}
            letterSpacing={0.08}
            anchorX="left"
            anchorY="middle"
            color={node.color}
            material-transparent
            material-opacity={phase(scrollProgress, 0.56, 0.81)}
          >
            {node.label}
          </Text>
        </group>
      ))}
    </group>
  );
}

const projectBeacons = [
  { label: "FINDIT", position: [-3.35, -1.92, -3.65], scale: 1.14 },
  { label: "ZAMINSAATHI", position: [-1.0, -1.92, -4.55], scale: 1.0 },
  { label: "HOSTEL OPS", position: [1.28, -1.92, -4.35], scale: 0.96 },
  { label: "HEALTHGPT", position: [3.42, -1.92, -3.48], scale: 0.9 },
];

function ProjectBeacons({ scrollProgress }: { scrollProgress: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const beaconRefs = useRef<THREE.Group[]>([]);
  const mats = useRef<THREE.Material[]>([]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const visible = phase(scrollProgress, 0.83, 0.93);
    if (groupRef.current) groupRef.current.rotation.y = Math.sin(t * 0.16) * 0.025;
    beaconRefs.current.forEach((beacon, index) => {
      const base = projectBeacons[index];
      const rise = smoothstep(0.84 + index * 0.014, 0.89 + index * 0.014, scrollProgress);
      beacon.position.y = base.position[1] - (1 - rise) * 0.9 + Math.sin(t * 1.2 + index) * 0.035 * visible;
      beacon.scale.setScalar(base.scale * (0.82 + rise * 0.18));
    });
    mats.current.forEach((mat, index) => {
      const material = mat as THREE.MeshBasicMaterial;
      material.opacity = visible * (0.22 + (index % 3) * 0.1 + Math.sin(t * 1.6 + index) * 0.035);
    });
  });

  return (
    <group ref={groupRef}>
      {projectBeacons.map((beacon, index) => (
        <group
          key={beacon.label}
          ref={(group) => {
            if (group) beaconRefs.current[index] = group;
          }}
          position={beacon.position as [number, number, number]}
          scale={beacon.scale}
        >
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.42, 0.46, 96]} />
            <meshBasicMaterial
              ref={(mat) => {
                if (mat) mats.current[index * 3] = mat;
              }}
              color="#ff1744"
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[0, 0.62, 0]} rotation={[0, Math.PI / 4, 0]}>
            <boxGeometry args={[0.72, 1.22, 0.018]} />
            <meshBasicMaterial
              ref={(mat) => {
                if (mat) mats.current[index * 3 + 1] = mat;
              }}
              color={index === 1 ? "#ffffff" : "#ff1744"}
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          <mesh position={[0, 0.62, 0]} rotation={[0, -Math.PI / 4, 0]}>
            <boxGeometry args={[0.72, 1.22, 0.018]} />
            <meshBasicMaterial
              ref={(mat) => {
                if (mat) mats.current[index * 3 + 2] = mat;
              }}
              color="#ff3355"
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          <Text
            position={[0, 1.38, 0]}
            rotation={[-0.12, 0, 0]}
            fontSize={0.13}
            letterSpacing={0.1}
            anchorX="center"
            anchorY="middle"
            color="#ffe8ec"
            material-transparent
            material-opacity={phase(scrollProgress, 0.85, 0.92)}
          >
            {beacon.label}
          </Text>
        </group>
      ))}
    </group>
  );
}

function TransmissionSignal({ scrollProgress }: { scrollProgress: number }) {
  const laptopX = useLaptopX();
  const groupRef = useRef<THREE.Group>(null);
  const mats = useRef<THREE.MeshBasicMaterial[]>([]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const visible = phase(scrollProgress, 0.82, 1);
    if (groupRef.current) {
      groupRef.current.position.x = laptopX + 0.1;
      groupRef.current.rotation.y = t * 0.12;
    }
    mats.current.forEach((mat, index) => {
      mat.opacity = visible * (0.08 + index * 0.07 + Math.sin(t * 1.2 + index) * 0.025);
    });
  });

  return (
    <group ref={groupRef} position={[laptopX + 0.1, -0.2, -1.6]} rotation={[0.8, 0, 0]}>
      {[1.2, 1.75, 2.35, 3.1].map((radius, index) => (
        <mesh key={radius}>
          <torusGeometry args={[radius, 0.008, 8, 160]} />
          <meshBasicMaterial
            ref={(mat) => {
              if (mat) mats.current[index] = mat;
            }}
            color={index === 3 ? "#ffffff" : "#ff1744"}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function StoryWorld({ scrollProgress }: { scrollProgress: number }) {
  return (
    <group>
      <StarWarpTunnel scrollProgress={scrollProgress} />
      <EntryProbe scrollProgress={scrollProgress} />
      <LaptopPortal scrollProgress={scrollProgress} />
      <InteriorWorld scrollProgress={scrollProgress} />
      <SkillConstellation scrollProgress={scrollProgress} />
      <ProjectBeacons scrollProgress={scrollProgress} />
      <TransmissionSignal scrollProgress={scrollProgress} />
    </group>
  );
}
