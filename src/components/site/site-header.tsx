import Link from "next/link";
import { publicNav } from "@/content/site";
import { ButtonLink } from "@/components/ui/button";
import { BrandMark } from "./brand-mark";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="sv-container site-header__inner">
        <BrandMark />
        <nav className="site-nav" aria-label="Navegación principal">
          {publicNav.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="site-header__cta">
          <ButtonLink href="/contact" size="sm">Explorar una oportunidad <span aria-hidden="true">→</span></ButtonLink>
        </div>
        <details className="mobile-nav">
          <summary aria-label="Menú">Menú</summary>
          <nav aria-label="Navegación móvil">
            {publicNav.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
            <Link href="/contact">Explorar una oportunidad →</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
