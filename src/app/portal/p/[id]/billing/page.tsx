import { notFound } from "next/navigation";
import { PortalEmpty } from "@/components/portal/portal-empty";
import { PortalHeading } from "@/components/portal/portal-heading";
import { StatusBadge } from "@/components/portal/status-badge";
import { requirePermission } from "@/modules/auth/guards";
import { getPublishedSnapshot } from "@/modules/publication/service";

export default async function PortalBillingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await requirePermission(id, "FINANCE").catch(() => notFound());
  const published = await getPublishedSnapshot(id, context.membership?.permissions ?? []);
  const invoices = published?.snapshot.billing ?? [];
  return <div className="workspace-page"><PortalHeading eyebrow="Facturación" title="Estado documental y de pago." body="SyntaVera muestra metadatos. El pago y el comprobante pertenecen al sistema externo enlazado." />{invoices.length ? <section className="workspace-panel"><div className="data-list">{invoices.map((invoice) => <article key={invoice.id}><div><strong>Factura {invoice.number}</strong><p>{new Intl.NumberFormat("es-EC", { style: "currency", currency: invoice.currency }).format(invoice.totalMinor / 100)}{invoice.dueAt ? ` · vence ${new Date(invoice.dueAt).toLocaleDateString("es-EC")}` : ""}</p>{invoice.externalUrl ? <a href={invoice.externalUrl} target="_blank" rel="noreferrer">Abrir en el sistema de facturación ↗</a> : null}</div><div><StatusBadge value={invoice.documentState} /><StatusBadge value={invoice.paymentState} /></div></article>)}</div></section> : <PortalEmpty title="No hay facturas publicadas." body="Esta vista no genera cobros ni simula pagos." />}</div>;
}
