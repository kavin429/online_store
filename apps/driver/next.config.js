const { loadRootEnv, loadDbEnv } = require("@online-store/config/next");

loadRootEnv(__dirname);
// Prisma's DATABASE_URL lives next to the schema; share it with this app.
loadDbEnv();

// The driver app runs on its own port. NextAuth needs the app's own URL so the
// sign-in callback and cookies belong to this app, not the storefront.
if (process.env.DRIVER_APP_URL) {
  process.env.NEXTAUTH_URL = process.env.DRIVER_APP_URL;
} else if (
  !process.env.NEXTAUTH_URL ||
  /localhost:3000|127\.0\.0\.1:3000/.test(process.env.NEXTAUTH_URL)
) {
  process.env.NEXTAUTH_URL = "http://localhost:3003";
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@online-store/ui", "@online-store/auth", "@online-store/db"],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

module.exports = nextConfig;
