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
          glow: 'rgb(255 138 76 / <alpha-value>)',
        },
        brown: {
          DEFAULT: 'rgb(var(--color-brown) / <alpha-value>)',
          light: 'rgb(var(--color-brown-light) / <alpha-value>)',
          deep: 'rgb(var(--color-brown-deep) / <alpha-value>)',
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
        'ember-glow': '0 0 40px -8px rgb(235 96 40 / 0.5)',
        'card-hover': '0 1px 0 rgba(255, 255, 255, 0.08) inset, 0 30px 80px rgba(0, 0, 0, 0.5), 0 8px 24px rgba(0, 0, 0, 0.3)',
      },
      animation: {
        marquee: 'marquee 32s linear infinite',
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        'pulse-ring': 'pulseRing 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        aurora: 'aurora 14s ease-in-out infinite alternate',
      },
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
        pulseRing: {
          '0%': { boxShadow: '0 0 0 0 rgb(34 197 94 / 0.5)' },
          '70%': { boxShadow: '0 0 0 8px rgb(34 197 94 / 0)' },
          '100%': { boxShadow: '0 0 0 0 rgb(34 197 94 / 0)' },
        },
        aurora: {
          '0%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(4%, -6%) scale(1.08)' },
          '100%': { transform: 'translate(-4%, 4%) scale(0.96)' },
        },
      },
    },
  },
  plugins: [],
}
