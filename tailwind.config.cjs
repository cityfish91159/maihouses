module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}', './src/**/*.css'],
  theme: {
    extend: {
      colors: {
        brand: '#1749D7',
      },
      maxWidth: {
        'container': '1080px',
      }
    }
  },
  plugins: []
}
