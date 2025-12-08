/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}",
    "./models/**/*.{js,jsx}",
    "./hooks/**/*.{js,jsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f4ff",
          100: "#e0e9ff",
          200: "#c7d5ff",
          300: "#a4b8ff",
          400: "#8190ff",
          500: "#6D5DFB",
          600: "#5a4ae8",
          700: "#4a3cd4",
          800: "#3d2fc0",
          900: "#3225a8",
        },
        secondary: {
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4ff",
          400: "#c084ff",
          500: "#A66CFF",
          600: "#9d5aff",
          700: "#8b48ff",
          800: "#7a3feb",
          900: "#6a36d4",
        },
        accent: {
          50: "#e6f7ff",
          100: "#bae7ff",
          200: "#91d5ff",
          300: "#69c0ff",
          400: "#40a9ff",
          500: "#00D4FF",
          600: "#00b8e6",
          700: "#0099cc",
          800: "#007ab3",
          900: "#005c99",
        },
        dark: {
          bg: "#0F0F11",
          surface: "#1A1A1D",
          border: "#2A2A2E",
          text: "#E4E4E7", // WCAG AA compliant (4.5:1 contrast on dark bg)
          muted: "#B4B8C0", // Improved contrast from #9CA3AF for better readability
        },
        glass: {
          light: "rgba(255, 255, 255, 0.08)",
          medium: "rgba(255, 255, 255, 0.12)",
          heavy: "rgba(255, 255, 255, 0.16)",
        },
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #6D5DFB 0%, #A66CFF 100%)",
        "gradient-secondary": "linear-gradient(135deg, #A66CFF 0%, #00D4FF 100%)",
        "gradient-accent": "linear-gradient(135deg, #00D4FF 0%, #6D5DFB 100%)",
        "glass-gradient": "linear-gradient(135deg, rgba(109, 93, 251, 0.1) 0%, rgba(166, 108, 255, 0.1) 100%)",
        "chat-pattern": "radial-gradient(circle at top left, rgba(109, 93, 251, 0.15), transparent 50%)",
      },
      boxShadow: {
        "neobrutal": "8px 8px 0px 0px rgba(0, 0, 0, 0.2)",
        "neobrutal-sm": "4px 4px 0px 0px rgba(0, 0, 0, 0.15)",
        "glass": "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
        "glow-primary": "0 0 20px rgba(109, 93, 251, 0.4)",
        "glow-secondary": "0 0 20px rgba(166, 108, 255, 0.4)",
        "glow-accent": "0 0 20px rgba(0, 212, 255, 0.4)",
      },
      backdropBlur: {
        xs: "2px",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        display: ["Poppins", "Inter", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "typing": "typing 1.4s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        typing: {
          "0%, 60%, 100%": { transform: "translateY(0)" },
          "30%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};

