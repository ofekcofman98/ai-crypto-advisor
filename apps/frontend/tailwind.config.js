/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          void: '#0D0F14',
          surface: '#161B27',
          border: '#1E2738',
          primary: '#3B82F6',
          secondary: '#8B5CF6',
          success: '#10B981',
          danger: '#EF4444',
          warning: '#F59E0B',
          'text-primary': '#F1F5F9',
          'text-secondary': '#94A3B8',
        },
        fontFamily: {
          sans: ['Inter', 'sans-serif'],
          mono: ['JetBrains Mono', 'monospace'],
        }
      },
    },
    plugins: [],
  }