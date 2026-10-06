# SyntaVera

Aplicación full-stack V1 para el sitio público, backoffice interno y portal privado de clientes de SyntaVera.

## Stack fijado

- Node.js 24.21.0, pnpm 10.33.2
- Next.js 16.3.7 App Router, React 19.3, TypeScript strict
- PostgreSQL + Prisma 7.10
- Better Auth 1.7.6
- Zod, Vitest y Playwright
- S3-compatible private object storage (Cloudflare R2 en producción)

## Inicio local

1. Activa Node con `mise trust && mise install` o usa `.nvmrc`.
2. Copia `.env.example` a `.env` y genera `BETTER_AUTH_SECRET` con al menos 32 caracteres aleatorios.
3. Inicia PostgreSQL: `docker compose up -d db`. El puerto local predeterminado es `5545` para no ocupar el `5432`; puedes cambiarlo con `POSTGRES_PORT`.
4. Instala y prepara:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm prisma:generate
pnpm prisma:migrate:deploy
pnpm dev
```

Para crear el primer administrador en una base local aislada, define `ALLOW_DEMO_SEED=true`, `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD`, y ejecuta `pnpm prisma:seed`. El seed no crea clientes, claims ni casos ficticios.

## Gates de calidad

```bash
pnpm prisma:validate
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

El formulario público permanece cerrado mientras falte cualquiera de sus gates: `PUBLIC_CONTACT_ENABLED=true`, versión legal aprobada coincidente, recepción/notificación configurada y entrega verificada. Consulta la [lista de activación](./docs/contact-activation.md).

Consulta [arquitectura](./docs/architecture.md), [modelo de datos](./docs/data-model.md), [auth y permisos](./docs/auth-and-permissions.md), [handoff visual](./docs/design-handoff.md), [storage y correo](./docs/storage-email.md), [activación de Contact](./docs/contact-activation.md), [candidato de publicación](./docs/publication-candidate.md), [asistente futuro](./docs/future-assistant.md), [backup/restore](./docs/backup-restore.md), [deployment](./docs/deployment.md), [evidencia base](./docs/verification.md), [verificación de la afinación pública](./docs/website-affination-verification.md) y [runbook](./docs/runbook.md).
