import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const buildSafeDatabaseUrl = process.env.DATABASE_URL ?? "postgresql://build:build@127.0.0.1:5432/build";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: buildSafeDatabaseUrl });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export function requireDatabase() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for this operation");
  return prisma;
}
