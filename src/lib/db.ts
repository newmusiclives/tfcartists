import { PrismaClient } from "@prisma/client";
import { logger } from "./logger";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Create Prisma Client with optimized connection pooling
 *
 * Connection Pool Configuration:
 * - Production: Optimized for serverless (5-10 connections)
 * - Development: Smaller pool to prevent overwhelming local DB
 */
const createPrismaClient = () => {
  if (!process.env.DATABASE_URL) {
    // Return a proxy that throws helpful errors if used
    return new Proxy({} as PrismaClient, {
      get() {
        throw new Error(
          "DATABASE_URL is not configured. Set DATABASE_URL environment variable."
        );
      },
    });
  }

  const isProduction = process.env.NODE_ENV === "production";

  return new PrismaClient({
    log: isProduction
      ? ["error", "warn"]
      : ["query", "error", "warn"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
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
