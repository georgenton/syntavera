import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { Prisma, PrismaClient } from "../../src/generated/prisma/client";
import { authenticatedFixture as fixture } from "./fixtures/authenticated";

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Authenticated E2E fixture requires ${name}`);
  return value;
}

async function main() {
  const databaseUrl = required("DATABASE_URL");
  const adminEmail = required("E2E_ADMIN_EMAIL").toLowerCase();
  const adminPassword = required("E2E_ADMIN_PASSWORD");
  const restrictedEmail = required("E2E_RESTRICTED_EMAIL").toLowerCase();
  const restrictedPassword = required("E2E_RESTRICTED_PASSWORD");
  if (adminPassword.length < 12 || restrictedPassword.length < 12) {
    throw new Error("Authenticated E2E passwords must contain at least 12 characters");
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
  try {
    const [adminPasswordHash, restrictedPasswordHash] = await Promise.all([
      hashPassword(adminPassword),
      hashPassword(restrictedPassword),
    ]);

    await prisma.$transaction(async (tx) => {
      await tx.invoice.deleteMany({ where: { projectId: { in: [fixture.projectId, fixture.unpublishedProjectId, fixture.foreignProjectId] } } });
      await tx.project.deleteMany({ where: { id: { in: [fixture.projectId, fixture.unpublishedProjectId, fixture.foreignProjectId] } } });
      await tx.user.deleteMany({ where: { id: { in: [fixture.viewerUserId, fixture.collaboratorUserId, fixture.approverUserId] } } });
      await tx.organization.deleteMany({ where: { id: { in: [fixture.organizationId, fixture.foreignOrganizationId] } } });

      const admin = await tx.user.upsert({
        where: { email: adminEmail },
        create: {
          id: fixture.adminUserId,
          name: "Administradora sintética",
          email: adminEmail,
          emailVerified: true,
          kind: "INTERNAL",
          internalRole: "ADMIN",
        },
        update: {
          name: "Administradora sintética",
          emailVerified: true,
          kind: "INTERNAL",
          internalRole: "ADMIN",
          disabledAt: null,
        },
      });
      const restricted = await tx.user.upsert({
        where: { email: restrictedEmail },
        create: {
          id: fixture.restrictedUserId,
          name: "Project manager sintético",
          email: restrictedEmail,
          emailVerified: true,
          kind: "INTERNAL",
          internalRole: "PROJECT_MANAGER",
        },
        update: {
          name: "Project manager sintético",
          emailVerified: true,
          kind: "INTERNAL",
          internalRole: "PROJECT_MANAGER",
          disabledAt: null,
        },
      });

      await Promise.all([
        tx.account.upsert({
          where: { providerId_accountId: { providerId: "credential", accountId: admin.id } },
          create: { providerId: "credential", accountId: admin.id, userId: admin.id, password: adminPasswordHash },
          update: { userId: admin.id, password: adminPasswordHash },
        }),
        tx.account.upsert({
          where: { providerId_accountId: { providerId: "credential", accountId: restricted.id } },
          create: { providerId: "credential", accountId: restricted.id, userId: restricted.id, password: restrictedPasswordHash },
          update: { userId: restricted.id, password: restrictedPasswordHash },
        }),
        tx.session.deleteMany({ where: { userId: { in: [admin.id, restricted.id] } } }),
      ]);

      const organization = await tx.organization.upsert({
        where: { slug: fixture.organizationSlug },
        create: { id: fixture.organizationId, name: fixture.organizationName, slug: fixture.organizationSlug },
        update: { name: fixture.organizationName },
      });
      const project = await tx.project.upsert({
        where: { slug: fixture.projectSlug },
        create: {
          id: fixture.projectId,
          organizationId: organization.id,
          name: fixture.projectName,
          slug: fixture.projectSlug,
          objective: "Validar autenticación y permisos con datos completamente sintéticos.",
          summary: "Proyecto desechable preparado únicamente para la aceptación autenticada.",
          reference: "E2E-AUTH",
          status: "ACTIVE",
        },
        update: {
          organizationId: organization.id,
          name: fixture.projectName,
          objective: "Validar autenticación y permisos con datos completamente sintéticos.",
          summary: "Proyecto desechable preparado únicamente para la aceptación autenticada.",
          reference: "E2E-AUTH",
          status: "ACTIVE",
        },
      });
      await tx.projectInternal.upsert({
        where: { projectId: project.id },
        create: { projectId: project.id, projectManagerId: admin.id },
        update: { projectManagerId: admin.id },
      });

      const unpublishedProject = await tx.project.create({
        data: {
          id: fixture.unpublishedProjectId,
          organizationId: organization.id,
          name: fixture.unpublishedProjectName,
          slug: fixture.unpublishedProjectSlug,
          objective: "Validar el estado vacío antes de la primera publicación sintética.",
          summary: "Este proyecto sintético todavía no tiene snapshot para cliente.",
          status: "ACTIVE",
          internal: { create: { projectManagerId: admin.id } },
        },
      });
      const foreignOrganization = await tx.organization.create({
        data: { id: fixture.foreignOrganizationId, name: "Organización sintética aislada", slug: fixture.foreignOrganizationSlug },
      });
      await tx.project.create({
        data: {
          id: fixture.foreignProjectId,
          organizationId: foreignOrganization.id,
          name: fixture.foreignProjectName,
          slug: fixture.foreignProjectSlug,
          objective: "Comprobar que otra organización no sea visible para clientes sintéticos.",
          summary: "Proyecto aislado para pruebas negativas de autorización.",
          status: "ACTIVE",
          internal: { create: { projectManagerId: admin.id } },
        },
      });

      const [viewer, collaborator, approver] = await Promise.all([
        tx.user.create({ data: { id: fixture.viewerUserId, name: "Visora sintética", email: fixture.viewerEmail, emailVerified: true, kind: "CLIENT", organizationId: organization.id } }),
        tx.user.create({ data: { id: fixture.collaboratorUserId, name: "Colaboradora sintética", email: fixture.collaboratorEmail, emailVerified: true, kind: "CLIENT", organizationId: organization.id } }),
        tx.user.create({ data: { id: fixture.approverUserId, name: "Aprobadora sintética", email: fixture.approverEmail, emailVerified: true, kind: "CLIENT", organizationId: organization.id } }),
      ]);
      await tx.projectMembership.createMany({ data: [
        { projectId: project.id, userId: viewer.id, permissions: ["VIEW"], status: "ACTIVE", activatedAt: new Date("2026-10-06T12:00:00.000Z") },
        { projectId: unpublishedProject.id, userId: viewer.id, permissions: ["VIEW"], status: "ACTIVE", activatedAt: new Date("2026-10-06T12:00:00.000Z") },
        { projectId: project.id, userId: collaborator.id, permissions: ["VIEW", "COMMENT"], status: "ACTIVE", activatedAt: new Date("2026-10-06T12:00:00.000Z") },
        { projectId: project.id, userId: approver.id, permissions: ["VIEW", "APPROVE", "FINANCE"], status: "ACTIVE", activatedAt: new Date("2026-10-06T12:00:00.000Z") },
      ] });

      await tx.phase.create({ data: { id: fixture.phaseId, projectId: project.id, name: "Fase publicada", clientSummary: "Resumen visible de fase", position: 0, status: "IN_PROGRESS" } });
      await tx.milestone.create({ data: { id: fixture.milestoneId, projectId: project.id, phaseId: fixture.phaseId, title: "Hito publicado del portal", description: "Contexto visible del hito", position: 0, status: "IN_PROGRESS" } });
      await tx.deliverable.createMany({ data: [
        { id: fixture.deliverableId, projectId: project.id, milestoneId: fixture.milestoneId, title: fixture.publishedDeliverableTitle, description: "Entrega sintética visible y pendiente de aceptación.", status: "IN_REVIEW" },
        { id: fixture.draftDeliverableId, projectId: project.id, title: fixture.draftDeliverableTitle, description: "No debe salir del backoffice.", status: "DRAFT" },
      ] });
      await tx.document.createMany({ data: [
        { id: fixture.documentId, projectId: project.id, deliverableId: fixture.deliverableId, title: "Documento publicado sintético", state: "PUBLISHED" },
        { id: fixture.draftDocumentId, projectId: project.id, deliverableId: fixture.draftDeliverableId, title: "DOCUMENTO BORRADOR INTERNO", state: "DRAFT" },
      ] });
      await tx.documentVersion.create({ data: { id: fixture.documentVersionId, documentId: fixture.documentId, version: 1, label: "Revisión sintética", notes: "NOTA INTERNA NO PUBLICABLE", authoredById: admin.id } });
      await tx.decision.create({ data: { id: fixture.decisionId, projectId: project.id, createdById: admin.id, title: "Decisión publicada sintética", context: "CONTEXTO INTERNO NO PUBLICABLE", outcome: "Resultado visible de la decisión", status: "DECIDED", decidedAt: new Date("2026-10-06T12:00:00.000Z") } });
      await tx.invoice.create({ data: { id: fixture.invoiceId, projectId: project.id, number: fixture.invoiceNumber, documentState: "ISSUED", paymentState: "UNPAID", currency: "USD", totalMinor: 12500, issuedAt: new Date("2026-10-06T12:00:00.000Z"), externalUrl: "https://billing.example.test/e2e-invoice" } });

      const visibleTicket = await tx.ticket.create({ data: { id: fixture.visibleTicketId, projectId: project.id, subject: "Ticket visible sintético", status: "OPEN", priority: "NORMAL", milestoneId: fixture.milestoneId, createdById: collaborator.id } });
      const internalTicket = await tx.ticket.create({ data: { id: fixture.internalTicketId, projectId: project.id, subject: "TICKET INTERNO NO VISIBLE", status: "OPEN", priority: "HIGH", createdById: admin.id } });
      const closedTicket = await tx.ticket.create({ data: { id: fixture.closedTicketId, projectId: project.id, subject: "Ticket cerrado sintético", status: "CLOSED", priority: "LOW", createdById: collaborator.id } });
      await tx.ticketMessage.createMany({ data: [
        { id: "10000000-0000-4000-8000-000000000311", ticketId: visibleTicket.id, authorId: collaborator.id, body: "Mensaje visible del cliente sintético.", visibility: "CLIENT" },
        { id: "10000000-0000-4000-8000-000000000312", ticketId: visibleTicket.id, authorId: admin.id, body: fixture.internalMessage, visibility: "INTERNAL" },
        { id: "10000000-0000-4000-8000-000000000313", ticketId: internalTicket.id, authorId: admin.id, body: "Contenido íntegramente interno.", visibility: "INTERNAL" },
        { id: "10000000-0000-4000-8000-000000000314", ticketId: closedTicket.id, authorId: collaborator.id, body: "Conversación visible ya cerrada.", visibility: "CLIENT" },
      ] });

      const snapshot = {
        schemaVersion: 1,
        generatedAt: "2026-10-06T12:00:00.000Z",
        project: { id: project.id, name: project.name, objective: project.objective, summary: project.summary, status: project.status, startDate: null, targetDate: null },
        phases: [{ id: fixture.phaseId, name: "Fase publicada", summary: "Resumen visible de fase", position: 0, status: "IN_PROGRESS" }],
        milestones: [{ id: fixture.milestoneId, phaseId: fixture.phaseId, title: "Hito publicado del portal", description: "Contexto visible del hito", position: 0, status: "IN_PROGRESS", dueAt: null }],
        deliverables: [{ id: fixture.deliverableId, milestoneId: fixture.milestoneId, title: fixture.publishedDeliverableTitle, description: "Entrega sintética visible y pendiente de aceptación.", status: "IN_REVIEW", dueAt: null, documents: [{ id: fixture.documentId, title: "Documento publicado sintético", state: "PUBLISHED", versions: [{ id: fixture.documentVersionId, version: 1, label: "Revisión sintética", createdAt: "2026-10-06T12:00:00.000Z", file: null }] }] }],
        decisions: [{ id: fixture.decisionId, title: "Decisión publicada sintética", outcome: "Resultado visible de la decisión", decidedAt: "2026-10-06T12:00:00.000Z" }],
        billing: [{ id: fixture.invoiceId, number: fixture.invoiceNumber, documentState: "ISSUED", paymentState: "UNPAID", currency: "USD", totalMinor: 12500, issuedAt: "2026-10-06T12:00:00.000Z", dueAt: null, externalUrl: "https://billing.example.test/e2e-invoice" }],
      };
      await tx.projectPublication.create({ data: { projectId: project.id, version: 1, status: "PUBLISHED", snapshot: snapshot as Prisma.InputJsonValue, changeSummary: "Snapshot sintético para aceptación del portal", publishedById: admin.id } });
      await tx.activityEvent.createMany({ data: [
        { projectId: project.id, actorId: admin.id, type: "PROJECT_PUBLISHED", data: { version: 1 }, visibleToClient: true },
        { projectId: project.id, actorId: admin.id, type: "INTERNAL_SECRET_EVENT", data: { note: "NO VISIBLE" }, visibleToClient: false },
      ] });

      const commonSubmission = {
        email: "requester@syntavera.invalid",
        organization: fixture.organizationName,
        role: "Rol sintético",
        context: "Solicitud creada únicamente para validar los controles de aceptación.",
        privacyVersion: "e2e-isolated",
        privacyAcceptedAt: new Date("2026-10-06T12:00:00.000Z"),
        notificationAttempts: 0,
        notificationLastAttemptAt: null,
        notificationSentAt: null,
      } as const;
      await tx.contactSubmission.upsert({
        where: { id: fixture.statusSubmissionId },
        create: {
          id: fixture.statusSubmissionId,
          name: fixture.statusSubmissionName,
          ...commonSubmission,
          status: "NEW",
          notificationStatus: "NOT_REQUIRED",
          notificationLastErrorCode: null,
        },
        update: {
          name: fixture.statusSubmissionName,
          ...commonSubmission,
          status: "NEW",
          notificationStatus: "NOT_REQUIRED",
          notificationLastErrorCode: null,
        },
      });
      await tx.contactSubmission.upsert({
        where: { id: fixture.retrySubmissionId },
        create: {
          id: fixture.retrySubmissionId,
          name: fixture.retrySubmissionName,
          ...commonSubmission,
          status: "NEW",
          notificationStatus: "FAILED",
          notificationLastErrorCode: "E2E_SYNTHETIC_FAILURE",
        },
        update: {
          name: fixture.retrySubmissionName,
          ...commonSubmission,
          status: "NEW",
          notificationStatus: "FAILED",
          notificationLastErrorCode: "E2E_SYNTHETIC_FAILURE",
        },
      });
    });

    process.stdout.write("Isolated authenticated E2E fixture ready\n");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Authenticated E2E fixture failed"}\n`);
  process.exitCode = 1;
});
