# Staging (CronoStudio)

Objetivo: tener un entorno de staging aislado para validar cambios antes de producción.

## Estructura recomendada en el VPS

```
/home/deploy/agentos/projects/
  cronostudio/
    repo/
    docker-compose.yml
    .env
  cronostudio-staging/
    repo/
    docker-compose.yml
    .env
```

## Dominios
- Producción: `cronostudio.atonixdev.com`
- Staging: `staging.cronostudio.atonixdev.com`

## Variables clave
- `APP_BASE_URL` debe apuntar al dominio del entorno.
- `N8N_BASE_URL` debe apuntar a n8n del entorno correspondiente.
- `CRONOSTUDIO_WEBHOOK_SECRET` puede ser distinto entre entornos.

## Caddy/Nginx
Agregar un bloque adicional para el dominio de staging apuntando a su servicio.

## Deploy
Usar el workflow `Deploy` con `environment=staging` o ejecutar:
```bash
DEPLOY_HOST=... DEPLOY_USER=... DEPLOY_PATH=/home/deploy/agentos/projects/cronostudio-staging/repo \
  DEPLOY_SERVICE_PATH=/home/deploy/agentos/projects/cronostudio-staging \
  ./scripts/deploy_remote.sh
```
