/** @type {import('tailwindcss').Config} */
// eslint-disable-next-line no-undef
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "var(--ks-lw-stroke)",
        input: "var(--ks-lw-layer2)",
        background: "var(--ks-lw-layer1)",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "var(--ks-lw-accent)",
        },
        subText: "var(--ks-lw-subText)",
        text: "var(--ks-lw-text)",
        warning: "var(--ks-lw-warning)",
        error: "var(--ks-lw-error)",
        icon: {
          DEFAULT: "var(--ks-lw-icons)",
        },
        accent: {
          DEFAULT: "var(--ks-lw-accent)",
        },
      },
      borderRadius: {
        lg: "calc(var(--ks-lw-borderRadius) + 2px)",
        md: "var(--ks-lw-borderRadius)",
        sm: "calc(var(--ks-lw-borderRadius) - 2px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  // eslint-disable-next-line no-undef
  plugins: [require("tailwindcss-animate")],
};
