import "server-only";
import { prisma } from "@/lib/db";
import { clientVisibleMessages } from "./policy";

export async function listClientTickets(projectId: string) {
  const tickets = await prisma.ticket.findMany({
    where: { projectId },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        where: { visibility: "CLIENT" },
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true } } },
      },
    },
  });
  return tickets.map((ticket) => ({ ...ticket, messages: clientVisibleMessages(ticket.messages) }));
}

export async function getClientTicket(projectId: string, ticketId: string) {
  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, projectId },
    include: { messages: { where: { visibility: "CLIENT" }, orderBy: { createdAt: "asc" }, include: { author: { select: { id: true, name: true } } } } },
  });
  return ticket ? { ...ticket, messages: clientVisibleMessages(ticket.messages) } : null;
}
