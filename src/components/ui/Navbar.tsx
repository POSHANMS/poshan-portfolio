"use client";

import React, { useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const navLinks = ["HOME", "ABOUT", "SKILLS", "PROJECTS", "EXPERIENCE", "BLOG", "CONTACT"];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("HOME");

  const handleLinkClick = (link: string) => {
    setActiveLink(link);
    setIsOpen(false);

    const targetElement = document.getElementById(link.toLowerCase());
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const renderNavLabel = (link: string) => link;

  return (
    <>
      <nav className="fixed left-0 top-0 z-50 w-full border-b border-white/[0.04] bg-[#050508]/35 px-6 py-4 backdrop-blur-md md:px-12">
        <div className="mx-auto flex max-w-[96rem] items-center justify-between">
          <div className="flex select-none items-center space-x-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#ff1744]/20 bg-[#ff1744]/5 shadow-[0_0_18px_rgba(255,23,68,0.18)]">
              <svg width="30" height="34" viewBox="0 0 40 45" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_10px_var(--electric-blue)]">
                <path d="M5 5H22C28.6274 5 34 10.3726 34 17C34 23.6274 28.6274 29 22 29H13V40" stroke="#ff1744" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13 17H22C23.6569 17 25 15.6569 25 14C25 12.3431 23.6569 11 22 11H13V17Z" fill="#800010" />
              </svg>
            </div>

            <div className="flex flex-col">
              <span className="text-xs font-bold tracking-[0.28em] text-white md:text-sm">POSHAN MS</span>
              <span className="font-mono text-[8px] font-medium uppercase tracking-[0.24em] text-[var(--electric-blue)] text-glow-blue md:text-[9px]">
                Full Stack Engineer
              </span>
            </div>
          </div>

          <div className="hidden items-center space-x-4 lg:flex">
            {navLinks.map((link, idx) => (
              <React.Fragment key={link}>
                {idx > 0 && <span className="select-none text-[8px] text-white/25">{"•"}</span>}
                <button
                  type="button"
                  suppressHydrationWarning
                  onClick={() => handleLinkClick(link)}
                  className={`relative px-3 py-1 font-mono text-[10px] font-semibold tracking-widest transition-all duration-300 md:text-xs ${
                    activeLink === link ? "text-[var(--electric-blue)] text-glow-blue" : "text-white/64 hover:text-white"
                  }`}
                >
                  {renderNavLabel(link)}
                  {activeLink === link && (
                    <motion.div
                      layoutId="activeUnderline"
                      className="absolute bottom-[-11px] left-3 right-3 h-[2px] bg-gradient-to-r from-[var(--electric-blue)] to-[var(--hot-pink)] shadow-[0_0_8px_var(--electric-blue)]"
                    />
                  )}
                </button>
              </React.Fragment>
            ))}
          </div>

          <div className="hidden items-center space-x-4 md:flex">
            <a
              href="mailto:siddeshwaraprasanna5@gmail.com"
              className="group flex items-center space-x-1.5 rounded-full border border-[var(--electric-blue)] bg-transparent px-5 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-white shadow-[0_0_16px_rgba(255,23,68,0.2)] transition-all duration-300 hover:border-[var(--hot-pink)] hover:bg-white/[0.02] hover:text-[var(--hot-pink)] hover:shadow-[0_0_18px_rgba(204,17,51,0.24)] md:text-xs"
            >
              <span>LET&apos;S CONNECT</span>
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>

            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setIsOpen(!isOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[var(--glass-dark)] text-white/80 transition-all duration-300 hover:border-[var(--electric-blue)] hover:text-[var(--electric-blue)] hover:shadow-[0_0_12px_rgba(255,23,68,0.24)]"
              aria-label="Open navigation menu"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center md:hidden">
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setIsOpen(!isOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[var(--glass-dark)] text-white"
              aria-label="Open navigation menu"
            >
              {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: "-20px" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "-20px" }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 flex flex-col justify-center bg-[#050508]/95 px-8 backdrop-blur-xl md:px-24"
          >
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] opacity-20" />
            <div className="mt-16 flex flex-col space-y-6">
              {navLinks.map((link, idx) => (
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={link}
                  onClick={() => handleLinkClick(link)}
                  className={`text-left text-3xl font-bold tracking-[0.1em] transition-all duration-300 ${
                    activeLink === link ? "text-[var(--electric-blue)] text-glow-blue" : "text-white/60 hover:text-white"
                  }`}
                >
                  {renderNavLabel(link)}
                </motion.button>
              ))}

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="border-t border-white/10 pt-8">
                <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-[#555577]">{"// Contact Details"}</p>
                <a href="mailto:siddeshwaraprasanna5@gmail.com" className="mb-2 block text-sm font-semibold tracking-wider text-[var(--electric-blue)] transition-colors duration-300 hover:text-white">
                  siddeshwaraprasanna5@gmail.com
                </a>
                <div className="flex space-x-4 pt-2 text-xs font-medium text-white/50">
                  <a href="https://github.com/POSHANMS" target="_blank" rel="noreferrer" className="transition-colors duration-300 hover:text-white">
                    GITHUB
                  </a>
                  <a href="https://linkedin.com/in/poshanms/" target="_blank" rel="noreferrer" className="transition-colors duration-300 hover:text-white">
                    LINKEDIN
                  </a>
                </div>
              </motion.div>
            </div>

            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setIsOpen(false)}
              className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/70 hover:text-white"
              aria-label="Close navigation menu"
            >
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
