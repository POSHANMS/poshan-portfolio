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

  for (int i = 0; i < 5; i++) {  // Increased from 4 to 5 octaves
    value += amplitude * noise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }

  return value;
}

void main() {
  vec2 uv = vUv;
  vec2 aspectUv = vec2((uv.x - 0.5) * (uResolution.x / uResolution.y), uv.y - 0.5);

  // Much slower drift for majestic feel
  vec2 slowDrift = vec2(uTime * 0.012, -uTime * 0.006);
  float cloudA = fbm(uv * 2.8 + slowDrift);
  float cloudB = fbm(uv * 3.8 - slowDrift * 1.2 + vec2(8.2, 2.7));
  float cloudC = fbm(uv * 6.0 + vec2(-uTime * 0.008, uTime * 0.012));
  float cloudD = fbm(uv * 9.0 + vec2(uTime * 0.004, -uTime * 0.008)); // Extra detail layer

  // Upper mask — allow more fog to show
  float upperMask = smoothstep(0.12, 0.65, uv.y);
  float horizonMask = smoothstep(0.06, 0.35, uv.y);

  // Galaxy swirl — positioned upper right like reference
  vec2 galaxyCenter = vec2(0.72, 0.68);
  vec2 galaxyVector = uv - galaxyCenter;
  float galaxyRadius = length(galaxyVector);
  float galaxyAngle = atan(galaxyVector.y, galaxyVector.x);
  float spiral = 0.5 + 0.5 * cos(galaxyAngle * 4.0 - 12.0 * galaxyRadius + uTime * 0.12);
  float galaxyCore = exp(-galaxyRadius * galaxyRadius * 55.0);
  float galaxyArms = exp(-galaxyRadius * galaxyRadius * 12.0) * pow(spiral, 2.5);

  // Data stream lines on left (like reference image)
  float streamLines = smoothstep(0.48, 0.52, sin(uv.y * 40.0 + uTime * 0.3)) * 
                      smoothstep(0.0, 0.25, uv.x) * 
                      smoothstep(1.0, 0.7, uv.x) * 0.5;

  // Fog density — MUCH denser than before
  float fogShape = pow(cloudA, 2.8) * 0.7 + pow(cloudB, 3.2) * 0.8 + 
                   pow(cloudC, 4.5) * 0.5 + pow(cloudD, 5.0) * 0.3;
  fogShape *= upperMask * horizonMask;

  // RICH RED COLOR PALETTE (matching reference)
  // Deep crimson core
  vec3 crimsonCore = vec3(0.95, 0.02, 0.08) * pow(cloudA, 2.5) * 0.35;
  // Burgundy mid-tones  
  vec3 burgundyMid = vec3(0.55, 0.0, 0.04) * pow(cloudB, 3.0) * 0.28;
  // Dark wine shadows
  vec3 wineShadow = vec3(0.25, 0.0, 0.02) * pow(cloudC, 4.0) * 0.18;
  // Bright red highlights
  vec3 redHighlight = vec3(1.0, 0.08, 0.15) * galaxyArms * 0.45;
  // Hot pink core glow
  vec3 pinkCore = vec3(1.0, 0.15, 0.35) * galaxyCore * 0.55;
  // Data stream glow
  vec3 streamGlow = vec3(0.9, 0.05, 0.12) * streamLines * 0.25;
  
  // Horizon glow — red sunset feel
  float horizonGlow = exp(-pow(uv.y - 0.18, 2.0) * 45.0);
  vec3 horizonColor = vec3(0.85, 0.02, 0.06) * horizonGlow * 0.12 + 
                      vec3(0.4, 0.0, 0.02) * horizonGlow * 0.06;

  vec3 color = crimsonCore + burgundyMid + wineShadow + redHighlight + pinkCore + streamGlow + horizonColor;
  
  // Boost overall brightness
  color = clamp(color, 0.0, 1.8);

  // Alpha — much more visible
  float alpha = clamp(fogShape * 0.35 + galaxyCore * 0.25 + galaxyArms * 0.18 + 
                      horizonGlow * 0.12 + streamLines * 0.08, 0.0, 0.55);
  alpha *= smoothstep(0.01, 0.12, uv.y);

  gl_FragColor = vec4(color, alpha);
}
