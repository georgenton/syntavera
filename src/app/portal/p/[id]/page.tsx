import Link from "next/link";
import { PortalEmpty } from "@/components/portal/portal-empty";
import { PortalHeading } from "@/components/portal/portal-heading";
import { StatusBadge } from "@/components/portal/status-badge";
import { requireProjectAccess } from "@/modules/auth/guards";
import { getPublishedSnapshot } from "@/modules/publication/service";

export default async function PortalOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await requireProjectAccess(id);
  const published = await getPublishedSnapshot(id, context.membership?.permissions ?? []);
  if (!published) return <div className="workspace-page"><PortalHeading eyebrow="Resumen" title="Tu proyecto." /><PortalEmpty title="Aún no hay una vista publicada." body="El equipo está preparando la primera revisión. Nada interno se muestra como sustituto." /></div>;
  const { snapshot, publication } = published;
  const completed = snapshot.milestones.filter((item) => item.status === "COMPLETED").length;
  const openDeliverables = snapshot.deliverables.filter((item) => item.status !== "ACCEPTED" && item.status !== "ARCHIVED").length;
  return <div className="workspace-page"><PortalHeading eyebrow={`Snapshot v${publication.version}`} title={snapshot.project.name} body={snapshot.project.summary} />{snapshot.project.objective ? <section className="workspace-panel"><div className="panel-heading"><h2>Objetivo</h2><p>Propósito publicado del proyecto.</p></div><p>{snapshot.project.objective}</p></section> : null}<section className="metric-grid"><article className="metric-card"><span>{completed}/{snapshot.milestones.length}</span><p>Hitos completados</p></article><article className="metric-card"><span>{openDeliverables}</span><p>Entregables por revisar</p></article><article className="metric-card"><span>{snapshot.decisions.length}</span><p>Decisiones registradas</p></article><article className="metric-card"><span>{snapshot.billing.length}</span><p>Facturas visibles</p></article></section><section className="workspace-grid-2"><div className="workspace-panel"><div className="panel-heading"><h2>Próximos hitos</h2><Link href={`/portal/p/${id}/plan`}>Ver plan →</Link></div><div className="data-list">{snapshot.milestones.slice(0, 4).map((item) => <article key={item.id}><div><strong>{item.title}</strong><p>{item.description}</p></div><StatusBadge value={item.status} /></article>)}</div></div><div className="workspace-panel"><div className="panel-heading"><h2>Entregables</h2><Link href={`/portal/p/${id}/deliverables`}>Ver todos →</Link></div><div className="data-list">{snapshot.deliverables.slice(0, 4).map((item) => <article key={item.id}><div><strong>{item.title}</strong><p>{item.documents.length} documentos</p></div><StatusBadge value={item.status} /></article>)}</div></div></section></div>;
}
