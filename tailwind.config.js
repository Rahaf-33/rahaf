/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans Arabic"', 'Tajawal', 'system-ui', 'sans-serif'],
        display: ['Tajawal', '"IBM Plex Sans Arabic"', 'sans-serif'],
      },
      colors: {
        navy: {
          50: '#eef3fb', 100: '#d9e3f4', 200: '#b3c6e8', 300: '#7f9fd4', 400: '#4f78bd',
          500: '#2f5aa3', 600: '#1f4485', 700: '#18356b', 800: '#122852', 900: '#0b1a38', 950: '#071126',
        },
        brand: { DEFAULT: '#2a78d6', light: '#5b9be6', dark: '#1d5fb0' },
        safe: { DEFAULT: '#12a150', soft: '#e3f6ea', dark: '#0b7a3b' },
        warn: { DEFAULT: '#e09100', soft: '#fff4dc', dark: '#a86a00' },
        danger: { DEFAULT: '#dc2f2f', soft: '#fde8e8', dark: '#a91d1d' },
      },
      boxShadow: {
        card: '0 1px 2px rgba(11,26,56,.06), 0 4px 16px rgba(11,26,56,.06)',
        glow: '0 0 0 4px rgba(220,47,47,.18)',
      },
      keyframes: {
        pulseRing: { '0%': { boxShadow: '0 0 0 0 rgba(220,47,47,.55)' }, '100%': { boxShadow: '0 0 0 14px rgba(220,47,47,0)' } },
        slideIn: { '0%': { transform: 'translateY(-8px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
        dash: { to: { strokeDashoffset: '-24' } },
        scan: { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100%)' } },
      },
      animation: {
        pulseRing: 'pulseRing 1.6s ease-out infinite',
        slideIn: 'slideIn .25s ease-out',
        dash: 'dash 1s linear infinite',
        scan: 'scan 3s linear infinite',
      },
    },
  },
  plugins: [],
};
