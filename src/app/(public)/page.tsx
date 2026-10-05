import { ArchitectureDiagram } from "@/components/site/architecture-diagram";
import { BrandPattern } from "@/components/site/brand-pattern";
import { CapabilityCard } from "@/components/site/capability-card";
import { CtaBand } from "@/components/site/cta-band";
import { ProcessStepper } from "@/components/site/process-stepper";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { websiteContent } from "@/content/site";
import { getContactChannelStatus } from "@/modules/contact/status.server";

export default function HomePage() {
  const channel = getContactChannelStatus();
  return (
    <>
      <section className="hero sv-grid-bg">
        <BrandPattern className="hero__pattern" variant="mesh" seed={5} width={1400} height={640} mask="fade-left" opacity={0.12} />
        <div className="sv-container hero__inner">
          <p className="sv-eyebrow">{websiteContent.hero.eyebrow}</p>
          <h1>{websiteContent.hero.title}</h1>
          <p className="sv-lede">{websiteContent.hero.subtitle}</p>
          <div className="hero__actions">
            <ButtonLink href={channel.available ? "/contact" : "/how-we-work"} size="lg">{channel.available ? "Hablemos de tu proceso" : "Conoce cómo trabajamos"} <span aria-hidden="true">→</span></ButtonLink>
            <ButtonLink href="/how-we-work#capabilities" variant="secondary" size="lg">Explorar capacidades</ButtonLink>
          </div>
          <ul className="hero__proof" aria-label="Capacidades">
            {websiteContent.hero.microproof.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <p className="hero__tagline">Inteligencia aplicada para decisiones reales</p>
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
          <SectionHeader index="03" eyebrow="SyntaVera Labs" title="Casos delimitados por la evidencia disponible." lede="Las fichas públicas explican el problema, el rol de la IA, la revisión humana y los límites. No destacamos una demo en la home hasta tener material verificable y accesible." />
          <div className="case-contrast" style={{ marginTop: "var(--space-10)" }}>
            <article><h3>Qué puedes revisar hoy</h3><p>El alcance de cada caso, su estado real, qué intenta resolver y cuál sería el siguiente gate de evaluación.</p></article>
            <article><h3>Qué no afirmamos</h3><p>No publicamos resultados, precisión, despliegues ni evidencia de clientes que no existan o no esté autorizada.</p></article>
          </div>
          <ButtonLink href="/labs" variant="secondary">Revisar las fichas de Labs <span aria-hidden="true">→</span></ButtonLink>
        </div>
      </section>

      <section className="section section--sunken">
        <div className="sv-container">
          <SectionHeader index="04" eyebrow="Cómo trabajamos" title="Así empieza y evoluciona un proyecto" lede="Cada etapa produce algo revisable y un punto de decisión explícito antes de invertir más." />
          <div style={{ marginTop: "var(--space-11)" }}><ProcessStepper /></div>
        </div>
      </section>

      <section className="section" id="capabilities">
        <span id="capacidades" aria-hidden="true" />
        <div className="sv-container">
          <SectionHeader index="05" eyebrow="Capacidades" title="Combinamos estas capacidades según tu proceso" lede="La combinación depende del trabajo, los datos disponibles y la decisión que se quiere mejorar." />
          <div className="capability-grid" style={{ marginTop: "var(--space-11)" }}>
            {websiteContent.capabilities.map((capability) => <CapabilityCard key={capability.index} capability={capability} />)}
          </div>
        </div>
      </section>

      <section className="section section--sunken">
        <div className="sv-container two-column">
          <SectionHeader index="06" eyebrow="Formas de comenzar" title="Un primer alcance que permita decidir con evidencia." />
          <div className="start-options">
            <article><span>01</span><h3>Evaluación de oportunidad</h3><p>Delimitamos el proceso, la decisión, los datos y el criterio de éxito.</p></article>
            <article><span>02</span><h3>Prototipo o piloto</h3><p>Hacemos visible la hipótesis y la evaluamos con un alcance controlado.</p></article>
            <article><span>03</span><h3>Construcción e integración</h3><p>Integramos y evolucionamos lo que ya demostró aportar al trabajo.</p></article>
          </div>
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
