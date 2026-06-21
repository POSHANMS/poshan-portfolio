"use client";

import React, { useState } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("HOME");

  const navLinks = [
    "HOME",
    "ABOUT",
    "SKILLS",
    "PROJECTS",
    "EXPERIENCE",
    "BLOG",
    "CONTACT",
  ];

  const handleLinkClick = (link: string) => {
    setActiveLink(link);
    setIsOpen(false);
    
    // Smooth scroll to target ID
    const targetElement = document.getElementById(link.toLowerCase());
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50 bg-[#050508]/30 backdrop-blur-md border-b border-white/[0.03] px-6 py-4 md:px-12">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo Brand Group */}
          <div className="flex items-center space-x-3 select-none">
            {/* Stylized Glowing P Logo */}
            <div className="relative w-8 h-9 flex items-center justify-center">
              <svg
                width="20"
                height="22"
                viewBox="0 0 40 45"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="filter drop-shadow-[0_0_8px_var(--electric-blue)]"
              >
                <path
                  d="M5 5H22C28.6274 5 34 10.3726 34 17C34 23.6274 28.6274 29 22 29H13V40"
                  stroke="#00d4ff"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M13 17H22C23.6569 17 25 15.6569 25 14C25 12.3431 23.6569 11 22 11H13V17Z"
                  fill="#ff2d78"
                />
              </svg>
            </div>
            
            {/* Text branding */}
            <div className="flex flex-col">
              <span className="font-sans font-bold tracking-[0.2em] text-white text-xs md:text-sm">
                POSHAN MS
              </span>
              <span className="font-mono text-[8px] md:text-[9px] tracking-[0.15em] text-[var(--electric-blue)] text-glow-blue uppercase font-medium">
                Full Stack Engineer
              </span>
            </div>
          </div>

          {/* Centered Desktop Nav Links */}
          <div className="hidden lg:flex items-center space-x-4 bg-glass-dark border border-white/5 px-6 py-2.5 rounded-full backdrop-blur-md">
            {navLinks.map((link, idx) => (
              <React.Fragment key={link}>
                {idx > 0 && <span className="text-white/20 select-none text-[8px]">•</span>}
                <button
                  onClick={() => handleLinkClick(link)}
                  className={`relative px-3 py-1 text-[10px] md:text-xs font-medium tracking-widest transition-all duration-300 ${
                    activeLink === link
                      ? "text-[var(--electric-blue)] text-glow-blue font-semibold"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {link}
                  {activeLink === link && (
                    <motion.div
                      layoutId="activeUnderline"
                      className="absolute bottom-[-10px] left-3 right-3 h-[2px] bg-gradient-to-r from-[var(--electric-blue)] to-[var(--hot-pink)] shadow-[0_0_8px_var(--electric-blue)]"
                    />
                  )}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Desktop Right Hand Side Elements */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Outlined Connection Button */}
            <a
              href="mailto:siddeshwaraprasanna5@gmail.com"
              className="group flex items-center space-x-1.5 border border-[var(--electric-blue)] hover:border-[var(--hot-pink)] text-white hover:text-[var(--hot-pink)] text-[10px] md:text-xs font-semibold uppercase tracking-widest px-5 py-2.5 rounded-full transition-all duration-300 bg-transparent hover:bg-white/[0.02] shadow-[0_0_10px_rgba(0,212,255,0.15)] hover:shadow-[0_0_15px_rgba(255,45,120,0.2)]"
            >
              <span>LET&apos;S CONNECT</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
            </a>

            {/* Circular Hamburger Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 hover:border-[var(--electric-blue)] bg-glass-dark text-white/80 hover:text-[var(--electric-blue)] hover:shadow-[0_0_10px_rgba(0,212,255,0.2)] transition-all duration-300"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Right Hand Side (Hamburger only) */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center justify-center w-9 h-9 rounded-full border border-white/10 bg-glass-dark text-white"
            >
              {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

        </div>
      </nav>

      {/* Fullscreen Mobile Navigation Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: "-20px" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "-20px" }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-[#050508]/95 backdrop-blur-xl flex flex-col justify-center px-8 md:px-24"
          >
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20" />

            <div className="flex flex-col space-y-6 mt-16">
              {navLinks.map((link, idx) => (
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={link}
                  onClick={() => handleLinkClick(link)}
                  className={`text-left text-3xl font-bold tracking-[0.1em] transition-all duration-300 ${
                    activeLink === link
                      ? "text-[var(--electric-blue)] text-glow-blue font-black"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {link}
                </motion.button>
              ))}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="pt-8 border-t border-white/10"
              >
                <p className="text-[10px] uppercase font-mono tracking-widest text-[#555577] mb-4">
                  {"// Contact Details"}
                </p>
                <a
                  href="mailto:siddeshwaraprasanna5@gmail.com"
                  className="text-sm font-semibold tracking-wider text-[var(--electric-blue)] hover:text-white transition-colors duration-300 block mb-2"
                >
                  siddeshwaraprasanna5@gmail.com
                </a>
                <div className="flex space-x-4 text-xs font-medium text-white/50 pt-2">
                  <a href="https://github.com/POSHANMS" target="_blank" rel="noreferrer" className="hover:text-white transition-colors duration-300">GITHUB</a>
                  <a href="https://linkedin.com/in/poshanms/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors duration-300">LINKEDIN</a>
                </div>
              </motion.div>
            </div>
            
            {/* Close button for mobile inside panel */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 flex items-center justify-center w-10 h-10 rounded-full border border-white/10 text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
