/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // UNEP brand colors
        'unep': {
          primary: '#00857c',    // UNEP teal/blue-green
          secondary: '#0077c8',  // UNEP blue
          green: '#3f9c35',      // UNEP green
          yellow: '#ffc72c',     // UNEP yellow
          light: '#e6f2f1',      // Light teal for backgrounds
          dark: '#005c55',       // Darker teal for hover states
        },
        // Air quality status colors
        'aqi': {
          good: '#3f9c35',
          moderate: '#ffc72c',
          unhealthy: '#ff9933',
          'very-unhealthy': '#cc0033',
          hazardous: '#660099',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-unep': 'linear-gradient(135deg, #00857c 0%, #0077c8 100%)',
      },
    },
  },
  plugins: [],
}