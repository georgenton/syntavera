"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/modules/audit/service";
import { requireAdmin } from "@/modules/auth/guards";
import { processContactNotification } from "./notification.server";

export async function updateContactStatusAction(id: string, formData: FormData) {
  const { user } = await requireAdmin();
  const submissionId = z.uuid().parse(id);
  const status = z.enum(["NEW", "REVIEWED", "ARCHIVED"]).parse(formData.get("status"));
  await prisma.$transaction(async (tx) => {
    await tx.contactSubmission.update({ where: { id: submissionId }, data: { status } });
    await writeAuditLog({ actorId: user.id, action: "CONTACT_STATUS_UPDATED", targetType: "ContactSubmission", targetId: submissionId, metadata: { status } }, tx);
  });
  revalidatePath("/admin/contacts");
}

export async function retryContactNotificationAction(id: string) {
  const { user } = await requireAdmin();
  const submissionId = z.uuid().parse(id);
  const queued = await prisma.$transaction(async (tx) => {
    const result = await tx.contactSubmission.updateMany({
      where: { id: submissionId, notificationStatus: "FAILED" },
      data: { notificationStatus: "PENDING", notificationLastErrorCode: null },
    });
    if (result.count === 1) {
      await writeAuditLog({
        actorId: user.id,
        action: "CONTACT_NOTIFICATION_RETRY_REQUESTED",
        targetType: "ContactSubmission",
        targetId: submissionId,
      }, tx);
    }
    return result;
  });

  if (queued.count === 1) {
    await processContactNotification(submissionId);
  }

  revalidatePath("/admin/contacts");
}
