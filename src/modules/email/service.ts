import "server-only";
import nodemailer from "nodemailer";
import { getServerEnv } from "@/lib/env";

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

function getMailer(): Mailer {
  const env = getServerEnv();
  if (env.SMTP_HOST) {
    const transport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      ...(env.SMTP_USER && env.SMTP_PASSWORD
        ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } }
        : {}),
    });
    return {
      async send(message) {
        await transport.sendMail({ from: env.EMAIL_FROM, ...message });
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

export async function notifyContactSubmission(input: { name: string; email: string; organization: string }) {
  const env = getServerEnv();
  if (!env.CONTACT_NOTIFICATION_TO) return;
  const mailer = getMailer();
  await mailer.send({
    to: env.CONTACT_NOTIFICATION_TO,
    replyTo: input.email,
    subject: `Nuevo contexto recibido · ${input.organization}`,
    text: `Nuevo contexto guardado. Revíselo en el backoffice. Contacto: ${input.name} <${input.email}>.`,
  });
}
