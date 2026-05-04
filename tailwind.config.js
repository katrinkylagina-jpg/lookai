/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream:    '#F5F0E8',
        charcoal: '#0A0A0A',
        surface:  '#1A1A1A',
        surface2: '#242424',
        muted:    '#6B6B6B',
        gold:     '#C9A84C',
        'gold-light': '#E0C070',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        playfair: ['Playfair Display', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #C9A84C, #E0C070)',
      },
    },
  },
  plugins: [],
}
