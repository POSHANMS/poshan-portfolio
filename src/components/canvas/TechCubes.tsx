"use client";

import React, { useMemo } from "react";
import { Physics } from "@react-three/rapier";
import { Line } from "@react-three/drei";
import TechCube from "./TechCube";

export default function TechCubes() {
  // Define positions to draw the network lines between cubes
  const cubeData = useMemo(() => [
    {
      name: "React",
      color: "#00d4ff",
      glowColor: "#00d4ff",
      logoPath: "/icons/react.svg",
      scale: 1.2,
      position: [-2.0, 2.0, 0.0] as [number, number, number],
    },
    {
      name: "Node",
      color: "#68a063",
      glowColor: "#68a063",
      logoPath: "/icons/node.svg",
      scale: 1.0,
      position: [3.0, 2.5, -1.0] as [number, number, number],
    },
    {
      name: "TypeScript",
      color: "#3178c6",
      glowColor: "#3178c6",
      logoPath: "/icons/typescript.svg",
      scale: 0.9,
      position: [3.5, 0.0, 0.0] as [number, number, number],
    },
    {
      name: "MongoDB",
      color: "#00ed64",
      glowColor: "#00ed64",
      logoPath: "/icons/mongodb.svg",
      scale: 0.7,
      position: [0.0, -1.5, 0.0] as [number, number, number],
    },
  ], []);

  // Form a closed loop path of lines connecting the floating cubes
  const linePoints = useMemo(() => {
    return [
      cubeData[0].position, // React
      cubeData[1].position, // Node
      cubeData[2].position, // TS
      cubeData[3].position, // MongoDB
      cubeData[0].position, // React (close loop)
    ];
  }, [cubeData]);

  return (
    <Physics gravity={[0, 0, 0]}>
      {/* 1. Renders the four glass tech cubes */}
      {cubeData.map((cube) => (
        <TechCube
          key={cube.name}
          color={cube.color}
          glowColor={cube.glowColor}
          logoPath={cube.logoPath}
          scale={cube.scale}
          position={cube.position}
        />
      ))}

      {/* 2. Renders the glowing data-link lines connecting the cubes */}
      <Line
        points={linePoints}
        color="#8b5cf6" // Deep violet network color
        lineWidth={1.0}
        opacity={0.4}
        transparent
      />
    </Physics>
  );
}
