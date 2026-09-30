import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthorizationError, requireCurrentUser } from "@/modules/auth/guards";

export const metadata: Metadata = { title: "Portal cliente", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  try {
    const { user } = await requireCurrentUser();
    if (user.kind !== "CLIENT") redirect("/admin");
    return children;
  } catch (error) {
    if (error instanceof AuthorizationError) redirect("/login");
    throw error;
  }
}
