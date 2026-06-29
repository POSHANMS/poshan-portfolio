"use client";

import { useEffect, useState } from "react";

export type DeviceTier = "mobile" | "tablet" | "desktop";

export function useDeviceSize() {
  const [deviceTier, setDeviceTier] = useState<DeviceTier>("desktop");
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const update = () => {
      const width = window.innerWidth;
      setDeviceTier(width < 768 ? "mobile" : width < 1180 ? "tablet" : "desktop");
      setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return { deviceTier, reducedMotion };
}
