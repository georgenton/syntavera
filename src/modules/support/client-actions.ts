"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/modules/audit/service";
import { requirePermission } from "@/modules/auth/guards";
import { criticalPriorityIsConfirmed } from "./policy";

export async function createClientTicketAction(projectId: string, formData: FormData) {
  const { user } = await requirePermission(projectId, "COMMENT");
  const parsed = z.object({
    subject: z.string().trim().min(4).max(180),
    body: z.string().trim().min(10).max(5000),
    priority: z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"]),
    criticalConfirmed: z.string().optional(),
    milestoneId: z.uuid().or(z.literal("")),
    deliverableId: z.uuid().or(z.literal("")),
    decisionId: z.uuid().or(z.literal("")),
  }).parse(Object.fromEntries(formData));
  if (!criticalPriorityIsConfirmed(parsed.priority, parsed.criticalConfirmed)) throw new Error("Critical priority requires explicit confirmation");
  const relationIds = [parsed.milestoneId, parsed.deliverableId, parsed.decisionId].filter(Boolean);
  if (relationIds.length > 1) throw new Error("A ticket can reference one project resource at a time");
  const [milestone, deliverable, decision] = await Promise.all([
    parsed.milestoneId ? prisma.milestone.findFirst({ where: { id: parsed.milestoneId, projectId }, select: { id: true } }) : null,
    parsed.deliverableId ? prisma.deliverable.findFirst({ where: { id: parsed.deliverableId, projectId }, select: { id: true } }) : null,
    parsed.decisionId ? prisma.decision.findFirst({ where: { id: parsed.decisionId, projectId }, select: { id: true } }) : null,
  ]);
  if ((parsed.milestoneId && !milestone) || (parsed.deliverableId && !deliverable) || (parsed.decisionId && !decision)) throw new Error("Related resource is outside the project");
  const ticket = await prisma.$transaction(async (tx) => {
    const created = await tx.ticket.create({ data: { projectId, subject: parsed.subject, priority: parsed.priority, milestoneId: parsed.milestoneId || null, deliverableId: parsed.deliverableId || null, decisionId: parsed.decisionId || null, createdById: user.id } });
    await tx.ticketMessage.create({ data: { ticketId: created.id, authorId: user.id, body: parsed.body, visibility: "CLIENT" } });
    await tx.activityEvent.create({ data: { projectId, actorId: user.id, type: "TICKET_CREATED", data: { ticketId: created.id }, visibleToClient: true } });
    await writeAuditLog({ actorId: user.id, projectId, action: "TICKET_CREATED", targetType: "Ticket", targetId: created.id, metadata: { priority: parsed.priority } }, tx);
    return created;
  });
  redirect(`/portal/p/${projectId}/support/${ticket.id}`);
}

export async function replyClientTicketAction(projectId: string, ticketId: string, formData: FormData) {
  const { user } = await requirePermission(projectId, "COMMENT");
  const body = z.string().trim().min(2).max(5000).parse(formData.get("body"));
  const ticket = await prisma.ticket.findFirst({ where: { id: ticketId, projectId } });
  if (!ticket) throw new Error("Ticket not found");
  await prisma.$transaction(async (tx) => {
    const message = await tx.ticketMessage.create({ data: { ticketId, authorId: user.id, body, visibility: "CLIENT" } });
    await tx.ticket.update({ where: { id: ticketId }, data: { status: "IN_PROGRESS" } });
    await writeAuditLog({ actorId: user.id, projectId, action: "CLIENT_TICKET_REPLY", targetType: "TicketMessage", targetId: message.id }, tx);
  });
  revalidatePath(`/portal/p/${projectId}/support/${ticketId}`);
}
