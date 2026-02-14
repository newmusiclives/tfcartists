import { PrismaClient } from "@prisma/client";
import { logger } from "./logger";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Resolve SQLite database path for serverless environments.
 * Uses dynamic require to avoid bundling Node.js fs/path modules in client code.
 */
function resolveSqliteUrl(originalUrl: string): string {
  if (!originalUrl.startsWith("file:") || typeof window !== "undefined") {
    return originalUrl;
  }

  try {
    // Dynamic require to avoid webpack bundling these for client
    const fs = require("fs");
    const path = require("path");

    const candidates = [
      path.resolve(process.cwd(), "prisma", "dev.db"),
      path.resolve(process.cwd(), "dev.db"),
      path.resolve(__dirname, "..", "..", "prisma", "dev.db"),
      path.resolve(__dirname, "..", "..", "..", "prisma", "dev.db"),
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return `file:${candidate}`;
      }
    }
  } catch {
    // fs/path not available (client-side), use original
  }

  return originalUrl;
}

/**
 * Create Prisma Client with optimized connection pooling
 */
const createPrismaClient = () => {
  let dbUrl = process.env.DATABASE_URL || "file:./dev.db";
  const isProduction = process.env.NODE_ENV === "production";

  if (dbUrl.startsWith("file:")) {
    dbUrl = resolveSqliteUrl(dbUrl);
  } else if (isProduction && dbUrl.startsWith("postgresql")) {
    const separator = dbUrl.includes("?") ? "&" : "?";
    if (!dbUrl.includes("connection_limit")) {
      dbUrl = `${dbUrl}${separator}connection_limit=5&pool_timeout=10`;
    }
  }

  return new PrismaClient({
    log: isProduction
      ? ["error", "warn"]
      : ["query", "error", "warn"],
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Graceful shutdown (only for real Prisma client)
if (process.env.NODE_ENV === "production" && process.env.DATABASE_URL) {
  process.on("beforeExit", async () => {
    await (prisma as PrismaClient).$disconnect();
  });
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
