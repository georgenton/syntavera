import type { Lab } from "@/content/site";

export function LabMedia({ media, title }: { media: Lab["media"]; title: string }) {
  if (!media) return null;

  return (
    <figure className="lab-media">
      <video controls preload="none" poster={media.poster} aria-label={`Demostración de ${title}`}>
        <source src={media.src} />
        <track default kind="captions" src={media.captions} srcLang="es" label="Español" />
        Tu navegador no puede reproducir este video. Consulta la transcripción enlazada debajo.
      </video>
      <figcaption>
        <span>{media.provenance}</span>
        <a href={media.transcript}>Leer transcripción</a>
      </figcaption>
    </figure>
  );
}
