import { websiteContent } from "@/content/site";

export function ArchitectureDiagram({ light = false }: { light?: boolean }) {
  return (
    <figure className={`architecture${light ? " architecture--light" : ""}`}>
      <div className="architecture__heading">
        <div>
          <p className="sv-eyebrow">Arquitectura de referencia</p>
          <h3>Una decisión con rastro.</h3>
        </div>
        <span className="architecture__status"><i /> Sistema verificable</span>
      </div>
      <div className="architecture__stages">
        {websiteContent.systemStages.map((stage, index) => (
          <div className="architecture__stage" key={stage.label}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{stage.label}</strong>
            <small>{stage.note}</small>
          </div>
        ))}
      </div>
      <figcaption>Las señales y los documentos entran, el conocimiento se estructura con fuentes, la decisión se propone y la verificación queda registrada.</figcaption>
    </figure>
  );
}
