export function invitationCanBeConsumed(invitation: { acceptedAt: Date | null; revokedAt: Date | null; expiresAt: Date }, now: Date) {
  return !invitation.acceptedAt && !invitation.revokedAt && invitation.expiresAt > now;
}

export function clientCanJoinOrganization(currentOrganizationId: string | null, invitedOrganizationId: string) {
  return currentOrganizationId === null || currentOrganizationId === invitedOrganizationId;
}
