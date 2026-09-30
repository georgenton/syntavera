import type { ReactNode } from "react";
import { BrandPattern } from "@/components/site/brand-pattern";

export function PageIntro({
  eyebrow,
  title,
  lede,
  dark = false,
  children,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  dark?: boolean;
  children?: ReactNode;
}) {
  return (
    <section className={`page-intro sv-grid-bg${dark ? " page-intro--dark sv-dark sv-grid-bg--dark" : ""}`}>
      <BrandPattern variant="field" onDark={dark} seed={14} width={1400} height={420} mask="fade-left" opacity={dark ? 0.26 : 0.12} />
      <div className="sv-container page-intro__inner">
        <p className="sv-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="sv-lede">{lede}</p>
        {children ? <div className="page-intro__extra">{children}</div> : null}
      </div>
    </section>
  );
}
