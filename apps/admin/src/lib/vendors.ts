import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";

const PASSWORD_CHARS =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

/** Creates a short, readable password that an admin can share with a vendor. */
export function generateVendorPassword(length = 10): string {
  let password = "";
  for (let i = 0; i < length; i++) {
    password += PASSWORD_CHARS[randomInt(0, PASSWORD_CHARS.length)];
  }
  return password;
}

/** `GrowMore Traders` -> `growmoretraders`. */
function slugifyVendorName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 12);
  return slug || "vendor";
}

/**
 * Generates a username like `growmore4821` and retries until it is free.
 * Usernames are what the vendor types into the vendor app login page.
 */
export async function generateVendorUsername(name: string): Promise<string> {
  const base = slugifyVendorName(name);

  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = `${base}${randomInt(1000, 9999)}`;
    const existing = await prisma.vendor.findUnique({
      where: { username: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
  }

  return `${base}${Date.now().toString().slice(-6)}`;
}

/**
 * Public URL of the vendor app login page. Configure `VENDOR_APP_URL`
 * (e.g. https://vendor.example.com) in the environment.
 */
export function getVendorLoginUrl(): string {
  const configured =
    process.env.VENDOR_APP_URL ||
    process.env.NEXT_PUBLIC_VENDOR_APP_URL ||
    process.env.VENDOR_URL ||
    "http://localhost:3001";

  const base = configured.replace(/\/+$/, "");
  return /\/login$/i.test(base) ? base : `${base}/login`;
}
