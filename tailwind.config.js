/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'sexy-pink': {
          50: '#fef7ff',
          100: '#fdeeff',
          200: '#fcdcff',
          300: '#f9bfff',
          400: '#f492ff',
          500: '#ec5cff',
          600: '#d946ef',
          700: '#be2dd4',
          800: '#9c25aa',
          900: '#7e2288',
        },
        'sexy-cyan': {
          50: '#f0fdff',
          100: '#ccf7fe',
          200: '#99eefd',
          300: '#5ddefa',
          400: '#22c8f3',
          500: '#0ba5d9',
          600: '#0d84b7',
          700: '#126a94',
          800: '#175879',
          900: '#194a66',
        },
      },
    },
  },
  plugins: [],
};
