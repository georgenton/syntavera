# Auth y permisos

Better Auth persiste sesiones y credenciales mediante Prisma. No existe signup público.

- Internos: email/contraseña, roles `ADMIN` y `PROJECT_MANAGER`.
- Clientes: alta por invitación de un solo uso, luego magic links de diez minutos almacenados con hash.
- Proyecto: permisos explícitos `VIEW`, `COMMENT`, `APPROVE`, `FINANCE`.

La frontera real siempre es servidor. `requireSession`, `requireInternalUser`, `requireAdmin`, `requireProjectAccess`, `requirePermission` y `requireInternalProjectAccess` consultan usuario, organización, membership y asignación. La cookie de `proxy.ts` solo permite una redirección temprana y nunca concede acceso.

Un cliente debe pertenecer a la misma organización del proyecto y tener un membership activo para ese ID exacto. `FINANCE` controla facturación; `APPROVE` permite aceptar únicamente versiones presentes en el snapshot vigente. Los mensajes `INTERNAL` se filtran en la consulta del servidor.

`authentication.md` conserva el detalle operativo de rotación y revocación.
