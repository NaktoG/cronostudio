# Deploy Automation (CI/CD)

Este repositorio incluye un workflow de GitHub Actions (`.github/workflows/deploy.yml`) para desplegar automáticamente a un VPS vía SSH + rsync.

Por defecto el stack deployado no levanta n8n. Para rollback legacy, ejecutar `docker compose --profile legacy-n8n up -d`.

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

Para `automation-go` agrega en el entorno de deploy:

| Variable | Descripción |
|----------|-------------|
| `AUTOMATION_GO_PORT` | Puerto interno del servicio Go (ej. `8081`) |
| `AUTOMATION_DB_URL` | Conexion PostgreSQL para cola/idempotencia/auditoria |
| `AUTOMATION_WEB_BASE_URL` | Base URL interna del BFF (ej. `http://cronostudio-web:3000`) |
| `AUTOMATION_WEBHOOK_SECRET` | Secreto compartido para endpoints internos BFF |
| `AUTOMATION_JWT_ISSUER` | Issuer esperado en JWT S2S |
| `AUTOMATION_JWT_AUDIENCE` | Audience esperado en JWT S2S |
| `AUTOMATION_JWT_ED25519_PUBLIC_KEYS` | Mapa `kid:base64url` de claves publicas |
| `AUTOMATION_JWT_MAX_SKEW_SEC` | Tolerancia de reloj para validacion JWT |
| `AUTOMATION_WORKER_ENABLE_YOUTUBE_CHANNELS` | Habilita handler real `youtube.sync.channels` en worker |
| `AUTOMATION_WORKER_ENABLE_YOUTUBE_VIDEOS` | Habilita handler real `youtube.sync.videos` en worker |
| `AUTOMATION_WORKER_ENABLE_YOUTUBE_ANALYTICS_DAILY` | Habilita handler real `youtube.analytics.ingest.daily` en worker |
| `AUTOMATION_SHADOW_CHANNELS_ENABLED` | Encola jobs shadow desde endpoint legacy de sync channels |
| `AUTOMATION_SHADOW_VIDEOS_ENABLED` | Encola jobs shadow desde endpoint legacy de sync videos |
| `AUTOMATION_SCHEDULER_ENABLED` | Habilita el proceso scheduler interno |
| `AUTOMATION_SCHEDULER_ENABLE_YOUTUBE_ANALYTICS_DAILY` | Habilita cron diario para encolar `youtube.analytics.ingest.daily` |
| `AUTOMATION_SCHEDULER_DAILY_HOUR_UTC` | Hora UTC del disparo diario (0-23) |
| `AUTOMATION_SCHEDULER_DAILY_MINUTE_UTC` | Minuto UTC del disparo diario (0-59) |
| `OBS_ENABLED` | Habilita emision de metricas desde worker/scheduler Go |
| `OBS_ENDPOINT` | Endpoint HTTP de observabilidad para eventos de metricas |
| `AUTOMATION_CUTOVER_ENABLED` | Activa cutover gradual desde endpoints legacy a cola Go |
| `AUTOMATION_CUTOVER_KILL_SWITCH` | Fuerza rollback inmediato a modo legacy |
| `AUTOMATION_CUTOVER_INCLUDE_USER_REQUESTS` | Incluye trafico de usuario en cutover (default: `false`) |
| `AUTOMATION_CUTOVER_YOUTUBE_SYNC_CHANNELS_PERCENT` | Porcentaje por tenant para `youtube.sync.channels` |
| `AUTOMATION_CUTOVER_YOUTUBE_SYNC_VIDEOS_PERCENT` | Porcentaje por tenant para `youtube.sync.videos` |

Importante:
- `AUTOMATION_WEBHOOK_SECRET` (worker/scheduler) debe coincidir exactamente con `CRONOSTUDIO_WEBHOOK_SECRET` (web) para que los endpoints internos respondan autorizado.

## Cómo funciona
- En `push` a `main`, despliega automáticamente a **production**.
- En `workflow_dispatch`, puedes elegir `production` o `staging`.
- Si tu deploy requiere ejecutar `up.sh`, define `DEPLOY_CMD` en el entorno/secret para que el workflow lo use.

## Flujo del deploy
1. Sincroniza el repo con `rsync` (excluye `.env`, `node_modules`, `.next`, etc.).
2. Ejecuta `docker compose build` + `docker compose up -d` en el VPS.

## Migracion de automatizaciones a Go (online)

Operacion actual (por defecto):

1. Desplegar `apps/web` y `automation-go` en el mismo release window.
2. Activar workflow por feature flag en pasos `10% -> 50% -> 100%`.
3. Monitorear errores, latencia y `DLQ depth` en cada paso.
4. Si hay degradacion, activar rollback por kill switch y volver temporalmente a legacy.

Rollback legacy (excepcional):

1. Levantar profile `legacy-n8n`.
2. Rehabilitar checks/flags legacy necesarios.
3. Mantener ventana acotada y volver a Go apenas se estabilice.

Este flujo se opera junto a `docs/runbooks/03-go-backend-cutover.md`.

## Recomendación de seguridad
- Usa una key de deploy dedicada.
- Restringe el usuario SSH a una carpeta y comandos permitidos.
- Mantén `DEPLOY_SSH_KNOWN_HOSTS` actualizado si rota la máquina.
