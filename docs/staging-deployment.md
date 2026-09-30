# Preparación de staging en Coolify

Destino: `staging.syntavera.dev`. Esta guía prepara la infraestructura existente Cloudflare → OVH → Coolify → Traefik → Docker. No reinstala Coolify ni requiere cambios de firewall, SSH o Traefik.

## Artefacto y servicios

1. Conectar en Coolify el repositorio Git privado y fijar el SHA verificado, no una rama flotante.
2. Crear una aplicación desde el `Dockerfile`, target `runner`, puerto interno 3000.
3. Crear un PostgreSQL exclusivo de staging en la red privada de Coolify. No publicar puertos al host ni a Internet.
4. Antes de actualizar la aplicación, ejecutar una tarea one-shot con target `migrator`, mismo SHA y la misma `DATABASE_URL` interna. Tomar backup antes de migrar.
5. Configurar las variables de staging de [la matriz](environment-matrix.md) en el secret manager de Coolify.
6. Enrutar únicamente `staging.syntavera.dev` por el Traefik ya instalado. En Cloudflare usar DNS proxied y SSL Full (strict), con certificado válido en origen.
7. Mantener `PUBLIC_CONTACT_ENABLED=false`, `PRIVACY_POLICY_VERSION` vacío y `ALLOW_DEMO_SEED=false`.

La aplicación debe usar un bucket R2 privado dedicado a staging. El bucket propuesto es `syntavera-app-staging-private`; no debe reutilizar el bucket de backups del control plane y no debe crearse hasta recibir credenciales. El equivalente productivo será otro bucket: `syntavera-app-production-private`.

## Gate de validación de staging

- `/api/health` responde 200 y declara PostgreSQL `ok`.
- Las migraciones figuran aplicadas y la base es exclusiva de staging.
- HTTPS no presenta errores; CSP, HSTS, `nosniff`, frame deny, permissions policy y `X-Robots-Tag` están presentes donde corresponda.
- `/`, `/labs` y `/how-we-work` cargan sin errores de consola y coinciden con los baselines visuales.
- `/admin` exige autenticación interna; `/portal` exige acceso de cliente.
- Invitación → magic link → login se prueba si staging dispone de SMTP. La ausencia de SMTP debe fallar explícitamente, nunca simular entrega.
- Dos organizaciones de prueba no pueden leer proyectos, usuarios, documentos ni snapshots entre sí.
- El portal muestra solo snapshots publicados; ningún borrador o dato mock cruza al cliente.
- Las rutas privadas tienen `noindex`.
- Upload/download R2 se prueba solo cuando existan bucket y credenciales de staging.
- Se recapturan las 15 vistas con el SHA desplegado y se comparan con [la auditoría cerrada](visual-parity-audit.md).

## Preparación de producción — no ejecutar

Producción debe recibir exactamente la misma imagen/digest validada en staging, con `https://syntavera.dev`, una base PostgreSQL independiente sin puertos publicados, secretos diferentes y el bucket `syntavera-app-production-private`. Antes de autorizarla son obligatorios SMTP real, invitation → magic link → login, R2, backups/restores y el copy legal de privacidad si Contact fuera a habilitarse.

Este review **no autoriza ni ejecuta** ningún despliegue a `syntavera.dev`.
