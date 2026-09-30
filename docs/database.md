# Base de datos

PostgreSQL es la única base productiva. `prisma/schema.prisma` define auth, CRM, proyectos, plan, entregables, documentos/versiones, aceptación, billing, soporte, snapshots, actividad y auditoría.

## Comandos

```bash
pnpm prisma:validate
pnpm prisma:generate
pnpm prisma:migrate:dev --name descripcion-local
pnpm prisma:migrate:deploy
```

`migrate deploy` ocurre en un job previo al arranque, nunca en el build ni dentro de cada réplica. El historial versionado está en `prisma/migrations`; V1 contiene la migración inicial y tres migraciones incrementales para dominio, contexto de aceptación y compatibilidad del identificador de verificación de Better Auth.

Antes de migrar producción: backup verificable, revisar SQL, confirmar ventana y probar rollback de aplicación. Las migraciones destructivas requieren estrategia expand/contract y nunca se improvisan con `db push`.
