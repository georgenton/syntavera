import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  findUnique: vi.fn(),
}));

vi.mock("react", () => ({ cache: <T,>(operation: T) => operation }));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: vi.fn().mockResolvedValue(new Headers()) }));
vi.mock("@/lib/db", () => ({ prisma: { user: { findUnique: mocks.findUnique } } }));
vi.mock("@/modules/auth/auth", () => ({ auth: { api: { getSession: mocks.getSession } } }));

import { AuthorizationError, requireAdmin } from "@/modules/auth/guards";

describe("administrator guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: "00000000-0000-4000-8000-000000000001" } });
  });

  it("returns an active internal administrator", async () => {
    mocks.findUnique.mockResolvedValue({
      id: "00000000-0000-4000-8000-000000000001",
      kind: "INTERNAL",
      internalRole: "ADMIN",
      disabledAt: null,
    });

    await expect(requireAdmin()).resolves.toMatchObject({ user: { internalRole: "ADMIN" } });
  });

  it("rejects an active project manager", async () => {
    mocks.findUnique.mockResolvedValue({
      id: "00000000-0000-4000-8000-000000000001",
      kind: "INTERNAL",
      internalRole: "PROJECT_MANAGER",
      disabledAt: null,
    });

    await expect(requireAdmin()).rejects.toMatchObject<Partial<AuthorizationError>>({
      name: "AuthorizationError",
      status: 403,
      message: "Administrator access required",
    });
  });
});
