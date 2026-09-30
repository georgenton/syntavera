# SyntaVera — plan de implementación productiva V1

Fecha de decisión: 2026-09-30  
Fuente normativa principal: solicitud productiva V1 del usuario.  
Referencia visual: handoff `SyntaVera Design System (1).zip`.

## Resolución de preguntas abiertas y contradicciones

La solicitud productiva V1 prevalece sobre `15-open-questions.md` y resuelve todas sus decisiones de producto. No quedan contradicciones funcionales abiertas: habrá portal real en V1, autenticación separada por audiencia, permisos por proyecto, publicación mediante snapshot, archivos privados, facturación externa y casos incompletos fuera de indexación.

Decisiones de cautela:

- El enlace visible de privacidad se mantiene, pero el contenido jurídico se sirve con versión y estado. El contacto productivo no se habilita hasta contar con texto legal aprobado.
- `Insights` y el perfil de experto placeholder se ocultan en V1.
- `/capabilities` redirige permanentemente a `/how-we-work#capabilities`; el destino conserva un alias `#capacidades` accesible.
- Los casos placeholder pueden existir para revisión, pero usan `noindex` y no aparecen en el sitemap.
- Los demos son experiencias honestas y deterministas; “LLM Twin” se presenta únicamente como planeado.
- La aceptación en portal queda registrada contra una versión exacta y no se presenta como firma legal.
- FeelVerse se identifica como iniciativa independiente de Jorge, no como producto o cliente de SyntaVera.

Bloqueos externos para habilitar un entorno compartido o producción:

1. Texto legal de privacidad aprobado y versionado.
2. Credenciales reales de PostgreSQL, correo y almacenamiento S3/R2.
3. Acceso al destino de staging/producción, dominio, DNS, Cloudflare, Traefik y secretos finales del entorno.

## Versiones base verificadas

- Node.js `24.21.0` LTS.
- Next.js `16.3.7` (App Router, release estable y parcheada vigente).
- Prisma `7.10.0`; Prisma 8 continúa en canal RC y queda excluido.
- Better Auth `1.7.6` estable.
- Gestor: `pnpm` mediante Corepack.

- TypeScript `6.0.3` y ESLint `9.39.5`, últimas versiones estables dentro de los rangos peer declarados por el toolchain de Next.js.

Las versiones restantes se fijan en `package.json` y `pnpm-lock.yaml`, y se validan durante la instalación.

## Matriz de trazabilidad

