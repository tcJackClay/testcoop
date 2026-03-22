/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e9f5ff',
          100: '#d5ecff',
          200: '#add8ff',
          300: '#7cc1ff',
          400: '#46a8ff',
          500: '#1292ff',
          600: '#0b7de0',
          700: '#0a66b7',
          800: '#0c4f88',
          900: '#0b3558',
        },
        dark: {
          bg: '#0b0d12',
          subtle: '#11161d',
          surface: '#18202b',
          elevated: '#202a36',
          panel: '#273444',
        },
        accent: {
          50: '#fff1f0',
          100: '#ffe4e1',
          200: '#ffc9c4',
          300: '#ffa09b',
          400: '#ff6b5d',
          500: '#f54d3d',
          600: '#e62e24',
          700: '#c41e16',
          800: '#9f1b15',
          900: '#811c16',
        },
        // Semantic colors
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          700: '#15803d',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          700: '#b45309',
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          700: '#b91c1c',
        },
        info: {
          50: '#eff6ff',
          500: '#3b82f6',
          700: '#1d4ed8',
        },
      },
      // Animation utilities
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'out-back': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        'instant': '100ms',
        'fast': '150ms',
        'normal': '200ms',
        'slow': '300ms',
        'slower': '500ms',
      },
      // Custom ring colors for focus states - Brand #0090FF
      ringColor: {
        'brand': '#0090ff',
        'brand-hover': '#33a3ff',
      },
      ringOffsetColor: {
        'brand': '#004080',
      },
      // Spacing system - 4px base grid
      spacing: {
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '2.5': '10px',
        '3': '12px',
        '3.5': '14px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        '9': '36px',
        '10': '40px',
        '11': '44px',
        '12': '48px',
        '14': '56px',
        '16': '64px',
        '20': '80px',
      },
      // Border radius
      borderRadius: {
        'xs': '2px',
        'sm': '4px',
        'DEFAULT': '12px',
        'md': '12px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        '3xl': '32px',
        'full': '9999px',
      },
      boxShadow: {
        soft: '0 18px 48px rgba(3, 6, 12, 0.28)',
        brand: '0 10px 30px rgba(18, 146, 255, 0.2)',
      },
    },
  },
  plugins: [],
}
