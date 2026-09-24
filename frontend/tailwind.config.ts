import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-primary": "#0F172A",
        "bg-secondary": "#1E293B",
        "bg-surface": "#334155",
        accent: "#6366F1",
        "accent-green": "#10B981",
        "accent-amber": "#F59E0B",
        "accent-red": "#EF4444",
        "text-primary": "#F1F5F9",
        "text-secondary": "#CBD5E1",
        "text-muted": "#94A3B8",
        border: "#334155",
        // Landing page — "paper & ink" palette
        paper: { DEFAULT: "#F7F5F0", deep: "#EFEBE2" },
        ink: { DEFAULT: "#16181D", soft: "#3B3E46", muted: "#65686F" },
        rule: "#E3DED3",
        marker: "#FBE38E",
        redline: "#C23E1C",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        plex: ["var(--font-plex)", "system-ui", "sans-serif"],
        "plex-mono": ["var(--font-plex-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        DEFAULT: "8px",
      },
      boxShadow: {
        elevated: "0 4px 24px rgba(0,0,0,0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
