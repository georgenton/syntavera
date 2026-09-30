import Link from "next/link";
import type { Lab } from "@/content/site";
import { MaturityBadge } from "@/components/ui/maturity-badge";

export function LabCard({ lab }: { lab: Lab }) {
  return (
    <Link className="lab-card" href={`/labs/${lab.slug}`} aria-label={`Ver el caso ${lab.title}`}>
      <div className="lab-card__topline">
        <MaturityBadge level={lab.level}>{lab.maturityLabel}</MaturityBadge>
      </div>
      <div className="lab-card__content"><p className="sv-eyebrow">{lab.territory}</p><h3>{lab.title}</h3><p>{lab.promise}</p></div>
      <ul className="chip-list" aria-label="Capas del demo">
        {lab.stack.map((item) => <li key={item}>{item}</li>)}
      </ul>
      <div className="lab-card__footer"><p className="lab-card__disclosure">{lab.disclosure}</p><span className="lab-card__link">Ver el caso <span aria-hidden="true">→</span></span></div>
    </Link>
  );
}
