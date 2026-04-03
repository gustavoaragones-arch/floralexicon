import type { Config } from "tailwindcss";

const config: Config = {
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
        flora: {
          cream: "#FCFBF4",
          forest: "#1a3c34",
          "forest-hover": "#142e28",
          sage: "#e8f0ec",
          mist: "#f4f7f5",
        },
      },
      fontFamily: {
        sans: ["var(--font-flora-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-flora-serif)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
