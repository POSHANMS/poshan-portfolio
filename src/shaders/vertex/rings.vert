/*
 * Mathematical formulations for Rings Vertex Shader:
 * 
 * 1. Vertex Projection:
 *    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0)
 * 
 * 2. UV Interpolation:
 *    vUv = uv
 */

varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vUv = uv;
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
