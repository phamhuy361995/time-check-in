/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#20201f',
        canvas: '#f5f4f1',
        coral: '#ef795e',
        peach: '#f8d9c5',
      },
      boxShadow: {
        card: '0 18px 55px rgba(36, 31, 27, 0.07)',
        button: '0 10px 28px rgba(239, 121, 94, 0.28)',
      },
    },
  },
  plugins: [],
}
