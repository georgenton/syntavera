export function SectionHeader({
  index,
  eyebrow,
  title,
  lede,
  onDark = false,
}: {
  index?: string;
  eyebrow: string;
  title: string;
  lede?: string;
  onDark?: boolean;
}) {
  return (
    <header className={`section-header${onDark ? " section-header--dark" : ""}`}>
      <div className="section-header__meta">
        {index ? <span aria-hidden="true">{index}</span> : null}
        <span>{eyebrow}</span>
      </div>
      <h2>{title}</h2>
      {lede ? <p>{lede}</p> : null}
    </header>
  );
}
