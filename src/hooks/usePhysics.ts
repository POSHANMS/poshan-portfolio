"use client";

import { useDeviceSize } from "./useDeviceSize";

export function usePhysics() {
  const { deviceTier, reducedMotion } = useDeviceSize();
  return {
    enabled: deviceTier !== "mobile" && !reducedMotion,
    tier: deviceTier,
  };
}
