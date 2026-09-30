"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/modules/audit/service";
import { requireAdmin } from "@/modules/auth/guards";

const slugSchema = z.string().trim().min(2).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const organizationSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: slugSchema,
});
const contactSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.email().transform((value) => value.trim().toLowerCase()),
  role: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(50).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export async function createOrganizationAction(formData: FormData) {
  const { user } = await requireAdmin();
  const input = organizationSchema.parse(Object.fromEntries(formData));
  const organization = await prisma.$transaction(async (tx) => {
    const created = await tx.organization.create({ data: input });
    await writeAuditLog({ actorId: user.id, action: "ORGANIZATION_CREATED", targetType: "Organization", targetId: created.id, metadata: { slug: created.slug } }, tx);
    return created;
  });
  redirect(`/admin/organizations/${organization.id}`);
}

export async function updateOrganizationAction(organizationId: string, formData: FormData) {
  const { user } = await requireAdmin();
  const input = organizationSchema.parse(Object.fromEntries(formData));
  await prisma.$transaction(async (tx) => {
    await tx.organization.update({ where: { id: organizationId }, data: input });
    await writeAuditLog({ actorId: user.id, action: "ORGANIZATION_UPDATED", targetType: "Organization", targetId: organizationId, metadata: { slug: input.slug } }, tx);
  });
  revalidatePath("/admin/organizations");
  revalidatePath(`/admin/organizations/${organizationId}`);
}

export async function createOrganizationContactAction(organizationId: string, formData: FormData) {
  const { user } = await requireAdmin();
  const input = contactSchema.parse(Object.fromEntries(formData));
  await prisma.$transaction(async (tx) => {
    const contact = await tx.contact.create({
      data: { organizationId, ...input, role: input.role || null, phone: input.phone || null, notes: input.notes || null },
    });
    await writeAuditLog({ actorId: user.id, action: "ORGANIZATION_CONTACT_CREATED", targetType: "Contact", targetId: contact.id, metadata: { organizationId } }, tx);
  });
  revalidatePath(`/admin/organizations/${organizationId}`);
}

export async function updateOrganizationContactAction(organizationId: string, contactId: string, formData: FormData) {
  const { user } = await requireAdmin();
  const input = contactSchema.parse(Object.fromEntries(formData));
  const contact = await prisma.contact.findFirst({ where: { id: contactId, organizationId }, select: { id: true } });
  if (!contact) throw new Error("Contact not found in organization");
  await prisma.$transaction(async (tx) => {
    await tx.contact.update({
      where: { id: contactId },
      data: { ...input, role: input.role || null, phone: input.phone || null, notes: input.notes || null },
    });
    await writeAuditLog({ actorId: user.id, action: "ORGANIZATION_CONTACT_UPDATED", targetType: "Contact", targetId: contactId, metadata: { organizationId } }, tx);
  });
  revalidatePath(`/admin/organizations/${organizationId}`);
}
