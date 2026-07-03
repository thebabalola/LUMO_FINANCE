/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        white: 'rgb(var(--color-white) / <alpha-value>)',
        black: 'rgb(var(--color-black) / <alpha-value>)',
        cream: {
          DEFAULT: 'rgb(var(--color-cream) / <alpha-value>)',
          muted: 'rgb(var(--color-cream) / 0.7)',
          darkMuted: 'rgb(var(--color-cream) / 0.5)',
        },
        ember: {
          DEFAULT: 'rgb(var(--color-ember) / <alpha-value>)',
          hover: 'rgb(var(--color-ember-hover) / <alpha-value>)',
        },
        brown: {
          DEFAULT: 'rgb(var(--color-brown) / <alpha-value>)',
          light: 'rgb(var(--color-brown-light) / <alpha-value>)',
        },
        success: '#22C55E',
        danger: '#EF4444',
      },
      fontFamily: {
        heading: ['Clash Display', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
        mono: ['Inter', 'monospace'],
      },
      boxShadow: {
        '3d': '0 1px 0 rgba(255, 255, 255, 0.05) inset, 0 20px 60px rgba(0, 0, 0, 0.4), 0 4px 16px rgba(0, 0, 0, 0.2)',
      }
    },
  },
  plugins: [],
}
