declare module "@react-three/postprocessing" {
  import React from "react";

  export interface EffectComposerProps {
    children?: React.ReactNode;
    disableNormalPass?: boolean;
    multisampling?: number;
    depthBuffer?: boolean;
  }

  export interface BloomProps {
    ref?: React.Ref<any>;
    intensity?: number;
    radius?: number;
    luminanceThreshold?: number;
    luminanceSmoothing?: number;
    mipmapBlur?: boolean;
  }

  export const EffectComposer: React.FC<EffectComposerProps>;
  export const Bloom: React.FC<BloomProps>;
}
