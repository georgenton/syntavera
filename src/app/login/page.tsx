import type { Metadata } from "next";
import { AuthShell } from "@/components/portal/auth-shell";
import { ClientLoginForm } from "@/components/portal/login-forms";

export const metadata: Metadata = { title: "Acceso cliente", robots: { index: false, follow: false } };

export default function LoginPage() {
  return <AuthShell eyebrow="Portal cliente" title="Tu proyecto, con contexto y trazabilidad." body="Revisa el plan publicado, entregables, decisiones, facturación y soporte sin mezclar información interna."><ClientLoginForm /></AuthShell>;
}
