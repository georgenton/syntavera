import Link from "next/link";
import { StatusBadge } from "@/components/portal/status-badge";
import { ButtonLink } from "@/components/ui/button";
import { prisma } from "@/lib/db";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({ orderBy: { updatedAt: "desc" }, include: { organization: true, publications: { where: { status: "PUBLISHED" }, select: { version: true }, take: 1 } } });
  return <div className="workspace-page"><header className="workspace-heading"><div><p className="sv-eyebrow">Proyectos</p><h1>Fuente de trabajo.</h1></div><ButtonLink href="/admin/projects/new">Crear proyecto</ButtonLink></header><section className="workspace-panel"><div className="data-list">{projects.length ? projects.map((project) => <Link className="data-row-link" href={`/admin/projects/${project.id}`} key={project.id}><div><strong>{project.name}</strong><p>{project.organization.name}</p></div><div><StatusBadge value={project.status} /><span>Snapshot v{project.publications[0]?.version ?? "—"}</span></div></Link>) : <p className="empty-state">No hay proyectos. Crea el primero para iniciar la fuente relacional.</p>}</div></section></div>;
}
