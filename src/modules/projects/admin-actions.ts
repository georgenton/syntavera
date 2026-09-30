"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { writeAuditLog } from "@/modules/audit/service";
import { requireInternalProjectAccess, requireInternalUser } from "@/modules/auth/guards";
import { createClientInvitation } from "@/modules/auth/invitations";
import { clientCanJoinOrganization } from "@/modules/auth/invitation-policy";
import { sendInvitationEmail } from "@/modules/email/service";
import { publishProjectSnapshot } from "@/modules/publication/service";

const slug = z.string().trim().min(2).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const projectSchema = z.object({
  organizationId: z.uuid(),
  name: z.string().trim().min(2).max(160),
  projectSlug: slug,
  objective: z.string().trim().min(20).max(2000),
  summary: z.string().trim().min(20).max(2000),
  status: z.enum(["DISCOVERY", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"]),
  projectManagerId: z.uuid(),
  primaryContactId: z.uuid().or(z.literal("")),
  reference: z.string().trim().max(120).optional(),
});

export async function createProjectAction(formData: FormData) {
  const { user } = await requireInternalUser();
  const parsed = projectSchema.parse(Object.fromEntries(formData));
  const project = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.findUnique({ where: { id: parsed.organizationId }, select: { id: true } });
    if (!organization) throw new Error("Organization not found");
    const manager = await tx.user.findFirst({ where: { id: parsed.projectManagerId, kind: "INTERNAL", disabledAt: null }, select: { id: true } });
    if (!manager) throw new Error("Project manager not found");
    if (parsed.primaryContactId) {
      const contact = await tx.contact.findFirst({ where: { id: parsed.primaryContactId, organizationId: parsed.organizationId }, select: { id: true } });
      if (!contact) throw new Error("Primary contact does not belong to the selected organization");
    }
    const created = await tx.project.create({
      data: {
        organizationId: parsed.organizationId,
        name: parsed.name,
        slug: parsed.projectSlug,
        objective: parsed.objective,
        summary: parsed.summary,
        status: parsed.status,
        primaryContactId: parsed.primaryContactId || null,
        reference: parsed.reference || null,
        internal: { create: { projectManagerId: parsed.projectManagerId } },
      },
    });
    await tx.activityEvent.create({ data: { projectId: created.id, actorId: user.id, type: "PROJECT_CREATED", data: { status: created.status }, visibleToClient: false } });
    await writeAuditLog({ actorId: user.id, projectId: created.id, action: "PROJECT_CREATED", targetType: "Project", targetId: created.id, metadata: { slug: created.slug } }, tx);
    return created;
  });
  redirect(`/admin/projects/${project.id}`);
}

