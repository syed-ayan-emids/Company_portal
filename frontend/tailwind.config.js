/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        emids: {
          red: "#E9212D",
          reddark: "#B7151F",
          teal: "#52B0BD",
          tealdeep: "#2A7682",
          tealsky: "#9DC6CC",
          tealsoft: "#EAF4F5",
          amber: "#FFB21C",
          navy: "#0F2440",
          ink: "#0A0A0A",
          paper: "#FEFEFE",
          mist: "#F4F5F7",
          line: "#E6E6E6",
        },
      },
      fontFamily: {
        sans: ["Inter", "Segoe UI", "system-ui", "sans-serif"],
        serif: ["Playfair Display", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(10,10,10,0.04), 0 12px 32px -16px rgba(15,36,64,0.12)",
        pop: "0 24px 64px -24px rgba(10,10,10,0.35)",
        chat: "0 32px 72px -24px rgba(15,36,64,0.35)",
      },
      keyframes: {
        "float-in": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pop: {
          "0%": { opacity: "0", transform: "translateY(16px) scale(0.96)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        blink: {
          "0%, 80%, 100%": { opacity: "0.25", transform: "translateY(0)" },
          "40%": { opacity: "1", transform: "translateY(-2px)" },
        },
      },
      animation: {
        "float-in": "float-in 0.5s ease-out both",
        pop: "pop 0.25s cubic-bezier(0.16, 1, 0.3, 1) both",
        blink: "blink 1.3s infinite ease-in-out both",
      },
    },
  },
  plugins: [],
};
