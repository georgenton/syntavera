import { notFound } from "next/navigation";
import { PortalHeading } from "@/components/portal/portal-heading";
import { StatusBadge } from "@/components/portal/status-badge";
import { requireProjectAccess } from "@/modules/auth/guards";
import { getPublishedSnapshot } from "@/modules/publication/service";

export default async function PortalMilestonePage({ params }: { params: Promise<{ id: string; milestoneId: string }> }) {
  const { id, milestoneId } = await params;
  const context = await requireProjectAccess(id);
  const published = await getPublishedSnapshot(id, context.membership?.permissions ?? []);
  const milestone = published?.snapshot.milestones.find((item) => item.id === milestoneId);
  if (!milestone) notFound();
  const deliverables = published!.snapshot.deliverables.filter((item) => item.milestoneId === milestone.id);
  return <div className="workspace-page"><PortalHeading eyebrow="Hito" title={milestone.title} body={milestone.description ?? undefined} action={<StatusBadge value={milestone.status} />} /><section className="workspace-panel"><div className="panel-heading"><h2>Entregables vinculados</h2><p>Elementos de la revisión publicada.</p></div><div className="data-list">{deliverables.map((item) => <article key={item.id}><div><strong>{item.title}</strong><p>{item.description}</p></div><StatusBadge value={item.status} /></article>)}</div></section></div>;
}
