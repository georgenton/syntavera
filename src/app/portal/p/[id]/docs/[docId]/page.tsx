import Link from "next/link";
import { notFound } from "next/navigation";
import { PortalHeading } from "@/components/portal/portal-heading";
import { StatusBadge } from "@/components/portal/status-badge";
import { requireProjectAccess } from "@/modules/auth/guards";
import { getPublishedSnapshot } from "@/modules/publication/service";

export default async function PortalDocumentPage({ params }: { params: Promise<{ id: string; docId: string }> }) {
  const { id, docId } = await params;
  const context = await requireProjectAccess(id);
  const published = await getPublishedSnapshot(id, context.membership?.permissions ?? []);
  const match = published?.snapshot.deliverables.flatMap((deliverable) => deliverable.documents.map((document) => ({ document, deliverable }))).find((item) => item.document.id === docId);
  if (!match) notFound();
  const canApprove = context.membership?.permissions.includes("APPROVE") ?? false;
  return <div className="workspace-page"><PortalHeading eyebrow={match.deliverable.title} title={match.document.title} body="El número de versión identifica exactamente lo que está disponible para revisión." /><section className="workspace-panel"><div className="data-list">{match.document.versions.toReversed().map((version, index) => <article key={version.id}><div><strong>Versión {version.version}{index === 0 ? " · Actual" : ""}</strong><p>{version.label ?? "Sin etiqueta"} · {new Date(version.createdAt).toLocaleString("es-EC")}</p>{version.file ? <Link href={`/api/files/${version.file.id}/download`}>Descargar {version.file.originalName} →</Link> : <span>Sin archivo asociado</span>}</div><div><StatusBadge value={match.document.state} />{canApprove && index === 0 ? <Link className="button button--secondary button--sm" href={`/portal/p/${id}/docs/${docId}/accept`}>Revisar aceptación</Link> : null}</div></article>)}</div></section></div>;
}
