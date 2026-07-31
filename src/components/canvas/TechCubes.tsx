"use client";

import React from "react";
import TechCube from "./TechCube";

const cubesData = [
  {
    position: [-3.8, 1.8, -1.2] as [number, number, number],
    scale: 0.95,
    color: "#ff1744",
    glowColor: "#ff4444",
    logoPath: "/icons/react.svg",
  },
  {
    position: [4.2, 2.6, -2.5] as [number, number, number],
    scale: 0.85,
    color: "#ff1744",
    glowColor: "#ff3355",
    logoPath: "/icons/node.svg",
  },
  {
    position: [-4.6, -1.2, -0.8] as [number, number, number],
    scale: 0.75,
    color: "#ff1744",
    glowColor: "#ff5566",
    logoPath: "/icons/typescript.svg",
  },
  {
    position: [3.8, -1.6, -1.5] as [number, number, number],
    scale: 0.8,
    color: "#ff1744",
    glowColor: "#ff2244",
    logoPath: "/icons/mongodb.svg",
  },
];

export default function TechCubes({ cubesOpacity = 1 }: { cubesOpacity?: number }) {
  return (
    <group>
      {cubesData.map((cube, i) => (
        <TechCube key={i} {...cube} cubesOpacity={cubesOpacity} />
      ))}
    </group>
  );
}
