/*
 * Mathematical formulations for Nebula Fragment Shader:
 * 
 * 1. Pseudo-Random Noise Generator (2D):
 *    Hash(p) = fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123)
 * 
 * 2. 2D Bilinear Noise Interpolation:
 *    Let P = (x, y) and i = floor(P), f = fract(P).
 *    Let u = f * f * (3.0 - 2.0 * f) be the cubic Hermite interpolator.
 *    InterpolatedValue = mix(mix(Hash(i), Hash(i + (1,0)), u.x),
 *                            mix(Hash(i + (0,1)), Hash(i + (1,1)), u.x), u.y)
 * 
 * 3. Fractional Brownian Motion (fBm):
 *    fBm(p) = sum_{k=0}^{M-1} amplitude_k * Noise(p * frequency_k)
 *    where amplitude_k = (0.5)^k, frequency_k = (2.0)^k.
 * 
 * 4. Logarithmic Spiral (Galaxy Swirl):
 *    Let d_gp = P - P_galaxy_center.
 *    Let r = length(d_gp), theta = atan(d_gp.y, d_gp.x).
 *    SpiralFactor = cos(theta - 3.0 * log(r) + time_offset).
 *    GalaxyIntensity = exp(-r * r * 4.0) * max(0.0, SpiralFactor)
 * 
 * 5. Signed Distance Fields (SDFs) for Head Silhouette:
 *    Let center C = (0.25, 0.75) in UV coordinates.
 *    - Head (Ellipse): SDF_head = length((P - C) / semi_axes) - 1.0
 *    - Neck (Rectangle): SDF_neck = max(abs(P.x - C.x) - w_n, abs(P.y - C.y + d_y) - h_n)
 *    - Shoulder (Circle): SDF_shoulder = length(P - C_shoulder) - r_shoulder
 *    Combined Silhouette = smoothstep(blur, 0.0, min(SDF_head, min(SDF_neck, SDF_shoulder)))
 */

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;

varying vec2 vUv;

// Pseudo-random 2D Hash function
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

// 2D Value Noise
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f); // Hermite smoothing

  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

// Fractional Brownian Motion (fBm)
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  
  // 5 octaves for high detail
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

// Procedural Face Silhouette SDF
float getFaceSilhouette(vec2 uv) {
  // Translate to top left corner
  vec2 p = uv - vec2(0.18, 0.78);
  
  // Head Ellipse (SDF)
  vec2 headAxes = vec2(0.09, 0.12);
  float head = length(p / headAxes) - 1.0;
  
  // Jaw/chin offset circle
  float chin = length(p - vec2(-0.02, -0.05)) - 0.06;
  float skull = min(head, chin);

  // Neck Rectangle (SDF)
  vec2 neckCenter = vec2(-0.01, -0.15);
  vec2 neckHalf = vec2(0.035, 0.07);
  vec2 dNeck = abs(p - neckCenter) - neckHalf;
  float neck = length(max(dNeck, 0.0)) + min(max(dNeck.x, dNeck.y), 0.0);

  // Shoulder Circle (SDF)
  vec2 shoulderCenter = vec2(0.08, -0.32);
  float shoulder = length(p - shoulderCenter) - 0.22;
  
  // Combine all parts using CSG Union (min)
  float silhouette = min(skull, min(neck, shoulder));
  
  // Smooth edges
  return smoothstep(0.02, 0.0, silhouette);
}

void main() {
  vec2 uv = vUv;

  // Volumetric fog noise drifting over time
  vec2 driftUv = uv * 3.0 + vec2(uTime * 0.02, uTime * 0.015);
  float n = fbm(driftUv);

  // Colors: Void-Black base, deep violet, electric blue, and hot pink highlights
  vec3 voidBlack = vec3(0.02, 0.02, 0.03);
  vec3 deepViolet = vec3(0.18, 0.11, 0.41);
  vec3 electricBlue = vec3(0.0, 0.83, 1.0);
  vec3 hotPink = vec3(1.0, 0.18, 0.47);

  // Mix volumetric fog
  vec3 fogColor = mix(voidBlack, deepViolet, n);
  fogColor += electricBlue * pow(n, 3.0) * 0.25;
  fogColor += hotPink * pow(n, 4.0) * 0.15;

  // 1. Procedural Galaxy Swirl in the Top-Right Corner
  vec2 galaxyCenter = vec2(0.85, 0.85);
  vec2 dGalaxy = uv - galaxyCenter;
  float rGalaxy = length(dGalaxy);
  float thetaGalaxy = atan(dGalaxy.y, dGalaxy.x);
  
  // Logarithmic spiral math
  float spiral = cos(thetaGalaxy - 4.5 * log(rGalaxy) - uTime * 0.4);
  float galaxyMask = exp(-rGalaxy * rGalaxy * 18.0) * smoothstep(0.0, 0.5, spiral);
  vec3 galaxyColor = mix(vec3(0.0), vec3(0.5, 0.2, 0.8), galaxyMask); // Deep purple swirl
  
  // Blend galaxy swirl
  fogColor += galaxyColor * 0.6;

  // 2. Procedural Face Silhouette in the Top-Left Corner
  float faceMask = getFaceSilhouette(uv);
  
  // Blend face silhouette with a very low opacity, subtle shadow overlay
  // Gives it a ghost-in-the-machine hologram feel
  vec3 faceGlow = vec3(0.0, 0.4, 0.5) * faceMask * 0.08;
  fogColor = mix(fogColor, voidBlack, faceMask * 0.07) + faceGlow;

  // Vignette effect to darken edges
  float vignette = uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y);
  vignette = clamp(pow(16.0 * vignette, 0.25), 0.0, 1.0);
  
  gl_FragColor = vec4(fogColor * vignette, 1.0);
}
