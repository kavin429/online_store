import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";

const PASSWORD_CHARS =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

/** Creates a short, readable password that an admin can share with a rider. */
export function generatePassword(length = 10): string {
  let password = "";
  for (let i = 0; i < length; i++) {
    password += PASSWORD_CHARS[randomInt(0, PASSWORD_CHARS.length)];
  }
  return password;
}

/** `kasun` -> `kasun`, `Kasun Perera` -> `kasunperera`. */
function slugifyName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 12);
  return slug || "driver";
}

/**
 * Generates a username like `kasun4821` and retries until it is free.
 * Usernames are what the rider types into the driver app.
 */
export async function generateUsername(name: string): Promise<string> {
  const base = slugifyName(name);

  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = `${base}${randomInt(1000, 9999)}`;
    const existing = await prisma.driver.findUnique({
      where: { username: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
  }

  return `${base}${Date.now().toString().slice(-6)}`;
}

/** Optional email alias for the rider, used only for contact. */
export function driverEmailFor(username: string): string {
  return `${username}@driver.growmore.local`;
}
