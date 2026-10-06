"use server";

import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { after } from "next/server";
import { getServerEnv } from "@/lib/env";
import { prisma } from "@/lib/db";
import { processContactNotification } from "./notification.server";
import { persistContactSubmission } from "./persistence-core";
import { consumeContactRateLimit } from "./rate-limit";
import { contactSchema } from "./schema";
import { CONTACT_UNAVAILABLE_MESSAGE } from "./status";
import { getContactChannelStatus } from "./status.server";

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
  const channel = getContactChannelStatus();
  if (!channel.available) return { status: "error", message: CONTACT_UNAVAILABLE_MESSAGE };

  if (formData.get("website")) {
    return { status: "success", message: "Gracias. Recibimos tu contexto. Lo revisaremos antes de responder." };
  }

  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: "Revisa los campos indicados.", errors: parsed.error.flatten().fieldErrors };

  const success: ContactFormState = {
    status: "success",
    name: parsed.data.name,
    message: `Gracias, ${parsed.data.name}. Recibimos tu contexto. Lo revisaremos antes de responder.`,
  };
  const requestHeaders = await headers();
  const ipHash = protectedHash(clientIp(requestHeaders), env.BETTER_AUTH_SECRET);
  const rate = await consumeContactRateLimit({
    ipHash,
    now: new Date(),
    windowSeconds: env.CONTACT_RATE_LIMIT_WINDOW_SECONDS,
    max: env.CONTACT_RATE_LIMIT_MAX,
  });
  if (!rate.allowed) return { status: "error", message: "Recibimos demasiados intentos. Inténtalo de nuevo más tarde." };

  let persisted;
  try {
    persisted = await persistContactSubmission(
      () => prisma.contactSubmission.create({
        data: {
          requestKey: parsed.data.submissionKey,
          name: parsed.data.name,
          organization: parsed.data.organization ?? null,
          email: parsed.data.email,
          role: parsed.data.role ?? null,
          context: parsed.data.description,
          area: parsed.data.area || null,
          privacyVersion: env.PRIVACY_POLICY_VERSION!,
          privacyAcceptedAt: new Date(),
          notificationStatus: channel.notificationConfigured ? "PENDING" : "NOT_REQUIRED",
          ipHash,
          userAgent: requestHeaders.get("user-agent")?.slice(0, 500) ?? null,
        },
        select: { id: true },
      }),
      () => prisma.contactSubmission.findUnique({ where: { requestKey: parsed.data.submissionKey }, select: { id: true } }),
    );
  } catch {
    return { status: "error", message: "No pudimos guardar tu solicitud. No se envió nada. Inténtalo de nuevo." };
  }

  if (persisted.outcome === "created" && channel.notificationConfigured) {
    after(() => processContactNotification(persisted.id));
  }

  return success;
}
