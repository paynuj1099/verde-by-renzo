import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'forest': {
          50: '#f0f5f0',
          100: '#dce8dc',
          200: '#b9d1b9',
          300: '#8fb58f',
          400: '#669966',
          500: '#2d5016',
          600: '#254013',
          700: '#1d3310',
          800: '#16260c',
          900: '#0e1a08',
        },
        'gold': {
          50: '#fefbf3',
          100: '#fdf6e3',
          200: '#faedbe',
          300: '#f6dd8c',
          400: '#f2ca5a',
          500: '#d4af37',
          600: '#b8952f',
          700: '#8f7325',
          800: '#66521a',
          900: '#3d310f',
        },
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'Georgia', 'Cambria', 'serif'],
        sans: ['var(--font-montserrat)', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
