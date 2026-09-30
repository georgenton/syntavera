import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main-content" className="not-found sv-grid-bg">
      <div className="sv-container not-found__inner">
        <p className="sv-eyebrow">404</p>
        <h1>Esta página no existe.</h1>
        <p className="sv-lede">La ruta pudo cambiar o el recurso todavía no está publicado.</p>
        <div className="not-found__actions"><ButtonLink href="/">Volver al inicio</ButtonLink><ButtonLink href="/labs" variant="quiet">Ver SyntaVera Labs</ButtonLink></div>
      </div>
    </main>
  );
}
