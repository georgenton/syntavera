import Link from "next/link";
import type { Lab } from "@/content/site";
import { MaturityBadge } from "@/components/ui/maturity-badge";

export function LabCard({ lab }: { lab: Lab }) {
  return (
    <article className="lab-card">
      <div className="lab-card__topline">
        <p className="sv-eyebrow">{lab.territory}</p>
        <MaturityBadge level={lab.level}>{lab.maturityLabel}</MaturityBadge>
      </div>
      <h3>{lab.title}</h3>
      <p>{lab.promise}</p>
      <ul className="chip-list" aria-label="Capas del demo">
        {lab.stack.map((item) => <li key={item}>{item}</li>)}
      </ul>
      <p className="lab-card__disclosure">{lab.disclosure}</p>
      <Link className="lab-card__link" href={`/labs/${lab.slug}`} aria-label={`Ver el caso ${lab.title}`}>
        Ver el caso <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}
