import type { Metadata } from "next";
import { CtaBand } from "@/components/site/cta-band";
import { PageIntro } from "@/components/ui/page-intro";
import { SectionHeader } from "@/components/ui/section-header";

export const metadata: Metadata = {
  title: "Nosotros",
  description: "Una firma de ingeniería de inteligencia artificial aplicada.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageIntro eyebrow="Nosotros" title="Una firma de ingeniería de inteligencia artificial aplicada." lede="Convertimos problemas reales, datos y conocimiento experto en prototipos, pilotos y sistemas inteligentes que pueden verse, probarse, evaluarse y llevarse a operación." />
      <section className="section">
        <div className="sv-container two-column">
          <SectionHeader index="01" eyebrow="Trabajo con expertos" title="No pretendemos ser expertos en todos los sectores. Sabemos construir con quienes sí lo son." />
          <div className="editorial-body">
            <p>El conocimiento de una persona experta es el activo más difícil de reemplazar. Nuestro trabajo es convertir parte de ese criterio en un sistema utilizable sin que el experto pierda control, propiedad ni juicio.</p>
            <p className="notice">Los perfiles se publican únicamente cuando existe una persona real y su autorización. En V1 no mostramos un perfil placeholder.</p>
          </div>
        </div>
      </section>
      <section className="section section--sunken">
        <div className="sv-container two-column">
          <SectionHeader index="02" eyebrow="Capacidad end-to-end del fundador" title="Un venture independiente como prueba de recorrido completo." />
          <article className="person-proof">
            <p className="sv-eyebrow">Venture independiente</p>
            <h3>FeelVerse</h3>
            <p>FeelVerse demuestra capacidad de llevar una idea compleja desde contenido y producto hasta arquitectura, software, IA, privacidad y experiencia. Es un venture independiente de Jorge Quizamanchuro y no pertenece a SyntaVera.</p>
            <p className="sv-eyebrow">Independent venture by Jorge Quizamanchuro</p>
          </article>
        </div>
      </section>
      <CtaBand title="¿Tienes un proceso que podría pensar mejor con IA?" body="Muéstranos dónde se pierde tiempo, contexto o criterio." secondary={false} />
    </>
  );
}