export async function updateProjectAction(projectId: string, formData: FormData) {
  const { user } = await requireInternalProjectAccess(projectId);
  const parsed = z.object({
    name: z.string().trim().min(2).max(160),
    objective: z.string().trim().min(20).max(2000),
    summary: z.string().trim().min(20).max(2000),
    status: z.enum(["DISCOVERY", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"]),
    reference: z.string().trim().max(120).optional(),
    primaryContactId: z.uuid().or(z.literal("")),
    projectManagerId: z.uuid(),
  }).parse(Object.fromEntries(formData));
  await prisma.$transaction(async (tx) => {
    const project = await tx.project.findUniqueOrThrow({ where: { id: projectId }, select: { organizationId: true } });
    if (parsed.primaryContactId) {
      const contact = await tx.contact.findFirst({ where: { id: parsed.primaryContactId, organizationId: project.organizationId }, select: { id: true } });
      if (!contact) throw new Error("Primary contact does not belong to the project organization");
    }
    await tx.project.update({ where: { id: projectId }, data: { name: parsed.name, objective: parsed.objective, summary: parsed.summary, status: parsed.status, reference: parsed.reference || null, primaryContactId: parsed.primaryContactId || null } });
    if (user.internalRole === "ADMIN") {
      const manager = await tx.user.findFirst({ where: { id: parsed.projectManagerId, kind: "INTERNAL", disabledAt: null }, select: { id: true } });
      if (!manager) throw new Error("Project manager not found");
      await tx.projectInternal.update({ where: { projectId }, data: { projectManagerId: manager.id } });
    }
    await writeAuditLog({ actorId: user.id, projectId, action: "PROJECT_UPDATED", targetType: "Project", targetId: projectId, metadata: { status: parsed.status } }, tx);
  });
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function addPhaseAction(projectId: string, formData: FormData) {
  const { user } = await requireInternalProjectAccess(projectId);
  const parsed = z.object({ name: z.string().trim().min(2).max(160), clientSummary: z.string().trim().max(1000).optional() }).parse(Object.fromEntries(formData));
  await prisma.$transaction(async (tx) => {
    const aggregate = await tx.phase.aggregate({ where: { projectId }, _max: { position: true } });
    const phase = await tx.phase.create({ data: { projectId, name: parsed.name, clientSummary: parsed.clientSummary || null, position: (aggregate._max.position ?? -1) + 1 } });
    await writeAuditLog({ actorId: user.id, projectId, action: "PHASE_CREATED", targetType: "Phase", targetId: phase.id }, tx);
  });
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function addMilestoneAction(projectId: string, formData: FormData) {
  const { user } = await requireInternalProjectAccess(projectId);
  const parsed = z.object({ title: z.string().trim().min(2).max(180), description: z.string().trim().max(1200).optional(), phaseId: z.uuid().or(z.literal("")) }).parse(Object.fromEntries(formData));
  await prisma.$transaction(async (tx) => {
    const aggregate = await tx.milestone.aggregate({ where: { projectId }, _max: { position: true } });
    const milestone = await tx.milestone.create({ data: { projectId, phaseId: parsed.phaseId || null, title: parsed.title, description: parsed.description || null, position: (aggregate._max.position ?? -1) + 1 } });
    await writeAuditLog({ actorId: user.id, projectId, action: "MILESTONE_CREATED", targetType: "Milestone", targetId: milestone.id }, tx);
  });
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function addDeliverableAction(projectId: string, formData: FormData) {
  const { user } = await requireInternalProjectAccess(projectId);
  const parsed = z.object({ title: z.string().trim().min(2).max(180), description: z.string().trim().max(1200).optional(), milestoneId: z.uuid().or(z.literal("")) }).parse(Object.fromEntries(formData));
  await prisma.$transaction(async (tx) => {
    const deliverable = await tx.deliverable.create({ data: { projectId, milestoneId: parsed.milestoneId || null, title: parsed.title, description: parsed.description || null, status: "IN_REVIEW" } });
    await writeAuditLog({ actorId: user.id, projectId, action: "DELIVERABLE_CREATED", targetType: "Deliverable", targetId: deliverable.id }, tx);
  });
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function createDocumentAction(projectId: string, formData: FormData) {
  const { user } = await requireInternalProjectAccess(projectId);
  const parsed = z.object({ deliverableId: z.uuid(), title: z.string().trim().min(2).max(180) }).parse(Object.fromEntries(formData));
  const deliverable = await prisma.deliverable.findFirst({ where: { id: parsed.deliverableId, projectId }, select: { id: true } });
  if (!deliverable) throw new Error("Deliverable not found in project");
  await prisma.$transaction(async (tx) => {
    const document = await tx.document.create({ data: { projectId, deliverableId: deliverable.id, title: parsed.title, state: "DRAFT" } });
    await writeAuditLog({ actorId: user.id, projectId, action: "DOCUMENT_CREATED", targetType: "Document", targetId: document.id, metadata: { deliverableId: deliverable.id } }, tx);
  });
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function updateDocumentStateAction(projectId: string, documentId: string, formData: FormData) {
  const { user } = await requireInternalProjectAccess(projectId);
  const state = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).parse(formData.get("state"));
  const document = await prisma.document.findFirst({ where: { id: documentId, projectId }, select: { id: true } });
  if (!document) throw new Error("Document not found in project");
  await prisma.$transaction(async (tx) => {
    await tx.document.update({ where: { id: document.id }, data: { state } });
    await writeAuditLog({ actorId: user.id, projectId, action: "DOCUMENT_STATE_UPDATED", targetType: "Document", targetId: document.id, metadata: { state } }, tx);
  });
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function publishProjectAction(projectId: string, formData: FormData) {
  const { user } = await requireInternalProjectAccess(projectId);
  const changeSummary = z.string().trim().min(4).max(500).parse(formData.get("changeSummary"));
  await publishProjectSnapshot({ projectId, actorId: user.id, changeSummary });
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath(`/portal/p/${projectId}`);
}

export async function inviteClientAction(projectId: string, formData: FormData) {
  const { user: actor } = await requireInternalProjectAccess(projectId);
  const parsed = z.object({
    name: z.string().trim().min(2).max(120),
    email: z.email().transform((value) => value.trim().toLowerCase()),
    permissions: z.array(z.enum(["VIEW", "COMMENT", "APPROVE", "FINANCE"])).min(1),
  }).parse({ name: formData.get("name"), email: formData.get("email"), permissions: formData.getAll("permissions") });
  const project = await prisma.project.findUniqueOrThrow({ where: { id: projectId }, select: { name: true, organizationId: true } });
  const existing = await prisma.user.findUnique({ where: { email: parsed.email } });
  if (existing?.kind === "INTERNAL") throw new Error("The email belongs to an internal user");
  if (existing && !clientCanJoinOrganization(existing.organizationId, project.organizationId)) {
    throw new Error("The client belongs to another organization");
  }
  const client = existing
    ? await prisma.user.update({ where: { id: existing.id }, data: { name: parsed.name, organizationId: project.organizationId } })
    : await prisma.user.create({ data: { name: parsed.name, email: parsed.email, kind: "CLIENT", organizationId: project.organizationId } });
  await prisma.projectMembership.upsert({
    where: { projectId_userId: { projectId, userId: client.id } },
    create: { projectId, userId: client.id, permissions: parsed.permissions, status: "INVITED" },
    update: { permissions: parsed.permissions, status: "INVITED", activatedAt: null, revokedAt: null },
  });
  const { invitation, token } = await createClientInvitation({ projectId, email: parsed.email, createdById: actor.id });
  const env = getServerEnv();
  await sendInvitationEmail({ email: parsed.email, projectName: project.name, inviteUrl: `${env.APP_URL}/invite/${token}` });
  await writeAuditLog({ actorId: actor.id, projectId, action: "CLIENT_INVITED", targetType: "ClientInvitation", targetId: invitation.id, metadata: { permissions: parsed.permissions } });
  revalidatePath(`/admin/projects/${projectId}`);
}
