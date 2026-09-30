import { describe, expect, it } from "vitest";
import { clientProjectAccessGrants } from "@/modules/auth/policy";
import { clientCanJoinOrganization, invitationCanBeConsumed } from "@/modules/auth/invitation-policy";
import { snapshotContainsDocumentVersion } from "@/modules/projects/acceptance-policy";
import { invoiceInputSchema } from "@/modules/projects/billing-policy";
import { projectSnapshotSchema } from "@/modules/publication/schema";
import { objectKeyBelongsToProject, validateUploadPolicy } from "@/modules/storage/upload-policy";
import { clientVisibleMessages, criticalPriorityIsConfirmed } from "@/modules/support/policy";

const id = (suffix: number) => `00000000-0000-4000-8000-${String(suffix).padStart(12, "0")}`;

describe("costly security boundaries", () => {
  it("denies organization A access to a project and membership from organization B", () => {
    const membership = { status: "ACTIVE" as const, permissions: ["VIEW" as const] };
    expect(clientProjectAccessGrants({ requestedProjectId: id(1), membershipProjectId: id(1), projectOrganizationId: id(10), userOrganizationId: id(10), membership }, "VIEW")).toBe(true);
    expect(clientProjectAccessGrants({ requestedProjectId: id(2), membershipProjectId: id(1), projectOrganizationId: id(20), userOrganizationId: id(10), membership }, "VIEW")).toBe(false);
  });

  it("rejects expired, revoked, and already consumed invitations", () => {
    const now = new Date("2026-09-30T12:00:00.000Z");
    expect(invitationCanBeConsumed({ acceptedAt: null, revokedAt: null, expiresAt: new Date("2026-09-30T12:01:00.000Z") }, now)).toBe(true);
    expect(invitationCanBeConsumed({ acceptedAt: now, revokedAt: null, expiresAt: new Date("2026-09-30T12:01:00.000Z") }, now)).toBe(false);
    expect(invitationCanBeConsumed({ acceptedAt: null, revokedAt: now, expiresAt: new Date("2026-09-30T12:01:00.000Z") }, now)).toBe(false);
    expect(invitationCanBeConsumed({ acceptedAt: null, revokedAt: null, expiresAt: now }, now)).toBe(false);
  });

  it("assigns an unscoped client only to the invited organization", () => {
    expect(clientCanJoinOrganization(null, id(10))).toBe(true);
    expect(clientCanJoinOrganization(id(10), id(10))).toBe(true);
    expect(clientCanJoinOrganization(id(20), id(10))).toBe(false);
  });

  it("accepts only the exact document version in the current snapshot", () => {
    const snapshot = projectSnapshotSchema.parse({ schemaVersion: 1, generatedAt: "2026-09-30T12:00:00.000Z", project: { id: id(1), name: "P", objective: "O", summary: "S", status: "ACTIVE", startDate: null, targetDate: null }, phases: [], milestones: [], deliverables: [{ id: id(2), milestoneId: null, title: "D", description: null, status: "IN_REVIEW", dueAt: null, documents: [{ id: id(3), title: "Doc", state: "PUBLISHED", versions: [{ id: id(4), version: 2, label: null, createdAt: "2026-09-30T12:00:00.000Z", file: null }] }] }], decisions: [], billing: [] });
    expect(snapshotContainsDocumentVersion(snapshot, id(2), id(4))).toBe(true);
    expect(snapshotContainsDocumentVersion(snapshot, id(2), id(5))).toBe(false);
  });

  it("never exposes internal ticket messages and confirms critical priority", () => {
    const messages = [{ visibility: "CLIENT" as const, body: "visible" }, { visibility: "INTERNAL" as const, body: "secret" }];
    expect(clientVisibleMessages(messages)).toEqual([{ visibility: "CLIENT", body: "visible" }]);
    expect(criticalPriorityIsConfirmed("CRITICAL", undefined)).toBe(false);
    expect(criticalPriorityIsConfirmed("CRITICAL", "on")).toBe(true);
  });

  it("keeps document and payment states independent", () => {
    const parsed = invoiceInputSchema.parse({ number: "INV-1", externalId: "", externalUrl: "", currency: "usd", totalMinor: "100", documentState: "DRAFT", paymentState: "PAID" });
    expect(parsed.documentState).toBe("DRAFT");
    expect(parsed.paymentState).toBe("PAID");
    expect(invoiceInputSchema.safeParse({ ...parsed, paymentState: "AUTHORIZED" }).success).toBe(false);
  });

  it("enforces upload type, size, and project-key scope", () => {
    expect(() => validateUploadPolicy({ mimeType: "application/pdf", sizeBytes: 1024 }, 2048)).not.toThrow();
    expect(() => validateUploadPolicy({ mimeType: "text/html", sizeBytes: 1024 }, 2048)).toThrow("Unsupported file type");
    expect(() => validateUploadPolicy({ mimeType: "application/pdf", sizeBytes: 4096 }, 2048)).toThrow("File exceeds");
    expect(objectKeyBelongsToProject(`projects/${id(1)}/2026/file.pdf`, id(1))).toBe(true);
    expect(objectKeyBelongsToProject(`projects/${id(2)}/2026/file.pdf`, id(1))).toBe(false);
  });
});
