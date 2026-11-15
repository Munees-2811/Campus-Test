/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070d18',
          900: '#0b1326',
          850: '#0f1a34',
          800: '#142244',
          750: '#1a2c56',
          700: '#22386c',
          600: '#2d4a8e',
          100: '#e2e8f0',
          50: '#f8fafc',
        },
        electric: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          DEFAULT: '#2563eb'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 20px -3px rgba(37, 99, 235, 0.25)',
        'glow-sm': '0 0 10px -2px rgba(37, 99, 235, 0.2)',
      }
    },
  },
  plugins: [],
}
