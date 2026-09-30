import { websiteContent } from "@/content/site";

export function ProcessList() {
  return (
    <ol className="process-list">
      {websiteContent.process.map((step, index) => (
        <li key={step.label}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <div>
            <h3>{step.label}</h3>
            <p>{step.description}</p>
          </div>
          <p><small>Salida</small>{step.output}</p>
        </li>
      ))}
    </ol>
  );
}
