import Link from "next/link";
import { StatusBadge } from "@/components/portal/status-badge";
import { prisma } from "@/lib/db";

export default async function AdminSupportPage() {
  const tickets = await prisma.ticket.findMany({ orderBy: { updatedAt: "desc" }, include: { project: { select: { name: true } }, messages: { orderBy: { createdAt: "desc" }, take: 1 } } });
  return <div className="workspace-page"><header className="workspace-heading"><div><p className="sv-eyebrow">Soporte</p><h1>Cola de tickets.</h1></div><p>Los mensajes internos permanecen fuera de toda consulta del cliente.</p></header><section className="workspace-panel"><div className="data-list">{tickets.length ? tickets.map((ticket) => <Link className="data-row-link" href={`/admin/support/${ticket.id}`} key={ticket.id}><div><strong>{ticket.subject}</strong><p>{ticket.project.name} · {ticket.messages[0]?.body.slice(0, 100) ?? "Sin mensajes"}</p></div><div><StatusBadge value={ticket.priority} /><StatusBadge value={ticket.status} /></div></Link>) : <p className="empty-state">No hay tickets.</p>}</div></section></div>;
}
