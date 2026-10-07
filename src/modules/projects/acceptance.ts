import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/modules/audit/service";
import { projectSnapshotSchema } from "@/modules/publication/schema";
import { snapshotContainsDocumentVersion } from "./acceptance-policy";

export const ACCEPTANCE_STATEMENT = "Aceptación registrada en el portal para esta versión. No constituye una firma electrónica ni sustituye un acuerdo legal.";

export async function acceptPublishedVersion(input: { projectId: string; deliverableId: string; documentVersionId: string; actorId: string; organizationId: string; sessionId: string; ipHash?: string | null; userAgent?: string | null }) {
  try {
    return await prisma.$transaction(async (tx) => {
      const publication = await tx.projectPublication.findFirst({ where: { projectId: input.projectId, status: "PUBLISHED" }, orderBy: { version: "desc" } });
      if (!publication) throw new Error("No published project snapshot");
      const snapshot = projectSnapshotSchema.parse(publication.snapshot);
      if (!snapshotContainsDocumentVersion(snapshot, input.deliverableId, input.documentVersionId)) throw new Error("The requested version is not in the current published snapshot");

      const existing = await tx.acceptance.findUnique({
        where: { documentVersionId_acceptedById: { documentVersionId: input.documentVersionId, acceptedById: input.actorId } },
      });
      if (existing) return existing;

      const acceptance = await tx.acceptance.create({
        data: {
          projectId: input.projectId,
          deliverableId: input.deliverableId,
          documentVersionId: input.documentVersionId,
          acceptedById: input.actorId,
          organizationId: input.organizationId,
          sessionId: input.sessionId,
          statement: ACCEPTANCE_STATEMENT,
          ipHash: input.ipHash ?? null,
          userAgent: input.userAgent ?? null,
        },
      });
      await tx.deliverable.update({ where: { id: input.deliverableId }, data: { status: "ACCEPTED" } });
      await tx.activityEvent.create({ data: { projectId: input.projectId, actorId: input.actorId, type: "DELIVERABLE_ACCEPTED", data: { deliverableId: input.deliverableId, documentVersionId: input.documentVersionId, acceptanceId: acceptance.id } as Prisma.InputJsonValue, visibleToClient: true } });
      await writeAuditLog({ actorId: input.actorId, projectId: input.projectId, action: "DELIVERABLE_ACCEPTED", targetType: "DocumentVersion", targetId: input.documentVersionId, metadata: { acceptanceId: acceptance.id, deliverableId: input.deliverableId } }, tx);
      return acceptance;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await prisma.acceptance.findUnique({
        where: { documentVersionId_acceptedById: { documentVersionId: input.documentVersionId, acceptedById: input.actorId } },
      });
      if (existing) return existing;
    }
    throw error;
  }
}
