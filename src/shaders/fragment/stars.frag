/*
 * Mathematical formulations for Starfield Fragment Shader:
 * 
 * 1. Twinkling Intensity:
 *    Let T_f = 2.0 + vRandom * 3.0 be the frequency.
 *    Let T_o = vRandom * 100.0 be the phase offset.
 *    TwinkleIntensity = mix(uMinBrightness, 1.0, sin(time * T_f + T_o) * 0.5 + 0.5)
 * 
 * 2. Point Sprite Circular Masking (SDF):
 *    Let C = gl_PointCoord be the local coordinate of the point sprite, C in [0,1]x[0,1].
 *    Let d = length(C - vec2(0.5, 0.5)) be the distance from center.
 *    CircularMask = smoothstep(0.5, 0.2, d)  // Creates soft glowing edge
 */

uniform float uTime;

varying float vRandom;
varying vec3 vViewPosition;

void main() {
  // Compute distance from center of point sprite to draw a circle
  vec2 center = gl_PointCoord - vec2(0.5, 0.5);
  float dist = length(center);
  
  // Discard fragments outside the radius of the star particle
  if (dist > 0.5) {
    discard;
  }

  // Soft circular glow mask
  float glow = smoothstep(0.5, 0.0, dist);

  // Twinkling sine wave based on the random value per particle
  float twinkleFreq = 1.5 + vRandom * 3.5;
  float twinklePhase = vRandom * 62.8; // 20 * PI
  float twinkle = sin(uTime * twinkleFreq + twinklePhase) * 0.5 + 0.5;
  
  // Mix twinkle to adjust minimum brightness (stars never fully disappear)
  float brightness = mix(0.15, 1.0, twinkle);

  // Core color is electric-blue-white
  vec3 starColor = vec3(0.9, 0.95, 1.0);
  
  // Apply twinkle and circular glow mask
  gl_FragColor = vec4(starColor, brightness * glow);
}
