/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:      '#0a0f0a',
        bg2:     '#111811',
        bg3:     '#162016',
        green:   '#1a9e5f',
        green2:  '#22c97a',
        green3:  '#0d6b3e',
        ftext:   '#e8f0e8',
        ftext2:  '#8a9e8a',
        ftext3:  '#4a5e4a',
        fborder: '#1e2e1e',
        fred:    '#e05a4a',
      },
    },
  },
  plugins: [],
}
