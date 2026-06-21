/*
 * Mathematical formulations for Rings Fragment Shader:
 * 
 * 1. Normalized Radial Distance:
 *    Let P = vUv - vec2(0.5, 0.5) be the UV offset from the center.
 *    r = length(P)
 * 
 * 2. Concentric Wave Function:
 *    Let K = 45.0 be the wave density.
 *    Let omega = 4.0 be the wave speed.
 *    wave = sin(r * K - uTime * omega)
 * 
 * 3. Thin Neon Ring Mask:
 *    ringMask = smoothstep(0.85, 0.98, wave)
 * 
 * 4. Radial Fade (Distance Decay):
 *    fade = max(0.0, 1.0 - (r * 2.2))
 */

uniform float uTime;
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vec2 uv = vUv;
  
  // Calculate distance from center (UV coordinate range is [0, 1])
  vec2 center = uv - vec2(0.5, 0.5);
  float r = length(center);
  
  // Spatial wave density (40.0) and expansion speed (3.0)
  float wave = sin(r * 45.0 - uTime * 4.0);
  
  // Create thin, sharp rings instead of broad sine waves
  float ringMask = smoothstep(0.85, 0.98, wave);
  
  // Fades out rings as they expand outward
  float fade = max(0.0, 1.0 - (r * 2.2));
  
  // Cyberpunk colors: Electric blue at the center, shifting to violet/pink on edges
  vec3 innerColor = vec3(0.0, 0.83, 1.0); // Cyan/Electric Blue
  vec3 outerColor = vec3(1.0, 0.18, 0.47); // Hot Pink
  vec3 ringColor = mix(innerColor, outerColor, r * 2.0);
  
  // Apply mask, fade, and increase brightness for bloom
  vec4 finalColor = vec4(ringColor, ringMask * fade * 0.7);
  
  // Discard completely transparent pixels to save fillrate
  if (finalColor.a < 0.01) {
    discard;
  }
  
  gl_FragColor = finalColor;
}
