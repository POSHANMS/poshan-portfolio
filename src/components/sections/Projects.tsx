"use client";

import SectionShell from "./SectionShell";
import { PROJECTS } from "@/utils/constants";

export default function Projects() {
  return (
    <SectionShell id="projects" eyebrow="// PROJECTS" title="Built Systems">
      <div className="grid gap-6 lg:grid-cols-3">
        {PROJECTS.map((project, index) => (
          <article
            key={project.name}
            className="group min-h-[25rem] border border-white/10 bg-[linear-gradient(145deg,rgba(10,10,30,0.78),rgba(5,5,8,0.84))] p-6 backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-[var(--electric-blue)] hover:shadow-[0_0_35px_rgba(0,212,255,0.16)]"
          >
            <div className="mb-8 flex items-center justify-between font-mono text-xs text-white/35">
              <span>0{index + 1}</span>
              <span>{project.liveLabel || "REAL PROJECT"}</span>
            </div>
            <h3 className="text-3xl font-black text-white">{project.name}</h3>
            <p className="mt-2 font-mono text-sm text-[var(--electric-blue)]">{project.subtitle}</p>
            <p className="mt-5 text-sm leading-7 text-white/62">{project.description}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {project.stack.map((item) => (
                <span key={item} className="border border-white/10 px-2.5 py-1 text-[11px] text-white/58">
                  {item}
                </span>
              ))}
            </div>
            {project.href ? (
              <a className="mt-8 inline-block font-mono text-xs uppercase tracking-[0.22em] text-[var(--terminal-green)]" href={project.href} target="_blank" rel="noreferrer">
                Open live ↗
              </a>
            ) : (
              <p className="mt-8 font-mono text-xs uppercase tracking-[0.22em] text-white/35">Live link not provided</p>
            )}
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
