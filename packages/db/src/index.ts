import { PrismaClient } from "@prisma/client";

export * from "@prisma/client";
export * from "./fifo";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Connection errors that are worth retrying. Prisma replaces a broken pooled
// connection on its own; retrying too quickly while the database is still
// restarting (e.g. P1001 after P1017) just fails again.
const RETRYABLE_CODES = new Set([
  "P1001", // can't reach database server
  "P1002", // database server timed out
  "P1008", // operation timed out
  "P1017", // server has closed the connection
  "P2024", // timed out fetching a connection from the pool
]);

const RETRY_DELAYS_MS = [500, 1500, 3000];

/**
 * Retries an operation when it fails because the database connection was
 * dropped. Do not call `$disconnect()` here: it closes the shared pool while
 * other requests are still using it and turns a single dropped connection into
 * a burst of failures.
 */
export async function withReconnect<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const code = err?.code as string | undefined;
      const delay = RETRY_DELAYS_MS[attempt];

      if (!code || !RETRYABLE_CODES.has(code) || delay === undefined) throw err;

      console.warn(
        `[db] ${code} while running query – retrying in ${delay}ms (attempt ${attempt + 1}/${RETRY_DELAYS_MS.length + 1})`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
