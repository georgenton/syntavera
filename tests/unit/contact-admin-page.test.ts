import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ prisma: { contactSubmission: { findMany: mocks.findMany } } }));
vi.mock("@/modules/auth/guards", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/modules/contact/admin-actions", () => ({
  retryContactNotificationAction: vi.fn(),
  updateContactStatusAction: vi.fn(),
}));

import ContactsPage from "@/app/admin/(protected)/contacts/page";

describe("contact administration access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({ user: { id: "00000000-0000-4000-8000-000000000001" } });
    mocks.findMany.mockResolvedValue([]);
  });

  it("checks administrator authorization before reading contact data", async () => {
    await ContactsPage();
    expect(mocks.requireAdmin).toHaveBeenCalledOnce();
    expect(mocks.findMany).toHaveBeenCalledOnce();
    expect(mocks.requireAdmin.mock.invocationCallOrder[0]).toBeLessThan(mocks.findMany.mock.invocationCallOrder[0]!);
  });

  it("does not query contact data for a non-administrator", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("Administrator access required"));
    await expect(ContactsPage()).rejects.toThrow("Administrator access required");
    expect(mocks.findMany).not.toHaveBeenCalled();
  });
});
