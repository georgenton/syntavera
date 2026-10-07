import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission, requireProjectAccess } from "@/modules/auth/guards";
import { authorizationHttpError } from "@/modules/auth/http";
import { createPrivateUploadUrl } from "@/modules/storage/service";
import { StorageValidationError } from "@/modules/storage/upload-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  projectId: z.uuid(),
  originalName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(160),
  sizeBytes: z.number().int().positive(),
  visibility: z.enum(["CLIENT", "INTERNAL"]).default("CLIENT"),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid upload request" }, { status: 400 });
  try {
    const context = await requireProjectAccess(parsed.data.projectId);
    if (context.user.kind === "CLIENT") {
      await requirePermission(parsed.data.projectId, "COMMENT");
      if (parsed.data.visibility !== "CLIENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const upload = await createPrivateUploadUrl(parsed.data);
    return NextResponse.json({ storageKey: upload.storageKey, uploadUrl: upload.url, expiresIn: upload.expiresIn }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const authorization = authorizationHttpError(error);
    if (authorization) return NextResponse.json({ error: authorization.message }, { status: authorization.status });
    if (error instanceof StorageValidationError) return NextResponse.json({ error: error.message }, { status: 400 });
    throw error;
  }
}
