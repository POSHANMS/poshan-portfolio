"use client";

import SectionShell from "./SectionShell";

export default function About() {
  return (
    <SectionShell id="about" eyebrow="// ABOUT" title="Engineer In The Neon Stack">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="border border-white/10 bg-[rgba(10,10,30,0.58)] p-7 shadow-[0_0_30px_rgba(0,212,255,0.08)] backdrop-blur-xl">
          <p className="text-lg leading-8 text-white/78">
            I am Poshan MS, a Full Stack Engineer from Karnataka, India. I build scalable, performant, and beautiful web systems across frontend, backend, databases, real-time communication, auth, deployment, and practical AI/ML integration.
          </p>
          <p className="mt-6 text-base leading-7 text-white/62">
            My work leans toward solo execution, fast shipping, and complete systems: React interfaces, Flask and Node APIs, relational and document databases, Dockerized services, Cloudinary media flows, and production hosting on Vercel, Railway, and Render.
          </p>
        </div>
        <div className="grid gap-4">
          {["Karnataka, India", "Available for work / freelance", "2+ Years Experience", "20+ Projects Completed"].map((item) => (
            <div key={item} className="border border-[rgba(0,212,255,0.22)] bg-[rgba(5,5,8,0.72)] px-5 py-4 font-mono text-sm text-white/80 shadow-[0_0_18px_rgba(0,212,255,0.08)]">
              <span className="text-[var(--terminal-green)]">&gt;</span> {item}
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
