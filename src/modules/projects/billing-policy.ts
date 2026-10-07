import { z } from "zod";

export function isSafeExternalHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

const externalHttpUrl = z.string().trim().refine(isSafeExternalHttpUrl, "Use an HTTP or HTTPS URL");

export const invoiceInputSchema = z.object({
  number: z.string().trim().min(1).max(80),
  externalId: z.string().trim().max(160).optional(),
  externalUrl: externalHttpUrl.or(z.literal("")),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  totalMinor: z.coerce.number().int().nonnegative(),
  documentState: z.enum(["DRAFT", "ISSUED", "VOID"]),
  paymentState: z.enum(["UNPAID", "PARTIALLY_PAID", "PAID", "OVERDUE", "REFUNDED"]),
});
