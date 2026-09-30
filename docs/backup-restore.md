# Backup y restauración

## Política

- Activar backups PostgreSQL automáticos en Coolify hacia almacenamiento off-site/R2 separado del bucket de archivos privados.
- Cifrar, aplicar retención documentada y restringir credenciales al job de backup.
- Ejecutar un backup verificable antes de cada migración material.
- No considerar cerrado el gate por la mera existencia de archivos: probar restauración periódicamente en un entorno aislado.

## Ensayo de restauración

1. Crear una base temporal vacía de la misma major de PostgreSQL.
2. Restaurar el último backup sin apuntar ninguna aplicación productiva.
3. Ejecutar `pnpm prisma:migrate:deploy` con el commit que se pretende desplegar.
4. Arrancar la imagen candidata contra esa base y comprobar `/api/health`.
5. Verificar recuentos de organizaciones, proyectos, publicaciones, documentos, aceptaciones y auditoría; recorrer login y un snapshot.
6. Registrar fecha, backup, commit, duración y resultado. Eliminar la base temporal con el procedimiento del proveedor.

Ante pérdida de datos, detener escrituras, preservar evidencia, restaurar en paralelo, validar y cambiar tráfico. Nunca ejecutar un reset automático ni revertir SQL destructivo a ciegas.
