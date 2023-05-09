/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./components/**/*.{js,ts,jsx,tsx}",
      "./lib/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      fontFamily: {
        sans: ['SegoeUI', 'system-ui', 'segoe-ui', '"PT Sans"', 'sans-serif']
      }
    },
    plugins: [],
  };