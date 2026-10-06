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
      <PageIntro eyebrow="Nosotros" title="Una firma de ingeniería de inteligencia artificial aplicada." lede="SyntaVera conecta conocimiento experto, producto y software para construir sistemas que puedan evaluarse antes de escalar." />
      <section className="section">
        <div className="sv-container two-column">
          <SectionHeader index="01" eyebrow="Fundador" title="Jorge Quizamanchuro" />
          <div className="editorial-body">
            <p>Jorge Quizamanchuro fundó SyntaVera y participa directamente en la definición de producto, arquitectura e implementación de sus líneas de trabajo.</p>
            <p>La firma trabaja con especialistas del dominio para convertir procesos, documentos y criterio profesional en software e IA aplicados, manteniendo la revisión humana y los límites del sistema explícitos.</p>
          </div>
        </div>
      </section>
      <section className="section section--sunken">
        <div className="sv-container two-column">
          <SectionHeader index="02" eyebrow="Recorrido independiente" title="Una iniciativa separada de SyntaVera." />
          <article className="person-proof">
            <p className="sv-eyebrow">Venture independiente</p>
            <h3>FeelVerse</h3>
            <p>FeelVerse es un venture independiente de Jorge Quizamanchuro. Se menciona únicamente como parte de su recorrido y no es producto ni cliente de SyntaVera.</p>
            <p className="sv-eyebrow">Venture independiente</p>
          </article>
        </div>
      </section>
      <CtaBand title="¿Tienes un proceso que podría pensar mejor con IA?" body="Muéstranos dónde se pierde tiempo, contexto o criterio." secondary={false} />
    </>
  );
}
