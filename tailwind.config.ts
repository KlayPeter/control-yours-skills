import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./electron/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#09111f",
          900: "#111c2d",
          800: "#1b2b42",
          700: "#2d4766",
          200: "#cad8ec",
          100: "#e8eef8"
        },
        ember: "#ff8f5a",
        moss: "#77c9a8",
        signal: "#7dcfff"
      },
      boxShadow: {
        panel: "0 18px 40px rgba(0, 0, 0, 0.22)"
      },
      fontFamily: {
        sans: ["Segoe UI", "system-ui", "sans-serif"],
        mono: ["Consolas", "monospace"]
      },
      backgroundImage: {
        "radial-grid":
          "radial-gradient(circle at top left, rgba(125, 207, 255, 0.18), transparent 32%), radial-gradient(circle at bottom right, rgba(255, 143, 90, 0.12), transparent 28%)"
      }
    }
  },
  plugins: [require("@tailwindcss/typography")]
};

export default config;
