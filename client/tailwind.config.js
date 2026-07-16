/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],

  theme: {
    extend: {
      colors: {
        /* Layout */
        page: "#f6f7f9",
        surface: "#ffffff",
        "surface-soft": "#f8fafc",

        /* Brand */
        sidebar: "#192231",
        gold: "#c9a35d",
        "gold-light": "#f3d79b",
        "gold-soft": "#f8f1e6",

        /* Typography */
        heading: "#192231",
        body: "#64748b",
        subtle: "#94a3b8",

        /* Borders */
        border: "#e5e7eb",
        "border-soft": "#f1f5f9",

        /* Status */
        green: "#1d4a3f",
        wine: "#5d2638",
      },

      fontFamily: {
        display: ["Georgia", "serif"],
        sans: ["Segoe UI", "system-ui", "sans-serif"],
      },

      boxShadow: {
        card: "0 8px 30px rgba(15, 23, 42, 0.06)",
        header: "0 1px 12px rgba(15, 23, 42, 0.05)",
      },
    },
  },

  plugins: [],
};