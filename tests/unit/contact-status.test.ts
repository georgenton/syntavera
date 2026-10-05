import { describe, expect, it } from "vitest";
import { resolveContactChannelStatus } from "@/modules/contact/status";

const ready = {
  enabled: true,
  privacyReady: true,
  notificationRecipient: "contacto@syntavera.dev",
  smtpHost: "smtp.example.test",
  emailFrom: "SyntaVera <no-reply@syntavera.dev>",
  smtpCredentialsReady: true,
  deliveryVerified: true,
  acceptsWithoutNotification: false,
};

describe("contact channel status", () => {
  it("is available only when the public, legal and notification gates are ready", () => {
    expect(resolveContactChannelStatus(ready)).toMatchObject({ available: true, reason: "available", notificationConfigured: true });
    expect(resolveContactChannelStatus({ ...ready, enabled: false })).toMatchObject({ available: false, reason: "disabled" });
    expect(resolveContactChannelStatus({ ...ready, privacyReady: false })).toMatchObject({ available: false, reason: "privacy-not-ready" });
    expect(resolveContactChannelStatus({ ...ready, smtpHost: undefined })).toMatchObject({ available: false, reason: "notification-not-ready" });
    expect(resolveContactChannelStatus({ ...ready, smtpCredentialsReady: false })).toMatchObject({ available: false, reason: "notification-not-ready" });
    expect(resolveContactChannelStatus({ ...ready, deliveryVerified: false })).toMatchObject({ available: false, reason: "notification-unverified" });
  });

  it("requires an explicit contract to receive only in the backoffice", () => {
    expect(resolveContactChannelStatus({ ...ready, smtpHost: undefined, acceptsWithoutNotification: true })).toMatchObject({
      available: true,
      notificationConfigured: false,
      acceptsWithoutNotification: true,
    });
  });
});
