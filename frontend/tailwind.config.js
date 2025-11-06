/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundColor: {
        'primary': '#f8f6f0',
        'secondary': '#ffeacf',
      },
      textColor: {
        'primary-light': '#FFBC42',
        'primary-dark': '#8C8277',
      }
    },
  },
  plugins: [],
}

