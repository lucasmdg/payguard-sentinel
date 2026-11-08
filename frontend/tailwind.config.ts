import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paypal: {
          navy: "#003087",
          blue: "#0070BA",
          sky: "#E6F2FA",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 1px rgba(15, 23, 42, 0.02)",
      },
    },
  },
  plugins: [],
};

export default config;
