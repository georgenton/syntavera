import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { ProjectPermission } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { writeAuditLog } from "@/modules/audit/service";
import { invitationEmailDeliveryConfigured, sendInvitationEmail } from "@/modules/email/service";
import { clientCanJoinOrganization, invitationCanBeConsumed } from "./invitation-policy";

const INVITE_TTL_MS = 72 * 60 * 60 * 1000;

export function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function clientInvitationDeliveryReady() {
  return invitationEmailDeliveryConfigured();
}

type DeliverInvitationInput = {
  projectId: string;
  name: string;
  email: string;
  permissions: ProjectPermission[];
  createdById: string;
  retry?: boolean;
};

export type InvitationDeliveryResult =
  | { status: "sent"; invitationId: string; membershipId: string }
  | { status: "failed"; invitationId: string; membershipId: string; errorCode: "INVITATION_DELIVERY_FAILED" };

export async function deliverClientInvitation(input: DeliverInvitationInput): Promise<InvitationDeliveryResult> {
  if (!clientInvitationDeliveryReady()) throw Object.assign(new Error("Invitation delivery is not configured"), { code: "INVITATION_DELIVERY_NOT_CONFIGURED" });

  const email = input.email.trim().toLowerCase();
  const token = randomBytes(32).toString("base64url");
  const prepared = await prisma.$transaction(async (tx) => {
    const project = await tx.project.findUniqueOrThrow({ where: { id: input.projectId }, select: { id: true, name: true, organizationId: true } });
    const existing = await tx.user.findUnique({ where: { email } });
    if (existing?.kind === "INTERNAL") throw new Error("The email belongs to an internal user");
    if (existing && !clientCanJoinOrganization(existing.organizationId, project.organizationId)) throw new Error("The client belongs to another organization");

    const activeMembership = existing ? await tx.projectMembership.findUnique({ where: { projectId_userId: { projectId: project.id, userId: existing.id } } }) : null;
    if (activeMembership?.status === "ACTIVE") throw new Error("The client already has active access to this project");

    const client = existing
      ? await tx.user.update({ where: { id: existing.id }, data: { name: input.name, organizationId: project.organizationId } })
      : await tx.user.create({ data: { name: input.name, email, kind: "CLIENT", organizationId: project.organizationId } });
    const membership = await tx.projectMembership.upsert({
      where: { projectId_userId: { projectId: project.id, userId: client.id } },
      create: { projectId: project.id, userId: client.id, permissions: input.permissions, status: "INVITED" },
      update: { permissions: input.permissions, status: "INVITED", activatedAt: null, revokedAt: null },
    });
    await tx.clientInvitation.updateMany({
      where: { projectId: project.id, email, acceptedAt: null, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    const invitation = await tx.clientInvitation.create({
      data: {
        projectId: project.id,
        email,
        createdById: input.createdById,
        tokenHash: hashInviteToken(token),
        expiresAt: new Date(Date.now() + INVITE_TTL_MS),
      },
    });
    await writeAuditLog({
      actorId: input.createdById,
      projectId: project.id,
      action: input.retry ? "CLIENT_INVITATION_RETRY_REQUESTED" : "CLIENT_INVITATION_PREPARED",
      targetType: "ClientInvitation",
      targetId: invitation.id,
      metadata: { membershipId: membership.id, permissions: input.permissions },
    }, tx);
    return { invitation, membership, project };
  }, { isolationLevel: "Serializable" });

  try {
    const env = getServerEnv();
    await sendInvitationEmail({ email, projectName: prepared.project.name, inviteUrl: `${env.APP_URL}/invite/${token}` });
    await writeAuditLog({
      actorId: input.createdById,
      projectId: input.projectId,
      action: "CLIENT_INVITATION_SENT",
      targetType: "ClientInvitation",
      targetId: prepared.invitation.id,
      metadata: { membershipId: prepared.membership.id },
    });
    return { status: "sent", invitationId: prepared.invitation.id, membershipId: prepared.membership.id };
  } catch {
    await prisma.$transaction(async (tx) => {
      await tx.clientInvitation.update({ where: { id: prepared.invitation.id }, data: { revokedAt: new Date() } });
      await writeAuditLog({
        actorId: input.createdById,
        projectId: input.projectId,
        action: "CLIENT_INVITATION_SEND_FAILED",
        targetType: "ClientInvitation",
        targetId: prepared.invitation.id,
        metadata: { membershipId: prepared.membership.id, errorCode: "INVITATION_DELIVERY_FAILED" },
      }, tx);
    });
    return { status: "failed", invitationId: prepared.invitation.id, membershipId: prepared.membership.id, errorCode: "INVITATION_DELIVERY_FAILED" };
  }
}

export async function retryClientInvitation(input: { projectId: string; userId: string; createdById: string }) {
  const membership = await prisma.projectMembership.findUnique({
    where: { projectId_userId: { projectId: input.projectId, userId: input.userId } },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!membership || membership.status !== "INVITED") throw new Error("Only pending invitations can be retried");
  return deliverClientInvitation({
    projectId: input.projectId,
    name: membership.user.name,
    email: membership.user.email,
    permissions: membership.permissions,
    createdById: input.createdById,
    retry: true,
  });
}

export async function consumeClientInvitation(token: string, now = new Date()) {
  const tokenHash = hashInviteToken(token);
  return prisma.$transaction(async (tx) => {
    const invitation = await tx.clientInvitation.findUnique({
      where: { tokenHash },
      include: { project: { select: { organizationId: true } } },
    });
    if (!invitation || !invitationCanBeConsumed(invitation, now)) return null;
    const user = await tx.user.findUnique({ where: { email: invitation.email } });
    if (!user || user.kind !== "CLIENT" || user.disabledAt) return null;
    if (!clientCanJoinOrganization(user.organizationId, invitation.project.organizationId)) return null;
    const membership = await tx.projectMembership.findUnique({
      where: { projectId_userId: { projectId: invitation.projectId, userId: user.id } },
    });
    if (!membership || membership.status === "REVOKED") return null;
    const accepted = await tx.clientInvitation.updateMany({
      where: { id: invitation.id, acceptedAt: null, revokedAt: null, expiresAt: { gt: now } },
      data: { acceptedAt: now },
    });
    if (accepted.count !== 1) return null;
    const assigned = await tx.user.updateMany({
      where: {
        id: user.id,
        OR: [{ organizationId: null }, { organizationId: invitation.project.organizationId }],
      },
      data: { organizationId: invitation.project.organizationId },
    });
    if (assigned.count !== 1) return null;
    await tx.projectMembership.update({
      where: { id: membership.id },
      data: { status: "ACTIVE", activatedAt: now },
    });
    return { email: user.email, projectId: invitation.projectId };
  });
}
