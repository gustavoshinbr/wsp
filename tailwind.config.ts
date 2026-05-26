import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        racing: {
          red: "#dc2626",
          gold: "#f59e0b",
          bg: "rgb(var(--bg) / <alpha-value>)",
          panel: "rgb(var(--panel) / <alpha-value>)",
          soft: "rgb(var(--panel-soft) / <alpha-value>)",
          line: "rgb(var(--line) / <alpha-value>)",
          text: "rgb(var(--text) / <alpha-value>)",
          muted: "rgb(var(--muted) / <alpha-value>)"
        }
      }
    }
  },
  plugins: []
};
export default config;
