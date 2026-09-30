import type { Metadata } from "next";
import { CapabilityCard } from "@/components/site/capability-card";
import { CtaBand } from "@/components/site/cta-band";
import { ProcessStepper } from "@/components/site/process-stepper";
import { PageIntro } from "@/components/ui/page-intro";
import { SectionHeader } from "@/components/ui/section-header";
import { websiteContent } from "@/content/site";

export const metadata: Metadata = {
  title: "Cómo trabajamos",
  description: "Seis decisiones que producen evidencia antes de escalar una iniciativa de IA.",
  alternates: { canonical: "/how-we-work" },
};

export default function HowWeWorkPage() {
  return (
    <>
      <PageIntro eyebrow="Cómo trabajamos" title="Empezamos por el problema y construimos evidencia antes de escalar." lede="Seis decisiones. Cada una produce algo revisable y un punto donde detenerse, corregir o continuar." />
      <section className="section">
        <div className="sv-container"><ProcessStepper showDetail /></div>
      </section>
      <section className="section section--sunken" id="capabilities">
        <span id="capacidades" aria-hidden="true" />
        <div className="sv-container">
          <SectionHeader index="02" eyebrow="Capacidades" title="Qué se combina en cada etapa." />
          <div className="capability-grid" style={{ marginTop: "var(--space-11)" }}>
            {websiteContent.capabilities.map((item) => <CapabilityCard key={item.index} capability={item} />)}
          </div>
        </div>
      </section>
      <section className="section section--dark sv-dark">
        <div className="sv-container">
          <SectionHeader index="03" eyebrow="Confianza" title="Lo que declaramos antes de construir." onDark />
          <div className="trust-grid" style={{ marginTop: "var(--space-11)" }}>
            {websiteContent.trust.map((item) => <article className="trust-item" key={item.index}><span>{item.index}</span><h3>{item.title}</h3><p>{item.description}</p></article>)}
          </div>
        </div>
      </section>
      <CtaBand title="¿Tienes un proceso que podría pensar mejor con IA?" body="Empezamos por el problema. Si no es un caso para IA, lo decimos." secondary={false} />
    </>
  );
}
