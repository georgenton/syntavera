import type { Metadata } from "next";
import { PageIntro } from "@/components/ui/page-intro";
import { privacyPolicy } from "@/content/legal/privacy";

export const metadata: Metadata = {
  title: "Privacidad",
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return (
    <>
      <PageIntro eyebrow="Privacidad" title="Contenido legal pendiente de aprobación." lede="La ruta, el versionado y el gate de publicación están preparados. No publicamos un texto legal inventado." />
      <section className="section">
        <div className="sv-container sv-prose">
          {privacyPolicy.approved ? privacyPolicy.sections.map((section) => (
            <section key={section.title} style={{ marginBottom: "var(--space-9)" }}>
              <h2>{section.title}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph} style={{ marginTop: "var(--space-5)" }}>{paragraph}</p>)}
            </section>
          )) : (
            <aside className="notice notice--warning"><h2>Publicación bloqueada</h2><p>Se requiere un texto de privacidad aprobado, con versión y fecha, antes de habilitar el formulario de contacto en producción.</p></aside>
          )}
        </div>
      </section>
    </>
  );
}
