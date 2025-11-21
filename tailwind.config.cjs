module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--brand)',
          light: 'var(--brand-light)',
          dark: 'var(--brand-600)',
          50: '#f0f7ff',
        },
        bg: {
          base: 'var(--bg-page)',
          card: 'var(--bg-card)',
          soft: '#F6F9FF',
        },
        border: {
          light: '#E6EDF7',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          muted: '#6C7B91',
          ink: '#0A2246',
        }
      },
      maxWidth: {
        'container': '1080px',
      }
    }
  },
  plugins: []
}
