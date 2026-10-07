import { notFound } from "next/navigation";
import { PortalHeading } from "@/components/portal/portal-heading";
import { Button } from "@/components/ui/button";
import { requirePermission } from "@/modules/auth/guards";
import { getPublishedSnapshot } from "@/modules/publication/service";
import { createClientTicketAction } from "@/modules/support/client-actions";

export default async function NewTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await requirePermission(id, "COMMENT").catch(() => notFound());
  const published = await getPublishedSnapshot(id, context.membership?.permissions ?? []);
  if (!published) notFound();
  const { milestones, deliverables, decisions } = published.snapshot;
  return <div className="workspace-page workspace-page--narrow"><PortalHeading eyebrow="Nuevo ticket" title="Cuéntanos qué bloquea el trabajo." body="Incluye el contexto necesario; la conversación quedará registrada en el proyecto." /><form action={createClientTicketAction.bind(null, id)} className="workspace-panel workspace-form"><div className="field"><label htmlFor="subject">Asunto</label><input id="subject" name="subject" minLength={4} required /></div><div className="field"><label htmlFor="body">Contexto</label><textarea id="body" name="body" minLength={10} required /></div><div className="field"><label htmlFor="priority">Prioridad</label><select id="priority" name="priority" defaultValue="NORMAL"><option value="LOW">Baja</option><option value="NORMAL">Normal</option><option value="HIGH">Alta</option><option value="CRITICAL">Crítica</option></select></div><div className="field"><label htmlFor="milestoneId">Hito relacionado</label><select id="milestoneId" name="milestoneId" defaultValue=""><option value="">Ninguno</option>{milestones.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></div><div className="field"><label htmlFor="deliverableId">Entregable relacionado</label><select id="deliverableId" name="deliverableId" defaultValue=""><option value="">Ninguno</option>{deliverables.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></div><div className="field"><label htmlFor="decisionId">Decisión relacionada</label><select id="decisionId" name="decisionId" defaultValue=""><option value="">Ninguna</option>{decisions.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></div><label className="checkbox-field"><input type="checkbox" name="criticalConfirmed" /> <span>Confirmo que usaré prioridad crítica únicamente ante un bloqueo inmediato del trabajo.</span></label><p className="field-help">Selecciona como máximo un recurso relacionado. La confirmación es obligatoria para prioridad crítica.</p><Button type="submit">Crear ticket</Button></form></div>;
}
