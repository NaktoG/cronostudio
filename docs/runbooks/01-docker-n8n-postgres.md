# Runbook: n8n + Postgres con Docker Compose (local)

## Requisitos
- Docker Desktop encendido
- Docker Compose disponible

## Archivos
- `infra/docker/docker-compose.yml`
- `infra/docker/.env` (NO commitear si tiene credenciales reales)

## Levantar servicios
```bash
docker compose -f infra/docker/docker-compose.yml up -d
docker ps

cat > docs/runbooks/01-docker-n8n-postgres.md <<'MD'
# Runbook: n8n + Postgres con Docker Compose (local)

## Requisitos
- Docker Desktop encendido
- Docker Compose disponible

## Archivos
- `infra/docker/docker-compose.yml`
- `infra/docker/.env` (NO commitear si tiene credenciales reales)

## Levantar servicios
```bash
docker compose -f infra/docker/docker-compose.yml up -d
docker ps
