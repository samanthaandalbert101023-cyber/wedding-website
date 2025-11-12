/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
  extend: {
    fontFamily: {
      script: ['"Great Vibes"', 'cursive'],
      serif: ['"Playfair Display"', 'serif'],
      mono: ['"Libre Baskerville"', 'serif'],
    },
  },
},
  plugins: [],
};
