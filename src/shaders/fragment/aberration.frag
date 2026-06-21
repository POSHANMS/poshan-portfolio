/*
 * Mathematical formulations for Chromatic Aberration:
 * Let I(uv) be the input texture color at coordinate uv.
 * Let d = uOffset be the displacement vector.
 * The displaced color channels are sampled as:
 *   Color_R = I(uv + d)
 *   Color_G = I(uv)
 *   Color_B = I(uv - d)
 * 
 * The combined output color is:
 *   Color_out = [Color_R.r, Color_G.g, Color_B.b, Color_G.a]
 */

uniform sampler2D tDiffuse;
uniform vec2 uOffset;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  
  // Sample red channel with positive offset, blue with negative, green centered
  float r = texture2D(tDiffuse, uv + uOffset).r;
  float g = texture2D(tDiffuse, uv).g;
  float b = texture2D(tDiffuse, uv - uOffset).b;
  float a = texture2D(tDiffuse, uv).a;
  
  gl_FragColor = vec4(r, g, b, a);
}
