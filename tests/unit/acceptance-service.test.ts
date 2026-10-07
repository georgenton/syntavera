import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  publicationFind: vi.fn(),
  acceptanceFind: vi.fn(),
  acceptanceCreate: vi.fn(),
  acceptanceFindOutside: vi.fn(),
  deliverableUpdate: vi.fn(),
  activityCreate: vi.fn(),
  audit: vi.fn(),
}));

const tx = {
  projectPublication: { findFirst: mocks.publicationFind },
  acceptance: { findUnique: mocks.acceptanceFind, create: mocks.acceptanceCreate },
  deliverable: { update: mocks.deliverableUpdate },
  activityEvent: { create: mocks.activityCreate },
  auditLog: { create: vi.fn() },
};

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: mocks.transaction,
    acceptance: { findUnique: mocks.acceptanceFindOutside },
  },
}));
vi.mock("@/modules/audit/service", () => ({ writeAuditLog: mocks.audit }));

import { acceptPublishedVersion } from "@/modules/projects/acceptance";

const id = (suffix: number) => `00000000-0000-4000-8000-${String(suffix).padStart(12, "0")}`;
const projectId = id(1);
const deliverableId = id(2);
const documentId = id(3);
const versionId = id(4);
const actorId = id(5);

const snapshot = {
  schemaVersion: 1,
  generatedAt: "2026-09-30T12:00:00.000Z",
  project: { id: projectId, name: "Proyecto", objective: "Objetivo", summary: "Resumen", status: "ACTIVE", startDate: null, targetDate: null },
  phases: [], milestones: [],
  deliverables: [{ id: deliverableId, milestoneId: null, title: "Entrega", description: null, status: "IN_REVIEW", dueAt: null, documents: [{ id: documentId, title: "Documento", state: "PUBLISHED", versions: [{ id: versionId, version: 1, label: null, createdAt: "2026-09-30T12:00:00.000Z", file: null }] }] }],
  decisions: [], billing: [],
};

const input = { projectId, deliverableId, documentVersionId: versionId, actorId, organizationId: id(6), sessionId: id(7) };

describe("published document acceptance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (operation: (client: typeof tx) => unknown) => operation(tx));
    mocks.publicationFind.mockResolvedValue({ id: id(8), snapshot });
    mocks.acceptanceFind.mockResolvedValue(null);
    mocks.acceptanceCreate.mockResolvedValue({ id: id(9), acceptedAt: new Date("2026-09-30T12:01:00.000Z") });
  });

  it("is idempotent for a repeated submission and emits one acceptance event", async () => {
    let existing: unknown = null;
    mocks.acceptanceFind.mockImplementation(async () => existing);
    mocks.acceptanceCreate.mockImplementation(async () => {
      existing = { id: id(9), acceptedAt: new Date("2026-09-30T12:01:00.000Z") };
      return existing;
    });

    const first = await acceptPublishedVersion(input);
    const second = await acceptPublishedVersion(input);
    expect(second).toEqual(first);
    expect(mocks.acceptanceCreate).toHaveBeenCalledTimes(1);
    expect(mocks.deliverableUpdate).toHaveBeenCalledTimes(1);
    expect(mocks.activityCreate).toHaveBeenCalledTimes(1);
    expect(mocks.audit).toHaveBeenCalledTimes(1);
  });

  it("rejects a version missing from the current published snapshot", async () => {
    await expect(acceptPublishedVersion({ ...input, documentVersionId: id(99) })).rejects.toThrow("not in the current published snapshot");
    expect(mocks.acceptanceCreate).not.toHaveBeenCalled();
    expect(mocks.activityCreate).not.toHaveBeenCalled();
  });
});
