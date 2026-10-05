import "server-only";
import { prisma } from "@/lib/db";
import { notifyContactSubmission } from "@/modules/email/service";
import { deliverContactNotification } from "./notification-core";

export async function processContactNotification(id: string) {
  return deliverContactNotification(id, {
    async claim(submissionId) {
      const claimed = await prisma.contactSubmission.updateMany({
        where: { id: submissionId, notificationStatus: "PENDING" },
        data: {
          notificationStatus: "PROCESSING",
          notificationAttempts: { increment: 1 },
          notificationLastAttemptAt: new Date(),
          notificationLastErrorCode: null,
        },
      });
      if (claimed.count !== 1) return null;
      return prisma.contactSubmission.findUnique({
        where: { id: submissionId },
        select: { id: true, name: true, email: true, organization: true },
      });
    },
    send(submission) {
      return notifyContactSubmission(submission);
    },
    async markSent(submissionId) {
      await prisma.contactSubmission.update({
        where: { id: submissionId },
        data: { notificationStatus: "SENT", notificationSentAt: new Date(), notificationLastErrorCode: null },
      });
    },
    async markFailed(submissionId, errorCode) {
      await prisma.contactSubmission.update({
        where: { id: submissionId },
        data: { notificationStatus: "FAILED", notificationLastErrorCode: errorCode },
      });
    },
  });
}
