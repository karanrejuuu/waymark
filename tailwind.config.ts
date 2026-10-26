import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        "surface-3": "var(--surface-3)",
        ink: "var(--ink)",
        mute: "var(--mute)",
        faint: "var(--faint)",
        line: "var(--line)",
        lime: "var(--lime)",
        onlime: "var(--on-lime)",
        up: "var(--up)",
        down: "var(--down)",
        warn: "var(--warn)",
        "text-primary": "var(--ink)",
        "text-secondary": "var(--mute)",
        "text-tertiary": "var(--faint)",
        accent: "var(--lime)",
        "accent-hover": "var(--lime)",
        "accent-faint": "var(--surface-2)",
        success: "var(--up)",
        urgent: "var(--down)",
        border: "var(--line)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "GeistSans", "-apple-system", "sans-serif"],
        heading: ["var(--font-geist-sans)", "GeistSans", "-apple-system", "sans-serif"],
        body: ["var(--font-geist-sans)", "GeistSans", "-apple-system", "sans-serif"],
        mono: ["var(--font-geist-mono)", "GeistMono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "28px",
        "2xl": "20px",
        xl: "16px",
        lg: "12px",
      },
      boxShadow: {
        lift: "var(--shadow-lift)",
        float: "var(--shadow-float)",
      },
    },
  },
  plugins: [],
};
export default config;
