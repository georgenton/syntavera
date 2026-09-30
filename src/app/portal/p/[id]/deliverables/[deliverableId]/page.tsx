import Link from "next/link";
import { notFound } from "next/navigation";
import { PortalHeading } from "@/components/portal/portal-heading";
import { StatusBadge } from "@/components/portal/status-badge";
import { requireProjectAccess } from "@/modules/auth/guards";
import { getPublishedSnapshot } from "@/modules/publication/service";

export default async function PortalDeliverablePage({ params }: { params: Promise<{ id: string; deliverableId: string }> }) {
  const { id, deliverableId } = await params;
  const context = await requireProjectAccess(id);
  const published = await getPublishedSnapshot(id, context.membership?.permissions ?? []);
  const item = published?.snapshot.deliverables.find((deliverable) => deliverable.id === deliverableId);
  if (!item) notFound();
  return <div className="workspace-page"><PortalHeading eyebrow="Entregable" title={item.title} body={item.description ?? undefined} action={<StatusBadge value={item.status} />} /><section className="workspace-panel"><div className="panel-heading"><h2>Documentos</h2><p>Solo versiones incluidas en el snapshot vigente.</p></div><div className="data-list">{item.documents.map((document) => <Link className="data-row-link" href={`/portal/p/${id}/docs/${document.id}`} key={document.id}><div><strong>{document.title}</strong><p>{document.versions.length} versiones</p></div><StatusBadge value={document.state} /></Link>)}</div></section></div>;
}
