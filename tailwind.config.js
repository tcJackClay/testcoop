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
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        // Custom dark theme colors (OKLCH-inspired)
        dark: {
          bg: '#0f0f0f',
          surface: '#1a1a1a',
          elevated: '#242424',
        },
        // Accent color - Coral/Salmon (70-20-10 rule: 10% accent)
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
      // Custom ring colors for focus states
      ringColor: {
        'brand': '#60a5fa',
        'brand-hover': '#93c5fd',
      },
      ringOffsetColor: {
        'brand': '#1e3a5f',
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
        'DEFAULT': '8px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        '3xl': '32px',
        'full': '9999px',
      },
    },
  },
  plugins: [],
}
