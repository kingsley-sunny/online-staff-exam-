/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/**/*.{html,js,ejs}"],
  darkMode: "selector",
  theme: {
    extend: {
      backgroundImage: {
        "banner-image": "url('/imgs/seminars-training-header.jpg')",
      },
      colors: {
        primary: "#4f46e5",
      },
    },
  },
  plugins: [],
};
