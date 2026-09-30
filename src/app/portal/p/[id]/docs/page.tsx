import Link from "next/link";
import { PortalEmpty } from "@/components/portal/portal-empty";
import { PortalHeading } from "@/components/portal/portal-heading";
import { StatusBadge } from "@/components/portal/status-badge";
import { requireProjectAccess } from "@/modules/auth/guards";
import { getPublishedSnapshot } from "@/modules/publication/service";

export default async function PortalDocsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await requireProjectAccess(id);
  const published = await getPublishedSnapshot(id, context.membership?.permissions ?? []);
  const documents = published?.snapshot.deliverables.flatMap((deliverable) => deliverable.documents.map((document) => ({ ...document, deliverableTitle: deliverable.title }))) ?? [];
  return <div className="workspace-page"><PortalHeading eyebrow="Documentos" title="Versiones publicadas." body="Cada revisión conserva su número y fecha. Los archivos se descargan con un enlace temporal." />{documents.length ? <section className="workspace-panel"><div className="data-list">{documents.map((document) => <Link className="data-row-link" href={`/portal/p/${id}/docs/${document.id}`} key={document.id}><div><strong>{document.title}</strong><p>{document.deliverableTitle} · {document.versions.length} versiones</p></div><StatusBadge value={document.state} /></Link>)}</div></section> : <PortalEmpty title="No hay documentos publicados." body="Los documentos en borrador interno no aparecen aquí." />}</div>;
}
