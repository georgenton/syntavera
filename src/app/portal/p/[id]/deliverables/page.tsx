import Link from "next/link";
import { PortalEmpty } from "@/components/portal/portal-empty";
import { PortalHeading } from "@/components/portal/portal-heading";
import { StatusBadge } from "@/components/portal/status-badge";
import { requireProjectAccess } from "@/modules/auth/guards";
import { getPublishedSnapshot } from "@/modules/publication/service";

export default async function PortalDeliverablesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await requireProjectAccess(id);
  const published = await getPublishedSnapshot(id, context.membership?.permissions ?? []);
  const items = published?.snapshot.deliverables ?? [];
  return <div className="workspace-page"><PortalHeading eyebrow="Entregables" title="Revisiones y aceptación." body="Una aceptación siempre apunta a una versión exacta." />{items.length ? <section className="project-card-grid">{items.map((item) => <Link className="project-card" href={`/portal/p/${id}/deliverables/${item.id}`} key={item.id}><StatusBadge value={item.status} /><h2>{item.title}</h2><p>{item.description}</p><strong>{item.documents.length} documentos →</strong></Link>)}</section> : <PortalEmpty title="No hay entregables publicados." body="Los borradores internos no aparecen en el portal." />}</div>;
}
