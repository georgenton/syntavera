import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import { PrismaClient } from "../../src/generated/prisma/client";
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
