import { demoLayers } from "@/content/site";

export function DemoLayers() {
  return (
    <div className="demo-layers">
      {demoLayers.map((layer, index) => (
        <article key={layer.title}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <h3>{layer.title}</h3>
          <p>{layer.description}</p>
          <ul>{layer.items.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
      ))}
    </div>
  );
}
