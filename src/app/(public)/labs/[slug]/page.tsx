import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArchitectureDiagram } from "@/components/site/architecture-diagram";
import { CtaBand } from "@/components/site/cta-band";
import { DemoLayers } from "@/components/site/demo-layers";
import { LabMedia } from "@/components/site/lab-media";
import { ButtonLink } from "@/components/ui/button";
import { MaturityBadge } from "@/components/ui/maturity-badge";
import { PageIntro } from "@/components/ui/page-intro";
import { SectionHeader } from "@/components/ui/section-header";
import { getLab, labs } from "@/content/site";

export function generateStaticParams() {
  return labs.map((lab) => ({ slug: lab.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const lab = getLab(slug);
  if (!lab) return {};
  return {
    title: lab.title,
    description: lab.promise,
    alternates: { canonical: `/labs/${lab.slug}` },
    robots: { index: false, follow: false },
  };
}

export default async function LabCasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lab = getLab(slug);
  if (!lab) notFound();

  const ledger = [
    ["Problema", lab.case.problem],
    ["Usuario / rol", lab.case.user],
    ["Workflow", lab.case.workflow],
    ["Qué construimos", lab.case.built],
    ["Papel de la IA", lab.case.aiRole],
    ["Revisión humana", lab.case.humanRole],
    ["Evidencia disponible", lab.case.evidence],
    ["Riesgos y límites", lab.case.limits],
    ["Siguiente gate", lab.case.nextGate],
  ] as const;

  return (
    <>
      <PageIntro dark eyebrow={lab.territory} title={lab.title} lede={lab.promise}>
        <MaturityBadge level={lab.level} onDark>{lab.maturityLabel}</MaturityBadge>
        <MaturityBadge level="limit" onDark>{lab.disclosure}</MaturityBadge>
      </PageIntro>
      <section className="section">
        <div className="sv-container">
          <div className="section-heading-row">
            <SectionHeader index="01" eyebrow="Caso" title="Problema, sistema y límites del caso." lede="La ficha distingue lo que está definido de lo que todavía necesita evidencia." />
            <ButtonLink href="/labs" variant="secondary">Volver a Labs</ButtonLink>
          </div>
          <LabMedia media={lab.media} title={lab.title} />
          <div className="case-contrast">
            <article><h3>Evidencia disponible</h3><p>{lab.case.evidence}</p></article>
            <article><h3>Límites</h3><p>{lab.case.limits}</p></article>
          </div>
          <dl className="ledger">{ledger.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        </div>
      </section>
      <section className="section section--dark sv-dark">
        <div className="sv-container">
          <SectionHeader index="02" eyebrow="Capas" title="Qué ve la persona, qué hace el modelo, dónde se verifica." onDark />
          <div style={{ marginTop: "var(--space-11)" }}><DemoLayers /></div>
          <SectionHeader index="03" eyebrow="Arquitectura" title="Patrón publicable, no arquitectura de producción." onDark />
          <ArchitectureDiagram />
          <p className="sv-eyebrow" style={{ marginTop: "var(--space-6)" }}>Sin datos de clientes, credenciales ni métricas de desempeño.</p>
        </div>
      </section>
      <CtaBand title="¿Tienes un problema parecido?" body="Si tu operación se parece a este territorio, empezamos por tu problema y decidimos juntos si conviene una prueba pequeña." secondary={false} />
    </>
  );
}
