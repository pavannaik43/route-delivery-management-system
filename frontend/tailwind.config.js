/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hatsun: {
          50: '#eef7ff',
          100: '#d9edff',
          200: '#bce0ff',
          300: '#8eccff',
          400: '#58afff',
          500: '#308eff',
          600: '#0077cc', // Secondary
          700: '#005bac', // Primary
          800: '#034b8c',
          900: '#083f73',
          950: '#05274b',
        },
        primary: {
          DEFAULT: '#005BAC',
          hover: '#004c91',
          light: '#E6F0FA'
        },
        secondary: {
          DEFAULT: '#0077CC',
          hover: '#0062a8',
          light: '#EBF5FC'
        },
        accent: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7'
        },
        bg: {
          main: '#F8FAFC',
          card: '#FFFFFF',
          sidebar: '#0A2540'
        },
        text: {
          main: '#1F2937',
          muted: '#64748B',
          light: '#94A3B8'
        }
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px -1px rgba(0, 0, 0, 0.05), 0 1px 3px -1px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 10px 25px -3px rgba(0, 91, 172, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'modal': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }
    },
  },
  plugins: [],
}
