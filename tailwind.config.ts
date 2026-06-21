import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "void-black": "var(--void-black)",
        "electric-blue": "var(--electric-blue)",
        "deep-violet": "var(--deep-violet)",
        "hot-pink": "var(--hot-pink)",
        "terminal-green": "var(--terminal-green)",
        "pure-white": "var(--pure-white)",
        "deep-navy": "var(--deep-navy)",
        "node-green": "var(--node-green)",
        "nebula-purple": "var(--nebula-purple)",
        "glass-dark": "var(--glass-dark)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
