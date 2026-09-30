import type { ReactNode } from "react";
import { BrandMark } from "@/components/site/brand-mark";

export function AuthShell({ eyebrow, title, body, children }: { eyebrow: string; title: string; body: string; children: ReactNode }) {
  return (
    <main id="main-content" className="auth-shell">
      <section className="auth-shell__brand">
        <BrandMark inverse />
        <div><p className="sv-eyebrow">{eyebrow}</p><h1>{title}</h1><p>{body}</p></div>
        <p className="sv-eyebrow">Acceso privado · Conexión segura</p>
      </section>
      <section className="auth-shell__panel"><div className="auth-card">{children}</div></section>
    </main>
  );
}
