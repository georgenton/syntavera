import { describe, expect, it } from "vitest";
import { internalCanAccessProject, membershipGrants } from "@/modules/auth/policy";

describe("project authorization policy", () => {
  it("allows administrators across projects", () => {
    expect(internalCanAccessProject({ role: "ADMIN", userId: "admin", projectManagerId: null })).toBe(true);
  });

  it("limits project managers to their assignment", () => {
    expect(internalCanAccessProject({ role: "PROJECT_MANAGER", userId: "pm-1", projectManagerId: "pm-1" })).toBe(true);
    expect(internalCanAccessProject({ role: "PROJECT_MANAGER", userId: "pm-1", projectManagerId: "pm-2" })).toBe(false);
  });

  it("requires an active membership and the explicit permission", () => {
    const active = { status: "ACTIVE" as const, permissions: ["VIEW", "COMMENT"] as const };
    expect(membershipGrants({ ...active, permissions: [...active.permissions] }, "VIEW")).toBe(true);
    expect(membershipGrants({ ...active, permissions: [...active.permissions] }, "APPROVE")).toBe(false);
    expect(membershipGrants({ status: "INVITED", permissions: ["VIEW"] }, "VIEW")).toBe(false);
    expect(membershipGrants({ status: "REVOKED", permissions: ["VIEW", "FINANCE"] }, "FINANCE")).toBe(false);
  });
});
