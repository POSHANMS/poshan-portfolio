"use client";

import { getProject } from "@theatre/core";

if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  import("@theatre/studio").then((studio) => {
    studio.default.initialize();
  });
}

// Create the Theatre.js project
// During development, state is saved to localStorage.
// Once complete, we export the JSON state and pass it as getProject("Portfolio", { state: exportedState })
const project = getProject("Portfolio");

// Create the animation sheet for cinematic camera controls
const sheet = project.sheet("Camera Timeline");

export { project, sheet };
