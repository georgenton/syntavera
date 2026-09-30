export type InternalRoleValue = "ADMIN" | "PROJECT_MANAGER";
export type UserKindValue = "INTERNAL" | "CLIENT";
export type PermissionValue = "VIEW" | "COMMENT" | "APPROVE" | "FINANCE";

export function internalCanAccessProject(input: {
  role: InternalRoleValue | null;
  userId: string;
  projectManagerId: string | null;
}) {
  return input.role === "ADMIN" || (input.role === "PROJECT_MANAGER" && input.userId === input.projectManagerId);
}

export function membershipGrants(input: {
  status: "INVITED" | "ACTIVE" | "REVOKED";
  permissions: PermissionValue[];
}, permission: PermissionValue) {
  return input.status === "ACTIVE" && input.permissions.includes(permission);
}

export function clientProjectAccessGrants(input: {
  requestedProjectId: string;
  projectOrganizationId: string;
  userOrganizationId: string | null;
  membershipProjectId: string;
  membership: { status: "INVITED" | "ACTIVE" | "REVOKED"; permissions: PermissionValue[] };
}, permission: PermissionValue) {
  return input.userOrganizationId === input.projectOrganizationId
    && input.membershipProjectId === input.requestedProjectId
    && membershipGrants(input.membership, permission);
}
