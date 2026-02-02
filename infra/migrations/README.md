# Migraciones SQL (CronoStudio)

Esta carpeta contiene migraciones versionadas en SQL plano. Objetivo: que cualquier cambio de esquema se pueda aplicar de forma determinista en Hetzner o local.

## Convenciones

- Formato de archivo: `YYYYMMDDHHMM__descripcion.sql` (dos guiones bajos como separador).
- Las migraciones son idempotentes siempre que sea posible (`CREATE TABLE IF NOT EXISTS`, etc.).
- No incluir datos sensibles ni contraseñas; si se requieren semillas, usar scripts separados o `INSERT ... ON CONFLICT`.

## Ejecución

```
export DATABASE_URL=postgresql://user:pass@host:5432/cronostudio
./scripts/db/migrate.sh
```

El script:
1. Crea la tabla `_migrations` si no existe.
2. Ejecuta cada archivo pendiente en orden alfanumérico.
3. Registra el hash y fecha de ejecución.

Para ambientes sin `DATABASE_URL`, el script permite `POSTGRES_*` tradicionales (`POSTGRES_HOST`, `POSTGRES_DB`, etc.).

## Crear nueva migración

```
./scripts/db/create-migration.sh add_ideas_priority_index
```

Esto genera un archivo con timestamp actual en esta carpeta, listo para editar.

## Buenas prácticas

- Revisar `EXPLAIN` en producción antes de agregar índices pesados.
- Documentar cualquier dependencia de n8n o CronoStudio en el encabezado del archivo (`-- Depende de ...`).
- En cambios destructivos (DROP), agregar `BEGIN; ... COMMIT;` para facilitar rollback manual.

## Estado actual

> Aún no se han versionado migraciones existentes. Para crear una línea base, ejecutar `pg_dump --schema-only` y copiar el resultado al primer archivo (`YYYYMMDDHHMM__baseline.sql`).

Una vez agregada la línea base, todos los cambios deben pasar por este flujo.
