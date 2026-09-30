import type { ReactNode } from "react";

export function PortalHeading({ eyebrow, title, body, action }: { eyebrow: string; title: string; body?: string | undefined; action?: ReactNode | undefined }) {
  return <header className="workspace-heading"><div><p className="sv-eyebrow">{eyebrow}</p><h1>{title}</h1>{body ? <p>{body}</p> : null}</div>{action}</header>;
}
