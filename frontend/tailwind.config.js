/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FFFFFF',
        secondary: '#FFFBEB',
        accent1: '#F59E0B',
        accent2: '#10B981',
        text: '#1F2937',
      },
    },
  },
  plugins: [],
}

