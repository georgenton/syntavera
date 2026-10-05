# Matriz de variables por entorno

No contiene secretos reales. Los valores descritos como `secret manager` deben configurarse en Coolify y nunca guardarse en Git. Staging y producción usan bases y buckets independientes.

| Variable | Staging | Production | Secret | Required to boot | Feature |
| -------- | ------- | ---------- | ------ | ---------------- | ------- |
| `NODE_ENV` | `production` | `production` | No | Sí | Runtime |
| `APP_URL` | `https://staging.syntavera.dev` | `https://syntavera.dev` | No | Sí | URL canónica |
| `BETTER_AUTH_URL` | `https://staging.syntavera.dev` | `https://syntavera.dev` | No | Sí | Auth |
| `BETTER_AUTH_SECRET` | Secret manager, único para staging | Secret manager, único para producción | Sí | Sí | Auth/session |
| `DATABASE_URL` | URL interna de PostgreSQL staging, sin puerto publicado | URL interna de PostgreSQL producción, sin puerto publicado | Sí | Sí | Persistencia |
| `SMTP_HOST` | Vacío o relay de staging | Relay productivo aprobado | No | No | Email |
| `SMTP_PORT` | Puerto del relay, si aplica | Puerto del relay productivo | No | No | Email |
| `SMTP_SECURE` | Según relay de staging | Según relay productivo | No | No | Email/TLS |
| `SMTP_USER` | Secret manager, si aplica | Secret manager | Sí | No | Email |
| `SMTP_PASSWORD` | Secret manager, si aplica | Secret manager | Sí | No | Email |
| `EMAIL_FROM` | Remitente de staging verificado | Remitente productivo verificado | No | No | Email |
| `CONTACT_NOTIFICATION_TO` | Buzón de prueba controlado | `contacto@syntavera.dev` | No | No | Contact |
| `CONTACT_ACCEPT_WITHOUT_NOTIFICATION` | `false` | `false` | No | No | Contact |
| `CONTACT_DELIVERY_VERIFIED` | `false` hasta prueba controlada | `false` hasta prueba controlada | No | No | Contact |
| `S3_ENDPOINT` | Endpoint R2 de la cuenta | Endpoint R2 de la cuenta | No | No | Documentos |
| `S3_REGION` | `auto` | `auto` | No | No | Documentos |
| `S3_BUCKET` | `syntavera-app-staging-private` | `syntavera-app-production-private` | No | No | Documentos |
| `S3_ACCESS_KEY_ID` | Secret manager, credencial acotada a staging | Secret manager, credencial acotada a producción | Sí | No | Documentos |
| `S3_SECRET_ACCESS_KEY` | Secret manager, credencial acotada a staging | Secret manager, credencial acotada a producción | Sí | No | Documentos |
| `S3_FORCE_PATH_STYLE` | `false` | `false` | No | No | Documentos |
| `SIGNED_URL_TTL_SECONDS` | `300` | `300` | No | No | Documentos |
| `MAX_UPLOAD_BYTES` | `26214400` | `26214400` | No | No | Documentos |
| `PRIVACY_POLICY_VERSION` | Vacío hasta aprobar copy | Vacío hasta aprobar copy | No | No | Privacy/Contact |
| `PUBLIC_CONTACT_ENABLED` | `false` | `false` hasta aprobación legal | No | No | Contact |
| `ALLOW_DEMO_SEED` | `false` | `false` | No | No | Bootstrap local |
| `SEED_ADMIN_NAME` | No configurar | No configurar | No | No | Bootstrap local |
| `SEED_ADMIN_EMAIL` | No configurar | No configurar | Sí | No | Bootstrap local |
| `SEED_ADMIN_PASSWORD` | No configurar | No configurar | Sí | No | Bootstrap local |
| `CONTACT_RATE_LIMIT_WINDOW_SECONDS` | `3600` | `3600` | No | No | Contact/rate limit |
| `CONTACT_RATE_LIMIT_MAX` | `5` | `5` | No | No | Contact/rate limit |
| `POSTGRES_PORT` | No aplica; red privada de Coolify | No aplica; red privada de Coolify | No | No | Solo Docker Compose local |

SMTP no es necesario para arrancar staging, pero sin transporte no se puede cerrar la validación de invitación y magic link. En producción, SMTP real y la prueba invitation → magic link → login son gate obligatorio. R2 tampoco es necesario para arrancar la web, pero sus credenciales son necesarias para verificar el flujo de documentos.

El destinatario productivo de Contact está confirmado como `contacto@syntavera.dev`. No es el remitente SMTP ni una credencial. El formulario solo queda disponible con gate público, privacidad aprobada, notificación configurada y `CONTACT_DELIVERY_VERIFIED=true` después de una prueba autorizada de llegada a bandeja. La excepción `CONTACT_ACCEPT_WITHOUT_NOTIFICATION=true` habilita de manera deliberada el contrato de recepción exclusiva en backoffice.
