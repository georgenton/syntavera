import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ready: vi.fn(),
  send: vi.fn(),
  transaction: vi.fn(),
  projectFind: vi.fn(),
  userFind: vi.fn(),
  userCreate: vi.fn(),
  userUpdate: vi.fn(),
  membershipFind: vi.fn(),
  membershipUpsert: vi.fn(),
  invitationUpdateMany: vi.fn(),
  invitationCreate: vi.fn(),
  invitationUpdate: vi.fn(),
  audit: vi.fn(),
}));

const tx = {
  project: { findUniqueOrThrow: mocks.projectFind },
  user: { findUnique: mocks.userFind, create: mocks.userCreate, update: mocks.userUpdate, updateMany: vi.fn() },
  projectMembership: { findUnique: mocks.membershipFind, upsert: mocks.membershipUpsert, update: vi.fn() },
  clientInvitation: { findUnique: vi.fn(), updateMany: mocks.invitationUpdateMany, create: mocks.invitationCreate, update: mocks.invitationUpdate },
  auditLog: { create: vi.fn() },
};

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: mocks.transaction,
    projectMembership: { findUnique: mocks.membershipFind },
    clientInvitation: { update: mocks.invitationUpdate },
  },
}));
vi.mock("@/lib/env", () => ({ getServerEnv: () => ({ APP_URL: "http://localhost:3000" }) }));
vi.mock("@/modules/email/service", () => ({
  invitationEmailDeliveryConfigured: mocks.ready,
  sendInvitationEmail: mocks.send,
}));
vi.mock("@/modules/audit/service", () => ({ writeAuditLog: mocks.audit }));

import { deliverClientInvitation } from "@/modules/auth/invitations";

const projectId = "00000000-0000-4000-8000-000000000001";
const actorId = "00000000-0000-4000-8000-000000000002";
const userId = "00000000-0000-4000-8000-000000000003";
const invitationId = "00000000-0000-4000-8000-000000000004";

const input = { projectId, name: "Cliente Sintético", email: "client@example.test", permissions: ["VIEW" as const], createdById: actorId };

describe("client invitation delivery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ready.mockReturnValue(true);
    mocks.transaction.mockImplementation(async (operation: (client: typeof tx) => unknown) => operation(tx));
    mocks.projectFind.mockResolvedValue({ id: projectId, name: "Proyecto", organizationId: "00000000-0000-4000-8000-000000000010" });
    mocks.userFind.mockResolvedValue(null);
    mocks.userCreate.mockResolvedValue({ id: userId, name: input.name, email: input.email, kind: "CLIENT", organizationId: "00000000-0000-4000-8000-000000000010" });
    mocks.membershipFind.mockResolvedValue(null);
    mocks.membershipUpsert.mockResolvedValue({ id: "membership-id", permissions: input.permissions, status: "INVITED" });
    mocks.invitationUpdateMany.mockResolvedValue({ count: 1 });
    mocks.invitationCreate.mockResolvedValue({ id: invitationId });
    mocks.invitationUpdate.mockResolvedValue({ id: invitationId, revokedAt: new Date() });
    mocks.send.mockResolvedValue(undefined);
  });

  it("performs no persistent write when delivery is not configured", async () => {
    mocks.ready.mockReturnValue(false);
    await expect(deliverClientInvitation(input)).rejects.toMatchObject({ code: "INVITATION_DELIVERY_NOT_CONFIGURED" });
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.membershipUpsert).not.toHaveBeenCalled();
  });

  it("revokes the new token and records a safe failure when email delivery fails", async () => {
    mocks.send.mockRejectedValueOnce(new Error("provider secret and response must not leak"));
    const result = await deliverClientInvitation(input);
    expect(result).toEqual({ status: "failed", invitationId, membershipId: "membership-id", errorCode: "INVITATION_DELIVERY_FAILED" });
    expect(mocks.invitationUpdate).toHaveBeenCalledWith(expect.objectContaining({ where: { id: invitationId }, data: { revokedAt: expect.any(Date) } }));
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({ action: "CLIENT_INVITATION_SEND_FAILED", metadata: expect.objectContaining({ errorCode: "INVITATION_DELIVERY_FAILED" }) }), tx);
    expect(JSON.stringify(mocks.audit.mock.calls)).not.toContain("provider secret");
  });

  it("invalidates prior active tokens and reuses the unique membership on retry", async () => {
    const result = await deliverClientInvitation({ ...input, retry: true });
    expect(result.status).toBe("sent");
    expect(mocks.invitationUpdateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ projectId, email: input.email, acceptedAt: null, revokedAt: null }) }));
    expect(mocks.membershipUpsert).toHaveBeenCalledTimes(1);
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({ action: "CLIENT_INVITATION_RETRY_REQUESTED" }), tx);
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({ action: "CLIENT_INVITATION_SENT" }));
  });
});
