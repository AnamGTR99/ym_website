import { Effect, BlendFunction } from "postprocessing";
import { Uniform, Color } from "three";

const fragmentShader = /* glsl */ `
uniform vec3 shadowColor;
uniform vec3 highlightColor;
uniform float intensity;
uniform float contrast;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 col = inputColor.rgb;

  // Perceptual luminance
  float lum = dot(col, vec3(0.299, 0.587, 0.114));

  // S-curve contrast
  float s = smoothstep(0.0, 1.0, lum);
  s = s * s * (3.0 - 2.0 * s);
  s = mix(lum, s, contrast);

  // Split-tone: tint shadows toward shadowColor, highlights toward highlightColor
  // Using overlay blend — preserves original brightness while shifting hue
  vec3 shadowTint = mix(col, shadowColor, (1.0 - s) * intensity);
  vec3 highlightTint = mix(col, highlightColor, s * intensity * 0.5);
  vec3 result = mix(shadowTint, highlightTint, s);

  outputColor = vec4(clamp(result, 0.0, 1.0), inputColor.a);
}
`;

export class SplitToningEffect extends Effect {
  constructor({
    shadowColor = 0x2a1040,
    highlightColor = 0xd4a853,
    intensity = 0.55,
    contrast = 0.5,
  } = {}) {
    super("SplitToning", fragmentShader, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, Uniform>([
        [
          "shadowColor",
          new Uniform(new Color(shadowColor)),
        ],
        [
          "highlightColor",
          new Uniform(new Color(highlightColor)),
        ],
        ["intensity", new Uniform(intensity)],
        ["contrast", new Uniform(contrast)],
      ]),
    });
  }
}
