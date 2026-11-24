import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ivory: "#faf7f0",
        paper: "#fffdf8",
        sand: { DEFAULT: "#ece4d3", dark: "#ddd3bd" },
        line: "#dcd6c6",
        forest: {
          DEFAULT: "#2f4a3c",
          dark: "#243a2f",
          light: "#4a6b58",
          soft: "#e4ebe5",
        },
        ink: "#27332d",
        muted: "#66726b",
        danger: { DEFAULT: "#8a4b3f", soft: "#f3e6e2" },
        success: { DEFAULT: "#3e6650", soft: "#e2eee6" },
      },
      fontFamily: {
        serif: ["Charter", "Georgia", "Cambria", "Times New Roman", "serif"],
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        ipa: ["Charis SIL", "Gentium Plus", "Doulos SIL", "Noto Sans", "Segoe UI", "DejaVu Sans", "serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(39, 51, 45, 0.06), 0 1px 1px rgba(39, 51, 45, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
