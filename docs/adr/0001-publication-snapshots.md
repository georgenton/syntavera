# ADR 0001 — snapshots explícitos para el portal

Estado: aceptado · 2026-09-30

## Decisión

El backoffice mantiene la fuente relacional. El cliente consume una copia JSONB versionada y validada con un schema estricto. Publicar retira la versión vigente, crea la siguiente y registra auditoría/actividad en una transacción.

## Consecuencias

- Guardar un borrador no cambia el portal.
- La whitelist evita filtrar notas internas, credenciales y claves de storage.
- Los datos live (soporte, actividad) requieren filtros server-side separados.
- Cambiar el schema del snapshot exige versión y compatibilidad o migración de lectura.
