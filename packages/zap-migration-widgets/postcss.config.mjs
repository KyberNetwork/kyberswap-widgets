const prefixOverrideList = ["html", "body"];

export default {
  plugins: {
    "postcss-import": {},
    "tailwindcss/nesting": {},
    tailwindcss: { config: "tailwind.config.ts" },
    autoprefixer: {},
  },
};
