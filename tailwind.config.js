/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#1A1A1A", // Black
        accent: "#E6DAC3",  // Beige
        background: "#FFFFFF", // White
        paper2: "#F8F6F2",
        white: "#FFFFFF",
        ink: "#1A1A1A",
        danger: "#D94F2A",
        success: "#00B89A",
        warning: "#9A6500",
        text: {
          primary: "#1A1A1A",
          secondary: "rgba(26,26,26,0.6)",
          muted: "rgba(26,26,26,0.3)",
        }
      },
      fontFamily: {
        display: ["Cormorant-Bold"],
        body: ["DMSans-Regular"],
        mono: ["DMMono-Regular"],
      }
    },
  },
  plugins: [],
}
