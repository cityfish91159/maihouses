module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#00385a', // Unified brand color
          light: '#009FE8',
          dark: '#00385a',
          700: '#00385a',
          600: '#004E7C', 
          500: '#00629B',
          300: '#7EA5FF',
          100: '#E6EDF7',
          50: '#F6F9FF',
        },
        ink: {
          900: '#0A2246',
          700: '#2A2F3A',
          600: '#6C7B91',
        },
        primary: '#0A2246',
        success: '#0f6a23',
        bg: {
          base: '#f6f9ff',
          card: 'rgba(255, 255, 255, 0.92)',
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
      },
      animation: {
        'fadeIn': 'fadeIn 0.3s ease-out forwards',
        'float': 'float 3s ease-in-out infinite',
        'float-desktop': 'floatDesktop 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-7px)' },
        },
        floatDesktop: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
    }
  },
  plugins: []
}
