import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import type { ProjectPermission } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { auth } from "./auth";
import { clientProjectAccessGrants, internalCanAccessProject, membershipGrants } from "./policy";

export class AuthorizationError extends Error {
  constructor(public readonly status: 401 | 403 | 404, message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export const requireSession = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new AuthorizationError(401, "Authentication required");
  return session;
});

export const requireCurrentUser = cache(async () => {
  const session = await requireSession();
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.disabledAt) throw new AuthorizationError(401, "Session is not active");
  return { session, user };
});

export async function requireInternalUser() {
  const context = await requireCurrentUser();
  if (context.user.kind !== "INTERNAL" || !context.user.internalRole) {
    throw new AuthorizationError(403, "Internal access required");
  }
  return context;
}

export async function requireAdmin() {
  const context = await requireInternalUser();
  if (context.user.internalRole !== "ADMIN") throw new AuthorizationError(403, "Administrator access required");
  return context;
}

export const requireProjectAccess = cache(async (projectId: string) => {
  const context = await requireCurrentUser();
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      slug: true,
      organizationId: true,
      internal: { select: { projectManagerId: true } },
      memberships: {
        where: { userId: context.user.id },
        select: { projectId: true, status: true, permissions: true },
        take: 1,
      },
    },
  });
  if (!project) throw new AuthorizationError(404, "Project not found");

  if (context.user.kind === "INTERNAL") {
    const allowed = internalCanAccessProject({
      role: context.user.internalRole,
      userId: context.user.id,
      projectManagerId: project.internal?.projectManagerId ?? null,
    });
    if (!allowed) throw new AuthorizationError(403, "Project access denied");
    return { ...context, project, membership: null };
  }

  const membership = project.memberships[0];
  if (!membership || !clientProjectAccessGrants({
    requestedProjectId: projectId,
    projectOrganizationId: project.organizationId,
    userOrganizationId: context.user.organizationId,
    membershipProjectId: membership.projectId,
    membership,
  }, "VIEW")) {
    throw new AuthorizationError(403, "Project access denied");
  }
  return { ...context, project, membership };
});

export async function requirePermission(projectId: string, permission: ProjectPermission) {
  const context = await requireProjectAccess(projectId);
  if (context.user.kind === "INTERNAL") return context;
  if (!context.membership || !membershipGrants(context.membership, permission)) {
    throw new AuthorizationError(403, `Permission ${permission} required`);
  }
  return context;
}

export async function requireInternalProjectAccess(projectId: string) {
  const context = await requireProjectAccess(projectId);
  if (context.user.kind !== "INTERNAL" || !context.user.internalRole) {
    throw new AuthorizationError(403, "Internal project access required");
  }
  return context;
}
