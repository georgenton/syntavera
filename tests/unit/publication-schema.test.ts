import { describe, expect, it } from "vitest";
import { projectSnapshotSchema, selectSnapshotForPermissions } from "@/modules/publication/schema";

const id = (suffix: number) => `00000000-0000-4000-8000-${String(suffix).padStart(12, "0")}`;

const snapshot = projectSnapshotSchema.parse({
  schemaVersion: 1,
  generatedAt: "2026-09-30T12:00:00.000Z",
  project: { id: id(1), name: "Proyecto", summary: "Resumen", status: "ACTIVE", startDate: null, targetDate: null },
  phases: [{ id: id(2), name: "Entender", summary: "Alcance", position: 0, status: "IN_PROGRESS" }],
  milestones: [{ id: id(3), phaseId: id(2), title: "Gate", description: null, position: 0, status: "NOT_STARTED", dueAt: null }],
  deliverables: [{
    id: id(4), milestoneId: id(3), title: "Documento", description: null, status: "IN_REVIEW", dueAt: null,
    documents: [{ id: id(5), title: "Informe", state: "PUBLISHED", versions: [{ id: id(6), version: 1, label: null, createdAt: "2026-09-30T12:00:00.000Z", file: { id: id(7), originalName: "informe.pdf", mimeType: "application/pdf", sizeBytes: "42" } }] }],
  }],
  decisions: [{ id: id(8), title: "Continuar", outcome: "Piloto acotado", decidedAt: "2026-09-30T12:00:00.000Z" }],
  billing: [{ id: id(9), number: "INV-1", documentState: "ISSUED", paymentState: "UNPAID", currency: "USD", totalMinor: 10000, issuedAt: null, dueAt: null, externalUrl: null }],
});

describe("publication snapshot", () => {
  it("contains no internal storage key or internal notes", () => {
    const serialized = JSON.stringify(snapshot);
    expect(serialized).not.toContain("storageKey");
    expect(serialized).not.toContain("salesNotes");
    expect(serialized).not.toContain("budgetNotes");
  });

  it("removes billing without FINANCE", () => {
    expect(selectSnapshotForPermissions(snapshot, ["VIEW"]).billing).toEqual([]);
    expect(selectSnapshotForPermissions(snapshot, ["VIEW", "FINANCE"]).billing).toHaveLength(1);
  });

  it("rejects unexpected fields", () => {
    expect(() => projectSnapshotSchema.parse({ ...snapshot, internal: { note: "no" } })).toThrow();
  });
});
