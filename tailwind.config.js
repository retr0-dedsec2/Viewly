/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        spotify: {
          green: '#1DB954',
          dark: '#121212',
          gray: '#181818',
          light: '#282828',
        },
        apple: {
          pink: '#FA2D48',
          dark: '#000000',
          gray: '#1C1C1E',
        },
      },
      screens: {
        'xs': '475px',
      },
    },
  },
  plugins: [],
}

