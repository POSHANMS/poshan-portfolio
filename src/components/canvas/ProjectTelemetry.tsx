"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform float uProjectType;
  uniform float uOpacity;
  uniform vec2 uPointer;
  varying vec2 vUv;

  float segment(vec2 p, vec2 a, vec2 b, float width) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.0001), 0.0, 1.0);
    float d = length(pa - ba * h);
    return 1.0 - smoothstep(width, width * 2.4, d);
  }

  float node(vec2 p, vec2 center, float radius) {
    float d = length(p - center);
    return 1.0 - smoothstep(radius, radius * 1.8, d);
  }

  void main() {
    vec2 p = (vUv - 0.5) * vec2(1.72, 1.0);
    float time = uTime;
    vec3 ink = vec3(0.006, 0.012, 0.023);
    vec3 ice = vec3(0.24, 0.88, 1.0);
    vec3 mint = vec3(0.38, 1.0, 0.76);
    vec3 amber = vec3(1.0, 0.55, 0.23);
    vec3 violet = vec3(0.72, 0.48, 1.0);
    vec3 signal = ice;
    float lines = 0.0;
    float sparks = 0.0;

    float gridA = 1.0 - smoothstep(0.012, 0.034, abs(fract((p.x + 0.86) * 8.0) - 0.5));
    float gridB = 1.0 - smoothstep(0.012, 0.034, abs(fract((p.y + 0.5) * 6.0) - 0.5));
    float grid = max(gridA, gridB) * 0.11;

    if (uProjectType < 0.5) {
      // FINDIT: radar sweep, range rings, GPS targets and socket pulse.
      vec2 radar = p * vec2(0.86, 1.0);
      float radius = length(radar);
      float ring = 1.0 - smoothstep(0.014, 0.03, abs(fract(radius * 6.0) - 0.5));
      float angle = atan(radar.y, radar.x);
      float sweep = pow(max(0.0, cos(angle - time * 1.35)), 22.0) * smoothstep(0.04, 0.72, radius);
      lines = ring * 0.5 + sweep * 0.82 + grid * 0.28;
      signal = ice;
      sparks += node(radar, vec2(-0.34, 0.16), 0.027) * (0.55 + 0.45 * sin(time * 4.2));
      sparks += node(radar, vec2(0.28, -0.06), 0.023) * (0.55 + 0.45 * sin(time * 3.3 + 1.0));
      sparks += node(radar, vec2(0.08, 0.34), 0.02) * (0.55 + 0.45 * sin(time * 5.0));
      lines += segment(radar, vec2(-0.34, 0.16), vec2(0.28, -0.06), 0.0035) * 0.5;
      lines += segment(radar, vec2(0.28, -0.06), vec2(0.08, 0.34), 0.0035) * 0.42;
    } else if (uProjectType < 1.5) {
      // ZAMINSAATHI: three cooperating agents and a pulsing verification vector.
      signal = violet;
      vec2 a = vec2(-0.45, -0.18);
      vec2 b = vec2(0.0, 0.34);
      vec2 c = vec2(0.45, -0.18);
      lines = segment(p, a, b, 0.004) + segment(p, b, c, 0.004) + segment(p, c, a, 0.004);
      lines += segment(p, vec2(0.0, -0.18), b, 0.0025) * 0.7;
      sparks += node(p, a, 0.035) * (0.62 + 0.38 * sin(time * 3.3));
      sparks += node(p, b, 0.035) * (0.62 + 0.38 * sin(time * 3.3 + 2.1));
      sparks += node(p, c, 0.035) * (0.62 + 0.38 * sin(time * 3.3 + 4.2));
      float verify = 1.0 - smoothstep(0.018, 0.042, abs(p.x - (sin(time * 1.1) * 0.5)));
      lines += verify * 0.18;
    } else if (uProjectType < 2.5) {
      // HOSTEL SYSTEM: isometric room-allocation matrix with occupied units.
      signal = amber;
      vec2 iso = vec2(p.x + p.y * 0.62, p.y * 0.92);
      float diagA = 1.0 - smoothstep(0.012, 0.034, abs(fract((iso.x + 0.9) * 6.0) - 0.5));
      float diagB = 1.0 - smoothstep(0.012, 0.034, abs(fract((iso.x + iso.y + 0.8) * 5.0) - 0.5));
      float diagC = 1.0 - smoothstep(0.012, 0.034, abs(fract((iso.x - iso.y + 0.8) * 5.0) - 0.5));
      lines = max(diagA, max(diagB, diagC)) * (1.0 - smoothstep(0.18, 0.78, length(p))) * 0.7;
      for (int i = 0; i < 7; i++) {
        float fi = float(i);
        vec2 cell = vec2(-0.48 + mod(fi, 4.0) * 0.31, -0.25 + floor(fi / 4.0) * 0.3);
        float occupied = node(p, cell, 0.055);
        sparks += occupied * (i == 2 || i == 5 ? 0.95 : 0.38);
      }
      lines += grid * 0.24;
    } else if (uProjectType < 3.5) {
      // HEALTHGPT: layered neural lattice with a moving diagnostic scan.
      signal = mint;
      float scan = 1.0 - smoothstep(0.008, 0.04, abs(p.x - (fract(time * 0.22) * 1.4 - 0.7)));
      lines += scan * 0.48;
      for (int layer = 0; layer < 4; layer++) {
        float lx = -0.56 + float(layer) * 0.37;
        for (int n = 0; n < 4; n++) {
          float ny = -0.36 + float(n) * 0.24 + (mod(float(layer), 2.0) * 0.1);
          vec2 q = vec2(lx, ny);
          sparks += node(p, q, 0.019) * (0.55 + 0.45 * sin(time * 2.5 + float(layer * 4 + n)));
          if (layer < 3) {
            for (int next = 0; next < 4; next++) {
              float nextY = -0.36 + float(next) * 0.24 + (mod(float(layer + 1), 2.0) * 0.1);
              lines += segment(p, q, vec2(lx + 0.37, nextY), 0.0018) * 0.34;
            }
          }
        }
      }
    } else {
      // NOTEFLASH: relational note graph with traveling synchronization packets.
      signal = amber;
      vec2 n0 = vec2(-0.48, 0.18);
      vec2 n1 = vec2(-0.16, 0.35);
      vec2 n2 = vec2(0.18, 0.25);
      vec2 n3 = vec2(0.48, 0.08);
      vec2 n4 = vec2(-0.34, -0.2);
      vec2 n5 = vec2(0.02, -0.33);
      vec2 n6 = vec2(0.39, -0.24);
      lines += segment(p, n0, n1, 0.003) + segment(p, n1, n2, 0.003) + segment(p, n2, n3, 0.003);
      lines += segment(p, n0, n4, 0.003) + segment(p, n4, n5, 0.003) + segment(p, n5, n6, 0.003);
      lines += segment(p, n2, n5, 0.003) + segment(p, n3, n6, 0.003);
      sparks += node(p, n0, 0.025) + node(p, n1, 0.024) + node(p, n2, 0.03);
      sparks += node(p, n3, 0.022) + node(p, n4, 0.025) + node(p, n5, 0.03) + node(p, n6, 0.024);
      float packet = fract(time * 0.34);
      sparks += node(p, mix(n0, n1, packet), 0.016) * 1.4;
      sparks += node(p, mix(n5, n6, fract(packet + 0.48)), 0.016) * 1.4;
    }

    float pointerGlow = uPointer.x < -0.5 ? 0.0 : exp(-length(vUv - uPointer) * 13.0) * 0.28;
    float edge = 1.0 - smoothstep(0.18, 0.82, length(p * vec2(0.85, 1.0)));
    float scanline = 0.035 * sin(vUv.y * 620.0 + time * 0.9);
    vec3 color = ink + signal * (lines * 0.82 + sparks * 0.94 + pointerGlow + grid + scanline);
    color += vec3(0.035, 0.07, 0.095) * edge;
    float alpha = (0.78 + edge * 0.14 + lines * 0.08) * uOpacity;
    gl_FragColor = vec4(color, alpha);
  }
`;

export default function ProjectTelemetry({ projectIndex, active }: { projectIndex: number; active: boolean }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const pointer = useRef(new THREE.Vector2(-1, -1));
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uProjectType: { value: projectIndex },
    uOpacity: { value: 0 },
    uPointer: { value: new THREE.Vector2(-1, -1) },
  }), [projectIndex]);

  useFrame(({ clock }, delta) => {
    if (!material.current) return;
    material.current.uniforms.uTime.value = clock.getElapsedTime();
    material.current.uniforms.uProjectType.value = projectIndex;
    material.current.uniforms.uOpacity.value = THREE.MathUtils.damp(material.current.uniforms.uOpacity.value, active ? 1 : 0.18, 6, delta);
    material.current.uniforms.uPointer.value.lerp(pointer.current, 1 - Math.exp(-delta * 8));
  });

  return (
    <mesh
      position={[0, 0, 0.126]}
      onPointerMove={(event) => { if (event.uv) pointer.current.copy(event.uv); }}
      onPointerLeave={() => pointer.current.set(-1, -1)}
    >
      <planeGeometry args={[5.22, 3.08, 1, 1]} />
      <shaderMaterial ref={material} vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={uniforms} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
