import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/site/brand-mark";
import { SignOutButton } from "./sign-out-button";

const items = [
  ["Resumen", ""], ["Plan", "/plan"], ["Documentos", "/docs"], ["Entregables", "/deliverables"], ["Facturación", "/billing"], ["Actividad", "/activity"], ["Soporte", "/support"],
] as const;

export function PortalShell({ projectId, projectName, userName, children }: { projectId: string; projectName: string; userName: string; children: ReactNode }) {
  const base = `/portal/p/${projectId}`;
  return <div className="workspace-shell workspace-shell--portal"><aside className="workspace-sidebar"><BrandMark inverse /><div><p className="workspace-sidebar__label">{projectName}</p><nav aria-label="Portal del proyecto">{items.map(([label, suffix]) => <Link href={`${base}${suffix}`} key={label}>{label}</Link>)}</nav></div><div className="workspace-user"><span>{userName}</span><Link href="/portal">Cambiar proyecto</Link><SignOutButton /></div></aside><main id="main-content" className="workspace-main">{children}</main></div>;
}
