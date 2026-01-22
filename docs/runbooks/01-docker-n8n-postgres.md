# Runbook: n8n + Postgres con Docker Compose (local)

## Requisitos
- Docker Desktop encendido
- Docker Compose disponible (`docker-compose --version`)

## Archivos
- `infra/docker/docker-compose.yml` — definición de servicios
- `infra/docker/.env` — variables de entorno (NO commitear si tiene credenciales reales)

## Levantar servicios

```bash
cd /Volumes/SSD-QVO/cronostudio
docker compose -f infra/docker/docker-compose.yml up -d
docker ps
```

**Esperado:**
- Container `cronostudio-postgres` en puerto 5432
- Container `cronostudio-n8n` en puerto 5678

## Acceso a servicios

- **n8n**: http://localhost:5678
- **Postgres**: localhost:5432 (credenciales en `.env`)

## Ver logs

```bash
# n8n logs
docker logs -f cronostudio-n8n

# Postgres logs
docker logs -f cronostudio-postgres
```

## Detener servicios

```bash
docker compose -f infra/docker/docker-compose.yml down
```

**Nota:** Detiene containers pero preserva volúmenes (datos persisten).

## Resetear volúmenes (⚠️ DESTRUCTIVO)

```bash
docker compose -f infra/docker/docker-compose.yml down -v
```

**Advertencia:** BORRA todos los datos de Postgres y n8n. Usar solo en dev local para "empezar de cero".

## Backup básico de Postgres

```bash
# Dumpar BD a archivo
docker exec cronostudio-postgres pg_dump -U postgres cronostudio > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar desde backup
docker exec -i cronostudio-postgres psql -U postgres cronostudio < backup_20250122_143000.sql
```

## Troubleshooting

| Problema | Solución |
|----------|----------|
| Puerto 5432 ocupado | `lsof -i :5432` y matar proceso |
| Puerto 5678 ocupado | `lsof -i :5678` y matar proceso |
| Docker daemon apagado | Abrir Docker Desktop |
| n8n no conecta a Postgres | Verificar `.env` en `infra/docker/` |
| Volúmenes con datos old | Usar `docker compose ... down -v` |
| Container "unhealthy" | Revisar: `docker logs cronostudio-postgres` |

## Monitoreo

```bash
# Recursos en tiempo real
docker stats --no-stream

# Inspeccionar container
docker inspect cronostudio-postgres | grep -A 10 "NetworkSettings"
```

## Verificación Post-Levante

1. Postgres accesible:
   ```bash
   docker exec cronostudio-postgres psql -U postgres -c "SELECT 1;"
   ```

2. n8n accesible:
   ```bash
   curl http://localhost:5678/api/v1/health
   ```
