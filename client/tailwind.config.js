/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0f0f0f',
          800: '#161616',
          700: '#1e1e1e',
          600: '#252525',
          500: '#2f2f2f',
          400: '#3a3a3a',
        },
        brand: {
          DEFAULT: '#6c63ff',
          light: '#9b8fff',
          dark: '#4a44a0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};