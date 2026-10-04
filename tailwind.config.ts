import type { Config } from "tailwindcss";

// Палитра снята с постера (ТЗ 2.2). Те же значения продублированы
// CSS-переменными в app/globals.css — менять в обоих местах.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      ink: "#120B3D",
      deep: "#30209D",
      surface: "#3A28AE",
      indigo: "#4A33C0",
      petal: "#6C5BCE",
      glow: "#7B62F0",
      paper: "#FFFFFF",
      text: "#E9E5FF",
      muted: "#A9A0E0",
      "muted-bright": "#CFC8F5",
      pollen: "#FFD66B",
      danger: "#FF6B8A",
    },
    fontSize: {
      sm: ["14px", { lineHeight: "1.45" }],
      base: ["16px", { lineHeight: "1.55" }],
      lg: ["18px", { lineHeight: "1.65" }],
      xl: ["22px", { lineHeight: "1.35" }],
      "2xl": ["28px", { lineHeight: "1.25" }],
      "3xl": ["36px", { lineHeight: "1.15" }],
      "4xl": ["48px", { lineHeight: "1.1" }],
      "5xl": ["64px", { lineHeight: "1.05" }],
    },
    extend: {
      fontFamily: {
        display: ["var(--font-unbounded)", "system-ui", "sans-serif"],
        sans: ["var(--font-onest)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        petal: "28px 6px 28px 6px",
        card: "12px",
      },
      maxWidth: {
        container: "1200px",
        prose: "72ch",
      },
      backgroundImage: {
        hero: "radial-gradient(ellipse at 50% 40%, #7B62F0 0%, #4A33C0 38%, #30209D 78%)",
      },
    },
  },
  plugins: [],
};

export default config;
