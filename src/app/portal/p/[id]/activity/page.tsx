import { PortalEmpty } from "@/components/portal/portal-empty";
import { PortalHeading } from "@/components/portal/portal-heading";
import { prisma } from "@/lib/db";
import { requireProjectAccess } from "@/modules/auth/guards";

const labels: Record<string, string> = {
  PROJECT_PUBLISHED: "Se publicó una revisión del proyecto",
  DELIVERABLE_ACCEPTED: "Se registró una aceptación",
  TICKET_CREATED: "Se creó un ticket",
  TICKET_STATUS_CHANGED: "Cambió el estado de un ticket",
};

export default async function PortalActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireProjectAccess(id);
  const events = await prisma.activityEvent.findMany({ where: { projectId: id, visibleToClient: true }, orderBy: { createdAt: "desc" }, take: 100, include: { actor: { select: { name: true } } } });
  return <div className="workspace-page"><PortalHeading eyebrow="Actividad" title="Un registro visible del proyecto." body="Solo aparecen eventos marcados explícitamente para cliente." />{events.length ? <section className="workspace-panel"><div className="activity-list">{events.map((event) => <article key={event.id}><span aria-hidden="true" /><div><strong>{labels[event.type] ?? "Actividad del proyecto"}</strong><p>{event.actor?.name ?? "SyntaVera"}</p></div><time>{event.createdAt.toLocaleString("es-EC")}</time></article>)}</div></section> : <PortalEmpty title="Todavía no hay actividad publicada." body="La actividad interna no se muestra aquí." />}</div>;
}
