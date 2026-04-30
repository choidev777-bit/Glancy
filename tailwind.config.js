/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-page)',
        surface: {
          1: 'var(--surface-1)',
          2: 'var(--surface-2)',
          3: 'var(--surface-3)',
          4: 'var(--surface-4)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
        },
        brand: {
          primary: 'var(--brand-primary)',
          secondary: 'var(--brand-secondary)',
        },
        positive: {
          DEFAULT: 'var(--positive)',
          bright: 'var(--positive-bright)',
        },
        negative: {
          DEFAULT: 'var(--negative)',
          bright: 'var(--negative-bright)',
        },
        warning: 'var(--warning)',
        info: 'var(--info)',
        neutral: 'var(--neutral)',
        border: {
          DEFAULT: 'var(--border-default)',
          strong: 'var(--border-strong)',
        }
      },
      fontFamily: {
        sans: ['Pretendard', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'card-lg': '16px',
        'card': '8px',
        'card-sm': '6px',
        'tag': '4px',
        'pill': '9999px',
      },
      boxShadow: {
        subtle: 'var(--shadow-subtle)',
        medium: 'var(--shadow-medium)',
        heavy: 'var(--shadow-heavy)',
      }
    },
  },
  plugins: [],
}
