import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import { ContactForm } from "@/components/site/contact-form";
import { ButtonLink } from "@/components/ui/button";
import { PageIntro } from "@/components/ui/page-intro";
import { CONTACT_UNAVAILABLE_MESSAGE } from "@/modules/contact/status";
import { getContactChannelStatus } from "@/modules/contact/status.server";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Comparte el proceso o la decisión que quieres mejorar.",
  alternates: { canonical: "/contact" },
};

const steps = [
  ["Leemos el contexto", "Revisamos qué decisión quieres mejorar y qué ocurre hoy."],
  ["Preguntamos lo justo", "Una conversación corta para entender el trabajo y los datos disponibles."],
  ["Decidimos si hay caso", "Si conviene una prueba pequeña, la proponemos. Si no es un caso para IA, lo decimos."],
] as const;

export default function ContactPage() {
  const channel = getContactChannelStatus();
  return (
    <>
      <PageIntro eyebrow="Contacto" title="Cuéntanos el problema, no el requerimiento." lede="Con el contexto del trabajo podemos preparar una conversación útil en lugar de una llamada de presentación." />
      <section className="section">
        <div className="sv-container two-column">
          {channel.available ? (
            <ContactForm submissionKey={randomUUID()} />
          ) : (
            <div className="contact-unavailable" role="status">
              <p className="sv-eyebrow">Canal en preparación</p>
              <h2>{CONTACT_UNAVAILABLE_MESSAGE}</h2>
              <p>No pediremos datos hasta que el aviso de privacidad, la recepción y la notificación estén listos.</p>
              <div><ButtonLink href="/how-we-work">Conoce cómo trabajamos <span aria-hidden="true">→</span></ButtonLink></div>
            </div>
          )}
          <aside className="contact-aside"><div><p className="sv-eyebrow">{channel.available ? "Qué pasa después" : "Cuando el canal esté disponible"}</p><h2>{channel.available ? "Tres pasos, sin presentación comercial." : "La conversación seguirá tres pasos claros."}</h2></div><ol>{steps.map(([title, body]) => <li key={title}><h3>{title}</h3><p>{body}</p></li>)}</ol></aside>
        </div>
      </section>
    </>
  );
}
