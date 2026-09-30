import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArchitectureDiagram } from "@/components/site/architecture-diagram";
import { CtaBand } from "@/components/site/cta-band";
import { DemoLayers } from "@/components/site/demo-layers";
import { ButtonLink } from "@/components/ui/button";
import { MaturityBadge } from "@/components/ui/maturity-badge";
import { PageIntro } from "@/components/ui/page-intro";
import { SectionHeader } from "@/components/ui/section-header";
import { caseLedger, getLab, labs } from "@/content/site";

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
    robots: { index: false, follow: false },
  };
}

export default async function LabCasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lab = getLab(slug);
  if (!lab) notFound();

  return (
    <>
      <PageIntro dark eyebrow={lab.territory} title={lab.title} lede={lab.promise}>
        <MaturityBadge level={lab.level} onDark>{lab.maturityLabel}</MaturityBadge>
        <MaturityBadge level="limit" onDark>{lab.disclosure}</MaturityBadge>
      </PageIntro>
      <section className="section">
        <div className="sv-container">
          <div className="section-heading-row">
            <SectionHeader index="01" eyebrow="Evidencia" title="El mismo patrón para cada caso." lede="Doce puntos en el mismo orden hacen comparable la evidencia entre demos." />
            <ButtonLink href="/labs" variant="secondary">Volver a Labs</ButtonLink>
          </div>
          <aside className="notice notice--warning" style={{ marginBottom: "var(--space-10)" }}>
            <h2>Caso en revisión editorial</h2>
            <p>Esta página se mantiene fuera de buscadores y del sitemap hasta sustituir los campos genéricos por evidencia verificable del demo.</p>
          </aside>
          <div className="case-contrast">
            <article><h3>Qué demuestra</h3><p>Que el flujo completo puede recorrerse y auditarse dentro de un sistema aplicado.</p></article>
            <article><h3>Qué no demuestra</h3><p>No demuestra desempeño sobre datos de un cliente, precisión en producción ni resultados de negocio.</p></article>
          </div>
          <dl className="ledger">{caseLedger.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        </div>
      </section>
      <section className="section section--dark sv-dark">
        <div className="sv-container">
          <SectionHeader index="02" eyebrow="Capas" title="Qué ve la persona, qué hace el modelo, dónde se verifica." onDark />
          <div style={{ marginTop: "var(--space-11)" }}><DemoLayers /></div>
          <SectionHeader index="03" eyebrow="Arquitectura" title="Lo que se puede publicar del sistema." onDark />
          <ArchitectureDiagram />
          <p className="sv-eyebrow" style={{ marginTop: "var(--space-6)" }}>Sin datos de clientes. Sin credenciales. Sin métricas de desempeño.</p>
        </div>
      </section>
      <CtaBand title="¿Tienes un problema parecido?" body="Si tu operación se parece a este territorio, empezamos por tu problema y decidimos juntos si conviene una prueba pequeña." secondary={false} />
    </>
  );
}
