export type ContactPersistenceResult =
  | { outcome: "created"; id: string }
  | { outcome: "duplicate"; id: string | null };

export function isUniqueConstraintError(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002");
}

export async function persistContactSubmission(
  create: () => Promise<{ id: string }>,
  findExisting: () => Promise<{ id: string } | null>,
): Promise<ContactPersistenceResult> {
  try {
    const created = await create();
    return { outcome: "created", id: created.id };
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
    const existing = await findExisting();
    return { outcome: "duplicate", id: existing?.id ?? null };
  }
}
