import type { Config } from "tailwindcss";
import baseConfig from "@online-store/config/tailwind/base";
import preset from "@online-store/config/tailwind/presets";

const config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  presets: [baseConfig, preset],
} satisfies Config;

export default config;
