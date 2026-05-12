import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#070E1C',
        surface: '#0C1628',
        card: '#0F1A2E',
        'card-hover': '#152035',
        line: '#1A2D45',
        'line-subtle': '#112038',
        accent: '#3B82F6',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        violet: '#8B5CF6',
        indigo: '#6366F1',
        cyan: '#06B6D4',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.4), 0 1px 2px -1px rgba(0,0,0,0.4)',
        elevated: '0 4px 24px -4px rgba(0,0,0,0.6)',
        glow: '0 0 0 1px rgba(59,130,246,0.3), 0 0 20px -5px rgba(59,130,246,0.15)',
        'glow-success': '0 0 0 1px rgba(16,185,129,0.3), 0 0 20px -5px rgba(16,185,129,0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'count-up': 'countUp 0.8s ease-out',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: {
          from: { transform: 'translateY(8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        slideRight: {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
      },
      backdropBlur: { xs: '2px' },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
    },
  },
  plugins: [],
} satisfies Config
