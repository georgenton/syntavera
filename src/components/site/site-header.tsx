"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { publicNav } from "@/content/site";
import { ButtonLink } from "@/components/ui/button";
import { BrandMark } from "./brand-mark";

export function SiteHeader() {
  const pathname = usePathname();
  const onDark = pathname === "/labs" || pathname.startsWith("/labs/");
  return (
    <header className={`site-header${onDark ? " site-header--dark sv-dark" : ""}`}>
      <div className="sv-container site-header__inner">
        <BrandMark inverse={onDark} />
        <nav className="site-nav" aria-label="Navegación principal">
          {publicNav.map((item) => (
            <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="site-header__cta">
          <ButtonLink href="/contact" variant="secondary" size="sm">Explorar una oportunidad <span aria-hidden="true">→</span></ButtonLink>
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
