/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#0D0E10", // Ink
        accent: "#00B89A",  // Cyan (Marque)
        background: "#F8F6F2", // Paper
        paper2: "#F2EFE9",
        white: "#FFFFFF",
        ink: "#0D0E10",
        danger: "#D94F2A",
        success: "#00B89A",
        warning: "#9A6500",
        text: {
          primary: "#0D0E10",
          secondary: "rgba(13,14,16,0.6)",
          muted: "rgba(13,14,16,0.3)",
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
