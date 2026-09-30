import { prisma } from "@/lib/db";

export default async function AdminOverviewPage() {
  const [projects, contacts, tickets, publications] = await Promise.all([
    prisma.project.count({ where: { status: { not: "ARCHIVED" } } }),
    prisma.contactSubmission.count({ where: { status: "NEW" } }),
    prisma.ticket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING_CLIENT"] } } }),
    prisma.projectPublication.count({ where: { status: "PUBLISHED" } }),
  ]);
  const metrics = [["Proyectos activos", projects], ["Contactos nuevos", contacts], ["Tickets abiertos", tickets], ["Snapshots vigentes", publications]] as const;
  const recent = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 12, include: { actor: { select: { name: true } }, project: { select: { name: true } } } });
  return (
    <div className="workspace-page">
      <header className="workspace-heading"><div><p className="sv-eyebrow">Backoffice</p><h1>Resumen operacional.</h1></div><p>Fuente relacional interna. Nada cambia en el portal hasta publicar un snapshot.</p></header>
      <section className="metric-grid">{metrics.map(([label, value]) => <article className="metric-card" key={label}><span>{value}</span><p>{label}</p></article>)}</section>
      <section className="workspace-panel"><div className="panel-heading"><h2>Actividad auditable</h2><p>Últimos eventos internos.</p></div><div className="data-list">{recent.length ? recent.map((event) => <article key={event.id}><div><strong>{event.action}</strong><p>{event.project?.name ?? event.targetType}</p></div><div><span>{event.actor?.name ?? "Sistema"}</span><time>{event.createdAt.toLocaleString("es-EC")}</time></div></article>) : <p className="empty-state">Todavía no hay eventos.</p>}</div></section>
    </div>
  );
}
