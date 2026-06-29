"use client";

import React from "react";
import { BriefcaseBusiness, Box, Code2, Home, Mail, Settings, UserRound } from "lucide-react";
import { motion } from "framer-motion";

const socials = [
  {
    name: "Home",
    href: "#home",
    icon: <Home className="h-[18px] w-[18px]" />,
  },
  {
    name: "About",
    href: "#about",
    icon: <UserRound className="h-[18px] w-[18px]" />,
  },
  {
    name: "Code",
    href: "#skills",
    icon: <Code2 className="h-[18px] w-[18px]" />,
  },
  {
    name: "Projects",
    href: "#projects",
    icon: <Box className="h-[18px] w-[18px]" />,
  },
  {
    name: "Mail",
    href: "mailto:siddeshwaraprasanna5@gmail.com",
    icon: <Mail className="h-[18px] w-[18px]" />,
  },
  {
    name: "Work",
    href: "#experience",
    icon: <BriefcaseBusiness className="h-[18px] w-[18px]" />,
  },
  {
    name: "Settings",
    href: "#contact",
    icon: <Settings className="h-[18px] w-[18px]" />,
  },
];

export default function SocialSidebar() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 2.0 }}
      className="fixed left-5 top-[7.1rem] z-30 hidden h-[calc(100vh-9rem)] w-[4.1rem] flex-col items-center justify-between rounded-[2rem] border border-white/10 bg-[rgba(6,8,24,0.55)] px-3 py-6 shadow-[0_0_30px_rgba(0,212,255,0.08)] backdrop-blur-md pointer-events-auto md:flex"
    >
      <div className="flex flex-col items-center gap-6">
        {socials.slice(0, 7).map((social, index) => (
          <motion.a
            key={social.name}
            href={social.href}
            aria-label={social.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 1.1 + index * 0.08 }}
            className={`block transition-all duration-300 hover:scale-125 hover:text-[#00d4ff] hover:drop-shadow-[0_0_8px_#00d4ff] ${
              index === 0 ? "text-[#00d4ff] drop-shadow-[0_0_10px_#00d4ff]" : "text-white/55"
            }`}
          >
            {social.icon}
          </motion.a>
        ))}
      </div>

      <div className="flex flex-col items-center gap-4 rounded-full border border-white/10 bg-white/[0.03] px-2 py-3">
        <span className="h-4 w-4 rounded-full border border-white/80" />
        <span className="h-3 w-6 rounded-full bg-white/15 after:block after:h-3 after:w-3 after:rounded-full after:bg-[var(--deep-violet)]" />
      </div>
    </motion.div>
  );
}
