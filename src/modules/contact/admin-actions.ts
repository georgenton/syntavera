"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/modules/audit/service";
import { requireInternalUser } from "@/modules/auth/guards";

export async function updateContactStatusAction(id: string, formData: FormData) {
  const { user } = await requireInternalUser();
  const status = z.enum(["NEW", "REVIEWED", "ARCHIVED"]).parse(formData.get("status"));
  await prisma.$transaction(async (tx) => {
    await tx.contactSubmission.update({ where: { id }, data: { status } });
    await writeAuditLog({ actorId: user.id, action: "CONTACT_STATUS_UPDATED", targetType: "ContactSubmission", targetId: id, metadata: { status } }, tx);
  });
  revalidatePath("/admin/contacts");
}
