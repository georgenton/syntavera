export type TicketPriorityValue = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

export function criticalPriorityIsConfirmed(priority: TicketPriorityValue, confirmation: string | undefined) {
  return priority !== "CRITICAL" || confirmation === "on";
}

export function clientVisibleMessages<T extends { visibility: "CLIENT" | "INTERNAL" }>(messages: readonly T[]) {
  return messages.filter((message) => message.visibility === "CLIENT");
}
