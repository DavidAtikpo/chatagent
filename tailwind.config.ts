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
        background: "var(--background)",
        foreground: "var(--foreground)",
        /** Or du logo CIA — branding SaaS */
        brand: {
          50: "#FDF8ED",
          100: "#FAF0D4",
          200: "#F0E0A8",
          300: "#E8C96A",
          400: "#DDB84A",
          500: "#D4A83A",
          600: "#C9922A",
          700: "#A67A22",
          800: "#876619",
          900: "#5C4510",
        },
      },
    },
  },
  plugins: [],
};
export default config;
