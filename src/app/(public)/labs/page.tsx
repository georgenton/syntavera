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
  description: "Fichas de capacidad con madurez, evidencia disponible y límites explícitos.",
  alternates: { canonical: "/labs" },
};

export default async function LabsPage({ searchParams }: { searchParams: Promise<{ territorio?: string }> }) {
  const { territorio } = await searchParams;
  const territories = [...new Set(labs.map((lab) => lab.territory))];
  const visibleLabs = territorio ? labs.filter((lab) => lab.territory === territorio) : labs;

  return (
    <>
      <PageIntro dark eyebrow="SyntaVera Labs" title="Casos con madurez y límites explícitos." lede="Cada ficha separa el problema, lo construido, el papel de la IA, la revisión humana y la evidencia que todavía falta.">
        <MaturityBadge level="demo" onDark>Ficha de capacidad</MaturityBadge>
        <MaturityBadge level="codev" onDark>Co-desarrollo</MaturityBadge>
        <MaturityBadge level="pilot" onDark>Candidato a piloto</MaturityBadge>
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
            <p>La etiqueta es parte de la evidencia. Una ficha de capacidad documenta el alcance sin afirmar una demostración interactiva. Co-desarrollo describe trabajo con criterio de dominio. Candidato a piloto indica el siguiente paso posible, no un despliegue realizado.</p>
          </aside>
        </div>
      </section>
      <section className="section section--dark sv-dark">
        <div className="sv-container">
          <SectionHeader index="02" eyebrow="Cómo explicamos un caso" title="Tres capas de la misma decisión." lede="Separamos qué ve la persona, qué hace el modelo y dónde se verifica la decisión." onDark />
          <div style={{ marginTop: "var(--space-11)" }}><DemoLayers /></div>
        </div>
      </section>
      <CtaBand title="¿Tienes un problema parecido?" body="Si alguno de estos territorios se parece a tu operación, la conversación empieza por tu problema, no por el demo." secondary={false} />
    </>
  );
}
