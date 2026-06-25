/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        grotesque: ['Archivo', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        abyss: '#01030a',
        aurelia: {
          cyan: '#5ef2ff',
          magenta: '#ff4fd8',
          teal: '#1a8a9c',
        },
      },
      letterSpacing: {
        widest2: '0.42em',
      },
    },
  },
  plugins: [],
}
