import Link from "next/link";
import { PortalEmpty } from "@/components/portal/portal-empty";
import { PortalHeading } from "@/components/portal/portal-heading";
import { StatusBadge } from "@/components/portal/status-badge";
import { ButtonLink } from "@/components/ui/button";
import { requireProjectAccess } from "@/modules/auth/guards";
import { listClientTickets } from "@/modules/support/service";

export default async function PortalSupportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await requireProjectAccess(id);
  const tickets = await listClientTickets(id);
  const canComment = context.membership?.permissions.includes("COMMENT") ?? false;
  return <div className="workspace-page"><PortalHeading eyebrow="Soporte" title="Preguntas con historial." body="Los mensajes y estados visibles quedan dentro del contexto del proyecto." action={canComment ? <ButtonLink href={`/portal/p/${id}/support/new`}>Nuevo ticket</ButtonLink> : null} />{tickets.length ? <section className="workspace-panel"><div className="data-list">{tickets.map((ticket) => <Link className="data-row-link" href={`/portal/p/${id}/support/${ticket.id}`} key={ticket.id}><div><strong>{ticket.subject}</strong><p>{ticket.messages.at(-1)?.body.slice(0, 120) ?? "Sin mensajes visibles"}</p></div><div><StatusBadge value={ticket.priority} /><StatusBadge value={ticket.status} /></div></Link>)}</div></section> : <PortalEmpty title="No hay tickets visibles." body="Los mensajes internos del equipo nunca aparecen en esta consulta." />}</div>;
}
