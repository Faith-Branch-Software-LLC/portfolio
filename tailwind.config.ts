import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    fontSize: {
      "2xs": ".625rem",
      xs: ".75rem",
      sm: "0.8rem",
      md: "1rem",
      lg: "1.25rem",
      xl: "1.4rem",
      "2xl": "1.563rem",
      "3xl": "1.953rem",
      "4xl": "2.441rem",
      "5xl": "3.052rem",
      "6xl": "3.815rem",
      "7xl": "4.768rem",
    },
    colors: {
      backgroundRed: "#D7263D",
      teal: "#1B998B",
      darkPurple: "#2E294E",
      orange: "#F46036",
      olive: "#C5D86D",
      white: "#FFFFFF",
      offWhite: "#D9D9D9",
      black: "#000000",
    },
    extend: {
      maxHeight: {
        "1/2": "50%",
        "1/3": "33.333333%",
        "2/3": "66.666667%",
        "3/4": "75%",
        "4/5": "80%",
        "9/10": "90%",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      boxShadow: {
        deep: "0 35px 4rem 1rem rgba(0, 0, 0, 0.6)",
        card: "10px 10px 0px 0px rgba(0,0,0,0.25)",
        button: "5px 5px 0px 0px rgba(0,0,0,0.25)",
      },
      fontFamily: {
        fraunces: ["Fraunces", "serif"],
        gelasio: ["Gelasio", "serif"],
        sendFlowers: ["Send Flowers", "cursive"],
        sourGummy: ["Sour Gummy", "cursive"],
      },
      keyframes: {
        'flip-right': {
          '0%': { 
            transform: 'rotateY(0deg)',
          },
          '100%': { 
            transform: 'rotateY(-180deg)',
          }
        },
        'flip-left': {
          '0%': { 
            transform: 'rotateY(0deg)',
          },
          '100%': { 
            transform: 'rotateY(180deg)',
          }
        }
      },
      animation: {
        'flip-right': 'flip-right 1s ease-in-out',
        'flip-left': 'flip-left 1s ease-in-out'
      },
      perspective: {
        '1000': '1000px'
      },
      rotate: {
        'y-180': 'rotateY(180deg)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
export default config;
