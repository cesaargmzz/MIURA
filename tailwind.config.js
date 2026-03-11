/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        mission: {
          bg: '#0a0e1a',
          panel: '#0f1420',
          border: '#1e2a3a',
          green: '#00ff88',
          amber: '#ffaa00',
          red: '#ff3355',
          blue: '#0088ff',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    }
  },
  plugins: []
}
