import Link from "next/link";

export function BrandSymbol({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" role="img" aria-label="Símbolo SyntaVera">
      <rect x="1" y="1" width="38" height="38" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 11h14l8 9-8 9H9l8-9-8-9Z" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="20" cy="20" r="2.7" fill="currentColor" />
    </svg>
  );
}

export function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link href="/" className={`brand-mark${inverse ? " brand-mark--inverse" : ""}`} aria-label="SyntaVera, inicio">
      <BrandSymbol />
      <span>SyntaVera</span>
    </Link>
  );
}
