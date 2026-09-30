"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/modules/auth/client";

export function SignOutButton() {
  const [pending, setPending] = useState(false);
  const router = useRouter();
  return <button className="shell-signout" type="button" disabled={pending} onClick={async () => { setPending(true); await authClient.signOut(); router.push("/"); router.refresh(); }}>{pending ? "Saliendo…" : "Cerrar sesión"}</button>;
}
