const { loadRootEnv } = require("@online-store/config/next");

loadRootEnv(__dirname);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@online-store/ui", "@online-store/auth", "@online-store/db"],
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
    instrumentationHook: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

module.exports = nextConfig;
