import { notFound } from "next/navigation";
import { PortalHeading } from "@/components/portal/portal-heading";
import { StatusBadge } from "@/components/portal/status-badge";
import { Button } from "@/components/ui/button";
import { requireProjectAccess } from "@/modules/auth/guards";
import { replyClientTicketAction } from "@/modules/support/client-actions";
import { getClientTicket } from "@/modules/support/service";

export default async function PortalTicketPage({ params }: { params: Promise<{ id: string; ticketId: string }> }) {
  const { id, ticketId } = await params;
  const context = await requireProjectAccess(id);
  const ticket = await getClientTicket(id, ticketId);
  if (!ticket) notFound();
  const canComment = context.membership?.permissions.includes("COMMENT") ?? false;
  return <div className="workspace-page workspace-page--narrow"><PortalHeading eyebrow="Ticket" title={ticket.subject} action={<div className="heading-status"><StatusBadge value={ticket.priority} /><StatusBadge value={ticket.status} /></div>} /><section className="message-thread">{ticket.messages.map((message) => <article className="message" key={message.id}><div><strong>{message.author.name}</strong></div><p>{message.body}</p><time>{message.createdAt.toLocaleString("es-EC")}</time></article>)}</section>{canComment && ticket.status !== "CLOSED" ? <form action={replyClientTicketAction.bind(null, id, ticketId)} className="workspace-panel workspace-form"><div className="field"><label htmlFor="body">Responder</label><textarea id="body" name="body" required /></div><Button type="submit">Enviar respuesta</Button></form> : null}</div>;
}
