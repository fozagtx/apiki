import { PrismaClient } from "@prisma/client";
import { resolve } from "node:path";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  // Relative file: URLs are resolved by Prisma against prisma/ (schema dir).
  const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db";
  return new PrismaClient({
    datasources: { db: { url: dbUrl } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Resolve the SQLite database file path for health checks / diagnostics.
 * Prisma resolves relative `file:` URLs against the prisma/ directory.
 */
export function getDatabasePath(): string {
  const raw = process.env.DATABASE_URL ?? "file:./dev.db";
  if (!raw.startsWith("file:")) return raw;

  const filePath = raw.slice("file:".length);
  if (filePath.startsWith("/")) return filePath;

  // Match Prisma: relative paths are relative to the schema directory.
  if (filePath.startsWith("./prisma/") || filePath.startsWith("prisma/")) {
    return resolve(process.cwd(), filePath);
  }
  return resolve(process.cwd(), "prisma", filePath.replace(/^\.\//, ""));
}
