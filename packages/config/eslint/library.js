/** @type {import('eslint').Linter.Config} */
const libraryConfig = {
  extends: ["next/core-web-vitals", "next/typescript"],
  rules: {
    "react/no-unescaped-entities": "off",
  },
  ignorePatterns: [
    "node_modules/",
    "dist/",
    ".next/",
    "next-env.d.ts",
  ],
};

module.exports = libraryConfig;
