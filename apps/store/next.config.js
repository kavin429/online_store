const { loadRootEnv } = require("@online-store/config/next");

// Pull the shared monorepo-root .env into this app's process env.
loadRootEnv(__dirname);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@online-store/ui", "@online-store/auth", "@online-store/db"],
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
      // Legacy URLs from before the (shop) / (auth) / account restructure.
      { source: "/orders", destination: "/account/orders", permanent: false },
      { source: "/orders/:path*", destination: "/account/orders", permanent: false },
      { source: "/signup", destination: "/register", permanent: false },
      { source: "/offer", destination: "/offers", permanent: false },
    ];
  },
};

module.exports = nextConfig;
