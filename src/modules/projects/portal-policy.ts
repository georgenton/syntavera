import type { ProjectSnapshot } from "@/modules/publication/schema";

export type PortalPermission = "VIEW" | "COMMENT" | "APPROVE" | "FINANCE";

export type PortalNavigationItem = {
  label: string;
  suffix: string;
  permission?: PortalPermission;
};

const portalNavigationItems: readonly PortalNavigationItem[] = [
  { label: "Resumen", suffix: "" },
  { label: "Plan", suffix: "/plan" },
  { label: "Documentos", suffix: "/docs" },
  { label: "Entregables", suffix: "/deliverables" },
  { label: "Facturación", suffix: "/billing", permission: "FINANCE" },
  { label: "Actividad", suffix: "/activity" },
  { label: "Soporte", suffix: "/support" },
] as const;

export function navigationForPermissions(permissions: readonly string[]) {
  return portalNavigationItems.filter((item) => !item.permission || permissions.includes(item.permission));
}

export function portalDashboardSummary(projects: readonly { snapshot: ProjectSnapshot | null; permissions: readonly string[] }[]) {
  const published = projects.filter((item): item is { snapshot: ProjectSnapshot; permissions: readonly string[] } => Boolean(item.snapshot));
  const pendingApprovals = published.reduce((sum, item) => {
    if (!item.permissions.includes("APPROVE")) return sum;
    return sum + item.snapshot.deliverables.filter((deliverable) => deliverable.status === "IN_REVIEW").length;
  }, 0);
  const openMilestones = published.reduce(
    (sum, item) => sum + item.snapshot.milestones.filter((milestone) => milestone.status !== "COMPLETED").length,
    0,
  );
  const hasFinance = published.some((item) => item.permissions.includes("FINANCE"));
  const invoicesWithBalance = published.reduce((sum, item) => {
    if (!item.permissions.includes("FINANCE")) return sum;
    return sum + item.snapshot.billing.filter((invoice) => ["UNPAID", "PARTIALLY_PAID", "OVERDUE"].includes(invoice.paymentState)).length;
  }, 0);

  return {
    activeProjects: published.filter((item) => item.snapshot.project.status === "ACTIVE").length,
    publishedProjects: published.length,
    pendingApprovals,
    openMilestones,
    hasFinance,
    invoicesWithBalance,
  };
}

export function snapshotContainsClientFile(snapshot: ProjectSnapshot, fileId: string) {
  return snapshot.deliverables.some((deliverable) => deliverable.documents.some((document) => (
    document.versions.some((version) => version.file?.id === fileId)
  )));
}
