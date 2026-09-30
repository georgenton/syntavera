import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand } from "@/components/site/cta-band";
import { DemoLayers } from "@/components/site/demo-layers";
import { LabCard } from "@/components/site/lab-card";
import { MaturityBadge } from "@/components/ui/maturity-badge";
import { PageIntro } from "@/components/ui/page-intro";
import { SectionHeader } from "@/components/ui/section-header";
import { labs } from "@/content/site";

export const metadata: Metadata = {
  title: "SyntaVera Labs",
  description: "Demos de capacidad etiquetados con su madurez y sus límites reales.",
  alternates: { canonical: "/labs" },
};

export default async function LabsPage({ searchParams }: { searchParams: Promise<{ territorio?: string }> }) {
  const { territorio } = await searchParams;
  const territories = [...new Set(labs.map((lab) => lab.territory))];
  const visibleLabs = territorio ? labs.filter((lab) => lab.territory === territorio) : labs;

  return (
    <>
      <PageIntro dark eyebrow="SyntaVera Labs" title="Demos etiquetados con su madurez real." lede="Cada pieza de Labs es una prueba de capacidad: dice qué demuestra, qué no demuestra y en qué estado está. Ninguna se ofrece como producto empaquetado.">
        <MaturityBadge level="demo" onDark>Capability Demo</MaturityBadge>
        <MaturityBadge level="codev" onDark>Co-development</MaturityBadge>
        <MaturityBadge level="pilot" onDark>Pilot candidate</MaturityBadge>
        <MaturityBadge level="lab" onDark>In the Lab · Planned</MaturityBadge>
      </PageIntro>
      <section className="section">
        <div className="sv-container">
          <nav className="filter-bar" aria-label="Filtrar por territorio">
            <span className="sv-eyebrow">Territorio</span>
            <Link className={!territorio ? "filter-chip filter-chip--active" : "filter-chip"} href="/labs">Todos</Link>
            {territories.map((item) => (
              <Link className={territorio === item ? "filter-chip filter-chip--active" : "filter-chip"} href={{ pathname: "/labs", query: { territorio: item } }} key={item}>{item}</Link>
            ))}
          </nav>
          <div className="lab-grid">
            {visibleLabs.map((lab) => <LabCard key={lab.slug} lab={lab} />)}
          </div>
          <aside className="notice" style={{ marginTop: "var(--space-10)" }}>
            <h2>Cómo leer estas etiquetas</h2>
            <p>La etiqueta es parte de la evidencia. “Capability Demo” significa que el sistema existe y se puede recorrer, no que esté operando en una empresa. “Co-development” significa que se construye junto a un especialista del dominio. “Planned” significa que aún no hay nada que mostrar.</p>
          </aside>
        </div>
      </section>
      <section className="section section--dark sv-dark">
        <div className="sv-container">
          <SectionHeader index="02" eyebrow="Cómo mostramos un demo" title="Tres capas del mismo caso." lede="Separamos qué ve la persona, qué hace el modelo y dónde se verifica la decisión." onDark />
          <div style={{ marginTop: "var(--space-11)" }}><DemoLayers /></div>
        </div>
      </section>
      <CtaBand title="¿Tienes un problema parecido?" body="Si alguno de estos territorios se parece a tu operación, la conversación empieza por tu problema, no por el demo." secondary={false} />
    </>
  );
}
