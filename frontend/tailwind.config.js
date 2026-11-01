/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      colors: {
        agrigreen: {
          50: '#F0FFF4',
          100: '#DCFCE7',
          200: '#A8EFC4',
          300: '#4DB870',
          500: '#2A8C4A',
          600: '#1A5C31',
          700: '#143D22',
          800: '#0D2B17',
          900: '#0A1F0F',
          950: '#060F07',
        },
        agrigold: {
          300: '#E8C96A',
          500: '#C9A84C',
          700: '#8B6D28',
        }
      },
      boxShadow: {
        'agri': '0 4px 24px rgba(10,74,46,0.12)',
        'agri-lg': '0 8px 40px rgba(10,74,46,0.18)',
        'gold': '0 0 20px rgba(201,168,76,0.28)',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease both',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeUp: {
          'from': { opacity: '0', transform: 'translateY(16px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        }
      }
    },
  },
  plugins: [],
}
