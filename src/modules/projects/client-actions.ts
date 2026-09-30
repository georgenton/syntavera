"use server";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";
import { requirePermission } from "@/modules/auth/guards";
import { acceptPublishedVersion } from "./acceptance";

function requestIp(requestHeaders: Headers) {
  return requestHeaders.get("cf-connecting-ip") ?? requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function acceptVersionAction(projectId: string, deliverableId: string, documentVersionId: string, formData: FormData) {
  z.literal("accepted").parse(formData.get("confirmation"));
  const { user, session } = await requirePermission(projectId, "APPROVE");
  if (user.kind !== "CLIENT" || !user.organizationId) throw new Error("Only an organization client can register acceptance");
  const requestHeaders = await headers();
  const env = getServerEnv();
  const ipHash = createHmac("sha256", env.BETTER_AUTH_SECRET).update(requestIp(requestHeaders)).digest("hex");
  await acceptPublishedVersion({ projectId, deliverableId, documentVersionId, actorId: user.id, organizationId: user.organizationId, sessionId: session.session.id, ipHash, userAgent: requestHeaders.get("user-agent")?.slice(0, 500) ?? null });
  revalidatePath(`/portal/p/${projectId}/deliverables/${deliverableId}`);
  revalidatePath(`/portal/p/${projectId}/activity`);
}
