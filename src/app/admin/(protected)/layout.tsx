import { redirect } from "next/navigation";
import { AdminShell } from "@/components/portal/admin-shell";
import { AuthorizationError, requireInternalUser } from "@/modules/auth/guards";

export const dynamic = "force-dynamic";

async function getInternalUserOrRedirect() {
  try {
    return (await requireInternalUser()).user;
  } catch (error) {
    if (error instanceof AuthorizationError) redirect("/admin/login");
    throw error;
  }
}

export default async function AdminProtectedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getInternalUserOrRedirect();
  return <AdminShell userName={user.name}>{children}</AdminShell>;
}
