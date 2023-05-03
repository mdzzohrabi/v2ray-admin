/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./lib/**/*.{js,ts,jsx,tsx}",
      "./pages/**/*.{js,ts,jsx,tsx}",
      "./components/**/*.{js,ts,jsx,tsx}",
      "../common/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
      fontFamily: {
        sans: ['SegoeUI', 'system-ui', 'segoe-ui', '"PT Sans"', 'sans-serif']
      }
    //   extend: {
    //     colors: {
    //       white: "#FFF",
    //       player: "rgb(87,114,255)",
    //       grayTheme  :'#18181d'
    //     },
    //   },
    //   backgroundImage: {
    //     "woman-in-black":
    //       "url('https://user-images.githubusercontent.com/95094057/193284518-44ca0774-79e4-486a-acab-1b4258b583a2.png')",
    //   },
    },
    plugins: [],
  };