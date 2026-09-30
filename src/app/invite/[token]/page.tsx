import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/portal/auth-shell";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { auth } from "@/modules/auth/auth";
import { consumeClientInvitation, hashInviteToken } from "@/modules/auth/invitations";

export const metadata: Metadata = { title: "Invitación", robots: { index: false, follow: false } };

function maskEmail(email: string) {
  const [local = "", domain = ""] = email.split("@");
  return `${local.slice(0, 2)}•••@${domain}`;
}

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await prisma.clientInvitation.findUnique({
    where: { tokenHash: hashInviteToken(token) },
    select: { email: true, expiresAt: true, acceptedAt: true, revokedAt: true },
  });
  const active = Boolean(invitation && !invitation.acceptedAt && !invitation.revokedAt && invitation.expiresAt > new Date());

  async function acceptInvitation() {
    "use server";
    const accepted = await consumeClientInvitation(token);
    if (!accepted) redirect("/login?error=invite-expired");
    await auth.api.signInMagicLink({
      body: { email: accepted.email, callbackURL: "/portal", errorCallbackURL: "/login?error=invalid-link" },
      headers: await headers(),
    });
    redirect("/login?sent=1");
  }

  return (
    <AuthShell eyebrow="Invitación" title={active ? "Activa tu acceso privado." : "Este enlace ya no está disponible."} body={active && invitation ? `La invitación corresponde a ${maskEmail(invitation.email)}. Al aceptarla enviaremos un enlace de acceso de un solo uso.` : "El enlace pudo expirar, haberse utilizado o haber sido revocado. Solicita una invitación nueva al equipo del proyecto."}>
      {active ? <form action={acceptInvitation}><Button type="submit" size="lg">Aceptar invitación y enviar acceso</Button></form> : <div className="notice notice--warning"><p>Por seguridad, una invitación no puede reutilizarse.</p></div>}
    </AuthShell>
  );
}
