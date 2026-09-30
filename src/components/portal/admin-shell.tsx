import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/site/brand-mark";
import { SignOutButton } from "./sign-out-button";

const nav = [
  ["Resumen", "/admin"],
  ["Organizaciones", "/admin/organizations"],
  ["Contactos", "/admin/contacts"],
  ["Proyectos", "/admin/projects"],
  ["Soporte", "/admin/support"],
] as const;

export function AdminShell({ userName, children }: { userName: string; children: ReactNode }) {
  return (
    <div className="workspace-shell">
      <aside className="workspace-sidebar">
        <BrandMark inverse />
        <div><p className="workspace-sidebar__label">Control interno</p><nav aria-label="Backoffice">{nav.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}</nav></div>
        <div className="workspace-user"><span>{userName}</span><SignOutButton /></div>
      </aside>
      <main id="main-content" className="workspace-main">{children}</main>
    </div>
  );
}
