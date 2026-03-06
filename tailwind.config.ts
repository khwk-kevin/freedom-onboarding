import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Freedom World brand palette
        fw: {
          bg: "#050314",
          "bg-alt": "#0B1036",
          "bg-card": "rgba(255,255,255,0.05)",
          green: "#10F48B",
          "green-hover": "#0DD87A",
          blue: "#1248C8",
          "blue-dark": "#0E3285",
          pink: "#F742A2",
          cyan: "#36BBF6",
          "text-primary": "#F4F4FC",
          "text-secondary": "#A6A7B5",
          "text-tertiary": "#67697C",
          "border": "rgba(255,255,255,0.1)",
        },
        // Keep old brand for CRM pages
        brand: {
          green: "#00FF88",
          "green-dark": "#00CC6A",
          "green-hover": "#00E87A",
        },
      },
      fontFamily: {
        heading: ['"Encode Sans Expanded"', 'sans-serif'],
        thai: ['"Noto Sans Thai"', '"Encode Sans Expanded"', 'sans-serif'],
      },
      backgroundImage: {
        'fw-hero-glow': 'linear-gradient(-70deg, rgba(247,66,162,0.25) 25%, rgba(247,66,162,0.33) 33%, rgba(54,187,246,0.6) 60%)',
        'fw-blue-card': 'linear-gradient(117deg, rgba(24,75,255,0.2) 0%, rgba(23,74,255,0.3) 100%)',
        'fw-accent': 'linear-gradient(117deg, rgba(0,194,255,0) 0%, rgb(255,41,195) 100%)',
        'fw-fade-top': 'linear-gradient(0deg, rgba(2,2,16,0) 0%, rgb(2,2,16) 10%)',
        'fw-fade-bottom': 'linear-gradient(0deg, rgb(2,2,16) 0%, rgba(2,2,16,0) 100%)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 4s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
