/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        theme: {
          primary: "var(--bg-primary)",
          secondary: "var(--bg-secondary)",
          surface: "var(--surface)",
          "surface-hover": "var(--surface-hover)",
          "primary-accent": "var(--primary)",
          "secondary-accent": "var(--secondary)",
          accent: "var(--accent)",
          "light-accent": "var(--light-accent)",
          "text-primary": "var(--text-primary)",
          "text-secondary": "var(--text-secondary)",
          border: "var(--border-color)",
        },
        everest: {
          50: "var(--everest-50)",
          100: "var(--everest-100)",
          200: "var(--everest-200)",
          300: "var(--everest-300)",
          400: "var(--everest-400)",
          DEFAULT: "var(--everest-500)",
          600: "var(--everest-600)",
          700: "var(--everest-700)",
          800: "var(--everest-800)",
          900: "var(--everest-900)",
          950: "var(--everest-950)",
        },
      },
      boxShadow: {
        card: "var(--card-shadow)",
      },
      borderRadius: {
        theme: "var(--border-radius)",
      },
      transitionDuration: {
        theme: "300ms",
      },
    },
  },
  plugins: [],
};
