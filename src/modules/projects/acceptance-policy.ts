import type { ProjectSnapshot } from "@/modules/publication/schema";

export function snapshotContainsDocumentVersion(snapshot: ProjectSnapshot, deliverableId: string, documentVersionId: string) {
  const deliverable = snapshot.deliverables.find((item) => item.id === deliverableId);
  const version = deliverable?.documents.flatMap((document) => document.versions).find((item) => item.id === documentVersionId);
  return Boolean(deliverable && version);
}
