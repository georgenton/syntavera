import type { Metadata } from "next";
import { AuthShell } from "@/components/portal/auth-shell";
import { InternalLoginForm } from "@/components/portal/login-forms";

export const metadata: Metadata = { title: "Acceso interno", robots: { index: false, follow: false } };

export default function AdminLoginPage() {
  return <AuthShell eyebrow="Backoffice" title="Operación antes que espectáculo." body="Gestiona la fuente relacional, revisa cambios y publica snapshots explícitos para cada proyecto."><InternalLoginForm /></AuthShell>;
}
