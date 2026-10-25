const path = require("path");

/** @type {import('eslint').Linter.Config} */
const nextConfig = {
  extends: ["next/core-web-vitals"],
  rules: {
    "@next/next/no-img-element": "off",
    "react/no-unescaped-entities": "off",
  },
  settings: {
    next: {
      rootDir: path.join(__dirname, "../../../apps/"),
    },
  },
  ignorePatterns: [
    "node_modules/",
    ".next/",
    "out/",
    "dist/",
    "next-env.d.ts",
  ],
};

module.exports = nextConfig;
