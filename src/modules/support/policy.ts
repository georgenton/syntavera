export type TicketPriorityValue = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

export function criticalPriorityIsConfirmed(priority: TicketPriorityValue, confirmation: string | undefined) {
  return priority !== "CRITICAL" || confirmation === "on";
}

export function clientVisibleMessages<T extends { visibility: "CLIENT" | "INTERNAL" }>(messages: readonly T[]) {
  return messages.filter((message) => message.visibility === "CLIENT");
}

type PublishedSupportSnapshot = {
  milestones: readonly { id: string }[];
  deliverables: readonly { id: string }[];
  decisions: readonly { id: string }[];
};

export function snapshotContainsSupportResource(
  snapshot: PublishedSupportSnapshot,
  resource: { milestoneId?: string; deliverableId?: string; decisionId?: string },
) {
  if (resource.milestoneId) return snapshot.milestones.some((item) => item.id === resource.milestoneId);
  if (resource.deliverableId) return snapshot.deliverables.some((item) => item.id === resource.deliverableId);
  if (resource.decisionId) return snapshot.decisions.some((item) => item.id === resource.decisionId);
  return true;
}

export function ticketCanReceiveClientReply(status: string) {
  return status !== "CLOSED";
}
