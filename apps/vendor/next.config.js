const { loadRootEnv, loadDbEnv } = require("@online-store/config/next");

// Pull the shared monorepo-root .env into this app's process env.
loadRootEnv(__dirname);
// Prisma's DATABASE_URL lives next to the schema; share it with this app.
loadDbEnv();

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
