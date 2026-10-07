import { notFound } from "next/navigation";
import { PortalShell } from "@/components/portal/portal-shell";
import { requireProjectAccess } from "@/modules/auth/guards";
import { getPublishedSnapshot } from "@/modules/publication/service";

export default async function PortalProjectLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const context = await requireProjectAccess(id).catch(() => notFound());
  const permissions = context.membership?.permissions ?? [];
  const publication = await getPublishedSnapshot(id, permissions);
  return <PortalShell projectId={id} projectName={publication?.snapshot.project.name ?? "Proyecto sin publicar"} userName={context.user.name} permissions={permissions}>{children}</PortalShell>;
}
