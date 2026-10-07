import "server-only";
import { appendFile } from "node:fs/promises";
import nodemailer from "nodemailer";
import { getServerEnv, type ServerEnv } from "@/lib/env";

type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

export interface Mailer {
  send(message: MailMessage): Promise<void>;
}

const MICROSOFT_SMTP_SCOPE = "https://outlook.office365.com/.default";
const TOKEN_EXPIRY_SAFETY_MS = 60_000;

type CachedOAuthToken = {
  accessToken: string;
  expiresAt: number;
  identity: string;
};

let cachedOAuthToken: CachedOAuthToken | undefined;
let pendingOAuthToken: Promise<CachedOAuthToken> | undefined;

function oauthConfigured(env: ServerEnv) {
  return Boolean(env.SMTP_OAUTH_TENANT_ID && env.SMTP_OAUTH_CLIENT_ID && env.SMTP_OAUTH_CLIENT_SECRET);
}

function safeMailError(code: string) {
  return Object.assign(new Error(code), { code });
}

async function requestOAuthToken(env: ServerEnv): Promise<CachedOAuthToken> {
  const tenantId = env.SMTP_OAUTH_TENANT_ID!;
  const clientId = env.SMTP_OAUTH_CLIENT_ID!;
  const clientSecret = env.SMTP_OAUTH_CLIENT_SECRET!;
  const identity = `${tenantId}:${clientId}`;
  let response: Response;

  try {
    response = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
        scope: MICROSOFT_SMTP_SCOPE,
      }),
      cache: "no-store",
    });
  } catch {
    throw safeMailError("SMTP_OAUTH_TOKEN_REQUEST_FAILED");
  }

  if (!response.ok) throw safeMailError("SMTP_OAUTH_TOKEN_REJECTED");

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw safeMailError("SMTP_OAUTH_TOKEN_INVALID_RESPONSE");
  }

  const accessToken = typeof payload === "object" && payload !== null && "access_token" in payload
    ? (payload as { access_token?: unknown }).access_token
    : undefined;
  const expiresIn = typeof payload === "object" && payload !== null && "expires_in" in payload
    ? (payload as { expires_in?: unknown }).expires_in
    : undefined;
  if (typeof accessToken !== "string" || accessToken.length === 0 || typeof expiresIn !== "number" || !Number.isFinite(expiresIn)) {
    throw safeMailError("SMTP_OAUTH_TOKEN_INVALID_RESPONSE");
  }

  return {
    accessToken,
    expiresAt: Date.now() + Math.max(0, expiresIn * 1000 - TOKEN_EXPIRY_SAFETY_MS),
    identity,
  };
}

async function getOAuthToken(env: ServerEnv) {
  const identity = `${env.SMTP_OAUTH_TENANT_ID}:${env.SMTP_OAUTH_CLIENT_ID}`;
  if (cachedOAuthToken?.identity === identity && cachedOAuthToken.expiresAt > Date.now()) return cachedOAuthToken.accessToken;

  if (!pendingOAuthToken) pendingOAuthToken = requestOAuthToken(env);
  try {
    cachedOAuthToken = await pendingOAuthToken;
    return cachedOAuthToken.accessToken;
  } finally {
    pendingOAuthToken = undefined;
  }
}

async function sendSafely(operation: () => Promise<unknown>) {
  try {
    await operation();
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("SMTP_OAUTH_")) throw error;
    throw safeMailError("SMTP_DELIVERY_FAILED");
  }
}

function getMailer(): Mailer {
  const env = getServerEnv();
  if (env.SMTP_HOST) {
    const transportOptions = {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
    };

    if (oauthConfigured(env)) {
      return {
        async send(message) {
          const accessToken = await getOAuthToken(env);
          const transport = nodemailer.createTransport({
            ...transportOptions,
            requireTLS: true,
            auth: { type: "OAuth2", user: env.SMTP_USER!, accessToken },
          });
          await sendSafely(() => transport.sendMail({ from: env.EMAIL_FROM, ...message }));
        },
      };
    }

    const transport = nodemailer.createTransport({
      ...transportOptions,
      ...(env.SMTP_USER && env.SMTP_PASSWORD ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } } : {}),
    });
    return {
      async send(message) {
        await sendSafely(() => transport.sendMail({ from: env.EMAIL_FROM, ...message }));
      },
    };
  }
  if (env.NODE_ENV !== "production" && env.E2E_MAILBOX_PATH) {
    return {
      async send(message) {
        await appendFile(env.E2E_MAILBOX_PATH!, `${JSON.stringify({ ...message, createdAt: new Date().toISOString() })}\n`, { encoding: "utf8", mode: 0o600 });
      },
    };
  }
  if (env.NODE_ENV === "production") throw new Error("SMTP is not configured");
  return {
    async send(message) {
      process.stdout.write(`[development-mail]\nTo: ${message.to}\nSubject: ${message.subject}\n${message.text}\n[/development-mail]\n`);
    },
  };
}

export function resetEmailServiceForTests() {
  cachedOAuthToken = undefined;
  pendingOAuthToken = undefined;
}

export function invitationEmailDeliveryConfigured() {
  const env = getServerEnv();
  return Boolean(env.SMTP_HOST || (env.NODE_ENV !== "production" && env.E2E_MAILBOX_PATH));
}

export async function sendMagicLinkEmail(email: string, url: string) {
  const mailer = getMailer();
  await mailer.send({
    to: email,
    subject: "Acceso seguro a SyntaVera",
    text: `Use este enlace una sola vez para acceder: ${url}\n\nEl enlace expira pronto. Si usted no lo solicitó, puede ignorar este mensaje.`,
    html: `<p>Use este enlace una sola vez para acceder:</p><p><a href="${url}">Acceder a SyntaVera</a></p><p>El enlace expira pronto. Si usted no lo solicitó, puede ignorar este mensaje.</p>`,
  });
}

export async function sendInvitationEmail(input: { email: string; inviteUrl: string; projectName: string }) {
  const mailer = getMailer();
  await mailer.send({
    to: input.email,
    subject: `Invitación al proyecto ${input.projectName}`,
    text: `Ha sido invitado al portal privado de ${input.projectName}. Active el acceso una sola vez: ${input.inviteUrl}`,
    html: `<p>Ha sido invitado al portal privado de <strong>${input.projectName}</strong>.</p><p><a href="${input.inviteUrl}">Activar acceso</a></p><p>La invitación es de un solo uso y expira.</p>`,
  });
}

export async function notifyContactSubmission(input: { name: string; email: string; organization: string | null }) {
  const env = getServerEnv();
  if (!env.CONTACT_NOTIFICATION_TO) throw Object.assign(new Error("Contact notification recipient is not configured"), { code: "RECIPIENT_NOT_CONFIGURED" });
  const mailer = getMailer();
  await mailer.send({
    to: env.CONTACT_NOTIFICATION_TO,
    replyTo: input.email,
    subject: input.organization ? `Nuevo contexto recibido · ${input.organization}` : "Nuevo contexto recibido",
    text: `Nuevo contexto guardado. Revíselo en el backoffice. Contacto: ${input.name} <${input.email}>.`,
  });
}
