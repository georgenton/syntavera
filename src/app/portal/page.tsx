import Link from "next/link";
import { BrandPattern } from "@/components/site/brand-pattern";
import { BrandMark } from "@/components/site/brand-mark";
import { SignOutButton } from "@/components/portal/sign-out-button";
import { StatusBadge } from "@/components/portal/status-badge";
import { projectSnapshotSchema, selectSnapshotForPermissions } from "@/modules/publication/schema";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/modules/auth/guards";
import { portalDashboardSummary } from "@/modules/projects/portal-policy";

export default async function PortalIndexPage() {
  const { user } = await requireCurrentUser();
  const memberships = await prisma.projectMembership.findMany({ where: { userId: user.id, status: "ACTIVE", permissions: { has: "VIEW" } }, include: { project: { include: { organization: { select: { name: true } }, publications: { where: { status: "PUBLISHED" }, orderBy: { version: "desc" }, take: 1 } } } }, orderBy: { updatedAt: "desc" } });
  const projects = memberships.map((membership) => {
    const publication = membership.project.publications[0];
    const parsed = publication ? projectSnapshotSchema.safeParse(publication.snapshot) : null;
    return { membership, publication, snapshot: parsed?.success ? selectSnapshotForPermissions(parsed.data, membership.permissions) : null };
  });
  const summary = portalDashboardSummary(projects.map((item) => ({ snapshot: item.snapshot, permissions: item.membership.permissions })));
  const accountMetrics = [
    ["En ejecución", summary.activeProjects, `${summary.publishedProjects} publicados`],
    ["Aprobaciones pendientes", summary.pendingApprovals, "Solo con permiso APPROVE"],
    ["Hitos abiertos", summary.openMilestones, "Según snapshots"],
    ["Vistas publicadas", summary.publishedProjects, `${projects.length} proyectos disponibles`],
    ...(summary.hasFinance ? [["Facturas con saldo", summary.invoicesWithBalance, "Solo proyectos con FINANCE"]] : []),
  ] as const;
  const initials = user.name.split(" ").map((part) => part[0]).slice(0, 2).join("");
  const organization = projects[0]?.membership.project.organization.name ?? "Área de clientes";

  return <div className="portal-dashboard">
    <header className="workspace-topbar"><div className="workspace-topbar__inner"><div className="workspace-topbar__brand"><BrandMark /><i aria-hidden="true" /><span>Área de clientes</span></div><div className="workspace-topbar__user"><span className="workspace-topbar__name">{user.name}<small>{organization}</small></span><b aria-hidden="true">{initials}</b><SignOutButton /></div></div></header>
    <main id="main-content">
      <section className="portal-dashboard__hero sv-dark">
        <BrandPattern variant="field" onDark seed={21} width={1400} height={360} opacity={0.28} mask="fade-left" />
        <div><p className="sv-eyebrow">Portal cliente</p><span className="portal-dashboard__org">{organization}</span><h1>Buenos días, {user.name.split(" ")[0]}.</h1><p>Tienes {summary.pendingApprovals} aprobaciones pendientes en {summary.publishedProjects} proyectos publicados.</p></div>
      </section>
      <div className="workspace-page portal-dashboard__content">
        <section className="metric-grid portal-account-metrics" aria-label="Indicadores de la cuenta">{accountMetrics.map(([label, value, detail]) => <article className="metric-card" key={label}><p>{label}</p><span>{value}</span><small>{detail}</small></article>)}</section>
        <section className="portal-projects"><header className="control-section-heading"><div><p className="sv-eyebrow">Expedientes publicados</p><h2>Tus proyectos con SyntaVera</h2></div><span className="sv-eyebrow">{projects.length} proyectos</span></header>
          <div className="project-card-grid">{projects.map(({ membership, publication, snapshot }) => {
            const name = snapshot?.project.name ?? "Proyecto pendiente de publicación";
            const summary = snapshot?.project.summary ?? "El equipo todavía no ha publicado la primera vista del cliente.";
            const completed = snapshot?.milestones.filter((milestone) => milestone.status === "COMPLETED").length ?? 0;
            const milestones = snapshot?.milestones.length ?? 0;
            const approvals = membership.permissions.includes("APPROVE") ? snapshot?.deliverables.filter((deliverable) => deliverable.status === "IN_REVIEW").length ?? 0 : 0;
            return <Link className="project-card" href={`/portal/p/${membership.projectId}`} key={membership.id}><div className="project-card__top"><StatusBadge value={snapshot?.project.status ?? "PENDING"} /><span>Snapshot v{publication?.version ?? "—"}</span></div><h3>{name}</h3><p>{summary}</p><div className="project-card__stats"><span><small>Hitos</small>{completed}/{milestones || "—"}</span><span><small>Aprobaciones</small>{approvals}</span><span><small>Permisos</small>{membership.permissions.length}</span></div><strong>Entrar →</strong></Link>;
          })}</div>
          {memberships.length === 0 ? <div className="notice"><h2>Sin proyectos activos</h2><p>Tu sesión es válida, pero todavía no hay un acceso activo con permiso de lectura.</p></div> : null}
        </section>
      </div>
    </main>
  </div>;
}
