import Link from "next/link";

export function BrandSymbol({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" role="img" aria-label="Símbolo SyntaVera">
      <path d="M4 12H16L36 32" stroke="currentColor" strokeWidth="3.5" />
      <path d="M4 24H28L36 32" stroke="currentColor" strokeWidth="3.5" />
      <path d="M4 40H28L36 32" stroke="currentColor" strokeWidth="3.5" />
      <path d="M4 52H16L36 32" stroke="currentColor" strokeWidth="3.5" />
      <path d="M36 32H60" stroke="currentColor" strokeWidth="7" />
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
