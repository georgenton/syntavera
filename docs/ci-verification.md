# Verificación de CI de la candidata

Fecha: 2026-10-06.

## Causa confirmada

El run remoto [CI #4](https://github.com/georgenton/syntavera/actions/runs/36785794709) ejecutó el commit `8639d4821d32d4fd11de97170fbb9d2f51edb86a`. El job `quality` generó el cliente Prisma, pero el job `e2e` empezó Playwright desde otro checkout limpio sin ejecutar `pnpm prisma:generate`. Next.js falló al resolver `@/generated/prisma/client` desde `src/lib/db.ts`.

Generar el cliente y migrar una base son operaciones distintas. El job público de navegador solo necesita `pnpm prisma:generate`; no ejecuta migraciones ni requiere PostgreSQL porque Contact permanece cerrado y las rutas revisadas no consultan datos privados.

## Corrección

- El job `e2e` ejecuta el script fijado `pnpm prisma:generate` después de `pnpm install --frozen-lockfile` y antes de instalar/iniciar Playwright.
- Prisma 7.10.0, Node.js 24.21.0, pnpm 10.33.2 y Playwright 1.63.0 siguen fijados por el proyecto; no se actualizaron dependencias.
- CI fija `PUBLIC_CONTACT_ENABLED=false` y `CONTACT_DELIVERY_VERIFIED=false`.
- Los snapshots ahora incluyen `{platform}`. Las referencias Darwin y Linux se conservan por separado porque Chromium usa rasterización y fuentes del sistema y una referencia creada en macOS no es canónica para Ubuntu.
- Ante un fallo, CI sube `playwright-report/` y `test-results/` durante siete días. El job público excluye por etiqueta la comprobación autenticada, por lo que esos artefactos no contienen sesión, credenciales ni datos reales.

## Diferencia visual

El primer intento de Home del run remoto alcanzó el `h1` y produjo una imagen estable, pero difirió en 50 212 píxeles (4 %) respecto de una referencia creada en macOS. Después apareció el error de Prisma y los reintentos y demás rutas renderizaron la pantalla de error. Son dos causas distintas.

Las referencias Linux se generaron y revisaron dentro de la imagen oficial `mcr.microsoft.com/playwright:v1.63.0-noble` sobre `linux/amd64`, con Chrome for Testing 153.0.8010.12. No se aumentaron tolerancias ni se eliminaron aserciones. Las imágenes Darwin existentes se conservan para verificaciones locales.

El run remoto [37496594144](https://github.com/georgenton/syntavera/actions/runs/37496594144) confirmó que la generación de Prisma ya estaba corregida: las nueve pruebas funcionales públicas pasaron y las cinco comparaciones visuales fallaron de forma estable. Ese job se ejecutó directamente en el host `ubuntu-latest` e instaló de nuevo Chromium y dependencias del sistema mediante `playwright install --with-deps`; no reprodujo el entorno oficial donde se crearon las referencias.

El job `e2e` ahora se ejecuta dentro del manifiesto inmutable `linux/amd64` de `mcr.microsoft.com/playwright:v1.63.0-noble`, fijado por el digest `sha256:bc6ab0d6d44ff4826e4cb8c1e6d801e185bfc42bb0753f8e2a30efc70db054c7`. Mantiene Node.js 24.21.0, pnpm 10.33.2 y Playwright 1.63.0, comprueba esas versiones y el ejecutable incluido, y no realiza actualizaciones generales del sistema ni reinstala el navegador. Los snapshots no se actualizaron para este ajuste.

## Reproducción limpia local

Se clonó el commit candidato en un directorio temporal y se comprobó la ausencia inicial de `node_modules`, `.next`, `src/generated`, `.env` y `.env.local`. En un contenedor nuevo Ubuntu 24.04 `linux/amd64` se instalaron Node.js 24.21.0 y pnpm 10.33.2, se ejecutó `pnpm install --frozen-lockfile`, se confirmó que la instalación no había creado el cliente y luego se ejecutó `pnpm prisma:generate` con una URL local ficticia, sin migrar ni conectar una base.

Playwright 1.63.0 generó únicamente las cinco referencias Linux que faltaban. Tras revisarlas visualmente, la ejecución equivalente al job (`desktop-1440`, Contact cerrado y exclusión explícita de `@authenticated`) terminó con 14/14 pruebas correctas, sin reintentos fallidos.

La estabilización se reprodujo desde otro clon limpio usando exactamente el digest fijado y las referencias existentes, sin `--update-snapshots`: nueve pruebas funcionales públicas y cinco comparaciones visuales terminaron correctamente (14/14), sin reintentos. Chrome informó la versión 153.0.8010.12. Un segundo clon limpio completó `lint`, `typecheck`, 38 pruebas unitarias y `build`. No se ejecutaron migraciones ni se conectó PostgreSQL. Al cerrar esta nota previa al push, el nuevo resultado remoto del pull request continúa pendiente.

## Comprobación autenticada pendiente

La suite autenticada no se declara aprobada. Requiere una base PostgreSQL desechable migrada, usuarios y proyectos enteramente sintéticos, autenticación real de la aplicación y servicios externos simulados. Debe ejecutarse en un job separado; no debe publicar storage state, cookies, contraseñas ni trazas autenticadas.

## Disparadores y publicación

El único workflow versionado se dispara en `pull_request` y en `push` a `main`. Un push de la rama candidata no ejecuta por sí solo este workflow; la validación remota debe hacerse mediante pull request.

El pull request #1 permanece abierto hacia `main`. Antes de subir la corrección de CI se debe volver a comprobar la configuración externa de Coolify y los demás enlaces externos; la ausencia de un workflow de despliegue no prueba por sí sola que ningún servicio observe el remoto. No se debe publicar ni fusionar mientras la candidata no tenga `quality` y `e2e` satisfactorios en el mismo SHA.

La revisión previa a la apertura del PR mostró un único workflow activo (`.github/workflows/ci.yml`), ningún repository webhook visible, ningún environment y ningún deployment registrado. Coolify producción y staging estaban limitados a la rama `main`, con despliegues de preview deshabilitados; Vercel no tenía un proyecto SyntaVera conectado y Railway no tenía un trigger para este repositorio. Estas condiciones deben reconfirmarse inmediatamente antes del siguiente push.
