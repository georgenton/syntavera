import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/modules/audit/service";
import { requirePermission, requireProjectAccess } from "@/modules/auth/guards";
import { confirmPrivateUpload } from "@/modules/storage/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  projectId: z.uuid(),
  storageKey: z.string().min(20).max(500),
  originalName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(160),
  sizeBytes: z.number().int().positive(),
  visibility: z.enum(["CLIENT", "INTERNAL"]).default("CLIENT"),
  documentId: z.uuid().optional(),
  label: z.string().trim().max(120).optional(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid upload completion" }, { status: 400 });
  const context = await requireProjectAccess(parsed.data.projectId);
  if (context.user.kind === "CLIENT") {
    await requirePermission(parsed.data.projectId, "COMMENT");
    if (parsed.data.visibility !== "CLIENT" || parsed.data.documentId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const verified = await confirmPrivateUpload(parsed.data);
  const file = await prisma.$transaction(async (tx) => {
    let documentVersionId: string | null = null;
    if (parsed.data.documentId) {
      const document = await tx.document.findFirst({ where: { id: parsed.data.documentId, projectId: parsed.data.projectId }, select: { id: true } });
      if (!document) throw new Error("Document not found in project");
      const aggregate = await tx.documentVersion.aggregate({ where: { documentId: document.id }, _max: { version: true } });
      const version = await tx.documentVersion.create({ data: { documentId: document.id, version: (aggregate._max.version ?? 0) + 1, label: parsed.data.label || null, authoredById: context.user.id } });
      documentVersionId = version.id;
    }
    const created = await tx.fileObject.create({
      data: {
        projectId: parsed.data.projectId,
        uploadedById: context.user.id,
        storageKey: parsed.data.storageKey,
        originalName: parsed.data.originalName,
        mimeType: parsed.data.mimeType,
        sizeBytes: BigInt(parsed.data.sizeBytes),
        visibility: parsed.data.visibility,
        checksum: verified.checksum,
        documentVersionId,
      },
    });
    await writeAuditLog({ actorId: context.user.id, projectId: parsed.data.projectId, action: documentVersionId ? "DOCUMENT_VERSION_CREATED" : "FILE_UPLOAD_COMPLETED", targetType: documentVersionId ? "DocumentVersion" : "FileObject", targetId: documentVersionId ?? created.id, metadata: { fileId: created.id, visibility: created.visibility, mimeType: created.mimeType, sizeBytes: created.sizeBytes.toString() } }, tx);
    return created;
  });
  return NextResponse.json({ fileId: file.id }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
