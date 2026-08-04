"use client";

import React, { useMemo, useRef } from "react";
import { Html, QuadraticBezierLine } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import DashboardHero from "@/components/ui/DashboardHero";

interface HolographicProjectionProps {
  scrollProgress: number;
  laptopScreenRef: React.MutableRefObject<THREE.Mesh | null>;
  visible: boolean;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smoothstep = (value: number) => value * value * (3 - 2 * value);
const easeOutExpo = (value: number) => (value >= 1 ? 1 : 1 - Math.pow(2, -10 * value));

export default function HolographicProjection({
  scrollProgress,
  laptopScreenRef,
  visible,
}: HolographicProjectionProps) {
  const { camera } = useThree();
  const rigRef = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const beamLinesRef = useRef<THREE.LineSegments>(null);
  const beamLinesGeometryRef = useRef<THREE.BufferGeometry>(null);
  const beamLinesMaterialRef = useRef<THREE.LineBasicMaterial>(null);
  const htmlShellRef = useRef<HTMLDivElement>(null);
  const rimLightRef = useRef<THREE.PointLight>(null);
  const cornerARef = useRef<THREE.Group>(null);
  const cornerBRef = useRef<THREE.Group>(null);
  const cornerCRef = useRef<THREE.Group>(null);
  const cornerDRef = useRef<THREE.Group>(null);

  const scratch = useMemo(
    () => ({
      screenPosition: new THREE.Vector3(),
      screenQuaternion: new THREE.Quaternion(),
      screenScale: new THREE.Vector3(),
      cameraDirection: new THREE.Vector3(),
      panelPosition: new THREE.Vector3(),
      midpoint: new THREE.Vector3(),
      beamDirection: new THREE.Vector3(),
      screenNormal: new THREE.Vector3(),
      up: new THREE.Vector3(0, 1, 0),
      panelRight: new THREE.Vector3(),
      panelUp: new THREE.Vector3(),
      cornerA: new THREE.Vector3(),
      cornerB: new THREE.Vector3(),
      cornerC: new THREE.Vector3(),
      cornerD: new THREE.Vector3(),
    }),
    [],
  );

  const beamMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uOpacity: { value: 0 },
          uTime: { value: 0 },
          uPulse: { value: 0 },
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vWorldPosition;

          void main() {
            vUv = uv;
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * viewMatrix * worldPosition;
          }
        `,
        fragmentShader: `
          uniform float uOpacity;
          uniform float uTime;
          uniform float uPulse;
          varying vec2 vUv;

          void main() {
            float axis = abs(vUv.x - 0.5) * 2.0;
            float core = smoothstep(1.0, 0.08, axis);
            float rim = smoothstep(0.96, 0.28, axis) * 0.38;
            float scan = sin((vUv.y * 42.0) - (uTime * 6.0)) * 0.5 + 0.5;
            float fadeFromScreen = mix(0.25, 0.05, vUv.y);
            float alpha = (core * 0.38 + rim + scan * 0.08) * fadeFromScreen * uOpacity;
            vec3 hotCore = vec3(1.0, 0.19, 0.27);
            vec3 deepCrimson = vec3(0.75, 0.02, 0.09);
            vec3 color = mix(hotCore, deepCrimson, vUv.y) * (1.0 + uPulse * 0.55);

            if (alpha < 0.002) discard;
            gl_FragColor = vec4(color, alpha);
          }
        `,
      }),
    [],
  );
  const beamLinePositions = useMemo(() => new Float32Array(24), []);

  useFrame((state) => {
    const screen = laptopScreenRef.current;
    const rig = rigRef.current;
    const beam = beamRef.current;

    if (!screen || !rig || !beam) {
      if (htmlShellRef.current) htmlShellRef.current.style.opacity = "0";
      return;
    }

    const p = clamp01(scrollProgress);
    const project = easeOutExpo(clamp01(p / 0.3));
    const hold = p >= 0.3 && p <= 0.8 ? 1 : 0;
    const dissolve = smoothstep(clamp01((p - 0.8) / 0.2));
    const opacity = visible ? project * (1 - dissolve) : 0;
    const scale = 0.05 + 0.95 * project;

    screen.updateWorldMatrix(true, false);
    screen.matrixWorld.decompose(
      scratch.screenPosition,
      scratch.screenQuaternion,
      scratch.screenScale,
    );

    scratch.cameraDirection
      .copy(camera.position)
      .sub(scratch.screenPosition)
      .normalize();

    scratch.screenNormal
      .set(0, 0, 1)
      .applyQuaternion(scratch.screenQuaternion)
      .normalize();

    scratch.panelPosition
      .copy(scratch.screenPosition)
      .addScaledVector(scratch.cameraDirection, THREE.MathUtils.lerp(0.08, 2.85, project))
      .addScaledVector(scratch.screenNormal, THREE.MathUtils.lerp(0.0, 0.2, project));

    rig.position.copy(scratch.panelPosition);
    rig.lookAt(camera.position);
    rig.rotateX(-0.05);
    rig.scale.setScalar(scale);
    rig.visible = opacity > 0.002;

    if (htmlShellRef.current) {
      htmlShellRef.current.style.opacity = opacity.toFixed(4);
      htmlShellRef.current.style.filter = `saturate(${1 + hold * 0.18}) brightness(${0.85 + project * 0.2})`;
      htmlShellRef.current.style.transform = `translateZ(0) scale(${1 - dissolve * 0.08})`;
    }

    scratch.midpoint.copy(scratch.screenPosition).lerp(scratch.panelPosition, 0.5);
    scratch.beamDirection.copy(scratch.panelPosition).sub(scratch.screenPosition);
    const beamLength = scratch.beamDirection.length();

    beam.position.copy(scratch.midpoint);
    beam.quaternion.setFromUnitVectors(
      scratch.up,
      scratch.beamDirection.normalize(),
    );
    beam.scale.set(
      THREE.MathUtils.lerp(0.08, 1.0, project),
      beamLength,
      THREE.MathUtils.lerp(0.08, 1.0, project),
    );
    beam.visible = opacity > 0.002;
    beamMaterial.uniforms.uOpacity.value = opacity * 1.15;
    beamMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    beamMaterial.uniforms.uPulse.value = Math.sin(state.clock.elapsedTime * 4.0) * 0.5 + 0.5;

    if (rimLightRef.current) {
      rimLightRef.current.position.copy(scratch.panelPosition);
      rimLightRef.current.intensity = opacity * 2.4;
      rimLightRef.current.distance = 4.5;
    }

    scratch.panelRight.set(1, 0, 0).applyQuaternion(rig.quaternion).multiplyScalar(0.94 * scale);
    scratch.panelUp.set(0, 1, 0).applyQuaternion(rig.quaternion).multiplyScalar(0.52 * scale);
    scratch.cornerA.copy(scratch.panelPosition).sub(scratch.panelRight).add(scratch.panelUp);
    scratch.cornerB.copy(scratch.panelPosition).add(scratch.panelRight).add(scratch.panelUp);
    scratch.cornerC.copy(scratch.panelPosition).sub(scratch.panelRight).sub(scratch.panelUp);
    scratch.cornerD.copy(scratch.panelPosition).add(scratch.panelRight).sub(scratch.panelUp);

    cornerARef.current?.position.copy(scratch.cornerA);
    cornerBRef.current?.position.copy(scratch.cornerB);
    cornerCRef.current?.position.copy(scratch.cornerC);
    cornerDRef.current?.position.copy(scratch.cornerD);

    const lineGeometry = beamLinesGeometryRef.current;
    const lineMaterial = beamLinesMaterialRef.current;
    const lineMesh = beamLinesRef.current;
    if (lineGeometry && lineMaterial && lineMesh) {
      const positions = lineGeometry.getAttribute("position") as THREE.BufferAttribute;
      const corners = [scratch.cornerA, scratch.cornerB, scratch.cornerC, scratch.cornerD];
      corners.forEach((corner, index) => {
        const base = index * 2;
        positions.setXYZ(base, scratch.screenPosition.x, scratch.screenPosition.y, scratch.screenPosition.z);
        positions.setXYZ(base + 1, corner.x, corner.y, corner.z);
      });
      positions.needsUpdate = true;
      lineGeometry.computeBoundingSphere();
      lineMaterial.opacity = opacity * 0.62;
      lineMesh.visible = opacity > 0.01;
    }
  });

  return (
    <>
      <mesh ref={beamRef} material={beamMaterial} renderOrder={8}>
        <cylinderGeometry args={[0.62, 0.045, 1, 4, 24, true]} />
      </mesh>
      <lineSegments ref={beamLinesRef} renderOrder={10}>
        <bufferGeometry ref={beamLinesGeometryRef}>
          <bufferAttribute
            attach="attributes-position"
            array={beamLinePositions}
            count={8}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          ref={beamLinesMaterialRef}
          color="#ff2244"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      <group ref={rigRef} renderOrder={12}>
        <pointLight ref={rimLightRef} color="#ff2244" intensity={0} distance={4.5} decay={2} />
        <Html
          transform
          center
          distanceFactor={1.28}
          zIndexRange={[60, 20]}
          style={{ pointerEvents: "auto", userSelect: "none" }}
        >
          <div
            ref={htmlShellRef}
            className="holographic-dashboard-html"
            style={{
              width: "920px",
              maxWidth: "920px",
              opacity: 0,
              transformOrigin: "center center",
              willChange: "opacity, filter, transform",
              transition: "none",
            }}
          >
            <DashboardHero scrollProgress={scrollProgress} stageScale={1} spatial />
          </div>
        </Html>
      </group>

      {["a", "b", "c", "d"].map((key, index) => {
        const ref = [cornerARef, cornerBRef, cornerCRef, cornerDRef][index];
        return (
          <group key={key} ref={ref}>
            <QuadraticBezierLine
              start={[0, 0, 0]}
              end={[0, 0, 0]}
              mid={[0, 0, 0]}
              color="#ff2244"
              lineWidth={0.55}
              transparent
              opacity={0}
            />
          </group>
        );
      })}
    </>
  );
}
