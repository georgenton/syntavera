import { describe, expect, it } from "vitest";
import { deliverContactNotification, type NotificationSubmission } from "@/modules/contact/notification-core";

const submission: NotificationSubmission = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "María Pérez",
  email: "maria@example.com",
  organization: null,
};

describe("contact notification delivery", () => {
  it("keeps the persisted receipt and records a notification failure", async () => {
    let status: "PENDING" | "PROCESSING" | "FAILED" = "PENDING";
    let errorCode: string | null = null;
    const result = await deliverContactNotification(submission.id, {
      async claim() {
        if (status !== "PENDING") return null;
        status = "PROCESSING";
        return submission;
      },
      async send() {
        throw Object.assign(new Error("relay unavailable"), { code: "ECONNECTION" });
      },
      async markSent() {
        throw new Error("unexpected sent state");
      },
      async markFailed(_id, code) {
        status = "FAILED";
        errorCode = code;
      },
    });

    expect(result).toEqual({ outcome: "failed", errorCode: "ECONNECTION" });
    expect(status).toBe("FAILED");
    expect(errorCode).toBe("ECONNECTION");
    expect(submission.id).toBeTruthy();
  });

  it("supports one controlled retry and does not resend after success", async () => {
    let status: "PENDING" | "PROCESSING" | "SENT" = "PENDING";
    let sends = 0;
    const dependencies = {
      async claim() {
        if (status !== "PENDING") return null;
        status = "PROCESSING" as const;
        return submission;
      },
      async send() { sends += 1; },
      async markSent() { status = "SENT" as const; },
      async markFailed() { throw new Error("unexpected failure"); },
    };

    await expect(deliverContactNotification(submission.id, dependencies)).resolves.toEqual({ outcome: "sent" });
    await expect(deliverContactNotification(submission.id, dependencies)).resolves.toEqual({ outcome: "not-claimed" });
    expect(sends).toBe(1);
  });
});
