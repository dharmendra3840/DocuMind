import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // "Paper & ink" palette, shared by the landing page and the app.
      colors: {
        paper: { DEFAULT: "#F7F5F0", deep: "#EFEBE2" },
        ink: { DEFAULT: "#16181D", soft: "#3B3E46", muted: "#65686F" },
        rule: "#E3DED3",
        marker: "#FBE38E",
        redline: "#C23E1C",
        border: "#E3DED3", // default for bare `border` utilities (same as rule)
      },
      fontFamily: {
        sans: ["var(--font-plex)", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        plex: ["var(--font-plex)", "system-ui", "sans-serif"],
        "plex-mono": ["var(--font-plex-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        DEFAULT: "8px",
      },
      boxShadow: {
        elevated: "0 24px 60px -20px rgba(22,24,29,0.3)",
      },
    },
  },
  plugins: [typography],
};

export default config;
