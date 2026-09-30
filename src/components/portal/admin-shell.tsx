"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/site/brand-mark";
import { SignOutButton } from "./sign-out-button";

const nav = [
  ["Control Center", "/admin"],
  ["Soporte", "/admin/support"],
] as const;

export function AdminShell({ userName, children }: { userName: string; children: ReactNode }) {
  const pathname = usePathname();
  const initials = userName.split(" ").map((part) => part[0]).slice(0, 2).join("");
  return (
    <div className="workspace-shell">
      <header className="workspace-topbar workspace-topbar--dark">
        <div className="workspace-topbar__inner">
          <div className="workspace-topbar__brand"><BrandMark inverse /><i aria-hidden="true" /><span>Administración</span></div>
          <div className="workspace-topbar__user"><span className="workspace-topbar__name">{userName}<small>Control interno</small></span><b aria-hidden="true">{initials}</b><SignOutButton /></div>
        </div>
      </header>
      <nav className="workspace-nav workspace-nav--dark" aria-label="Administración">
        <div>{nav.map(([label, href]) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return <Link href={href} key={href} aria-current={active ? "page" : undefined}>{label}</Link>;
        })}</div>
      </nav>
      <main id="main-content" className="workspace-main">{children}</main>
    </div>
  );
}
