const { loadRootEnv } = require("@online-store/config/next");

// Pull the shared monorepo-root .env into this app's process env.
loadRootEnv(__dirname);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@online-store/ui", "@online-store/db"],
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

module.exports = nextConfig;
