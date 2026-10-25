/**
 * Shared Tailwind presets.
 * Apps do: `const config = { presets: [require("@online-store/config/tailwind/presets")] }`
 * The preset wires up the shared design tokens so all three apps look alike.
 */
const base = require("./base.js");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: base.darkMode,
  theme: {
    extend: base.theme.extend,
  },
  plugins: base.plugins,
};
