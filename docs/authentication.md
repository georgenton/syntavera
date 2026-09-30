# Autenticación y autorización

Better Auth expone `/api/auth/[...all]`.

- Equipo interno: email/contraseña, `disableSignUp`, mínimo 12 caracteres, roles `ADMIN` o `PROJECT_MANAGER`.
- Cliente: usuario creado por el equipo, membership de proyecto, invitación propia de un solo uso y magic link Better Auth de un solo uso (10 minutos, token almacenado con hash).
- No hay signup público.

Los helpers obligatorios son `requireSession`, `requireInternalUser`, `requireAdmin`, `requireProjectAccess` y `requirePermission`. `requireInternalProjectAccess` combina las fronteras para mutaciones de backoffice.

Permisos cliente: `VIEW`, `COMMENT`, `APPROVE`, `FINANCE`. Ser miembro de otro proyecto nunca concede acceso cruzado. Un project manager solo accede a proyectos asignados; un admin accede a todos.

Rotación de `BETTER_AUTH_SECRET` debe planificarse con la capacidad de secrets múltiples de Better Auth si se desea preservar sesiones.
