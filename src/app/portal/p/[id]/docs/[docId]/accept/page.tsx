import { notFound } from "next/navigation";
import { PortalHeading } from "@/components/portal/portal-heading";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/modules/auth/guards";
import { ACCEPTANCE_STATEMENT } from "@/modules/projects/acceptance";
import { acceptVersionAction } from "@/modules/projects/client-actions";
import { getPublishedSnapshot } from "@/modules/publication/service";

export default async function AcceptDocumentPage({ params }: { params: Promise<{ id: string; docId: string }> }) {
  const { id, docId } = await params;
  const context = await requirePermission(id, "APPROVE").catch(() => notFound());
  const published = await getPublishedSnapshot(id, context.membership?.permissions ?? []);
  const match = published?.snapshot.deliverables.flatMap((deliverable) => deliverable.documents.map((document) => ({ document, deliverable }))).find((item) => item.document.id === docId);
  const version = match?.document.versions.at(-1);
  if (!match || !version) notFound();
  const existing = await prisma.acceptance.findUnique({ where: { documentVersionId_acceptedById: { documentVersionId: version.id, acceptedById: context.user.id } } });
  return <div className="workspace-page workspace-page--narrow"><PortalHeading eyebrow="Aceptación" title={`Versión ${version.version} · ${match.document.title}`} body="Confirma únicamente después de revisar el archivo y su contexto." /><section className="workspace-panel acceptance-panel"><div><span className="sv-eyebrow">Entregable</span><h2>{match.deliverable.title}</h2><p>{match.deliverable.description}</p></div>{version.file ? <a className="button button--secondary button--md" href={`/api/files/${version.file.id}/download`}>Descargar versión exacta</a> : null}<div className="notice notice--warning"><h3>Alcance del registro</h3><p>{ACCEPTANCE_STATEMENT}</p></div>{existing ? <div className="notice notice--success" role="status"><h3>Aceptación ya registrada</h3><p>Esta versión fue aceptada el {new Intl.DateTimeFormat("es-EC", { dateStyle: "long", timeStyle: "short" }).format(existing.acceptedAt)}.</p></div> : <form action={acceptVersionAction.bind(null, id, match.deliverable.id, version.id)}><label className="checkbox-field"><input type="checkbox" name="confirmation" value="accepted" required /> <span>Revisé la versión {version.version} y deseo registrar su aceptación en el portal.</span></label><Button type="submit" size="lg">Registrar aceptación</Button></form>}</section></div>;
}
