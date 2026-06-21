/*
 * Mathematical formulations for vertex projection:
 * Let P_model be the 3D model coordinate of a vertex: P_model = [x, y, z, 1]^T
 * Let M_modelview be the model-view transformation matrix.
 * Let M_proj be the camera projection matrix.
 * The projected homogeneous coordinate P_clip is given by:
 *   P_clip = M_proj * M_modelview * P_model
 * 
 * Texture coordinates UV map:
 *   vUv = uv
 */

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
