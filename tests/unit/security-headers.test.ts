import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";

describe("security headers", () => {
  it("allows browser uploads only to the configured private storage origin", async () => {
    const rules = await nextConfig.headers!();
    const catchAll = rules.find((rule) => rule.source === "/:path*");
    const csp = catchAll?.headers.find((header) => header.key === "Content-Security-Policy")?.value;

    expect(csp).toContain("connect-src 'self' https://syntavera-app-staging-private.e56c3b040e55059b2dde377f03c08e89.r2.cloudflarestorage.com");
    expect(csp).not.toContain("https://*.r2.cloudflarestorage.com");
  });
});
