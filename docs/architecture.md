# Arquitectura

SyntaVera V1 es un monolito modular en Next.js. Las rutas viven en `src/app`; reglas de negocio y acceso en `src/modules`; componentes compartidos en `src/components`; infraestructura en `src/lib`.

## Superficies

- Público: contenido estático o Server Components, formulario mediante Server Action.
- Backoffice: fuente relacional, protegido para `INTERNAL` y rol/asignación.
- Portal: snapshots explícitos por proyecto, protegido por membership y permisos.
- APIs: Better Auth, healthcheck, carga y descarga privada.

`proxy.ts` solo hace redirección optimista por cookie. Los guards server-side son la frontera de seguridad real.

## Publicación

```text
Backoffice relacional → selección explícita → snapshot JSONB versionado → portal
                              │
                              └─ AuditLog + ActivityEvent
```

El schema Zod de publicación es estricto. La facturación se elimina al leer si el membership no tiene `FINANCE`. Soporte y actividad son consultas live con filtros `CLIENT`/`visibleToClient` ejecutados en servidor.
