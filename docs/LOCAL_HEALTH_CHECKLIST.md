# Local Health Checklist

Checklist rapido para confirmar que CronoStudio corre 100% local.

## 1) Infra arriba
- `docker ps` muestra `cronostudio-postgres`, `cronostudio-redis`, `cronostudio-adminer`.
- Postgres en estado `healthy`.

## 2) App web
- `npm run dev` activo en `apps/web`.
- Acceso web: http://localhost:3000

## 3) Health API
- `curl http://localhost:3000/api/health` responde `200` y `status: healthy`.

## 4) n8n (legacy rollback, opcional)
- Solo si activaste `ENABLE_LEGACY_N8N=true`.
- Acceso: http://localhost:5678
- Health: `curl http://localhost:5678/healthz` responde `200`.

## 5) Adminer
- Acceso: http://localhost:8080
- Credenciales: usar valores de `infra/docker/.env`.

## 6) Smoke test
- `./scripts/smoke_test.sh`

## 7) Estado rapido
- `./scripts/local_status.sh`
