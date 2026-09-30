import Link from "next/link";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/modules/auth/guards";
import { createOrganizationAction } from "@/modules/organizations/admin-actions";

export default async function OrganizationsPage() {
  await requireAdmin();
  const organizations = await prisma.organization.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { contacts: true, projects: true } } },
  });
  return (
    <div className="workspace-page">
      <header className="workspace-heading"><div><p className="sv-eyebrow">Organizaciones</p><h1>Clientes y contactos.</h1></div><p>Registro operativo mínimo, sin pipeline comercial ni eliminación destructiva.</p></header>
      <section className="workspace-grid-2">
        <form action={createOrganizationAction} className="workspace-panel workspace-form">
          <div className="panel-heading"><h2>Nueva organización</h2><p>El slug queda como referencia estable.</p></div>
          <div className="field"><label htmlFor="organization-name">Nombre</label><input id="organization-name" name="name" required /></div>
          <div className="field"><label htmlFor="organization-slug">Slug</label><input id="organization-slug" name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required /></div>
          <Button type="submit">Crear organización</Button>
        </form>
        <section className="workspace-panel">
          <div className="panel-heading"><h2>Directorio</h2><p>{organizations.length} organizaciones registradas.</p></div>
          <div className="data-list">{organizations.length ? organizations.map((organization) => <Link className="data-row-link" href={`/admin/organizations/${organization.id}`} key={organization.id}><div><strong>{organization.name}</strong><p>{organization.slug}</p></div><span>{organization._count.contacts} contactos · {organization._count.projects} proyectos</span></Link>) : <p className="empty-state">Todavía no hay organizaciones.</p>}</div>
        </section>
      </section>
    </div>
  );
}
