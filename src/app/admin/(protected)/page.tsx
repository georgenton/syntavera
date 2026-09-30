import Link from "next/link";
import { BrandPattern } from "@/components/site/brand-pattern";
import { StatusBadge } from "@/components/portal/status-badge";
import { ButtonLink } from "@/components/ui/button";
import { prisma } from "@/lib/db";

export default async function AdminOverviewPage() {
  const [projects, activeProjects, blockedProjects, waitingClient, deliverablesInReview, draftDocuments, openTickets, pendingInvoices] = await Promise.all([
    prisma.project.findMany({
      where: { status: { not: "ARCHIVED" } },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        reference: true,
        status: true,
        organization: { select: { name: true } },
        milestones: { select: { status: true } },
        tickets: { where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING_CLIENT"] } }, select: { id: true } },
        invoices: { where: { paymentState: { in: ["UNPAID", "PARTIALLY_PAID", "OVERDUE"] } }, select: { id: true } },
        publications: { where: { status: "PUBLISHED" }, orderBy: { version: "desc" }, take: 1, select: { version: true } },
      },
    }),
    prisma.project.count({ where: { status: "ACTIVE" } }),
    prisma.milestone.findMany({ where: { status: "BLOCKED" }, distinct: ["projectId"], select: { projectId: true } }),
    prisma.ticket.count({ where: { status: "WAITING_CLIENT" } }),
    prisma.deliverable.count({ where: { status: "IN_REVIEW" } }),
    prisma.document.count({ where: { state: "DRAFT" } }),
    prisma.ticket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING_CLIENT"] } } }),
    prisma.invoice.count({ where: { paymentState: { in: ["UNPAID", "PARTIALLY_PAID", "OVERDUE"] } } }),
  ]);

  const metrics = [
    ["Proyectos activos", activeProjects, `${projects.length} visibles`],
    ["Con bloqueos", blockedProjects.length, blockedProjects.length ? "Requieren revisión" : "Ninguno"],
    ["Esperando cliente", waitingClient, "Tickets en espera"],
    ["Entregables en revisión", deliverablesInReview, "Pendientes de decisión"],
    ["Documentos pendientes", draftDocuments, "En borrador"],
    ["Tickets abiertos", openTickets, "Operación activa"],
    ["Facturas pendientes", pendingInvoices, "Con saldo"],
  ] as const;

  return (
    <>
      <section className="control-hero sv-dark">
        <BrandPattern variant="verification" onDark seed={12} width={1400} height={300} opacity={0.3} mask="fade-left" />
        <div className="control-hero__inner">
          <div><p className="sv-eyebrow">Fuente relacional · uso interno</p><h1>Project Control Center</h1><p>{new Intl.DateTimeFormat("es-EC", { dateStyle: "long" }).format(new Date())} · lo que los clientes ven y lo que hay que mover hoy</p></div>
          <ButtonLink href="/admin/projects/new" variant="inverse">Nuevo proyecto <span aria-hidden="true">＋</span></ButtonLink>
        </div>
      </section>
      <div className="workspace-page control-page">
        <section className="metric-grid metric-grid--seven" aria-label="Indicadores internos">
          {metrics.map(([label, value, detail]) => <article className="metric-card" key={label}><p>{label}</p><span>{value}</span><small>{detail}</small></article>)}
        </section>

        <section className="control-projects">
          <header className="control-section-heading"><div><p className="sv-eyebrow">Vista operacional</p><h2>Proyectos</h2></div><span className="sv-eyebrow">{projects.length} proyectos</span></header>
          <div className="control-table">
            <div className="control-table__head"><span>Proyecto</span><span>Organización</span><span>Hitos</span><span>Bloqueos</span><span>Tickets</span><span>Facturas</span><span>Snapshot</span><span /></div>
            {projects.map((project) => {
              const completed = project.milestones.filter((milestone) => milestone.status === "COMPLETED").length;
              const blocked = project.milestones.filter((milestone) => milestone.status === "BLOCKED").length;
              return (
                <article className="control-table__row" key={project.id}>
                  <div><StatusBadge value={project.status} /><strong>{project.name}</strong><small>{project.reference ?? "Sin referencia"}</small></div>
                  <span>{project.organization.name}</span>
                  <span>{completed}/{project.milestones.length || "—"}</span>
                  <span className={blocked ? "control-value--attention" : undefined}>{blocked || "—"}</span>
                  <span>{project.tickets.length || "—"}</span>
                  <span>{project.invoices.length || "—"}</span>
                  <span>v{project.publications[0]?.version ?? "—"}</span>
                  <Link href={`/admin/projects/${project.id}`}>Abrir →</Link>
                </article>
              );
            })}
            {projects.length === 0 ? <p className="empty-state">No hay proyectos operativos.</p> : null}
          </div>
        </section>
      </div>
    </>
  );
}
