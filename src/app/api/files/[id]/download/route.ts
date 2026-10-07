import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireCurrentUser, requireProjectAccess } from "@/modules/auth/guards";
import { authorizationHttpError } from "@/modules/auth/http";
import { snapshotContainsClientFile } from "@/modules/projects/portal-policy";
import { getPublishedSnapshot } from "@/modules/publication/service";
import { createPrivateDownloadUrl } from "@/modules/storage/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "Invalid file id" }, { status: 400 });
  try {
    await requireCurrentUser();
    const file = await prisma.fileObject.findUnique({ where: { id } });
    if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });
    let context;
    try {
      context = await requireProjectAccess(file.projectId);
    } catch (error) {
      const authorization = authorizationHttpError(error, { concealForbidden: true });
      if (authorization) return NextResponse.json({ error: authorization.message }, { status: authorization.status });
      throw error;
    }
    if (context.user.kind === "CLIENT") {
      if (file.visibility !== "CLIENT") return NextResponse.json({ error: "Not found" }, { status: 404 });
      const published = await getPublishedSnapshot(file.projectId, context.membership?.permissions ?? []);
      if (!published || !snapshotContainsClientFile(published.snapshot, file.id)) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }
    const url = await createPrivateDownloadUrl(file.storageKey, file.originalName);
    return NextResponse.redirect(url, 302);
  } catch (error) {
    const authorization = authorizationHttpError(error);
    if (authorization) return NextResponse.json({ error: authorization.message }, { status: authorization.status });
    throw error;
  }
}
