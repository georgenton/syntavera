# Evidencia de verificación V1

Fecha: 2026-09-30. Entorno: macOS arm64, Node.js 24.21.0 mediante mise y PostgreSQL 17 en Docker local aislado.

## Gates ejecutados

- `pnpm lint`: correcto, cero warnings.
- `pnpm typecheck`: correcto.
- `pnpm test`: 6 archivos y 18 pruebas unitarias correctas.
- `pnpm prisma:validate`: schema válido.
- `prisma migrate status`: cuatro migraciones aplicadas; base actualizada.
- `pnpm build`: build optimizado de Next.js correcto, 21 páginas estáticas generadas y rutas dinámicas compiladas.
- Playwright final: 24 pruebas públicas/visuales correctas en 1440×900, 768×1024 y 390×844. Las 6 pruebas autenticadas se repitieron por separado, con credenciales efímeras sobre la base aislada, y también pasaron: 30/30 verificadas.
- Auditoría visual: 15 pares referencia/implementación capturados con DPR 1 y sin P0/P1 abiertos. Las 30 capturas y mediciones están en [la auditoría de paridad](visual-parity-audit.md).
- Regresión visual: 9 snapshots públicos correctos y deterministas en los tres breakpoints, con animaciones deshabilitadas, `prefers-reduced-motion` y ejecución habilitada en CI.
- Smoke de la imagen Docker final: contenedor `healthy`; `/api/health` respondió `200` con `database: ok` y 2 ms de latencia. CSP, HSTS, no-sniff, frame deny, permissions policy y políticas cross-origin fueron observadas.

## Recorrido funcional real

En la base local se creó una organización, contacto, proyecto, fase, hito, entregable y documento en borrador. Se publicaron snapshots v1 y v2. Se recorrió login interno, invitación cliente, magic link, selector de proyecto y todas las vistas del portal. El snapshot v2 mostró objetivo, fase, hito y entregable; el documento en borrador no apareció.

Se verificó que:

- la invitación y el magic link no admiten replay;
- el usuario cliente queda ligado a la organización del proyecto;
- una organización diferente no puede reutilizar ese usuario;
- el cliente no entra a `/admin`;
- plan, documentos, entregables, facturación, actividad y soporte cargan con filtros de servidor;
- los datos internos y documentos en borrador no cruzan al snapshot.

## Docker

Se retiró la directiva innecesaria `docker/dockerfile:1.7`. El build real `docker build --target runner -t syntavera:predeploy .` terminó correctamente para Linux arm64. La imagen se arrancó de forma efímera contra PostgreSQL local y pasó su healthcheck; después se retiró el contenedor de smoke. El digest debe fijarse en el registry al publicar staging, para promover exactamente el mismo artefacto a producción.

## Límites externos abiertos

- No se ejecutó un upload real a R2 ni una entrega SMTP externa porque no se proporcionaron credenciales. Las abstracciones, validaciones, confirmación `HeadObject`, correo de desarrollo y fallos explícitos de producción sí están implementados.
- No se desplegó staging ni producción porque no se proporcionaron acceso y secretos de Cloudflare/Coolify. El procedimiento exacto queda en [staging-deployment.md](staging-deployment.md).
- El formulario de contacto productivo sigue cerrado deliberadamente hasta instalar texto legal aprobado y fijar `PRIVACY_POLICY_VERSION`.
- Producción no fue desplegada ni modificada.
