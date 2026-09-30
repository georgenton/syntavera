import type { Capability } from "@/content/site";

export function CapabilityCard({ capability }: { capability: Capability }) {
  return (
    <article className="capability-card">
      <span>{capability.index}</span>
      <h3>{capability.title}</h3>
      <p>{capability.description}</p>
      <ul>{capability.items.map((item) => <li key={item}>{item}</li>)}</ul>
    </article>
  );
}
