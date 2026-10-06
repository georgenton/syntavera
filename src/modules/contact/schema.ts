import { z } from "zod";

export const contactSchema = z.object({
  submissionKey: z.uuid("No pudimos preparar el envío. Recarga la página e inténtalo de nuevo."),
  name: z.string().trim().min(2, "Escribe tu nombre.").max(120),
  organization: z.string().trim().max(160).optional().transform((value) => value || undefined),
  email: z.email("Escribe un email válido.").transform((value) => value.trim().toLowerCase()),
  role: z.string().trim().max(120).optional().transform((value) => value || undefined),
  description: z.string().trim().min(20, "Cuéntanos un poco más sobre la situación o decisión.").max(5000),
  area: z.enum(["", "Ventas", "Operaciones", "Riesgo", "Ambiente", "Conocimiento", "Otro"]),
  privacyAcknowledged: z.literal("on", { error: "Confirma que leíste el aviso de privacidad." }),
  website: z.string().max(0).optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;
