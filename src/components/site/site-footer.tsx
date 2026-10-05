import Link from "next/link";
import { labs } from "@/content/site";
import { BrandMark } from "./brand-mark";

export function SiteFooter() {
  return (
    <footer className="site-footer sv-dark">
      <div className="sv-container site-footer__grid">
        <div className="site-footer__lead">
          <BrandMark inverse />
          <p>Inteligencia aplicada para decisiones reales. Prototipos y sistemas construidos sobre procesos, datos y conocimiento experto.</p>
        </div>
        <div>
          <p className="sv-eyebrow">Labs</p>
          {labs.map((lab) => (
            <Link key={lab.slug} href={`/labs/${lab.slug}`}>{lab.title}</Link>
          ))}
        </div>
        <div>
          <p className="sv-eyebrow">Firma</p>
          <Link href="/how-we-work">Cómo trabajamos</Link>
          <Link href="/how-we-work#capabilities">Capacidades</Link>
          <Link href="/about">Nosotros</Link>
          <Link href="/contact">Contacto</Link>
        </div>
      </div>
      <div className="sv-container site-footer__disclosure">
        <p>Las fichas de SyntaVera Labs declaran su evidencia y estado real. No representan despliegues con clientes ni productos empaquetados.</p>
        <p>© {new Date().getFullYear()} SyntaVera · <Link href="/privacy">Privacidad</Link></p>
      </div>
    </footer>
  );
}
