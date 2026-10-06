# Deployment — Coolify, Traefik y Cloudflare

## Build y release

Construir el target `runner` del `Dockerfile`. Ejecutar una sola vez el target `migrator` con el mismo commit y `DATABASE_URL`; solo después arrancar o actualizar réplicas. `/api/health` devuelve 200 únicamente cuando PostgreSQL responde.

Variables mínimas de arranque: `APP_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET` y `DATABASE_URL`. SMTP y S3/R2 son gates de sus respectivas funcionalidades. Consultar la [matriz por entorno](environment-matrix.md) y el [procedimiento de staging](staging-deployment.md).

## Proxy y DNS

- Cloudflare: SSL Full (strict), DNS proxied y certificado válido en el origen.
- Traefik: TLS al contenedor, host canónico, `X-Forwarded-For` y `X-Forwarded-Proto` saneados.
- No exponer PostgreSQL ni el bucket a Internet.
- Mantener una sola cadena de redirects HTTPS/canonical para evitar loops.
- Usar PostgreSQL independiente por entorno dentro de la red privada de Coolify, sin publicar puertos.

## Gate productivo

No habilitar `PUBLIC_CONTACT_ENABLED=true` hasta completar la [lista de activación de Contact](contact-activation.md): instalar el texto legal aprobado, fijar la misma versión en `PRIVACY_POLICY_VERSION`, verificar persistencia, correo y reintento sin duplicados, y registrar `CONTACT_DELIVERY_VERIFIED=true` solo después de confirmar llegada a bandeja. Verificar además R2, healthcheck, backup y smoke E2E antes de cambiar tráfico. Los dos hitos y el rollback están definidos en [el candidato de publicación](publication-candidate.md).

Promover a producción exactamente el digest validado en staging. No reconstruir desde una rama flotante entre ambos entornos.
