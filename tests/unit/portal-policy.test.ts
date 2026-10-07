import { describe, expect, it } from "vitest";
import { navigationForPermissions, portalDashboardSummary, snapshotContainsClientFile } from "@/modules/projects/portal-policy";
import { projectSnapshotSchema, selectSnapshotForPermissions } from "@/modules/publication/schema";

const id = (suffix: number) => `00000000-0000-4000-8000-${String(suffix).padStart(12, "0")}`;

const snapshot = projectSnapshotSchema.parse({
  schemaVersion: 1,
  generatedAt: "2026-09-30T12:00:00.000Z",
  project: { id: id(1), name: "Proyecto", objective: "Objetivo", summary: "Resumen", status: "ACTIVE", startDate: null, targetDate: null },
  phases: [],
  milestones: [{ id: id(2), phaseId: null, title: "Hito", description: null, position: 0, status: "IN_PROGRESS", dueAt: null }],
  deliverables: [{ id: id(3), milestoneId: id(2), title: "Entrega", description: null, status: "IN_REVIEW", dueAt: null, documents: [{ id: id(4), title: "Documento", state: "PUBLISHED", versions: [{ id: id(5), version: 1, label: null, createdAt: "2026-09-30T12:00:00.000Z", file: { id: id(6), originalName: "documento.pdf", mimeType: "application/pdf", sizeBytes: "100" } }] }] }],
  decisions: [],
  billing: [{ id: id(7), number: "INV-1", documentState: "ISSUED", paymentState: "UNPAID", currency: "USD", totalMinor: 100, issuedAt: null, dueAt: null, externalUrl: "https://billing.example.test/invoice/1" }],
});

describe("portal permission projections", () => {
  it("removes all finance navigation and metrics without FINANCE", () => {
    const projected = selectSnapshotForPermissions(snapshot, ["VIEW"]);
    const summary = portalDashboardSummary([{ snapshot: projected, permissions: ["VIEW"] }]);
    expect(projected.billing).toEqual([]);
    expect(summary.hasFinance).toBe(false);
    expect(summary.invoicesWithBalance).toBe(0);
    expect(navigationForPermissions(["VIEW"]).map((item) => item.label)).not.toContain("Facturación");
  });

  it("shows finance and approval data only with their exact permissions", () => {
    const summary = portalDashboardSummary([{ snapshot, permissions: ["VIEW", "FINANCE", "APPROVE"] }]);
    expect(summary.hasFinance).toBe(true);
    expect(summary.invoicesWithBalance).toBe(1);
    expect(summary.pendingApprovals).toBe(1);
    expect(navigationForPermissions(["VIEW", "FINANCE"]).map((item) => item.label)).toContain("Facturación");
  });

  it("permits downloads only for files present in the published snapshot", () => {
    expect(snapshotContainsClientFile(snapshot, id(6))).toBe(true);
    expect(snapshotContainsClientFile(snapshot, id(99))).toBe(false);
  });
});
