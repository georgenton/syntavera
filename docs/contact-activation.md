# Activación del canal de contacto

El destinatario confirmado es `contacto@syntavera.dev`. Esta dirección se configura en `CONTACT_NOTIFICATION_TO`; no se reutiliza como remitente SMTP, usuario del relay ni secreto.

## Gates previos

- Instalar el aviso de privacidad aprobado en `src/content/legal/privacy.ts`, con versión y fecha reales.
- Configurar la misma versión en `PRIVACY_POLICY_VERSION`.
- Configurar `CONTACT_NOTIFICATION_TO=contacto@syntavera.dev`.
- Configurar y verificar por separado `EMAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` y las credenciales SMTP.
- Mantener `CONTACT_ACCEPT_WITHOUT_NOTIFICATION=false`. Solo cambiarlo si se aprueba expresamente que el backoffice sea el único canal de recepción.
- Mantener `CONTACT_DELIVERY_VERIFIED=false` hasta completar la prueba controlada de aceptación y llegada a bandeja.
- Ejecutar la migración `20261005090000_contact_delivery_state` con el proceso one-shot de migraciones; no durante `next build`.

## Prueba de staging

1. Confirmar que, con cualquier gate incompleto, `/contact` no renderiza campos y muestra el mensaje de canal en preparación.
2. Mantener `PUBLIC_CONTACT_ENABLED=false` y `CONTACT_DELIVERY_VERIFIED=false`. Crear en una tarea one-shot de administración una única `ContactSubmission` sintética, claramente identificada, con email `delivery-probe@syntavera.invalid` y `notificationStatus=FAILED`; no usar datos personales.
3. Con una cuenta `ADMIN`, usar “Reintentar notificación”. Confirmar que pasa una sola vez de `FAILED` a `SENT`, que aumenta `notificationAttempts` y que un segundo intento no vuelve a enviar.
4. Confirmar en el proveedor que el mensaje fue aceptado, que salió desde el `EMAIL_FROM` autorizado y que el `Reply-To` es `delivery-probe@syntavera.invalid`.
5. Confirmar en `contacto@syntavera.dev` la llegada a la bandeja esperada. Registrar fecha, identificador del proveedor y resultado sin copiar credenciales ni contenido del mensaje.
6. Forzar una falla controlada con otro registro sintético: la fila debe permanecer en `FAILED` y ser reintentable; restaurar el transporte antes de continuar.
7. Solo después de la aceptación y llegada, configurar `CONTACT_DELIVERY_VERIFIED=true` en staging.
8. Instalar la privacidad aprobada, configurar su versión coincidente y habilitar temporalmente `PUBLIC_CONTACT_ENABLED=true` en staging. Enviar una única solicitud pública sintética y confirmar una fila, un `requestKey` y una notificación.
9. Volver a cerrar el formulario si queda alguna observación y ejecutar lint, typecheck, unitarias, build y E2E públicos/autenticados.

## Activación productiva

Tomar backup, ejecutar la migración con el mismo artefacto aprobado y repetir el smoke de solo lectura. Con el formulario aún cerrado, repetir la prueba interna de reintento contra el transporte productivo y confirmar llegada a `contacto@syntavera.dev`. Solo entonces configurar `CONTACT_DELIVERY_VERIFIED=true` y `PUBLIC_CONTACT_ENABLED=true`. No probar con datos reales antes de que el servidor muestre el canal disponible.

La confirmación al visitante significa que la solicitud quedó persistida. La notificación interna es posterior y auditable; su fallo no borra la recepción.
