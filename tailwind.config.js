/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Cinzel"', 'serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          900: '#0a0e16',
          800: '#11161f',
          700: '#1a2030',
          600: '#252d40',
          500: '#38415a',
          400: '#5a688a',
        },
        gold: {
          400: '#f5d68a',
          500: '#e6b85c',
          600: '#c9933a',
        },
        ember: {
          400: '#ff9d5c',
          500: '#ff7a1a',
          600: '#d9530a',
        },
        frost: {
          400: '#8fe3ff',
          500: '#49c2ff',
          600: '#1d8fd6',
        },
        moss: {
          400: '#9bd17a',
          500: '#6ba84f',
          600: '#3f7a2e',
        },
        rarity: {
          common: '#cbd5e1',
          uncommon: '#6ba84f',
          rare: '#49c2ff',
          epic: '#c084fc',
          legendary: '#f5a623',
          mythic: '#ff4d6d',
        },
      },
      boxShadow: {
        glow: '0 0 24px rgba(245,214,138,0.35)',
        innerhud: 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 0 1px rgba(255,255,255,0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out both',
        'rise-in': 'riseIn 0.6s cubic-bezier(0.16,1,0.3,1) both',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        riseIn: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%,100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
