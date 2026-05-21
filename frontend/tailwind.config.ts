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
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
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
