module.exports = {
  content: [
    './src/**/*.{html,js,svelte,ts}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#0078bd',
          DEFAULT: '#005fa3',
          dark: '#004680'
        },
        secondary: {
          light: '#f0f0f0',
          DEFAULT: '#e5e5e5',
          dark: '#d4d4d4'
        }
      }
    }
  },
  plugins: []
};