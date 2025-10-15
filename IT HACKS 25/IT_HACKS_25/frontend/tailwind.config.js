/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
  extend: {
    colors: {
      harvest: '#D4A373',
      soil: '#5C4033',
      leaf: '#6B8E23',
      field: '#E6CCB2',
      sky: '#87CEEB',
    },
    eco: {
        light: '#e6f4ea',
        DEFAULT: '#16a34a',
        dark: '#065f46',
      },
  },
},
}