/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    screens: {
      'xxs': '280px',
      'xs': '375px',
      'ss': '425px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '1xl': '1440px',
      '2xl': '1536px',
      '3xl': '1920px',
      '4xl': '2560px',
    },

    extend: {
      colors: {
        green: {
          1:'#051E0F',
          2:'#1e6436'
         
        },
        main:{
          1: '#faf9df'
        },
        yellow: {
          1: '#ffbd59'
        }
      },
    },
  },
  daisyui: {
    themes: ["", "cmyk"]
  },
  plugins: [
    require("daisyui"),
    require("tailwind-scrollbar-hide"),
    require("tailwindcss-animate")
  ],
}