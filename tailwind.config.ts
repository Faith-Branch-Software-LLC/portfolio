import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    fontSize: {
      '2xs': ".625rem",
      xs: '.75rem',
      sm: '0.8rem',
      md: '1rem',
      lg: '1.25rem',
      xl: '1.4rem',
      '2xl': '1.563rem',
      '3xl': '1.953rem',
      '4xl': '2.441rem',
      '5xl': '3.052rem',
    },
    colors: {
      backgroundRed: '#D7263D',
      teal: '#1B998B',
      darkPurple: '#2E294E',
      orange: '#F46036',
      olive: '#C5D86D',
      white: '#FFFFFF'
    },
    extend: {
      maxHeight: {
        '1/2': '50%',
        '1/3': '33.333333%',
        '2/3': '66.666667%',
        '3/4': '75%',
        '4/5': '80%',
        '9/10': '90%',
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      boxShadow: {
        'deep': "0 35px 4rem 1rem rgba(0, 0, 0, 0.6)",
        'card': "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1), inset 0 0 4rem 0.5rem rgba(42, 129, 11, 0.3)",
      },
    },
  },
  plugins: [],
};
export default config;
