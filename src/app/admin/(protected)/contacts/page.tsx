import { StatusBadge } from "@/components/portal/status-badge";
import { prisma } from "@/lib/db";
import { updateContactStatusAction } from "@/modules/contact/admin-actions";

export default async function ContactsPage() {
  const contacts = await prisma.contactSubmission.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return <div className="workspace-page"><header className="workspace-heading"><div><p className="sv-eyebrow">Pipeline de contacto</p><h1>Contextos recibidos.</h1></div><p>Datos persistidos con versión de privacidad y metadatos mínimos de auditoría.</p></header><section className="workspace-panel"><div className="data-list">{contacts.length ? contacts.map((contact) => <article key={contact.id} className="data-list__expanded"><div><strong>{contact.name}</strong><p>{contact.organization} · {contact.role}</p><a href={`mailto:${contact.email}`}>{contact.email}</a><p className="data-list__body">{contact.context}</p></div><div><StatusBadge value={contact.status} /><time>{contact.createdAt.toLocaleDateString("es-EC")}</time><form action={updateContactStatusAction.bind(null, contact.id)}><select name="status" defaultValue={contact.status}>{["NEW", "REVIEWED", "ARCHIVED"].map((status) => <option value={status} key={status}>{status}</option>)}</select><button type="submit">Guardar</button></form></div></article>) : <p className="empty-state">No hay contactos registrados.</p>}</div></section></div>;
}
