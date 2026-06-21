/*
 * Mathematical formulations for Starfield Vertex Shader:
 * 
 * 1. Perspective Depth Attenuation for Points:
 *    Let P_mv = M_modelview * vec4(position, 1.0) be the position in view-space.
 *    To simulate depth, point size scales inversely with depth:
 *      gl_PointSize = size * (uScaleAttenuation / -P_mv.z)
 *    where uScaleAttenuation is a constant related to viewport height and camera focal length.
 * 
 * 2. Vertex Projection:
 *    gl_Position = M_proj * P_mv
 */

uniform float uSize;
attribute float aRandom;

varying float vRandom;
varying vec3 vViewPosition;

void main() {
  vRandom = aRandom;
  
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = mvPosition.xyz;
  
  gl_Position = projectionMatrix * mvPosition;
  
  // Point size attenuation based on distance from camera
  // 300.0 is the scale factor for perspective projection scaling
  gl_PointSize = uSize * (300.0 / -mvPosition.z);
}
