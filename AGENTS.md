# SyntaVera repository instructions

## Canon

- La marca visible es exactamente `SyntaVera`; el dominio canónico es `syntavera.dev`.
- No inventar clientes, testimonios, logotipos, métricas, resultados, precisión, despliegues ni madurez.
- FeelVerse es un venture independiente de Jorge Quizamanchuro; no es producto ni cliente de SyntaVera.
- Mantener Insights y perfiles placeholder fuera de la web hasta tener contenido real y permiso.

## Arquitectura y seguridad

- Mantener un monolito modular Next.js App Router. Preferir Server Components; usar `"use client"` solo donde haya interacción.
- Toda mutación valida input con Zod y vuelve a comprobar sesión/autorización dentro del Server Action o Route Handler.
- Usar exclusivamente los guards de `src/modules/auth/guards.ts`; nunca confiar en `proxy.ts` como control de seguridad.
- El backoffice relacional es la fuente interna. El portal solo consume snapshots `ProjectPublication` y consultas live explícitamente filtradas.
- Nunca añadir notas internas, `storageKey`, credenciales o mensajes `INTERNAL` a un snapshot o respuesta cliente.
- La aceptación apunta a una `DocumentVersion` exacta y siempre conserva la frase que aclara que no es firma legal.
- Archivos privados: autorización antes de firmar URL, TTL corto, MIME permitido y máximo configurado (25 MiB por defecto).

## Datos y migraciones

- IDs UUID; enums persistidos en inglés y labels de UI en español.
- Prisma estable, sin previews. No ejecutar migraciones durante `next build`.
- Cada cambio de schema incluye migración revisable y `pnpm prisma:validate` + `pnpm prisma:generate`.
- El seed exige opt-in explícito y no crea evidencia comercial ficticia.

## Calidad

- Antes de entregar: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` y E2E relevantes.
- Añadir tests de denegación cruzada cuando cambien permisos; tests de leakage cuando cambien snapshots, soporte o archivos.
- Mantener accesibilidad de teclado, foco visible, HTML semántico y `prefers-reduced-motion`.
- Usar el copy estructurado en `src/content/website-content.json`; no reescribirlo a mano.

## Operación

- Node 24.21.0 y pnpm 10.33.2 son la base reproducible.
- Secretos solo por entorno. Nunca subir `.env`, tokens, credenciales o URLs firmadas.
- El contacto productivo requiere texto de privacidad aprobado, versión coincidente y gate habilitado.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
