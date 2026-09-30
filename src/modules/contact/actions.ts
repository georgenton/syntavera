"use server";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { after } from "next/server";
import { getServerEnv } from "@/lib/env";
import { prisma } from "@/lib/db";
import { isPrivacyPolicyReady } from "@/content/legal/privacy";
import { notifyContactSubmission } from "@/modules/email/service";
import { consumeContactRateLimit } from "./rate-limit";
import { contactSchema } from "./schema";

export type ContactFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  name?: string;
  errors?: Record<string, string[]>;
};

function clientIp(requestHeaders: Headers) {
  return requestHeaders.get("cf-connecting-ip")
    ?? requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown";
}

function protectedHash(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export async function submitContact(_: ContactFormState, formData: FormData): Promise<ContactFormState> {
  const env = getServerEnv();
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Revisa los campos indicados.", errors: parsed.error.flatten().fieldErrors };

  const success: ContactFormState = {
    status: "success",
    name: parsed.data.name,
    message: `Gracias, ${parsed.data.name}. Recibimos tu contexto. Lo revisaremos antes de responder.`,
  };
  if (parsed.data.website) return success;

  if (!env.PUBLIC_CONTACT_ENABLED || !isPrivacyPolicyReady(env.PRIVACY_POLICY_VERSION)) {
    return { status: "error", message: "El formulario estará disponible cuando el aviso de privacidad aprobado quede publicado." };
  }

  const requestHeaders = await headers();
  const ipHash = protectedHash(clientIp(requestHeaders), env.BETTER_AUTH_SECRET);
  const rate = await consumeContactRateLimit({
    ipHash,
    now: new Date(),
    windowSeconds: env.CONTACT_RATE_LIMIT_WINDOW_SECONDS,
    max: env.CONTACT_RATE_LIMIT_MAX,
  });
  if (!rate.allowed) return { status: "error", message: "Recibimos demasiados intentos. Inténtalo de nuevo más tarde." };

  await prisma.contactSubmission.create({
    data: {
      name: parsed.data.name,
      organization: parsed.data.organization,
      email: parsed.data.email,
      role: parsed.data.role,
      context: `${parsed.data.process}\n\nSituación actual:\n${parsed.data.currentState}`,
      area: parsed.data.area || null,
      privacyVersion: env.PRIVACY_POLICY_VERSION!,
      privacyAcceptedAt: new Date(),
      ipHash,
      userAgent: requestHeaders.get("user-agent")?.slice(0, 500) ?? null,
    },
  });

  after(async () => {
    await notifyContactSubmission({
      name: parsed.data.name,
      email: parsed.data.email,
      organization: parsed.data.organization,
    }).catch(() => undefined);
  });

  return success;
}
