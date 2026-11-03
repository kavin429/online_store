const fs = require("fs");
const path = require("path");
const { loadRootEnv, parseEnv } = require("@online-store/config/next");

loadRootEnv(__dirname);

// The monorepo keeps DATABASE_URL next to the Prisma schema. Reuse it when the
// root .env does not define one so the driver app can boot on its own.
if (!process.env.DATABASE_URL) {
  const dbEnvPath = path.resolve(__dirname, "../../packages/db/.env");
  if (fs.existsSync(dbEnvPath)) {
    const parsed = parseEnv(fs.readFileSync(dbEnvPath, "utf8"));
    for (const [key, value] of Object.entries(parsed)) {
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

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
