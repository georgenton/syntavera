import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre.").max(120),
  organization: z.string().trim().min(2, "Escribe la organización.").max(160),
  email: z.email("Escribe un email válido.").transform((value) => value.trim().toLowerCase()),
  role: z.string().trim().min(2, "Escribe tu rol.").max(120),
  process: z.string().trim().min(20, "Cuéntanos un poco más sobre el proceso o decisión.").max(3000),
  currentState: z.string().trim().min(20, "Cuéntanos qué ocurre hoy.").max(3000),
  area: z.enum(["", "Ventas", "Operaciones", "Riesgo", "Ambiente", "Conocimiento", "Otro"]),
  privacyAcknowledged: z.literal("on", { error: "Confirma que leíste el aviso de privacidad." }),
  website: z.string().max(0).optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;
