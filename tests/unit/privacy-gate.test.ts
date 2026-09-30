import { describe, expect, it } from "vitest";
import { isPrivacyPolicyReady, privacyPolicy } from "@/content/legal/privacy";

describe("privacy publication gate", () => {
  it("stays closed until approved content and matching version exist", () => {
    expect(privacyPolicy.approved).toBe(false);
    expect(isPrivacyPolicyReady("v1")).toBe(false);
  });
});
