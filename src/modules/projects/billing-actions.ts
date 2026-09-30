"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/modules/audit/service";
import { requireInternalProjectAccess } from "@/modules/auth/guards";
import { invoiceInputSchema } from "./billing-policy";

export async function createInvoiceAction(projectId: string, formData: FormData) {
  const { user } = await requireInternalProjectAccess(projectId);
  const parsed = invoiceInputSchema.parse(Object.fromEntries(formData));
  await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.create({ data: { projectId, ...parsed, externalId: parsed.externalId || null, externalUrl: parsed.externalUrl || null, issuedAt: parsed.documentState === "ISSUED" ? new Date() : null } });
    await writeAuditLog({ actorId: user.id, projectId, action: "INVOICE_CREATED", targetType: "Invoice", targetId: invoice.id, metadata: { number: invoice.number, documentState: invoice.documentState, paymentState: invoice.paymentState } }, tx);
  });
  revalidatePath(`/admin/projects/${projectId}`);
}
