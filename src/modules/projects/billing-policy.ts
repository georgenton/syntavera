import { z } from "zod";

export const invoiceInputSchema = z.object({
  number: z.string().trim().min(1).max(80),
  externalId: z.string().trim().max(160).optional(),
  externalUrl: z.url().or(z.literal("")),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  totalMinor: z.coerce.number().int().nonnegative(),
  documentState: z.enum(["DRAFT", "ISSUED", "VOID"]),
  paymentState: z.enum(["UNPAID", "PARTIALLY_PAID", "PAID", "OVERDUE", "REFUNDED"]),
});
