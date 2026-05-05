/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Light theme
        bg: {
          DEFAULT: '#DDD7CC',
          2: '#D0C9BC',
        },
        surface: {
          DEFAULT: '#F5F0E8',
          2: '#EDE7DC',
        },
        accent: {
          DEFAULT: '#A85C28',
          bg: '#F0E0CC',
          text: '#6A2E08',
        },
        mint: {
          DEFAULT: '#2E6E50',
          bg: '#C8E8D8',
          text: '#0E3E28',
        },
        rose: {
          DEFAULT: '#A83838',
          bg: '#EED0D0',
          text: '#681818',
        },
        lav: {
          DEFAULT: '#5840A0',
          bg: '#DDD8F0',
          text: '#280E68',
        },
        // Semantic
        border: 'rgba(90,70,40,0.25)',
        border2: 'rgba(90,70,40,0.40)',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
        input: '10px',
      },
    },
  },
  plugins: [],
}
