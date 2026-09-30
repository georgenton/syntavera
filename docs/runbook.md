# Runbook

## Incidente de aplicación

1. Consultar `/api/health`; distinguir aplicación de base de datos.
2. Revisar logs sin copiar PII, tokens, cookies ni URLs firmadas.
3. Si la release es la causa, revertir la imagen al digest anterior. No revertir una migración a ciegas.
4. Si PostgreSQL falla, detener escrituras, verificar proveedor/backup y restaurar siguiendo su runbook.

## Auth

- Revocar sesiones afectadas en la tabla `Session` o deshabilitar al usuario.
- Revocar invitaciones con `revokedAt`; no reutilizar tokens.
- Ante exposición de secret, rotar según Better Auth, invalidar sesiones si procede y auditar accesos.

## Storage

- Revocar/rotar la key de R2, mantener bucket privado y revisar AuditLog.
- Una URL firmada expira; no se “revoca” individualmente sin cambiar el objeto/credencial.

## Contacto y correo

- Ante abuso, bajar `CONTACT_RATE_LIMIT_MAX` o cerrar temporalmente `PUBLIC_CONTACT_ENABLED`.
- Los registros ya persistidos sobreviven una caída SMTP; reprocesar la notificación desde backoffice sin duplicar el submission.

## Backup

Verificar backup PostgreSQL antes de cada migración material y ejecutar una restauración de prueba periódica. La existencia del backup sin prueba de restore no cierra el gate.
