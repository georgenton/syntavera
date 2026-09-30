import { PortalEmpty } from "@/components/portal/portal-empty";
import { PortalHeading } from "@/components/portal/portal-heading";
import { StatusBadge } from "@/components/portal/status-badge";
import { requireProjectAccess } from "@/modules/auth/guards";
import { getPublishedSnapshot } from "@/modules/publication/service";

export default async function PortalPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await requireProjectAccess(id);
  const published = await getPublishedSnapshot(id, context.membership?.permissions ?? []);
  return <div className="workspace-page"><PortalHeading eyebrow="Plan publicado" title="Fases e hitos." body="Esta vista solo cambia cuando el equipo publica una revisión." />{published ? <div className="portal-timeline">{published.snapshot.phases.map((phase) => <section key={phase.id}><div className="portal-timeline__phase"><span>{String(phase.position + 1).padStart(2, "0")}</span><div><h2>{phase.name}</h2><p>{phase.summary}</p></div><StatusBadge value={phase.status} /></div><div className="data-list">{published.snapshot.milestones.filter((item) => item.phaseId === phase.id).map((item) => <article key={item.id}><div><strong>{item.title}</strong><p>{item.description}</p></div><div><StatusBadge value={item.status} />{item.dueAt ? <time>{new Date(item.dueAt).toLocaleDateString("es-EC")}</time> : null}</div></article>)}</div></section>)}</div> : <PortalEmpty title="No hay plan publicado." body="El borrador interno no es visible hasta que el equipo lo publique." />}</div>;
}
