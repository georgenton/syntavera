import Link from "next/link";
import { BrandMark } from "@/components/site/brand-mark";
import { SignOutButton } from "@/components/portal/sign-out-button";
import { projectSnapshotSchema } from "@/modules/publication/schema";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/modules/auth/guards";

export default async function PortalIndexPage() {
  const { user } = await requireCurrentUser();
  const memberships = await prisma.projectMembership.findMany({ where: { userId: user.id, status: "ACTIVE", permissions: { has: "VIEW" } }, include: { project: { include: { publications: { where: { status: "PUBLISHED" }, orderBy: { version: "desc" }, take: 1 } } } }, orderBy: { updatedAt: "desc" } });
  return <main id="main-content" className="project-picker sv-grid-bg"><div className="project-picker__header"><BrandMark /><div><span>{user.name}</span><SignOutButton /></div></div><div className="project-picker__content"><p className="sv-eyebrow">Portal cliente</p><h1>Elige un proyecto.</h1><p className="sv-lede">Solo aparecen proyectos con acceso activo y permiso de lectura.</p><div className="project-card-grid">{memberships.map((membership) => { const publication = membership.project.publications[0]; const parsed = publication ? projectSnapshotSchema.safeParse(publication.snapshot) : null; const name = parsed?.success ? parsed.data.project.name : "Proyecto pendiente de publicación"; const summary = parsed?.success ? parsed.data.project.summary : "El equipo todavía no ha publicado la primera vista del cliente."; return <Link className="project-card" href={`/portal/p/${membership.projectId}`} key={membership.id}><span>{membership.permissions.join(" · ")}</span><h2>{name}</h2><p>{summary}</p><strong>Entrar al proyecto →</strong></Link>; })}</div>{memberships.length === 0 ? <div className="notice"><h2>Sin proyectos activos</h2><p>Tu sesión es válida, pero todavía no hay un acceso activo con permiso de lectura.</p></div> : null}</div></main>;
}
