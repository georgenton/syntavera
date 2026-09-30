# Storage y correo

## Storage privado

La abstracción usa S3 API y está preparada para Cloudflare R2. El bucket debe ser privado, sin URL pública. Upload y download usan URLs firmadas de TTL corto. El servidor valida proyecto, permiso, visibilidad, MIME y tamaño antes de firmar. El cliente sube primero a la URL firmada y después llama a `/api/files/complete-upload`; el servidor confirma el objeto con `HeadObject` y solo entonces registra metadata y auditoría.

Variables: `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `SIGNED_URL_TTL_SECONDS`, `MAX_UPLOAD_BYTES`.

R2 debe permitir CORS `PUT` desde los orígenes exactos de staging y producción, con `Content-Type` entre los headers permitidos. No se debe habilitar `*` para orígenes compartidos ni hacer público el bucket.

Rotar credenciales si aparecen en logs o clientes. No registrar URLs firmadas.

## Correo

SMTP envía invitaciones, magic links y notificaciones de contacto. Variables: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`, `CONTACT_NOTIFICATION_TO`.

En desarrollo y test, si `SMTP_HOST` no existe, el adapter escribe el mensaje completo entre marcadores `[development-mail]` en la salida del servidor para poder recorrer invitaciones y magic links. En producción la ausencia de SMTP produce un error explícito; nunca se informa un envío ficticio.

SPF, DKIM y DMARC deben validarse antes de producción. Una falla de notificación de contacto no revierte el registro persistido; una falla al enviar invitación deja el acceso sin activar y debe regenerarse.
