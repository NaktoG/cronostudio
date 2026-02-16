# Guía de Migraciones SQL

Todas las migraciones viven en `infra/migrations/*.sql` con el formato `YYYYMMDDHHMM__descripcion.sql`. El orden alfabético es el orden de aplicación.

## 📦 Comandos disponibles

| Escenario | Comando |
|-----------|---------|
| Local / CI con `DATABASE_URL` | `DATABASE_URL=postgresql://user:pass@host:5432/db ./scripts/db/migrate.sh` |
| Stack Docker (contendedores infra/docker) | `./scripts/db_migrate.sh` |

Ambos scripts son idempotentes: crean la tabla `schema_migrations` y solo ejecutan archivos pendientes.

## 🚢 Deploy en entornos existentes

1. **Backup obligatorio**
   ```bash
   ssh deploy@vps "pg_dump -Fc cronostudio > /var/backups/cronostudio/$(date +%Y%m%d%H%M).dump"
   ```
2. **Actualizar código** (`git pull` en `/home/deploy/agentos/projects/cronostudio/repo`).
3. **Aplicar migraciones**
   ```bash
   cd /home/deploy/agentos/projects/cronostudio/repo
   DATABASE_URL=postgresql://cronostudio:********@127.0.0.1:5432/cronostudio_db \
     ./scripts/db/migrate.sh
   ```
4. **Verificar**
   ```bash
   psql $DATABASE_URL -c "SELECT * FROM public.schema_migrations ORDER BY applied_at DESC LIMIT 5;"
   ```
5. **Reiniciar servicios** si la migración añade columnas usadas por el backend (`systemctl restart cronostudio-web`).

## 🧱 Crear nuevas migraciones

1. Generar archivo:
   ```bash
   ./scripts/db/create-migration.sh add_table_foo
   ```
2. Editar el SQL siguiendo las convenciones (`BEGIN/COMMIT`, `IF NOT EXISTS`, triggers, etc.).
3. Ejecutar en local con `./scripts/db_migrate.sh` y añadir pruebas antes de abrir un PR.

## 🧰 Troubleshooting

- **`permission denied`**: asegúrate de usar un usuario con privilegios `CREATE/ALTER` sobre `public`.
- **Migraciones manuales en producción**: si necesitas revertir, usa el backup tomado en el paso 1 (`pg_restore`).
- **Nuevas columnas requeridas por la app**: coordina deploy atómico (migrar + reiniciar Next.js) para evitar errores `column does not exist`.

Mantén este documento actualizado cada vez que agregues flujos especiales (seeders, scripts de datos, etc.).
