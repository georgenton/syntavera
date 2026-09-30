"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/site/brand-mark";
import { SignOutButton } from "./sign-out-button";

const items = [
  ["Resumen", ""], ["Plan", "/plan"], ["Documentos", "/docs"], ["Entregables", "/deliverables"], ["Facturación", "/billing"], ["Actividad", "/activity"], ["Soporte", "/support"],
] as const;

export function PortalShell({ projectId, projectName, userName, children }: { projectId: string; projectName: string; userName: string; children: ReactNode }) {
  const pathname = usePathname();
  const base = `/portal/p/${projectId}`;
  const initials = userName.split(" ").map((part) => part[0]).slice(0, 2).join("");
  return <div className="workspace-shell workspace-shell--portal">
    <header className="workspace-topbar">
      <div className="workspace-topbar__inner">
        <div className="workspace-topbar__brand"><BrandMark /><i aria-hidden="true" /><span>Área de clientes</span></div>
        <div className="workspace-topbar__user"><span className="workspace-topbar__name">{userName}<small>{projectName}</small></span><b aria-hidden="true">{initials}</b><Link href="/portal">Cambiar proyecto</Link><SignOutButton /></div>
      </div>
    </header>
    <nav className="workspace-nav" aria-label="Portal del proyecto"><div>{items.map(([label, suffix]) => {
      const href = `${base}${suffix}`;
      const active = suffix === "" ? pathname === href : pathname.startsWith(href);
      return <Link href={href} key={label} aria-current={active ? "page" : undefined}>{label}</Link>;
    })}</div></nav>
    <main id="main-content" className="workspace-main">{children}</main>
  </div>;
}
