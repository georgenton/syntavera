# Evidencia de verificación V1

Fecha: 2026-09-30. Entorno: macOS arm64, Node.js 24.21.0 mediante mise y PostgreSQL 17 en Docker local aislado.

## Gates ejecutados

- `pnpm lint`: correcto, cero warnings.
- `pnpm typecheck`: correcto.
- `pnpm test`: 6 archivos y 18 pruebas unitarias correctas.
- `pnpm prisma:validate`: schema válido.
- `prisma migrate status`: cuatro migraciones aplicadas; base actualizada.
- `pnpm build`: build optimizado de Next.js correcto, 21 páginas estáticas generadas y rutas dinámicas compiladas.
- Playwright público y autenticado: 21 pruebas correctas en 1440×1000, 768×1024 y 390×844.
- Regresión visual: 3 snapshots correctos en los mismos breakpoints, con animaciones deshabilitadas y `prefers-reduced-motion`.
- Smoke de producción en puerto 3100: `/api/health` respondió `200` con `database: ok`; home respondió `200`; `/admin` respondió `307` hacia login. CSP, HSTS, no-sniff, frame deny, permissions policy y `X-Robots-Tag` fueron observados.

## Recorrido funcional real

En la base local se creó una organización, contacto, proyecto, fase, hito, entregable y documento en borrador. Se publicaron snapshots v1 y v2. Se recorrió login interno, invitación cliente, magic link, selector de proyecto y todas las vistas del portal. El snapshot v2 mostró objetivo, fase, hito y entregable; el documento en borrador no apareció.

Se verificó que:

- la invitación y el magic link no admiten replay;
- el usuario cliente queda ligado a la organización del proyecto;
- una organización diferente no puede reutilizar ese usuario;
- el cliente no entra a `/admin`;
- plan, documentos, entregables, facturación, actividad y soporte cargan con filtros de servidor;
- los datos internos y documentos en borrador no cruzan al snapshot.

## Límites externos abiertos

- La imagen Docker multi-stage se intentó construir dos veces; Docker Desktop agotó el tiempo al resolver `docker/dockerfile:1.7` desde Docker Hub, antes de ejecutar una instrucción del proyecto. El build Next productivo y su smoke local sí quedaron verificados.
- No se ejecutó un upload real a R2 ni una entrega SMTP real porque no se proporcionaron credenciales. Las abstracciones, validaciones, confirmación `HeadObject`, correo de desarrollo y fallos explícitos de producción sí están implementados.
- No se desplegó staging o producción porque no se proporcionaron destino, secretos, DNS ni acceso a Cloudflare/Coolify/Traefik.
- El formulario de contacto productivo sigue cerrado deliberadamente hasta instalar texto legal aprobado y fijar `PRIVACY_POLICY_VERSION`.