| Requirement | Source | Decision | Implementation | Test | Status |
|---|---|---|---|---|---|
| Monolito modular full-stack | Solicitud §arquitectura | Un único Next.js App Router | `src/app`, `src/modules`, `src/components`, `src/lib` | build + smoke | Verificado |
| Node 24 + pnpm + TS strict | Solicitud §stack | Node 24.21.0 y Corepack | `.nvmrc`, `.node-version`, `.mise.toml`, `package.json`, `tsconfig.json` | typecheck con Node 24 | Verificado |
| Next estable y seguro | Solicitud §versiones | Next 16.3.7 | dependencia fijada, `output: standalone` | build productivo | Verificado |
| Prisma estable, sin preview | Solicitud §versiones | Prisma 7.10.0 | schema, config, cuatro migraciones y seed | validate + migrate status | Verificado |
| Diseño aprobado | Handoff 01–14 + solicitud | Reconstruir componentes con tokens, sin pegar JSX | CSS por capas + librería propia | snapshots 1440/768/390 | Verificado |
| Canon de marca | Solicitud §marca | Solo “SyntaVera” y `syntavera.dev` | constantes de marca + copy importado | test de cadenas prohibidas | Verificado |
| Sitio público | Solicitud §rutas | Home, proceso, labs, about, contact, privacy, cases | route group pública | E2E en tres viewports | Verificado |
| `/capabilities` | Solicitud §rutas | 308 a `/how-we-work#capabilities` | `next.config.ts` redirect | E2E redirect | Verificado |
| Insights oculto | Solicitud + preguntas abiertas | No ruta ni navegación V1 | exclusión del router/nav | canon + sitemap | Verificado |
| Experto placeholder oculto | Solicitud + handoff | No render público | contenido filtrado | canon de marca/copy | Verificado |
| Cases incompletos | Solicitud §SEO | `noindex`, fuera de sitemap | metadata dinámica + catálogo | E2E metadata/sitemap | Verificado |
| Labs honestos | Solicitud §Labs | Demos deterministas con disclosure | rutas `/labs/*` | unit + E2E | Verificado |
| LLM Twin planeado | Solicitud §Labs | Nunca simular ejecución real | estado `planned` | test de copy/estado | Verificado |
| Contacto persistente | Solicitud §contacto | Server Action + Zod + honeypot + límite IP | `ContactSubmission` + módulo contact | schemas + E2E de gate | Implementado; gate legal |
| Texto exacto de éxito | Solicitud §contacto | Conservar literal español | estado del formulario | test exacto | Verificado |
| Privacidad versionada | Solicitud §legal | Mecanismo listo; publicación pendiente | `legal-content.ts` + gate | test de estado | Bloqueo: texto aprobado |
| Auth interna | Solicitud §auth | Email/password, sin registro público | Better Auth + rutas internas | E2E login/redirect | Verificado |
| Auth cliente | Solicitud §auth | Invitación y magic link de un solo uso | Better Auth + invitaciones | recorrido manual y replay denial | Verificado |
| Roles internos | Solicitud §autorización | `ADMIN`, `PROJECT_MANAGER` | enums + guards | matriz de permisos | Verificado |
| Permisos cliente | Solicitud §autorización | `VIEW`, `COMMENT`, `APPROVE`, `FINANCE` por proyecto | membership + política central | cross-project/org denial | Verificado |
| Helpers server | Solicitud §autorización | Cinco guards obligatorios | helpers y guard interno compuesto | unit + E2E | Verificado |
| Modelo de dominio | Solicitud §datos | UUID y enums ingleses estables | `prisma/schema.prisma` | Prisma validate | Verificado |
| Admin relacional | Solicitud §publicación | Fuente canónica interna | organizaciones, contactos, proyectos, documentos, billing y soporte | flujo real local + E2E | Verificado |
| Snapshot cliente | Solicitud §publicación | JSONB explícito y filtrado | `ProjectPublication` + Zod estricto | unit + publicación v2 real | Verificado |
| Aceptación versionada | Solicitud §entregables | Versión exacta + auditoría | `Acceptance` transaccional | boundary tests | Verificado en código |
| Archivos privados | Solicitud §archivos | R2/S3 privado, URL firmada, ~25 MB | upload en dos fases, `HeadObject`, descarga firmada | tipo/tamaño/scope unit | Implementado; requiere R2 real |
| Facturación externa | Solicitud §billing | Solo metadatos; estados separados | Invoice + Payment | estados unit + portal | Verificado |
| Soporte filtrado | Solicitud §tickets | Mensajes internos nunca visibles al cliente | consultas server-side | leakage unit + portal | Verificado |
| Auditoría y actividad | Solicitud §auditoría | Eventos append-only para acciones críticas | `AuditLog`, `ActivityEvent` | recorrido admin/portal | Verificado |
| Portal cliente | Handoff portal + solicitud | Dashboard, plan, docs, entregables, billing, actividad, soporte | `/portal/p/[id]/*` | recorrido real snapshot v2 | Verificado |
| Backoffice | Solicitud §admin | Overview, organizaciones, contactos, proyectos, publicación, billing, soporte | `/admin/*` | E2E tres viewports | Verificado |
| SEO técnico | Solicitud §SEO | metadata, OG raster, robots, sitemap, JSON-LD | Metadata API | E2E assertions | Verificado |
| Accesibilidad | Handoff + solicitud | teclado, foco, contraste, reduced motion | primitives y skip links | E2E + visual reduced-motion | Verificado funcionalmente |
| Seguridad web | Solicitud §seguridad | CSP, headers, validación, cookies seguras | `proxy.ts`, guards y config | smoke de headers/auth | Verificado |
| Docker/Coolify | Solicitud §deploy | multi-stage standalone, migrator separado | Dockerfile + compose | build intentado dos veces | Bloqueo: timeout de registry |
| Healthcheck DB | Solicitud §deploy | `/api/health` verifica proceso y PostgreSQL | route Node runtime | smoke productivo 200/db ok | Verificado |
| Documentación operativa | Solicitud §docs | setup, env, auth, DB, storage, email, deploy, runbook | `README.md`, `docs/*` | revisión final | Verificado |
| Calidad final | Solicitud §gates | typecheck, lint, tests, build, E2E y smoke | scripts CI | 18 unit + 21 E2E + 3 visual | Verificado; Docker con bloqueo externo |

## Secuencia de gates

1. **Gate 0 — Fundaciones:** versiones, scaffold, configuración estricta, Prisma, entorno y primera migración.
2. **Gate 1 — Design system + sitio:** tokens, primitives, shell público, rutas, SEO y contacto.
3. **Gate 2 — Identidad y autorización:** Better Auth, sesiones, invitaciones y guards.
4. **Gate 3 — Dominio y backoffice:** CRUD interno, auditoría y publicación explícita.
5. **Gate 4 — Portal cliente:** snapshots, entregables, aceptaciones, archivos, billing y soporte.
6. **Gate 5 — Operación:** pruebas integrales, Docker, healthcheck, documentación y hardening.

Cada gate termina solo con evidencia ejecutable. Los bloqueos productivos se marcan por separado y no se disfrazan como funcionalidad completa.
