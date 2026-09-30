import "server-only";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

type DbClient = PrismaClient | Prisma.TransactionClient;

export async function writeAuditLog(input: {
  actorId?: string | null;
  projectId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ipHash?: string | null;
  userAgent?: string | null;
}, db: DbClient = prisma) {
  return db.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      projectId: input.projectId ?? null,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      metadata: input.metadata ?? {},
      ipHash: input.ipHash ?? null,
      userAgent: input.userAgent ?? null,
    },
  });
}
