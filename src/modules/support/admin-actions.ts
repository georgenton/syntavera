"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/modules/audit/service";
import { requireInternalProjectAccess } from "@/modules/auth/guards";
import { criticalPriorityIsConfirmed } from "./policy";

export async function replyToTicketAction(ticketId: string, formData: FormData) {
  const ticket = await prisma.ticket.findUniqueOrThrow({ where: { id: ticketId }, select: { projectId: true } });
  const { user } = await requireInternalProjectAccess(ticket.projectId);
  const parsed = z.object({ body: z.string().trim().min(2).max(5000), visibility: z.enum(["CLIENT", "INTERNAL"]) }).parse(Object.fromEntries(formData));
  await prisma.$transaction(async (tx) => {
    const message = await tx.ticketMessage.create({ data: { ticketId, authorId: user.id, body: parsed.body, visibility: parsed.visibility } });
    if (parsed.visibility === "CLIENT") await tx.ticket.update({ where: { id: ticketId }, data: { status: "WAITING_CLIENT" } });
    await writeAuditLog({ actorId: user.id, projectId: ticket.projectId, action: "TICKET_MESSAGE_CREATED", targetType: "TicketMessage", targetId: message.id, metadata: { visibility: parsed.visibility } }, tx);
  });
  revalidatePath(`/admin/support/${ticketId}`);
}

export async function updateTicketStatusAction(ticketId: string, formData: FormData) {
  const ticket = await prisma.ticket.findUniqueOrThrow({ where: { id: ticketId }, select: { projectId: true } });
  const { user } = await requireInternalProjectAccess(ticket.projectId);
  const parsed = z.object({
    status: z.enum(["OPEN", "IN_PROGRESS", "WAITING_CLIENT", "RESOLVED", "CLOSED"]),
    priority: z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"]),
    criticalConfirmed: z.string().optional(),
  }).parse(Object.fromEntries(formData));
  if (!criticalPriorityIsConfirmed(parsed.priority, parsed.criticalConfirmed)) throw new Error("Critical priority requires explicit confirmation");
  await prisma.$transaction(async (tx) => {
    await tx.ticket.update({ where: { id: ticketId }, data: { status: parsed.status, priority: parsed.priority } });
    await tx.activityEvent.create({ data: { projectId: ticket.projectId, actorId: user.id, type: "TICKET_STATUS_CHANGED", data: { ticketId, status: parsed.status, priority: parsed.priority }, visibleToClient: true } });
    await writeAuditLog({ actorId: user.id, projectId: ticket.projectId, action: "TICKET_STATUS_CHANGED", targetType: "Ticket", targetId: ticketId, metadata: { status: parsed.status, priority: parsed.priority } }, tx);
  });
  revalidatePath(`/admin/support/${ticketId}`);
  revalidatePath(`/portal/p/${ticket.projectId}/support`);
}
