import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { clientCanJoinOrganization, invitationCanBeConsumed } from "./invitation-policy";

const INVITE_TTL_MS = 72 * 60 * 60 * 1000;

export function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createClientInvitation(input: { projectId: string; email: string; createdById: string }) {
  const token = randomBytes(32).toString("base64url");
  const email = input.email.trim().toLowerCase();
  const invitation = await prisma.clientInvitation.create({
    data: {
      projectId: input.projectId,
      email,
      createdById: input.createdById,
      tokenHash: hashInviteToken(token),
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    },
  });
  return { invitation, token };
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
