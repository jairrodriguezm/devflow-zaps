/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f4f6fd',
          100: '#e8ecfa',
          200: '#cdd7f6',
          300: '#a2b6f0',
          400: '#718fe7',
          500: '#4f6ddc',
          600: '#3a53c6',
          700: '#2f42a1',
          800: '#2b3984',
          900: '#26326c',
          950: '#161d40',
        },
        dark: {
          700: '#242938',
          800: '#1a1e29',
          850: '#141720',
          900: '#0f1117',
          950: '#090a0e',
        }
      }
    },
  },
  plugins: [],
};
