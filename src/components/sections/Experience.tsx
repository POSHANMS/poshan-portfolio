"use client";

import SectionShell from "./SectionShell";

const timeline = [
  ["Full Stack Engineering", "2+ years building React, Next.js, Flask, Node.js, Express, SQL, NoSQL, auth, uploads, and deployment workflows."],
  ["Solo Product Builds", "FindIt was built solo in 2 weeks with real-time notifications, image upload, JWT auth, Docker, PostgreSQL, Redis, and Cloudinary."],
  ["Deployment Practice", "Projects shipped across Vercel, Railway, Render, Cloudinary, and MongoDB Atlas."],
  ["Security + Systems", "Hands-on fundamentals in log analysis, vulnerability assessment, ethical hacking basics, DSA, OOP, REST APIs, DBMS, operating systems, and networks."],
];

export default function Experience() {
  return (
    <SectionShell id="experience" eyebrow="// EXPERIENCE" title="Operating Timeline">
      <div className="relative border-l border-[rgba(0,212,255,0.35)] pl-8">
        {timeline.map(([title, body], index) => (
          <div key={title} className="relative mb-10 last:mb-0">
            <div className="absolute -left-[2.6rem] top-1 h-4 w-4 rounded-full border border-[var(--electric-blue)] bg-[#050508] shadow-[0_0_18px_var(--electric-blue)]" />
            <p className="font-mono text-xs text-[var(--hot-pink)]">0{index + 1}</p>
            <h3 className="mt-2 text-2xl font-bold text-white">{title}</h3>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/62">{body}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
