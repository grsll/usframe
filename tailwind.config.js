/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-main)',
        surface: 'var(--bg-surface)',
        'surface-elevated': 'var(--bg-surface-elevated)',
        'surface-subtle': 'var(--bg-surface-subtle)',
        border: 'var(--border-subtle)',
        'border-strong': 'var(--border-strong)',
        foreground: 'var(--text-main)',
        'foreground-muted': 'var(--text-muted)',
        'foreground-subtle': 'var(--text-subtle)',
        primary: {
          DEFAULT: 'var(--primary-main)',
          hover: 'var(--primary-hover)',
          soft: 'var(--primary-soft)',
          foreground: 'var(--primary-foreground)',
        },
        rose: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
        },
        terracotta: {
          50: '#FDF6F3',
          100: '#FCEBE4',
          200: '#F8D4C5',
          300: '#F2B59E',
          400: '#E88B6E',
          500: '#D95D39',
          600: '#C24726',
          700: '#9E3418',
          800: '#7E2A14',
          900: '#672412',
        },
        warm: {
          50: '#FAF8F5',
          100: '#F5F2EB',
          200: '#EBE5D8',
          300: '#DCD4C2',
          400: '#C2B8A3',
          500: '#A39882',
          600: '#7D735E',
          700: '#5F5747',
          800: '#3D372D',
          900: '#1F1C16',
          950: '#12110E',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        script: ['"Caveat"', 'cursive'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'soft': '0 2px 12px -2px rgba(28, 25, 23, 0.05), 0 1px 3px 0 rgba(28, 25, 23, 0.03)',
        'medium': '0 8px 24px -4px rgba(28, 25, 23, 0.08), 0 2px 6px -1px rgba(28, 25, 23, 0.04)',
        'elevated': '0 20px 40px -12px rgba(28, 25, 23, 0.12), 0 4px 12px -2px rgba(28, 25, 23, 0.05)',
        'photostrip': '0 15px 35px -5px rgba(0, 0, 0, 0.2), 0 5px 15px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'flash': 'flash 0.5s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-subtle': 'pulseSubtle 3s infinite ease-in-out',
      },
      keyframes: {
        flash: {
          '0%': { opacity: '0.9', backgroundColor: '#ffffff' },
          '100%': { opacity: '0', backgroundColor: 'transparent' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.04)', opacity: '0.9' },
        }
      }
    },
  },
  plugins: [],
}
