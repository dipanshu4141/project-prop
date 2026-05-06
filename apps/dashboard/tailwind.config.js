/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        background: "#f8fafc",
        card: "#ffffff",
        muted: "#f1f5f9",

        border: {
          DEFAULT: "#e5e7eb",
          light: "#f1f5f9",
        },

        foreground: "#0f172a",
        mutedForeground: "#64748b",

        primary: {
          DEFAULT: "#4f46e5",
          foreground: "#ffffff",
          soft: "#eef2ff",
        },

        success: {
          DEFAULT: "#16a34a",
          foreground: "#ffffff",
          soft: "#dcfce7",
        },

        warning: {
          DEFAULT: "#f59e0b",
          foreground: "#ffffff",
          soft: "#fef3c7",
        },
      },

      boxShadow: {
        sm: "0 1px 2px rgba(0,0,0,0.04)",
        md: "0 4px 12px rgba(0,0,0,0.08)",
        lg: "0 10px 25px rgba(0,0,0,0.12)",
      },

      borderRadius: {
        lg: "0.75rem",
        xl: "1rem",
      },

      /* 🔥 ADD THIS SECTION */

      keyframes: {
        whatsappMessage: {
          "0%": { color: "#25D366" },
          "50%": { color: "#ffffff" },
          "100%": { color: "#25D366" },
        },
      },

      animation: {
        "whatsapp-message": "whatsappMessage 2s linear infinite",
      },
    },
  },

  plugins: [],
};