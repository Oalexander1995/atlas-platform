import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#16a34a',
          600: '#15803d',
          700: '#166534',
          800: '#14532d',
          900: '#052e16',
        },
        navy: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        // Warm Building Society Sand / Cream
        stone: {
          warm: '#fdfbf7',
          card: '#ffffff',
          border: '#e7e5e4',
        },
        // Risk tier palette as specified in PRD 7.1
        tier: {
          low: {
            bg: '#f0fdfa',
            border: '#99f6e4',
            text: '#0f766e',
            badge: '#14b8a6',
          },
          medium: {
            bg: '#fffbeb',
            border: '#fde68a',
            text: '#b45309',
            badge: '#f59e0b',
          },
          high: {
            bg: '#fff7ed',
            border: '#fed7aa',
            text: '#c2410c',
            badge: '#ea580c',
          },
          uncharted: {
            bg: '#faf5ff',
            border: '#e9d5ff',
            text: '#7e22ce',
            badge: '#9333ea',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
