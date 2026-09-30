import { ButtonLink } from "@/components/ui/button";

export function CtaBand({
  title,
  body,
  secondary = true,
}: {
  title: string;
  body: string;
  secondary?: boolean;
}) {
  return (
    <section className="cta-band sv-dark sv-grid-bg--dark">
      <div className="sv-container cta-band__inner">
        <div>
          <p className="sv-eyebrow">Siguiente conversación</p>
          <h2>{title}</h2>
          <p>{body}</p>
        </div>
        <div className="cta-band__actions">
          <ButtonLink href="/contact" variant="inverse" size="lg">Explorar una oportunidad <span aria-hidden="true">→</span></ButtonLink>
          {secondary ? <ButtonLink href="/labs" variant="quiet" size="lg">Ver SyntaVera Labs</ButtonLink> : null}
        </div>
      </div>
    </section>
  );
}
