/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-main': '#A0AB89',
        'brand-dark': '#808670',
        'brand-accent-1': '#BF8A64',
        'brand-accent-2': '#E6B883',
        'brand-bg': '#FFFFFF',
        'brand-sand': '#F0E1D1',
        'brand-gold': '#E89B40',
        'brand-rust': '#BD612A',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}