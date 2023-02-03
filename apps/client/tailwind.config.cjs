/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    colors: {
      transparent: "transparent",
      gray: {
        100: "#FFFFFF",
        200: "#D4D4D4",
        300: "#BFBFBF",
        400: "#AAAAAA",
        500: "#959595",
        600: "#7F7F7F",
        700: "#6A6A6A",
        800: "#555555",
        900: "#2A2A2A"
      },
      red: {
        100: "#E77878",
        300: "#DF4B4B",
        500: "#D71E1E",
        700: "#AC1818",
        900: "#811212"
      },
      gold: {
        100: "#FAD067",
        300: "#F8C034",
        500: "#F6B001",
        700: "#D69A06",
        900: "#B07F03"
      },
      green: {
        100: "#89D591",
        300: "#62C76D",
        500: "#3BB948",
        700: "#2F943A",
        900: "#236F2B"
      }
    },
    extend: {
      fontFamily: {
        sans: [
          "Comfortaa",
          ...require("tailwindcss/defaultTheme").fontFamily.sans
        ]
      },
      animation: {
        "fade-in": "fade-in .4s ease-out"
      },
      keyframes: {
        "fade-in": { from: { opacity: 0 }, to: { opacity: 1 } }
      }
    }
  },
  plugins: [require("@headlessui/tailwindcss")],
  future: {
    hoverOnlyWhenSupported: true
  }
}
