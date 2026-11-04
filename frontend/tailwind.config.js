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
        sapphire: {
          abyss: '#03091F',
          midnight: '#071544',
          royal: '#0A2786',
          electric: '#1045CA',
          bright: '#218DFF',
          ice: '#9EDCFF',
        }
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        'sapphire-glow': '0 0 28px rgba(33, 141, 255, 0.38)',
        'sapphire-card': '0 16px 50px rgba(17, 39, 92, 0.14)',
        'sapphire-dark': '0 20px 60px rgba(3, 9, 31, 0.65)',
      }
    },
  },
  plugins: [],
}

