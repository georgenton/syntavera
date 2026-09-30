"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/modules/auth/client";

export function ClientLoginForm() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string>();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(undefined);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const result = await authClient.signIn.magicLink({
      email,
      callbackURL: "/portal",
      errorCallbackURL: "/login?error=invalid-link",
    });
    setPending(false);
    setMessage(result.error ? "No pudimos enviar el enlace. Verifica tu acceso o inténtalo más tarde." : "Si tu acceso está activo, recibirás un enlace de un solo uso.");
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      <div><p className="sv-eyebrow">Portal cliente</p><h2>Accede con un enlace seguro.</h2></div>
      {message ? <div className="notice" role="status">{message}</div> : null}
      <div className="field"><label htmlFor="client-email">Email invitado</label><input id="client-email" name="email" type="email" autoComplete="email" required /></div>
      <Button type="submit" size="lg" disabled={pending}>{pending ? "Enviando…" : "Enviar enlace de acceso"}</Button>
      <p className="field-help">No existe registro público. El email debe pertenecer a una invitación y a un proyecto activo.</p>
    </form>
  );
}

export function InternalLoginForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(undefined);
    const form = new FormData(event.currentTarget);
    const result = await authClient.signIn.email({
      email: String(form.get("email") ?? "").trim().toLowerCase(),
      password: String(form.get("password") ?? ""),
      callbackURL: "/admin",
    });
    setPending(false);
    if (result.error) setError("No se pudo iniciar sesión con esas credenciales.");
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      <div><p className="sv-eyebrow">Equipo SyntaVera</p><h2>Control interno.</h2></div>
      {error ? <div className="notice notice--warning" role="alert">{error}</div> : null}
      <div className="field"><label htmlFor="internal-email">Email</label><input id="internal-email" name="email" type="email" autoComplete="username" required /></div>
      <div className="field"><label htmlFor="internal-password">Contraseña</label><input id="internal-password" name="password" type="password" autoComplete="current-password" minLength={12} required /></div>
      <Button type="submit" size="lg" disabled={pending}>{pending ? "Verificando…" : "Iniciar sesión"}</Button>
    </form>
  );
}
