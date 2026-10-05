# Candidato de publicación

La unidad publicable es un commit inmutable del repositorio. Coolify debe construir los targets `migrator` y `runner` del mismo commit, registrar el digest resultante y promover exactamente ese digest. Nunca se publica un árbol de trabajo con cambios sin versionar ni se reconstruye desde una rama flotante entre staging y producción.

## Hito A — Web afinada, contacto cerrado

El Hito A publica contenido, estilos, rutas y controles revisados con `PUBLIC_CONTACT_ENABLED=false`, `CONTACT_DELIVERY_VERIFIED=false` y la privacidad sin alterar.

La migración `20261005090000_contact_delivery_state` sí es necesaria en este hito. Aunque el formulario esté cerrado, la aplicación candidata y la vista administrativa fueron generadas contra las columnas y el enum nuevos; arrancar el código nuevo antes de expandir la base puede producir consultas inválidas. La prueba local confirmó que la expansión conserva filas anteriores y que el código anterior todavía puede escribir omitiendo los campos nuevos.

### Requisitos previos

- Commit candidato limpio, revisado y con todos los gates en verde.
- Imagen `migrator` e imagen `runner` construidas desde el mismo commit; digest registrado.
- Base y bucket exclusivos por entorno; `DATABASE_URL` comprobada sin imprimirla.
- Backup inmediatamente anterior, con restauración ensayada en una base aislada.
- Ventana con capacidad para detener escrituras y restaurar el artefacto anterior.
- Contacto cerrado en configuración antes, durante y después del rollout.

### Orden

1. Desplegar el digest candidato en staging con Contact cerrado.
2. Ejecutar una sola tarea `migrator` contra la base exclusiva de staging.
3. Confirmar `prisma migrate status`, recuentos históricos y `/api/health` antes de iniciar `runner`.
4. Arrancar `runner`, ejecutar smoke de `/`, `/labs`, `/about`, `/contact`, `/admin` y portal, y revisar logs/headers.
5. Validar los snapshots y permisos con el SHA desplegado.
6. Con autorización posterior, repetir en producción: backup, `migrator`, comprobación, `runner`, smoke. No habilitar Contact.

### Criterios de detención

- Destino de base ambiguo, compartido o no verificablemente respaldado.
- Drift, checksum distinto, migración pendiente inesperada o lock que exceda la ventana.
- Recuento histórico distinto, filas antiguas que no queden `NOT_REQUIRED` o índice único fallido.
- Healthcheck, login, rutas privadas, canonical, CSP o páginas públicas con regresión.
- Cualquier formulario visible o mutación aceptada mientras Contact deba permanecer cerrado.

### Reversión

Primero mantener/cambiar `PUBLIC_CONTACT_ENABLED=false` y detener nuevas escrituras. Reponer el `runner` del digest anterior; no ejecutar SQL inverso automático. La migración es expansiva y el código anterior tolera las columnas adicionales, por lo que el esquema expandido se conserva durante el rollback de aplicación.

El código anterior puede crear filas con el nuevo default `PENDING` pero no procesarlas; por eso la coexistencia solo es aceptable con Contact cerrado. Si hubiera corrupción de datos, preservar evidencia y restaurar el backup en paralelo siguiendo `backup-restore.md`; revertir código no revierte la base.

## Hito B — Activación del formulario

Este hito es independiente y no queda autorizado por publicar el Hito A. Requiere privacidad aprobada/versionada, remitente autorizado, transporte y credenciales, aceptación del proveedor, llegada confirmada a `contacto@syntavera.dev` y la prueba exacta de `contact-activation.md`.

Si el Hito A ya aplicó la migración, el Hito B no necesita otra migración de base. Se despliega el mismo código validado o un commit posterior que solo contenga la privacidad aprobada/configuración documentada, manteniendo `CONTACT_ACCEPT_WITHOUT_NOTIFICATION=false`.

El orden es: prueba interna con formulario cerrado → `CONTACT_DELIVERY_VERIFIED=true` → versión legal coincidente → smoke de staging → autorización humana → configuración productiva → prueba productiva controlada → `PUBLIC_CONTACT_ENABLED=true`. Ante cualquier fallo, cerrar el gate público; las solicitudes ya persistidas no se eliminan y las notificaciones `FAILED` se reintentan únicamente desde una cuenta `ADMIN`.

## Autorizaciones separadas

Requieren autorización expresa: publicar el commit al remoto, construir o subir imágenes en infraestructura compartida, ejecutar backup o migración fuera de la base desechable, desplegar staging/producción, enviar la prueba de correo, instalar el texto legal, cambiar variables productivas, habilitar Contact y modificar DNS.
