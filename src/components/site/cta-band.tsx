import { ButtonLink } from "@/components/ui/button";
import { getContactChannelStatus } from "@/modules/contact/status.server";

export function CtaBand({
  title,
  body,
  secondary = true,
}: {
  title: string;
  body: string;
  secondary?: boolean;
}) {
  const channel = getContactChannelStatus();
  return (
    <section className="cta-band sv-dark sv-grid-bg--dark">
      <div className="sv-container cta-band__inner">
        <div>
          <p className="sv-eyebrow">Siguiente conversación</p>
          <h2>{title}</h2>
          <p>{body}</p>
        </div>
        <div className="cta-band__actions">
          <ButtonLink href={channel.available ? "/contact" : "/how-we-work"} variant="inverse" size="lg">{channel.available ? "Hablemos de tu proceso" : "Conoce cómo trabajamos"} <span aria-hidden="true">→</span></ButtonLink>
          {secondary ? <ButtonLink href="/how-we-work#capabilities" variant="quiet" size="lg">Explorar capacidades</ButtonLink> : null}
        </div>
      </div>
    </section>
  );
}
