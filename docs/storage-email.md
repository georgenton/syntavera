# Storage y correo

## Storage privado

La abstracción usa S3 API y está preparada para Cloudflare R2. El bucket debe ser privado, sin URL pública. Upload y download usan URLs firmadas de TTL corto. El servidor valida proyecto, permiso, visibilidad, MIME y tamaño antes de firmar. El cliente sube primero a la URL firmada y después llama a `/api/files/complete-upload`; el servidor confirma el objeto con `HeadObject` y solo entonces registra metadata y auditoría.

Variables: `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `SIGNED_URL_TTL_SECONDS`, `MAX_UPLOAD_BYTES`.

R2 debe permitir CORS `PUT` desde los orígenes exactos de staging y producción, con `Content-Type` entre los headers permitidos. No se debe habilitar `*` para orígenes compartidos ni hacer público el bucket.

Rotar credenciales si aparecen en logs o clientes. No registrar URLs firmadas.

## Correo

SMTP envía invitaciones, magic links y notificaciones de contacto. Variables: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`, `CONTACT_NOTIFICATION_TO`, `CONTACT_ACCEPT_WITHOUT_NOTIFICATION`, `CONTACT_DELIVERY_VERIFIED`.

En desarrollo y test, si `SMTP_HOST` no existe, el adapter escribe el mensaje completo entre marcadores `[development-mail]` en la salida del servidor para poder recorrer invitaciones y magic links. CI puede dirigir esos mensajes a `E2E_MAILBOX_PATH`, un archivo temporal no publicado que permite probar enlaces de un solo uso sin transporte externo. Esa variable está prohibida en producción. En producción la ausencia de SMTP produce un error explícito; nunca se informa un envío ficticio.

SPF, DKIM y DMARC deben validarse antes de producción. `CONTACT_NOTIFICATION_TO=contacto@syntavera.dev` es el destino confirmado. `EMAIL_FROM` debe ser un remitente verificado distinto de las credenciales del relay; el email escrito por la persona se usa únicamente como `Reply-To`.

La presencia de estas variables solo confirma configuración. `CONTACT_DELIVERY_VERIFIED=true` se reserva para cuando una prueba autorizada confirme aceptación del proveedor y llegada al buzón correcto; antes de esa evidencia el formulario continúa cerrado.

La recepción y la notificación son estados separados. Primero se persiste `ContactSubmission`; después se intenta la notificación. Una falla SMTP no elimina ni duplica la solicitud: queda `FAILED`, conserva un código operativo no sensible y puede reintentarse desde el backoffice. `SENT` no vuelve a enviarse. `NOT_REQUIRED` solo se usa cuando `CONTACT_ACCEPT_WITHOUT_NOTIFICATION=true` declara expresamente que el backoffice es el único canal de recepción.
