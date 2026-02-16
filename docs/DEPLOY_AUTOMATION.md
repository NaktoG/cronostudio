# Deploy Automation (CI/CD)

Este repositorio incluye un workflow de GitHub Actions (`.github/workflows/deploy.yml`) para desplegar automáticamente a un VPS vía SSH + rsync.

## Requisitos
- Acceso SSH al VPS.
- Una ruta de deploy por entorno (production/staging).
- Known hosts preconfigurado (para evitar MITM).

## Secrets requeridos en GitHub

| Secret | Descripción |
|--------|-------------|
| `DEPLOY_SSH_HOST` | IP o hostname del VPS |
| `DEPLOY_SSH_USER` | Usuario SSH (ej. `deploy`) |
| `DEPLOY_SSH_PORT` | Puerto SSH (opcional, default 22) |
| `DEPLOY_SSH_KEY` | Private key PEM/OPENSSH |
| `DEPLOY_SSH_KNOWN_HOSTS` | Salida de `ssh-keyscan` del VPS |
| `DEPLOY_PATH_PROD` | Ruta repo prod (ej. `/home/deploy/agentos/projects/cronostudio/repo`) |
| `DEPLOY_SERVICE_PATH_PROD` | Ruta del compose (ej. `/home/deploy/agentos/projects/cronostudio`) |
| `DEPLOY_PATH_STAGING` | Ruta repo staging (ej. `/home/deploy/agentos/projects/cronostudio-staging/repo`) |
| `DEPLOY_SERVICE_PATH_STAGING` | Ruta del compose staging |
| `DEPLOY_CMD` | (Opcional) Comando remoto. Por defecto: `docker compose build && docker compose up -d` |

## Cómo funciona
- En `push` a `main`, despliega automáticamente a **production**.
- En `workflow_dispatch`, puedes elegir `production` o `staging`.
- Si tu deploy requiere ejecutar `up.sh`, define `DEPLOY_CMD` en el entorno/secret para que el workflow lo use.

## Flujo del deploy
1. Sincroniza el repo con `rsync` (excluye `.env`, `node_modules`, `.next`, etc.).
2. Ejecuta `docker compose build` + `docker compose up -d` en el VPS.

## Recomendación de seguridad
- Usa una key de deploy dedicada.
- Restringe el usuario SSH a una carpeta y comandos permitidos.
- Mantén `DEPLOY_SSH_KNOWN_HOSTS` actualizado si rota la máquina.
