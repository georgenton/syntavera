import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createTransport: vi.fn(),
  fetch: vi.fn(),
  sendMail: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("nodemailer", () => ({ default: { createTransport: mocks.createTransport } }));

import { resetEnvForTests } from "@/lib/env";
import { resetEmailServiceForTests, sendMagicLinkEmail } from "@/modules/email/service";

function configureOAuthEnvironment() {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("DATABASE_URL", "postgresql://example.test/syntavera");
  vi.stubEnv("BETTER_AUTH_SECRET", "test-secret-that-is-at-least-32-characters");
  vi.stubEnv("SMTP_HOST", "smtp.office365.com");
  vi.stubEnv("SMTP_PORT", "587");
  vi.stubEnv("SMTP_SECURE", "false");
  vi.stubEnv("SMTP_USER", "mailer@example.test");
  vi.stubEnv("SMTP_PASSWORD", "");
  vi.stubEnv("SMTP_OAUTH_TENANT_ID", "00000000-0000-4000-8000-000000000001");
  vi.stubEnv("SMTP_OAUTH_CLIENT_ID", "00000000-0000-4000-8000-000000000002");
  vi.stubEnv("SMTP_OAUTH_CLIENT_SECRET", "synthetic-client-secret");
  vi.stubEnv("EMAIL_FROM", "SyntaVera <mailer@example.test>");
}

describe("SMTP OAuth2 mailer", () => {
  beforeEach(() => {
    configureOAuthEnvironment();
    resetEnvForTests();
    resetEmailServiceForTests();
    mocks.createTransport.mockReturnValue({ sendMail: mocks.sendMail });
    mocks.sendMail.mockResolvedValue({ accepted: ["recipient@example.test"] });
    mocks.fetch.mockResolvedValue(new Response(JSON.stringify({ access_token: "opaque-access-token", expires_in: 3600 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
    vi.stubGlobal("fetch", mocks.fetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    resetEnvForTests();
    resetEmailServiceForTests();
    vi.clearAllMocks();
  });

  it("uses client credentials to authenticate Nodemailer with XOAUTH2 and caches the token", async () => {
    await sendMagicLinkEmail("recipient@example.test", "https://staging.example.test/magic");
    await sendMagicLinkEmail("recipient@example.test", "https://staging.example.test/magic-2");

    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    expect(mocks.fetch).toHaveBeenCalledWith(
      "https://login.microsoftonline.com/00000000-0000-4000-8000-000000000001/oauth2/v2.0/token",
      expect.objectContaining({ method: "POST", cache: "no-store" }),
    );
    expect(mocks.createTransport).toHaveBeenCalledWith(expect.objectContaining({
      host: "smtp.office365.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: { type: "OAuth2", user: "mailer@example.test", accessToken: "opaque-access-token" },
    }));
    expect(mocks.createTransport.mock.calls[0]?.[0]?.auth).not.toHaveProperty("pass");
    expect(mocks.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      from: "SyntaVera <mailer@example.test>",
      to: "recipient@example.test",
    }));
  });

  it("returns a safe error when Microsoft rejects the token request", async () => {
    mocks.fetch.mockResolvedValueOnce(new Response(JSON.stringify({
      error: "invalid_client",
      error_description: "synthetic-client-secret must never escape",
    }), { status: 401, headers: { "Content-Type": "application/json" } }));

    const delivery = sendMagicLinkEmail("recipient@example.test", "https://staging.example.test/magic");
    await expect(delivery).rejects.toMatchObject({ code: "SMTP_OAUTH_TOKEN_REJECTED" });
    await expect(delivery).rejects.not.toThrow(/synthetic-client-secret/);
    expect(mocks.createTransport).not.toHaveBeenCalled();
  });
});
