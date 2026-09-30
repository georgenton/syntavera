import type { MaturityLevel } from "@/content/site";

export function MaturityBadge({
  level,
  children,
  onDark = false,
}: {
  level: MaturityLevel | "limit";
  children: string;
  onDark?: boolean;
}) {
  return <span className={`maturity maturity--${level}${onDark ? " maturity--dark" : ""}`}>{children}</span>;
}
