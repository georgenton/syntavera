import "server-only";
import { cache } from "react";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/modules/audit/service";
import { projectSnapshotSchema, selectSnapshotForPermissions, type ProjectSnapshot } from "./schema";

async function createSnapshot(projectId: string, db: Prisma.TransactionClient): Promise<ProjectSnapshot> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      id: true, name: true, objective: true, summary: true, status: true, startDate: true, targetDate: true,
      phases: { orderBy: { position: "asc" }, select: { id: true, name: true, clientSummary: true, position: true, status: true } },
      milestones: { orderBy: { position: "asc" }, select: { id: true, phaseId: true, title: true, description: true, position: true, status: true, dueAt: true } },
      deliverables: {
        where: { status: { not: "DRAFT" } },
        orderBy: { createdAt: "asc" },
        select: {
          id: true, milestoneId: true, title: true, description: true, status: true, dueAt: true,
          documents: {
            where: { state: "PUBLISHED" },
            select: {
              id: true, title: true, state: true,
              versions: {
                orderBy: { version: "asc" },
                select: { id: true, version: true, label: true, createdAt: true, file: { where: { visibility: "CLIENT" }, select: { id: true, originalName: true, mimeType: true, sizeBytes: true } } },
              },
            },
          },
        },
      },
      decisions: { where: { status: "DECIDED", outcome: { not: null }, decidedAt: { not: null } }, orderBy: { decidedAt: "desc" }, select: { id: true, title: true, outcome: true, decidedAt: true } },
      invoices: { where: { documentState: "ISSUED" }, orderBy: { issuedAt: "desc" }, select: { id: true, number: true, documentState: true, paymentState: true, currency: true, totalMinor: true, issuedAt: true, dueAt: true, externalUrl: true } },
    },
  });
  if (!project) throw new Error("Project not found");

  return projectSnapshotSchema.parse({
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    project: {
      id: project.id,
      name: project.name,
      objective: project.objective,
      summary: project.summary,
      status: project.status,
      startDate: project.startDate?.toISOString() ?? null,
      targetDate: project.targetDate?.toISOString() ?? null,
    },
    phases: project.phases.map((phase) => ({ id: phase.id, name: phase.name, summary: phase.clientSummary, position: phase.position, status: phase.status })),
    milestones: project.milestones.map((item) => ({ ...item, dueAt: item.dueAt?.toISOString() ?? null })),
    deliverables: project.deliverables.map((item) => ({
      ...item,
      dueAt: item.dueAt?.toISOString() ?? null,
      documents: item.documents.map((document) => ({
        ...document,
        versions: document.versions.map((version) => ({ ...version, createdAt: version.createdAt.toISOString(), file: version.file ? { ...version.file, sizeBytes: version.file.sizeBytes.toString() } : null })),
      })),
    })),
    decisions: project.decisions.map((item) => ({ id: item.id, title: item.title, outcome: item.outcome!, decidedAt: item.decidedAt!.toISOString() })),
    billing: project.invoices.map((item) => ({ ...item, issuedAt: item.issuedAt?.toISOString() ?? null, dueAt: item.dueAt?.toISOString() ?? null })),
  });
}

export async function publishProjectSnapshot(input: { projectId: string; actorId: string; changeSummary: string }) {
  return prisma.$transaction(async (tx) => {
    const snapshot = await createSnapshot(input.projectId, tx);
    const aggregate = await tx.projectPublication.aggregate({ where: { projectId: input.projectId }, _max: { version: true } });
    const version = (aggregate._max.version ?? 0) + 1;
    await tx.projectPublication.updateMany({ where: { projectId: input.projectId, status: "PUBLISHED" }, data: { status: "WITHDRAWN", withdrawnAt: new Date() } });
    const publication = await tx.projectPublication.create({
      data: { projectId: input.projectId, publishedById: input.actorId, version, changeSummary: input.changeSummary, snapshot: snapshot as unknown as Prisma.InputJsonValue },
    });
    await tx.activityEvent.create({ data: { projectId: input.projectId, actorId: input.actorId, type: "PROJECT_PUBLISHED", data: { publicationId: publication.id, version, changeSummary: input.changeSummary }, visibleToClient: true } });
    await writeAuditLog({ actorId: input.actorId, projectId: input.projectId, action: "PROJECT_PUBLISHED", targetType: "ProjectPublication", targetId: publication.id, metadata: { version, changeSummary: input.changeSummary } }, tx);
    return publication;
  });
}

const getPublishedSnapshotCached = cache(async (projectId: string, includeFinance: boolean) => {
  const publication = await prisma.projectPublication.findFirst({ where: { projectId, status: "PUBLISHED" }, orderBy: { version: "desc" } });
  if (!publication) return null;
  const snapshot = projectSnapshotSchema.parse(publication.snapshot);
  return { publication, snapshot: selectSnapshotForPermissions(snapshot, includeFinance ? ["FINANCE"] : []) };
});

export async function getPublishedSnapshot(projectId: string, permissions: readonly string[]) {
  return getPublishedSnapshotCached(projectId, permissions.includes("FINANCE"));
}
