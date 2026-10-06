"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { submitContact, type ContactFormState } from "@/modules/contact/actions";

const initialContactState: ContactFormState = { status: "idle" };

function ErrorText({ messages, id }: { messages: string[] | undefined; id: string }) {
  return messages?.[0] ? <span className="field-error" id={id}>{messages[0]}</span> : null;
}

export function ContactForm({ submissionKey }: { submissionKey: string }) {
  const [state, formAction, pending] = useActionState(submitContact, initialContactState);
  if (state.status === "success") {
    return <div className="contact-success" role="status"><p className="sv-eyebrow">Contexto recibido</p><h2>{state.message}</h2><p>La conversación empezará por el trabajo y la decisión que quieres mejorar.</p></div>;
  }

  const errors = state.errors ?? {};
  return (
    <form action={formAction} className="contact-form" noValidate>
      {state.message ? <div className="notice notice--warning" role="alert">{state.message}</div> : null}
      <input name="submissionKey" type="hidden" value={submissionKey} readOnly />
      <div className="honeypot" aria-hidden="true"><label htmlFor="website">Sitio web</label><input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" /></div>
      <div className="form-grid">
        <div className="field"><label htmlFor="name">Nombre *</label><input id="name" name="name" required aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} /><ErrorText id="name-error" messages={errors.name} /></div>
        <div className="field"><label htmlFor="organization">Organización (opcional)</label><input id="organization" name="organization" autoComplete="organization" aria-invalid={Boolean(errors.organization)} aria-describedby={errors.organization ? "organization-error" : undefined} /><ErrorText id="organization-error" messages={errors.organization} /></div>
        <div className="field"><label htmlFor="email">Email *</label><input id="email" name="email" type="email" autoComplete="email" required aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} /><ErrorText id="email-error" messages={errors.email} /></div>
        <div className="field"><label htmlFor="role">Rol (opcional)</label><input id="role" name="role" autoComplete="organization-title" aria-invalid={Boolean(errors.role)} aria-describedby={errors.role ? "role-error" : undefined} /><ErrorText id="role-error" messages={errors.role} /></div>
        <div className="field field--full"><label htmlFor="area">Área (opcional)</label><select id="area" name="area" defaultValue=""><option value="">Selecciona una opción</option>{["Ventas", "Operaciones", "Riesgo", "Ambiente", "Conocimiento", "Otro"].map((area) => <option value={area} key={area}>{area}</option>)}</select></div>
        <div className="field field--full"><label htmlFor="description">Cuéntanos la situación o decisión que quieres mejorar *</label><textarea id="description" name="description" required aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? "description-help description-error" : "description-help"} /><small id="description-help">Qué ocurre hoy, dónde se pierde tiempo o contexto y qué decisión importa.</small><ErrorText id="description-error" messages={errors.description} /></div>
        <div className="field field--full"><label className="checkbox-field"><input name="privacyAcknowledged" type="checkbox" required /> <span>Leí el <Link href="/privacy">aviso de privacidad</Link> y autorizo el uso de estos datos para responder este contacto. *</span></label><ErrorText id="privacy-error" messages={errors.privacyAcknowledged} /></div>
      </div>
      <div className="contact-form__actions"><Button type="submit" size="lg" disabled={pending}>{pending ? "Enviando…" : "Enviar contexto →"}</Button><p>Primero guardamos tu solicitud. La notificación al equipo es un paso separado y nunca cambia la confirmación que ves.</p></div>
    </form>
  );
}
