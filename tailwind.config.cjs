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
          400: '#94A3B8',
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
        },
        maihouses: {
          dark: '#003366', // Was hardcoded
          light: '#00A8E8', // Was hardcoded
        }
      },
      maxWidth: {
        'container': '1080px',
      },
      animation: {
        'fadeIn': 'fadeIn 0.3s ease-out forwards',
        'float': 'float 3s ease-in-out infinite',
        'float-desktop': 'floatDesktop 3s ease-in-out infinite',
        'bounce-slow': 'bounce 2s infinite',
        'wiggle': 'wiggle 0.3s ease-in-out',
        'wave': 'wave 0.5s ease-in-out',
        'blink': 'blink 3s infinite',
        'jump': 'jump 0.5s ease-in-out',
        'shake': 'shake 0.5s ease-in-out',
        'twinkle': 'twinkle 1.5s infinite',
        'twinkle-delay': 'twinkle 1.5s infinite 0.4s',
        'drip': 'drip 2s infinite',
        'float-up': 'floatUp 3s infinite',
        'confetti': 'confetti 1s forwards',
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
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-5deg)' },
          '75%': { transform: 'rotate(5deg)' },
        },
        wave: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '50%': { transform: 'rotate(20deg)' },
        },
        blink: {
          '0%, 45%, 55%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        jump: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-15px)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-3px)' },
          '75%': { transform: 'translateX(3px)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.8)' },
        },
        drip: {
          '0%': { transform: 'translateY(0)', opacity: '0.7' },
          '100%': { transform: 'translateY(20px)', opacity: '0' },
        },
        floatUp: {
          '0%, 100%': { transform: 'translateY(0)', opacity: '0.7' },
          '50%': { transform: 'translateY(-10px)', opacity: '1' },
        },
        confetti: {
          '0%': { transform: 'translate(0, 0) scale(0.6) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translate(var(--confetti-dx, 0px), var(--confetti-dy, 80px)) scale(1.2) rotate(360deg)', opacity: '0' },
        },
      },
      zIndex: {
        dropdown: '30',
        overlay: '40',
        modal: '50',
      },
    }
  },
  plugins: []
}
