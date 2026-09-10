import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617"
        },
        risk: {
          low: "#10b981",       // Emerald green
          moderate: "#eab308",  // Yellow
          elevated: "#f97316",  // Amber-orange
          high: "#ef4444",      // Red
          critical: "#881337"   // Crimson purple
        }
      },
    },
  },
  plugins: [],
};
export default config;
