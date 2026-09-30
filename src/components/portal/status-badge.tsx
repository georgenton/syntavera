const labels: Record<string, string> = {
  DISCOVERY: "Descubrimiento", ACTIVE: "Activo", PAUSED: "Pausado", COMPLETED: "Completado", ARCHIVED: "Archivado",
  NEW: "Nuevo", REVIEWED: "Revisado", IN_REVIEW: "En revisión", CLOSED: "Cerrado",
  OPEN: "Abierto", IN_PROGRESS: "En progreso", WAITING_CLIENT: "Espera cliente", RESOLVED: "Resuelto",
  NOT_STARTED: "No iniciado", BLOCKED: "Bloqueado", CHANGES_REQUESTED: "Cambios solicitados", ACCEPTED: "Aceptado",
  DRAFT: "Borrador", PUBLISHED: "Publicado", ISSUED: "Emitida", VOID: "Anulada", UNPAID: "Pendiente", PARTIALLY_PAID: "Pago parcial", PAID: "Pagada", OVERDUE: "Vencida", REFUNDED: "Reembolsada",
  LOW: "Baja", NORMAL: "Normal", HIGH: "Alta", CRITICAL: "Crítica",
};

export function StatusBadge({ value }: { value: string }) {
  return <span className={`status-badge status-badge--${value.toLowerCase().replaceAll("_", "-")}`}>{labels[value] ?? value}</span>;
}
