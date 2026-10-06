import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  channel: {
    available: false,
    reason: "disabled",
    notificationConfigured: false,
    acceptsWithoutNotification: false,
  },
  persistContactSubmission: vi.fn(),
  consumeContactRateLimit: vi.fn(),
  processContactNotification: vi.fn(),
  after: vi.fn(),
  create: vi.fn(),
  findUnique: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers({ "user-agent": "vitest" })) }));
vi.mock("next/server", () => ({ after: mocks.after }));
vi.mock("@/lib/env", () => ({
  getServerEnv: () => ({
    BETTER_AUTH_SECRET: "test-secret-that-is-at-least-32-characters",
    CONTACT_RATE_LIMIT_WINDOW_SECONDS: 3600,
    CONTACT_RATE_LIMIT_MAX: 5,
    PRIVACY_POLICY_VERSION: "review-current",
  }),
}));
vi.mock("@/lib/db", () => ({
  prisma: { contactSubmission: { create: mocks.create, findUnique: mocks.findUnique } },
}));
vi.mock("@/modules/contact/status.server", () => ({ getContactChannelStatus: () => mocks.channel }));
vi.mock("@/modules/contact/rate-limit", () => ({ consumeContactRateLimit: mocks.consumeContactRateLimit }));
vi.mock("@/modules/contact/persistence-core", () => ({ persistContactSubmission: mocks.persistContactSubmission }));
vi.mock("@/modules/contact/notification.server", () => ({ processContactNotification: mocks.processContactNotification }));

import { submitContact } from "@/modules/contact/actions";
import { CONTACT_UNAVAILABLE_MESSAGE } from "@/modules/contact/status";

function validFormData() {
  const form = new FormData();
  form.set("submissionKey", "00000000-0000-4000-8000-000000000401");
  form.set("name", "Persona sintética");
  form.set("email", "persona@example.invalid");
  form.set("organization", "");
  form.set("role", "");
  form.set("area", "");
  form.set("description", "Contexto sintético suficientemente largo para validar el flujo.");
  form.set("privacyAcknowledged", "on");
  form.set("website", "");
  return form;
}

describe("contact server action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(mocks.channel, {
      available: false,
      reason: "disabled",
      notificationConfigured: false,
      acceptsWithoutNotification: false,
    });
    mocks.consumeContactRateLimit.mockResolvedValue({ allowed: true });
  });

  it("blocks a direct action request before validation or persistence", async () => {
    const result = await submitContact({ status: "idle" }, validFormData());
    expect(result).toEqual({ status: "error", message: CONTACT_UNAVAILABLE_MESSAGE });
    expect(mocks.consumeContactRateLimit).not.toHaveBeenCalled();
    expect(mocks.persistContactSubmission).not.toHaveBeenCalled();
  });

  it("does not confirm receipt when persistence fails", async () => {
    Object.assign(mocks.channel, { available: true, reason: "available", notificationConfigured: true });
    mocks.persistContactSubmission.mockRejectedValue(new Error("database unavailable"));

    const result = await submitContact({ status: "idle" }, validFormData());
    expect(result).toEqual({ status: "error", message: "No pudimos guardar tu solicitud. No se envió nada. Inténtalo de nuevo." });
    expect(mocks.after).not.toHaveBeenCalled();
  });

  it("confirms a persisted request and queues its notification separately", async () => {
    Object.assign(mocks.channel, { available: true, reason: "available", notificationConfigured: true });
    mocks.persistContactSubmission.mockResolvedValue({ outcome: "created", id: "created-id" });

    const result = await submitContact({ status: "idle" }, validFormData());
    expect(result).toMatchObject({ status: "success", name: "Persona sintética" });
    expect(result.message).toContain("Recibimos tu contexto");
    expect(mocks.after).toHaveBeenCalledOnce();
  });

  it("returns the same receipt for a duplicate without queuing another notification", async () => {
    Object.assign(mocks.channel, { available: true, reason: "available", notificationConfigured: true });
    mocks.persistContactSubmission.mockResolvedValue({ outcome: "duplicate", id: "existing-id" });

    const result = await submitContact({ status: "idle" }, validFormData());
    expect(result.status).toBe("success");
    expect(mocks.after).not.toHaveBeenCalled();
  });
});
