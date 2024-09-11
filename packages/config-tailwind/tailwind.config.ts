import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";
import plugin from "tailwindcss/plugin";
import type { PluginUtils } from "tailwindcss/types/config";

// We want each package to be responsible for its own content.
const config: Omit<Config, "content"> = {
  darkMode: "selector",
  prefix: "ui-", // This is to avoid conflicts with other packages, https://github.com/vercel/turbo/issues/1809
  theme: {
    screens: {
      // https://tailwindcss.com/docs/screens#adding-smaller-breakpoints,
      xs: "375px",
      ...defaultTheme.screens,
    },
    extend: {
      keyframes: {
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        countdown: {
          "0%": {
            transform: "scale(1)",
            opacity: 1,
          },
          "100%": {
            transform: "scale(3)",
            opacity: 0,
          },
        },
        wave: {
          "0%": {
            opacity: 0,
            transform: "scaleX(1) scaleY(1)",
          },

          "100%": {
            opacity: 1,
            transform: "scaleX(1.4) scaleY(1.4)",
          },
        },
        blink: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0 },
        },

        boundr: {
          "0%": {
            transform: "translateX(15%)",
            "animation-timing-function": "cubic-bezier(0.8, 0, 1, 1)",
          },
          "50%": {
            transform: "translateX(0)",
            "animation-timing-function": "cubic-bezier(0, 0, 0.2, 1)",
          },
          "100%": {
            transform: "translateX(15%)",
            "animation-timing-function": "cubic-bezier(0.8, 0, 1, 1)",
          },
        },

        boundl: {
          "0%": {
            transform: "translateX(-15%)",
            "animation-timing-function": "cubic-bezier(0.8, 0, 1, 1)",
          },
          "50%": {
            transform: "translateX(0)",
            "animation-timing-function": "cubic-bezier(0, 0, 0.2, 1)",
          },
          "100%": {
            transform: "translateX(-15%)",
            "animation-timing-function": "cubic-bezier(0.8, 0, 1, 1)",
          },
        },

        "marquee-scroll": {
          "100%": {
            transform: "translate3d(0,0,0)",
          },
        },

        "scale-slide-up": {
          "0%": {
            transform: "scale(0.5,0.5) translateY(100px)",
            opacity: 0,
          },
          "100%": {
            transform: "scale(1,1) translateY(0%)",
            opacity: 1,
          },
        },

        glow: {
          "75%, 100%": {
            width: "calc(100% + 10px)",
            height: "calc(100% + 10px)",
            opacity: 0,
          },
        },
        "trivia-pulse": {
          "0%": {
            "box-shadow": "0 0 0 0 rgba(45, 212, 191, 1)",
          },

          "70%": {
            "box-shadow": "0 0 0 20px rgba(45, 212, 191, 0)",
          },

          "100%": {},
        },
      },
      animation: {
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        "bound-right": "boundr 0.8s infinite",
        "bound-left": "boundl 0.8s infinite",
        countdown: "countdown 1s ease-in-out infinite",
        blink: "blink 1s step-start infinite",
        "marquee-scroll": "marquee-scroll 10s linear infinite",
        "scale-slide-up": "scale-slide-up 0.3s ease-out",
        glow: "glow 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "trivia-pulse": "trivia-pulse 1.5s infinite",
      },
      fontFamily: {
        montserrat: ["Montserrat", "sans-serif"],
        manrope: ["Manrope", "sans-serif"],
        "chakra-petch": ["Chakra Petch", "sans-serif"],
        inter: ["Inter", "sans-serif"],
      },
      backgroundImage: {
        "glow-conic":
          "conic-gradient(from 180deg at 50% 50%, #2a8af6 0deg, #a853ba 180deg, #e92a67 360deg)",
        gradient:
          "linear-gradient(to bottom right, #1f1f1f, rgba(255, 90, 16, 0.5)), linear-gradient(rgba(0, 0, 0, 1), rgba(0, 0, 0, 1))",
        secondary: {
          DEFAULT: "linear-gradient(90deg, #FF5A10 0%, #FE9900 100%)",
        },
        "orange-sunrise":
          "linear-gradient(180deg, #FE9801 -22.22%, #FF6225 100%)",
        "orange-flame":
          "linear-gradient(180deg, #FE9801 -22.22%, #FF6225 100%)",
      },
      colors: {
        button: {
          idle: {
            "100": "#FF5A10",
            "200": "#FE9900",
          },
          hover: {
            "100": "#CD2800",
            "200": "#CC6700",
          },
        },
        background: {
          DEFAULT: "rgb(var(--background) / <alpha-value>)",
          dialog: "rgb(var(--dialog-background) / <alpha-value>)",
          popover: "rgb(var(--popover-background) / <alpha-value>)",
          "selection-tab":
            "rgb(var(--selection-tab-background) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--color-secondary) / <alpha-value>)",
        },
        tertiary: {
          DEFAULT: "rgb(var(--color-tertiary) / <alpha-value>)",
        },
        warning: {
          // accent crown on design
          DEFAULT: "rgb(var(--color-warning) / <alpha-value>)",
        },
        danger: {
          DEFAULT: "rgb(var(--color-danger) / <alpha-value>)",
        },
        success: {
          DEFAULT: "rgb(var(--color-success) / <alpha-value>)",
        },
        verified: {
          DEFAULT: "rgb(var(--color-verified) / <alpha-value>)",
        },
        surface: {
          base: "rgb(var(--surface-base) / <alpha-value>)", // card
          lower: "rgb(var(--surface-lower) / <alpha-value>)", // main background
          raised: "rgb(var(--surface-raised) / <alpha-value>)", // popover/popup
        },

        grey: {
          900: "rgb(var(--grey-900) / <alpha-value>)",
        },
      },

      textColor: ({ theme }: PluginUtils) => ({
        main: {
          DEFAULT: "rgb(var(--text-main) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--text-secondary) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--text-muted) / <alpha-value>)",
        },
        warning: {
          DEFAULT: theme("colors.warning"),
        },
        danger: {
          DEFAULT: theme("colors.danger"),
        },
        success: {
          DEFAULT: theme("colors.success"),
        },
        accent: {
          inactive: "rgb(var(--accent-inactive) / <alpha-value>)",
        },
      }),

      backgroundColor: {
        surface: {
          base: "rgb(var(--surface-base) / <alpha-value>)", // card
          lower: "rgb(var(--surface-lower) / <alpha-value>)", // main background
          raised: "rgb(var(--surface-raised) / <alpha-value>)", // popover/popup
          header: "rgb(var(--surface-header) / <alpha-value>)",
        },
      },
      borderColor: {
        base: {
          DEFAULT: "rgb(var(--border-color-base) / <alpha-value>)",
        },
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    // this class is scrollable but hides scrollbar
    // use @repo/ui/widgets/chrome-extension/stream-stories
    // Ref: https://dev.to/derick1530/how-to-create-scrollable-element-in-tailwind-without-a-scrollbar-4mbd, https://github.com/tailwindlabs/tailwindcss/discussions/9915#discussioncomment-7500470
    plugin(({ addUtilities }) => {
      addUtilities({
        ".scrollbar-none": {
          "scrollbar-width": "none",
          "&::-webkit-scrollbar": {
            display: "none",
          },
        },
        /* a temp styling, will wait for the design system to be implemented */
        /* it is used in apps/chrome-extension/src/pages/popup/index.css */
        ".gray-scrollbar": {
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },

          "&::-webkit-scrollbar-thumb": {
            borderRadius: "8px",
            background: "#6d727d",
          },
        },
      });
    }),
  ],
};
export default config;
