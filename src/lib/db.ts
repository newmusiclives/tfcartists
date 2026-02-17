import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Create Prisma Client with optimized connection pooling for PostgreSQL
 */
const createPrismaClient = () => {
  let dbUrl = process.env.DATABASE_URL || "";
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction && dbUrl.startsWith("postgresql")) {
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

// Graceful shutdown
if (process.env.NODE_ENV === "production" && process.env.DATABASE_URL) {
  process.on("beforeExit", async () => {
    await (prisma as PrismaClient).$disconnect();
  });
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
