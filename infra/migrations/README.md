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

- `202401010000__baseline.sql:` esquema inicial (`app_users`, `channels`, `videos`, `analytics`) + datos demo.
- `202601240000__content_modules.sql:` tablas de ideas, scripts, thumbnails y SEO.
- `202601250000__productions_pipeline.sql:` pipeline de producciones, shorts, social posts y automation_runs.
- `202601290000__auth_sessions.sql` y `202601300000__auth_email_tokens.sql:` tablas de sesiones y tokens.
- `202602090000__user_roles.sql`: agrega columna `role` a `app_users` para habilitar RBAC.

> Todos los despliegues deben usar `scripts/db/migrate.sh` (local `DATABASE_URL`) o `scripts/db_migrate.sh` (stack Docker) para aplicar estos archivos en orden.
