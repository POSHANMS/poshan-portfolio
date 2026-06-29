uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;

varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;

  for (int i = 0; i < 6; i++) {
    value += amplitude * noise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }

  return value;
}

void main() {
  vec2 uv = vUv;
  vec2 aspectUv = vec2((uv.x - 0.5) * (uResolution.x / uResolution.y), uv.y - 0.5);

  vec2 slowDrift = vec2(uTime * 0.018, -uTime * 0.009);
  float cloudA = fbm(uv * 3.1 + slowDrift);
  float cloudB = fbm(uv * 4.4 - slowDrift * 1.4 + vec2(8.2, 2.7));
  float cloudC = fbm(uv * 7.0 + vec2(-uTime * 0.012, uTime * 0.016));

  float upperMask = smoothstep(0.18, 0.58, uv.y);
  float horizonMask = smoothstep(0.08, 0.28, uv.y);

  vec2 galaxyCenter = vec2(0.64, 0.75);
  vec2 galaxyVector = uv - galaxyCenter;
  float galaxyRadius = length(galaxyVector);
  float galaxyAngle = atan(galaxyVector.y, galaxyVector.x);
  float spiral = 0.5 + 0.5 * cos(galaxyAngle * 3.0 - 10.0 * galaxyRadius + uTime * 0.18);
  float galaxyCore = exp(-galaxyRadius * galaxyRadius * 42.0);
  float galaxyArms = exp(-galaxyRadius * galaxyRadius * 9.0) * pow(spiral, 2.2);

  vec2 faceCenter = vec2(-0.58, 0.2);
  float faceSilhouette = exp(-length(aspectUv - faceCenter) * 3.2) * smoothstep(0.24, 0.72, uv.y);

  float fogShape = pow(cloudA, 3.2) * 0.58 + pow(cloudB, 3.8) * 0.72 + pow(cloudC, 5.0) * 0.42;
  fogShape *= upperMask * horizonMask;

  vec3 blueFog = vec3(0.0, 0.18, 0.72) * pow(cloudA, 4.2) * 0.22;
  vec3 violetFog = vec3(0.38, 0.06, 0.85) * pow(cloudB, 4.4) * 0.18;
  vec3 magentaFog = vec3(0.9, 0.06, 0.42) * pow(cloudC, 5.4) * 0.16;
  vec3 cyanEdge = vec3(0.0, 0.85, 1.0) * galaxyArms * 0.35;
  vec3 purpleCore = vec3(0.55, 0.15, 1.0) * galaxyCore * 0.42;
  vec3 faceGlow = vec3(0.18, 0.03, 0.55) * faceSilhouette * 0.08;

  float horizonGlow = exp(-pow(uv.y - 0.22, 2.0) * 58.0);
  vec3 horizonColor = vec3(0.0, 0.3, 0.8) * horizonGlow * 0.06 + vec3(0.8, 0.04, 0.5) * horizonGlow * 0.03;

  vec3 color = blueFog + violetFog + magentaFog + cyanEdge + purpleCore + faceGlow + horizonColor;
  color = clamp(color, 0.0, 1.35);

  float alpha = clamp(fogShape * 0.14 + galaxyCore * 0.12 + galaxyArms * 0.08 + horizonGlow * 0.05 + faceSilhouette * 0.04, 0.0, 0.24);
  alpha *= smoothstep(0.02, 0.18, uv.y);

  gl_FragColor = vec4(color, alpha);
}
