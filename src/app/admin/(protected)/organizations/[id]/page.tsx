import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/portal/status-badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/modules/auth/guards";
import { createOrganizationContactAction, updateOrganizationAction, updateOrganizationContactAction } from "@/modules/organizations/admin-actions";

export default async function OrganizationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin();
  const organization = await prisma.organization.findUnique({
    where: { id },
    include: { contacts: { orderBy: { name: "asc" } }, projects: { orderBy: { updatedAt: "desc" } } },
  });
  if (!organization) notFound();
  return (
    <div className="workspace-page">
      <header className="workspace-heading"><div><p className="sv-eyebrow">Organización</p><h1>{organization.name}</h1></div><Link href="/admin/organizations">Volver al directorio</Link></header>
      <section className="workspace-grid-2">
        <form action={updateOrganizationAction.bind(null, id)} className="workspace-panel workspace-form">
          <div className="panel-heading"><h2>Datos</h2><p>Edición sin borrado destructivo.</p></div>
          <div className="field"><label htmlFor="name">Nombre</label><input id="name" name="name" defaultValue={organization.name} required /></div>
          <div className="field"><label htmlFor="slug">Slug</label><input id="slug" name="slug" defaultValue={organization.slug} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required /></div>
          <Button type="submit">Guardar organización</Button>
        </form>
        <form action={createOrganizationContactAction.bind(null, id)} className="workspace-panel workspace-form">
          <div className="panel-heading"><h2>Nuevo contacto</h2><p>Contacto real asociado a esta organización.</p></div>
          <div className="form-grid">
            <div className="field"><label htmlFor="new-contact-name">Nombre</label><input id="new-contact-name" name="name" required /></div>
            <div className="field"><label htmlFor="new-contact-email">Email</label><input id="new-contact-email" name="email" type="email" required /></div>
            <div className="field"><label htmlFor="new-contact-role">Rol</label><input id="new-contact-role" name="role" /></div>
            <div className="field"><label htmlFor="new-contact-phone">Teléfono</label><input id="new-contact-phone" name="phone" /></div>
            <div className="field field--full"><label htmlFor="new-contact-notes">Notas internas</label><textarea id="new-contact-notes" name="notes" /></div>
          </div>
          <Button type="submit">Añadir contacto</Button>
        </form>
      </section>
      <section className="workspace-panel"><div className="panel-heading"><h2>Contactos</h2><p>Se pueden actualizar; V1 no elimina registros.</p></div><div className="organization-contact-grid">{organization.contacts.length ? organization.contacts.map((contact) => <form action={updateOrganizationContactAction.bind(null, id, contact.id)} className="contact-editor" key={contact.id}><div className="form-grid"><div className="field"><label htmlFor={`contact-name-${contact.id}`}>Nombre</label><input id={`contact-name-${contact.id}`} name="name" defaultValue={contact.name} required /></div><div className="field"><label htmlFor={`contact-email-${contact.id}`}>Email</label><input id={`contact-email-${contact.id}`} name="email" type="email" defaultValue={contact.email} required /></div><div className="field"><label htmlFor={`contact-role-${contact.id}`}>Rol</label><input id={`contact-role-${contact.id}`} name="role" defaultValue={contact.role ?? ""} /></div><div className="field"><label htmlFor={`contact-phone-${contact.id}`}>Teléfono</label><input id={`contact-phone-${contact.id}`} name="phone" defaultValue={contact.phone ?? ""} /></div><div className="field field--full"><label htmlFor={`contact-notes-${contact.id}`}>Notas internas</label><textarea id={`contact-notes-${contact.id}`} name="notes" defaultValue={contact.notes ?? ""} /></div></div><Button type="submit" variant="secondary">Guardar contacto</Button></form>) : <p className="empty-state">No hay contactos.</p>}</div></section>
      <section className="workspace-panel"><div className="panel-heading"><h2>Proyectos</h2><p>Trabajo relacionado con esta organización.</p></div><div className="data-list">{organization.projects.length ? organization.projects.map((project) => <Link className="data-row-link" href={`/admin/projects/${project.id}`} key={project.id}><div><strong>{project.name}</strong><p>{project.reference ?? "Sin referencia"}</p></div><StatusBadge value={project.status} /></Link>) : <p className="empty-state">No hay proyectos relacionados.</p>}</div></section>
    </div>
  );
}
