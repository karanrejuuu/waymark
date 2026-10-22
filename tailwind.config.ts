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
        bg: "var(--bg)",
        ink: "var(--ink)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-tertiary": "var(--text-tertiary)",
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        "accent-faint": "var(--accent-faint)",
        success: "var(--success)",
        "green-soft": "var(--green-soft)",
        urgent: "var(--urgent)",
        "red-soft": "var(--red-soft)",
        "yellow-soft": "var(--yellow-soft)",
        lines: "var(--lines)",
        border: "var(--border)",
        "bg-subtle": "var(--bg-subtle)",
        "bg-hover": "var(--bg-hover)",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "-apple-system", "sans-serif"],
        body: ["var(--font-body)", "-apple-system", "sans-serif"],
        sans: ["var(--font-body)", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "12px",
        md: "10px",
        lg: "12px",
        xl: "12px",
        "2xl": "16px",
      },
      boxShadow: {
        soft: "0 1px 3px 0 rgba(20, 33, 61, 0.04), 0 1px 2px -1px rgba(20, 33, 61, 0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
