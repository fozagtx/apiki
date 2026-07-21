import { PrismaClient } from "@prisma/client";
import { resolve } from "node:path";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
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
 */
export function getDatabasePath(): string {
  const raw = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  if (raw.startsWith("file:")) {
    return resolve(raw.slice("file:".length));
  }
  return raw;
}
