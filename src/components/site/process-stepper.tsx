"use client";

import { useState } from "react";
import { websiteContent } from "@/content/site";

export function ProcessStepper({ showDetail = false }: { showDetail?: boolean }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = websiteContent.process[activeIndex] ?? websiteContent.process[0]!;

  return (
    <div className="process-stepper-wrap">
      <ol className="process-stepper">
        {websiteContent.process.map((step, index) => {
          const selected = index === activeIndex;
          return (
            <li key={step.label}>
              <button type="button" aria-current={selected ? "step" : undefined} onClick={() => setActiveIndex(index)}>
                <span className="process-stepper__index">{String(index + 1).padStart(2, "0")}</span>
                <span className="process-stepper__title">{step.label}</span>
                <span className="process-stepper__description">{step.description}</span>
                {selected ? <span className="process-stepper__output">Salida · {step.output}</span> : null}
              </button>
            </li>
          );
        })}
      </ol>
      {showDetail ? (
        <section className="process-stepper__detail" aria-live="polite">
          <div><span className="sv-eyebrow">{String(activeIndex + 1).padStart(2, "0")} · {active.label}</span><h2>{active.description}</h2></div>
          <div><span className="sv-eyebrow">Salida</span><p>{active.output}</p><span className="sv-eyebrow">Decisión al cierre</span><p>Continuar, ajustar el alcance o detenerse con la evidencia disponible.</p></div>
        </section>
      ) : null}
    </div>
  );
}
