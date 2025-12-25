import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // --- 30MINUTES BRAND PALETTE ---
        brandNavy: "#0F3057",
        brandOrange: "#E65100",
        brandLight: "#E3F2FD",
        
        // System Overrides
        border: "#E3F2FD",
        input: "#E3F2FD",
        ring: "#E65100",
        background: "#FFFFFF",
        foreground: "#0F3057",
      },
    },
  },
  plugins: [],
};
export default config;
