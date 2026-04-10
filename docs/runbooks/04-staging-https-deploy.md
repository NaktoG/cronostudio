# Runbook: Staging HTTPS + Deploy Automation

Objetivo: dejar `staging` operativo en VPS con HTTPS, hardening base y deploy automatizado por GitHub Actions.

## 1. Pre-requisitos

- VPS accesible por SSH (`DEPLOY_SSH_HOST`, `DEPLOY_SSH_USER`, `DEPLOY_SSH_PORT`).
- Subdominio apuntando al VPS (ej. `cronostudio.atonixdev.com -> 46.62.242.64`).
- Entorno `staging` creado en GitHub (`Settings -> Environments`).

## 2. Estructura remota

Ruta recomendada:

```text
/home/nakto/agentos/projects/cronostudio-staging/
  repo/
```

Contenido clave en `repo/`:

- `infra/docker/.env` (credenciales de infra y auth)
- `apps/web/.env.local` (config web de staging)

## 3. Seguridad base aplicada

- Nginx como reverse proxy.
- App Next.js ligada a `127.0.0.1:3000` (no expuesta directa).
- UFW activo con solo `22/80/443` abiertos.
- Fail2ban activo con jail `sshd`.
- HTTP redirige a HTTPS.

## 4. HTTPS con Let's Encrypt

Configurar `server_name` en Nginx y emitir certificado:

- `certbot --nginx -d cronostudio.atonixdev.com --redirect`

Validaciones esperadas:

- `http://cronostudio.atonixdev.com` -> `301` a `https://...`
- `https://cronostudio.atonixdev.com/api/health` -> `200` + `status: healthy`

## 5. Deploy automation (GitHub Actions)

Workflow: `.github/workflows/deploy.yml`

Secrets requeridos en entorno `staging`:

- `DEPLOY_SSH_HOST`
- `DEPLOY_SSH_USER`
- `DEPLOY_SSH_PORT`
- `DEPLOY_SSH_KEY`
- `DEPLOY_SSH_KNOWN_HOSTS`
- `DEPLOY_PATH_STAGING`
- `DEPLOY_SERVICE_PATH_STAGING`
- `DEPLOY_CMD`

Valores usados para staging en este setup:

- `DEPLOY_PATH_STAGING=/home/nakto/agentos/projects/cronostudio-staging/repo`
- `DEPLOY_SERVICE_PATH_STAGING=/home/nakto/agentos/projects/cronostudio-staging/repo/infra/docker`

`DEPLOY_CMD` recomendado para web + infra:

```bash
export PATH="/home/nakto/.nvm/versions/node/v22.22.2/bin:$PATH" && \
cd "/home/nakto/agentos/projects/cronostudio-staging/repo/infra/docker" && \
docker compose up -d postgres redis && \
docker compose stop adminer mailpit >/dev/null 2>&1 || true && \
cd "/home/nakto/agentos/projects/cronostudio-staging/repo/apps/web" && \
npm ci && npm run build && \
systemctl --user restart cronostudio-staging-web.service
```

## 6. Servicios persistentes (user systemd)

- `cronostudio-staging-infra.service`
- `cronostudio-staging-web.service`

Verificar:

```bash
systemctl --user status cronostudio-staging-infra.service
systemctl --user status cronostudio-staging-web.service
```

## 7. Troubleshooting rapido

- `no configuration file provided: not found`
  - `DEPLOY_SERVICE_PATH_STAGING` apunta a ruta sin `docker-compose.yml`.
- `health: unhealthy` en producción
  - revisar `apps/web/.env.local` (especialmente `DATABASE_URL`, `REDIS_URL`, `APP_BASE_URL`, `CORS_ALLOWED_ORIGINS`).
- DNS aparentemente correcto pero el cliente sigue viendo IP vieja
  - comprobar resolvers públicos (`@1.1.1.1`, `@8.8.8.8`) y limpiar cache local.

## 8. Checklist final

- [ ] `gh run` de deploy staging en `success`.
- [ ] `https://cronostudio.atonixdev.com/api/health` responde `healthy`.
- [ ] HTTP redirige a HTTPS.
- [ ] UFW activo con puertos mínimos.
- [ ] Fail2ban activo.
