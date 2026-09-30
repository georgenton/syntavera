import { ArchitectureDiagram } from "@/components/site/architecture-diagram";
import { CapabilityCard } from "@/components/site/capability-card";
import { CtaBand } from "@/components/site/cta-band";
import { LabCard } from "@/components/site/lab-card";
import { ProcessList } from "@/components/site/process-list";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { publishableHomeLabs, websiteContent } from "@/content/site";

export default function HomePage() {
  return (
    <>
      <section className="hero sv-grid-bg">
        <div className="hero__pattern" aria-hidden="true" />
        <div className="sv-container hero__inner">
          <p className="sv-eyebrow">{websiteContent.hero.eyebrow}</p>
          <h1>{websiteContent.hero.title}</h1>
          <p className="sv-lede">{websiteContent.hero.subtitle}</p>
          <div className="hero__actions">
            <ButtonLink href="/contact" size="lg">Explorar una oportunidad <span aria-hidden="true">→</span></ButtonLink>
            <ButtonLink href="/labs" variant="secondary" size="lg">Ver SyntaVera Labs</ButtonLink>
          </div>
          <ul className="hero__proof" aria-label="Capacidades">
            {websiteContent.hero.microproof.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </section>

      <section className="section section--sunken">
        <div className="sv-container two-column">
          <SectionHeader index="01" eyebrow="El problema" title={websiteContent.problem.title} />
          <div className="editorial-body">
            <p>{websiteContent.problem.body}</p>
            <div><ButtonLink href="/how-we-work" variant="quiet">Empezar por el problema <span aria-hidden="true">→</span></ButtonLink></div>
          </div>
        </div>
      </section>

      <section className="section section--dark sv-dark">
        <div className="sv-container">
          <SectionHeader index="02" eyebrow="El sistema" title="Señales, conocimiento, decisión y verificación." lede="Así se ve un sistema aplicado cuando se diseña para el trabajo real: cada etapa deja rastro y la decisión sigue siendo humana." onDark />
          <ArchitectureDiagram />
        </div>
      </section>

      <section className="section">
        <div className="sv-container">
          <div className="section-heading-row">
            <SectionHeader index="03" eyebrow="SyntaVera Labs" title="No te pedimos que imagines lo que podemos construir. Mira cómo pensamos." />
            <ButtonLink href="/labs" variant="secondary">Ver todos los demos <span aria-hidden="true">→</span></ButtonLink>
          </div>
          <div className="lab-grid">
            {publishableHomeLabs.map((lab) => <LabCard key={lab.slug} lab={lab} />)}
          </div>
          <p className="sv-eyebrow" style={{ marginTop: "var(--space-7)" }}>Los demos son pruebas de capacidad. Ninguno se presenta como producto empaquetado ni como despliegue con clientes.</p>
        </div>
      </section>

      <section className="section section--sunken">
        <div className="sv-container">
          <SectionHeader index="04" eyebrow="Cómo trabajamos" title="Una secuencia de decisiones, no paquetes." lede="Cada etapa produce algo revisable y un punto de decisión explícito antes de invertir más." />
          <div style={{ marginTop: "var(--space-11)" }}><ProcessList /></div>
        </div>
      </section>

      <section className="section" id="capabilities">
        <span id="capacidades" aria-hidden="true" />
        <div className="sv-container">
          <SectionHeader index="05" eyebrow="Capacidades" title="Capacidades combinables." lede="Se combinan según el problema. No son un menú de servicios." />
          <div className="capability-grid" style={{ marginTop: "var(--space-11)" }}>
            {websiteContent.capabilities.map((capability) => <CapabilityCard key={capability.index} capability={capability} />)}
          </div>
        </div>
      </section>

      <section className="section section--sunken">
        <div className="sv-container two-column">
          <SectionHeader index="06" eyebrow="Recorrido independiente" title="Capacidad end-to-end, sin convertirla en un claim de cliente." />
          <article className="person-proof">
            <p className="sv-eyebrow">Independent venture by Jorge Quizamanchuro</p>
            <h3>FeelVerse</h3>
            <p>FeelVerse demuestra capacidad de llevar una idea compleja desde contenido y producto hasta arquitectura, software, IA, privacidad y experiencia. Es un venture independiente y no pertenece a SyntaVera.</p>
            <ul className="chip-list"><li>Producto</li><li>Software</li><li>IA</li><li>Privacidad</li></ul>
          </article>
        </div>
      </section>

      <section className="section section--dark sv-dark">
        <div className="sv-container">
          <SectionHeader index="07" eyebrow="Confianza" title="Lo que declaramos antes de construir." onDark />
          <div className="trust-grid" style={{ marginTop: "var(--space-11)" }}>
            {websiteContent.trust.map((principle) => (
              <article className="trust-item" key={principle.index}>
                <span>{principle.index}</span><h3>{principle.title}</h3><p>{principle.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CtaBand title={websiteContent.finalCta.title} body={websiteContent.finalCta.body} />
    </>
  );
}
