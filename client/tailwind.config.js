/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        montserrat: ["Montserrat", "sans-serif"],
        pt: ["'PT Sans Narrow'", "sans-serif"],
        paprika: ["Paprika", "serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        'custom-radial': "radial-gradient(circle 728px at 12% 6%, rgba(30, 40, 100, 0.6) 0%, rgba(3, 4, 18, 0) 60%), radial-gradient(circle 1200px at 90% 18%, rgba(49, 60, 122, 0.6) 0%, rgba(7, 9, 37, 0) 60%), radial-gradient(ellipse 800px 500px at 50% 45%, rgba(30, 40, 100, 0.6) 0%, rgba(3, 4, 18, 0) 60%), radial-gradient(circle 1500px at 50% 102%, rgba(49, 60, 122, 0.6) 0%, rgba(7, 9, 37, 0) 60%)",
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}
