import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireProjectAccess } from "@/modules/auth/guards";
import { createPrivateDownloadUrl } from "@/modules/storage/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const file = await prisma.fileObject.findUnique({ where: { id } });
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const context = await requireProjectAccess(file.projectId);
  if (context.user.kind === "CLIENT" && file.visibility !== "CLIENT") return NextResponse.json({ error: "Not found" }, { status: 404 });
  const url = await createPrivateDownloadUrl(file.storageKey, file.originalName);
  return NextResponse.redirect(url, 302);
}
