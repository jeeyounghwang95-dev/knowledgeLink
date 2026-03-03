/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#f8f9fa',
        node: {
          white: '#ffffff',
          yellow: '#fef9c3',
          red: '#fee2e2',
          green: '#dcfce7',
        }
      }
    },
  },
  plugins: [],
}
