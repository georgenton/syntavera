# Verificación final de afinación de la web pública

Fecha: 2026-10-05. Entorno local: macOS arm64, Node.js 24.21.0 y pnpm 10.33.2 mediante mise. Revisión realizada sobre el diff completo del workspace; no se desplegó ni se usó infraestructura compartida.

## Evaluación

**Hito A — candidato apto para solicitar publicación, no publicado.** La web afinada puede prepararse con Contact cerrado. La migración es obligatoria antes de arrancar el nuevo `runner`, incluso con el formulario cerrado. El procedimiento, criterios de detención y reversión están en [publication-candidate.md](publication-candidate.md).

**Hito B — no apto para activación.** Faltan el texto de privacidad aprobado y versionado, remitente autorizado, transporte/credenciales, aceptación del proveedor y llegada comprobada a `contacto@syntavera.dev`. Tener variables configuradas no prueba la entrega.

## Gates ejecutados

- `pnpm prisma:validate`: correcto con Prisma 7.10.0.
- `pnpm prisma:generate`: correcto con Prisma 7.10.0.
- `pnpm lint`: correcto, cero warnings.
- `pnpm typecheck`: correcto.
- `pnpm test`: 13 archivos y 38 pruebas unitarias correctas.
- `pnpm build`: build optimizado de Next.js 16.3.7 correcto.
- Playwright público y visual: 42 pruebas correctas en 1440×900, 768×1024 y 390×844; 6 pruebas autenticadas quedaron omitidas por no proporcionar credenciales E2E. No hubo errores de consola en las rutas públicas revisadas.
- Regresión pública: canonical y sitemap, redirección permanente de `/capabilities`, 404 real, casos incompletos `noindex`, Contact cerrado, CTA internos y ausencia de asistente.
- Control interno: pruebas directas verifican ADMIN frente a PROJECT_MANAGER, autorización antes de leer solicitudes, autorización antes de cambiar estado y autorización antes de reintentar una notificación.
- `git diff --check`: correcto. La revisión de nombres, diff y patrones sensibles no encontró secretos, datos personales reales ni archivos temporales publicables. `.next`, `node_modules`, `playwright-report`, `test-results`, Prisma generado y `tsconfig.tsbuildinfo` permanecen ignorados.

## Qué es integración real y qué está simulado

- **Integración real local:** PostgreSQL 17 desechable, las cinco migraciones versionadas y el cliente Prisma del proyecto. Se probaron filas históricas, defaults, lectura/escritura, índice único e idempotencia concurrente.
- **Navegador real local:** Chromium contra Next.js local para rutas, semántica, destinos de CTA, errores de consola y comparación visual. Las páginas públicas no necesitaron una base funcional ni servicios externos.
- **Build real local:** compilación y generación de rutas con valores locales no secretos; no valida el runtime de Coolify ni la infraestructura productiva.
- **Servicios simulados en unitarias:** persistencia fallida/correcta, fallo de notificación, claim, reintento, doble envío, guard ADMIN y estado del canal. Estas pruebas validan el contrato de aplicación, no SMTP, el proveedor ni la bandeja.
- **No validado:** transporte SMTP real, aceptación del proveedor, llegada a bandeja, backup/restauración de staging o producción, migración productiva y login E2E autenticado con usuarios reales.

## Prueba de migración

Se creó un contenedor efímero independiente `postgres:17-bookworm`, escuchando solo en localhost, con una base cuyo nombre contenía `review`. No se tocó el contenedor existente del proyecto. Se aplicaron las cuatro migraciones anteriores, se insertaron dos registros sintéticos `.invalid`, se marcaron esas migraciones con Prisma y se ejecutó `pnpm prisma:migrate:deploy` para `20261005090000_contact_delivery_state`.

Resultado verificado por `tools/verification/verify-contact-migration.ts`:

- 2/2 registros históricos conservados y consultables.
- Históricos con `requestKey=null`, `notificationStatus=NOT_REQUIRED` y `notificationAttempts=0`; no se encolaron notificaciones.
- Una escritura con la forma del código anterior, omitiendo todos los campos nuevos, fue aceptada y recibió el default de base `PENDING`.
- Dos creaciones concurrentes con la misma UUID produjeron exactamente `created` + `duplicate` y una sola fila.
- Un nuevo reintento devolvió `duplicate`; el recuento permaneció en una fila.
- La solicitud nueva quedó `PENDING`, con cero intentos; no se invocó el módulo de correo.
- `prisma migrate status` terminó con el esquema actualizado.
- El contenedor se detuvo y fue autoeliminado al finalizar.

