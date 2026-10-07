import { z } from "zod";
import { isSafeExternalHttpUrl } from "@/modules/projects/billing-policy";

const isoDate = z.iso.datetime().nullable();
const workStatus = z.enum(["NOT_STARTED", "IN_PROGRESS", "BLOCKED", "IN_REVIEW", "COMPLETED"]);

export const projectSnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: z.iso.datetime(),
  project: z.object({
    id: z.uuid(),
    name: z.string(),
    objective: z.string().default(""),
    summary: z.string(),
    status: z.enum(["DISCOVERY", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"]),
    startDate: isoDate,
    targetDate: isoDate,
  }).strict(),
  phases: z.array(z.object({
    id: z.uuid(), name: z.string(), summary: z.string().nullable(), position: z.number().int(), status: workStatus,
  }).strict()),
  milestones: z.array(z.object({
    id: z.uuid(), phaseId: z.uuid().nullable(), title: z.string(), description: z.string().nullable(), position: z.number().int(), status: workStatus, dueAt: isoDate,
  }).strict()),
  deliverables: z.array(z.object({
    id: z.uuid(),
    milestoneId: z.uuid().nullable(),
    title: z.string(),
    description: z.string().nullable(),
    status: z.enum(["DRAFT", "IN_REVIEW", "CHANGES_REQUESTED", "ACCEPTED", "ARCHIVED"]),
    dueAt: isoDate,
    documents: z.array(z.object({
      id: z.uuid(),
      title: z.string(),
      state: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
      versions: z.array(z.object({
        id: z.uuid(), version: z.number().int().positive(), label: z.string().nullable(), createdAt: z.iso.datetime(),
        file: z.object({ id: z.uuid(), originalName: z.string(), mimeType: z.string(), sizeBytes: z.string() }).strict().nullable(),
      }).strict()),
    }).strict()),
  }).strict()),
  decisions: z.array(z.object({
    id: z.uuid(), title: z.string(), outcome: z.string(), decidedAt: z.iso.datetime(),
  }).strict()),
  billing: z.array(z.object({
    id: z.uuid(), number: z.string(), documentState: z.enum(["DRAFT", "ISSUED", "VOID"]), paymentState: z.enum(["UNPAID", "PARTIALLY_PAID", "PAID", "OVERDUE", "REFUNDED"]), currency: z.string(), totalMinor: z.number().int(), issuedAt: isoDate, dueAt: isoDate, externalUrl: z.string().nullable().transform((value) => value && isSafeExternalHttpUrl(value) ? value : null),
  }).strict()),
}).strict();

export type ProjectSnapshot = z.infer<typeof projectSnapshotSchema>;

export function selectSnapshotForPermissions(snapshot: ProjectSnapshot, permissions: readonly string[]) {
  return permissions.includes("FINANCE") ? snapshot : { ...snapshot, billing: [] };
}
