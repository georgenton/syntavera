# Modelo de datos

La definición ejecutable vive en `prisma/schema.prisma`; las migraciones versionadas son el historial contractual. PostgreSQL usa UUID para claves internas y enums ingleses para estados.

## Agregados principales

- Identidad: `User`, `Session`, `Account`, `Verification`.
- Cliente y trabajo: `Organization`, `Contact`, `Project`, `ProjectInternal`, `ProjectMembership`.
- Ejecución: `Phase`, `Milestone`, `Deliverable`, `Decision`, `TimelineEvent`.
- Documentos: `Document`, `DocumentVersion`, `FileObject`, `Acceptance`.
- Operación: `Invoice`, `Payment`, `Ticket`, `TicketMessage`, `ActivityEvent`, `AuditLog`.
- Entrada pública y publicación: `ContactSubmission`, `ProjectPublication`, `RateLimitBucket`, `ClientInvitation`.

`ProjectInternal` guarda información exclusivamente interna. `ProjectPublication.snapshot` es una whitelist versionada para el portal, nunca una serialización directa de las tablas. `Acceptance` fija usuario, organización, sesión y versión exacta. `Invoice.documentState` y `Invoice.paymentState` permanecen independientes.

No se usa `db push` en despliegues. Consultar también `database.md` para comandos y política de migración.