La migración es expansiva. El código anterior tolera temporalmente el esquema nuevo porque puede omitir las columnas añadidas, pero crearía filas `PENDING` que no sabe procesar. Por ello el orden seguro es migración → comprobación → nuevo `runner`, y la convivencia o reversión al binario anterior solo es aceptable con Contact cerrado. Revertir la aplicación no revierte el esquema; no se planifica un SQL inverso automático.

## Correcciones adicionales de la revisión

- Se reemplazó el guard interno genérico por `requireAdmin()` tanto en la consulta de solicitudes como en las acciones de estado y reintento.
- Se añadió validación UUID al identificador de la mutación de estado.
- El claim de reintento y su auditoría ahora se confirman en una sola transacción; si la auditoría falla, no se intenta el envío.
- Se añadió `CONTACT_DELIVERY_VERIFIED`; el canal ya no se considera disponible solo porque SMTP tenga configuración.
- Se agregaron pruebas directas del Server Action: gate antes de validar/persistir, fallo de persistencia sin confirmación, persistencia con notificación separada y duplicado sin nueva notificación.
- Se agregaron pruebas de lectura y mutaciones administrativas para ADMIN y no ADMIN.
- Se agregaron referencias visuales de Nosotros y Contacto en los tres breakpoints, sin reescribir indiscriminadamente las referencias existentes.
- Se agregó el verificador reproducible de migración con guardas que rechazan hosts no locales y bases sin `review` en el nombre.

## Contacto

La disponibilidad se resuelve una sola vez con el mismo contrato para la página y el Server Action. Mientras un gate esté incompleto no se renderizan campos, una petición directa se rechaza antes de validación/rate-limit/persistencia y los CTA llevan a contenido informativo real.

La confirmación significa únicamente que la solicitud quedó persistida. La notificación se ejecuta después y su fallo deja la fila auditable en `FAILED`. El reintento solo puede iniciarlo un ADMIN y el claim atómico evita reenvíos de una notificación ya procesada. No se envió ningún correo real.

`contacto@syntavera.dev` está confirmado únicamente como destinatario. El remitente, el transporte, las credenciales, la aceptación y la llegada siguen siendo gates separados. La prueba posterior autorizada está descrita, sin secretos ni datos reales, en [contact-activation.md](contact-activation.md).

## Revisión visual y evidencia

La identidad visual se conserva. Inicio, Contacto, Labs y Nosotros se revisaron en el build optimizado y en los tres snapshots responsivos. No se observan notas internas, placeholders públicos, asistente, widgets, video sin recurso ni promesas de resultados o despliegues. La versión sin medios opcionales se percibe terminada.

Labs muestra exactamente `Ficha de capacidad`, `Co-desarrollo`, `Validación comercial` y `Candidato a piloto`; cada ficha declara límites. Nosotros identifica a FeelVerse como venture independiente y explícitamente niega que sea producto o cliente de SyntaVera. Los CTA visibles son internos y respondieron con estado menor a 400.

- [Inicio antes](evidence/public-home-before-1440.png) — producción, lectura solamente.
- [Inicio después](evidence/public-home-after-1440.png) — build optimizado local.
- [Contacto antes](evidence/public-contact-before-1440.png) — producción, lectura solamente; no se envió el formulario.
- [Contacto después](evidence/public-contact-after-1440.png) — build optimizado local, recolección bloqueada.
- [Labs después](evidence/public-labs-after-1440.png) — build optimizado local, sin medio opcional.
- [Nosotros después](evidence/public-about-after-1440.png) — build optimizado local.
- Quince snapshots Darwin (cinco rutas por tres breakpoints) y cinco referencias Linux desktop para CI están en `tests/e2e/visual-reference.spec.ts-snapshots/`.

## Bloqueos y autorizaciones

Para publicar Hito A todavía se requiere autorización humana para crear/promover el artefacto fuera del equipo local, ejecutar backup y ensayo de restauración del entorno objetivo, migrar staging/producción, desplegar y hacer smoke autenticado. El commit no se ha enviado a ningún remoto.

Para Hito B, además, se requiere aprobación e instalación de privacidad, configuración secreta del remitente/transporte, una prueba de correo controlada con confirmación de proveedor y bandeja, cambio de variables y autorización explícita para habilitar Contact.

No se hizo push, merge, despliegue, cambio DNS, migración fuera de la base desechable ni envío externo.
