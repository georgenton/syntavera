import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  updateMany: vi.fn(),
  transaction: vi.fn(),
  writeAuditLog: vi.fn(),
  processContactNotification: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/lib/db", () => ({
  prisma: {
    contactSubmission: { updateMany: mocks.updateMany },
    $transaction: mocks.transaction,
  },
}));
vi.mock("@/modules/audit/service", () => ({ writeAuditLog: mocks.writeAuditLog }));
vi.mock("@/modules/auth/guards", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/modules/contact/notification.server", () => ({ processContactNotification: mocks.processContactNotification }));

import { retryContactNotificationAction, updateContactStatusAction } from "@/modules/contact/admin-actions";

const submissionId = "00000000-0000-4000-8000-000000000301";

describe("contact notification retry authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({ user: { id: "00000000-0000-4000-8000-000000000001" } });
    mocks.transaction.mockImplementation(async (operation) => operation({ contactSubmission: { updateMany: mocks.updateMany } }));
    mocks.writeAuditLog.mockResolvedValue(undefined);
    mocks.processContactNotification.mockResolvedValue({ outcome: "sent" });
  });

  it("rejects a retry before touching the submission when the user is not an administrator", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("Administrator access required"));

    await expect(retryContactNotificationAction(submissionId)).rejects.toThrow("Administrator access required");
    expect(mocks.updateMany).not.toHaveBeenCalled();
    expect(mocks.processContactNotification).not.toHaveBeenCalled();
  });

  it("rejects a status change before opening a transaction when the user is not an administrator", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("Administrator access required"));

    await expect(updateContactStatusAction(submissionId, new FormData())).rejects.toThrow("Administrator access required");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("lets an administrator claim and process one failed notification", async () => {
    mocks.updateMany.mockResolvedValue({ count: 1 });

    await retryContactNotificationAction(submissionId);

    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: submissionId, notificationStatus: "FAILED" },
      data: { notificationStatus: "PENDING", notificationLastErrorCode: null },
    });
    expect(mocks.writeAuditLog).toHaveBeenCalledOnce();
    expect(mocks.processContactNotification).toHaveBeenCalledWith(submissionId);
  });

  it("does not send again when another retry already claimed the failure", async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });

    await retryContactNotificationAction(submissionId);

    expect(mocks.writeAuditLog).not.toHaveBeenCalled();
    expect(mocks.processContactNotification).not.toHaveBeenCalled();
  });

  it("does not send when the retry audit cannot be committed", async () => {
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.writeAuditLog.mockRejectedValue(new Error("audit unavailable"));

    await expect(retryContactNotificationAction(submissionId)).rejects.toThrow("audit unavailable");
    expect(mocks.processContactNotification).not.toHaveBeenCalled();
  });
});
