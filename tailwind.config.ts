import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0c1b2a",
        steel: "#1f3d57",
        metal: "#4f7aa6",
        mist: "#c6d7e7",
        glow: "#4bd2ff"
      },
      boxShadow: {
        glow: "0 0 40px rgba(75, 210, 255, 0.35)"
      }
    }
  },
  plugins: []
};

export default config;
