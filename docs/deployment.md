# Deployment — Coolify, Traefik y Cloudflare

## Build y release

Construir el target `runner` del `Dockerfile`. Ejecutar una sola vez el target `migrator` con el mismo commit y `DATABASE_URL`; solo después arrancar o actualizar réplicas. `/api/health` devuelve 200 únicamente cuando PostgreSQL responde.

Variables mínimas: `APP_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `DATABASE_URL`, SMTP y S3/R2. Configurar `APP_URL=https://syntavera.dev` y el mismo origen para Better Auth.

## Proxy y DNS

- Cloudflare: SSL Full (strict), DNS proxied y certificado válido en el origen.
- Traefik: TLS al contenedor, host canónico, `X-Forwarded-For` y `X-Forwarded-Proto` saneados.
- No exponer PostgreSQL ni el bucket a Internet.
- Mantener una sola cadena de redirects HTTPS/canonical para evitar loops.

## Gate productivo

No habilitar `PUBLIC_CONTACT_ENABLED=true` hasta instalar el texto legal aprobado y fijar la misma versión en `PRIVACY_POLICY_VERSION`. Verificar correo, R2, healthcheck, backup y smoke E2E antes de cambiar tráfico.
