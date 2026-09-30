import type { Metadata } from "next";
import { ContactForm } from "@/components/site/contact-form";
import { PageIntro } from "@/components/ui/page-intro";

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
  return (
    <>
      <PageIntro eyebrow="Contacto" title="Cuéntanos el problema, no el requerimiento." lede="Con el contexto del trabajo podemos preparar una conversación útil en lugar de una llamada de presentación." />
      <section className="section">
        <div className="sv-container two-column">
          <ContactForm />
          <aside className="contact-aside"><div><p className="sv-eyebrow">Qué pasa después</p><h2>Tres pasos, sin presentación comercial.</h2></div><ol>{steps.map(([title, body]) => <li key={title}><h3>{title}</h3><p>{body}</p></li>)}</ol></aside>
        </div>
      </section>
    </>
  );
}
