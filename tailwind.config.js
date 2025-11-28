/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./spp-app/View/**/*.ejs",
    "./spp-app/Public/**/*.js",
    "./node_modules/flowbite/**/*.js",
  ],
  theme: {
    extend: {
      fontFamily: {
        jakarta: ["Plus Jakarta Sans", "sans-serif"],
      },
    },
  },
  plugins: [require("flowbite/plugin")],
};
