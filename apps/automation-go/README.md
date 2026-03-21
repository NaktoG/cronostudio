# automation-go

Servicio interno de automatizaciones para CronoStudio.

## Alcance actual (PR2/PR3)
- API interna con `healthz`, `readyz` y `POST /internal/jobs`.
- Auth servicio-a-servicio con JWT Ed25519.
- Autorizacion de tenant por claims (`tenantUserId` o `tenantIds`).
- Idempotencia persistente cuando `AUTOMATION_DB_URL` esta definida.
- Fallback en memoria para desarrollo rapido sin DB externa.

## Alcance PR4 (shadow worker)
- Worker MVP (`cmd/worker`) que consume `automation_job_queue` con `FOR UPDATE SKIP LOCKED`.
- Handler `noop` sin efectos externos para validar pipeline interno.
- Heartbeat de lease, retries con backoff+jitter y envio a DLQ al agotar intentos.
- Shadow mode en esta fase significa "sin side effects externos" (si muta estados internos de cola/attempts/DLQ).
- Handler inicial real (`youtube.sync.channels`) habilitable por flag y ejecutado via endpoint interno del BFF.
- Handler inicial real (`youtube.sync.videos`) habilitable por flag y ejecutado via endpoint interno del BFF.
- Handler `youtube.analytics.ingest.daily` habilitable por flag y ejecutado via endpoint interno del BFF.

## Variables de entorno
- `AUTOMATION_GO_PORT` (default: `8081`)
- `AUTOMATION_DB_URL` (opcional, recomendado para staging/prod)
- `AUTOMATION_WEB_BASE_URL` (default: `http://localhost:3000`)
- `AUTOMATION_WEBHOOK_SECRET` (requerida para handlers proxy a web)
- `OBS_ENABLED` (default `false`)
- `OBS_ENDPOINT` (endpoint HTTP para eventos de metricas)
- `AUTOMATION_JWT_ISSUER` (default: `cronostudio-web`)
- `AUTOMATION_JWT_AUDIENCE` (default: `automation-go`)
- `AUTOMATION_JWT_ED25519_PUBLIC_KEYS` (obligatoria para `cmd/api`; formato `kid:base64url,kid2:base64url`)
- `AUTOMATION_JWT_MAX_SKEW_SEC` (default: `30`)
- `AUTOMATION_RATE_LIMIT_PER_MIN` (default: `120`)
- `AUTOMATION_REQUEST_TIMEOUT_MS` (default: `10000`)

Worker:
- `AUTOMATION_WORKER_ID` (default hostname)
- `AUTOMATION_WORKER_CONCURRENCY` (default `4`)
- `AUTOMATION_WORKER_BATCH_SIZE` (default `10`)
- `AUTOMATION_WORKER_POLL_MS` (default `1000`)
- `AUTOMATION_WORKER_LEASE_SEC` (default `30`)
- `AUTOMATION_WORKER_RETRY_BASE_MS` (default `1000`)
- `AUTOMATION_WORKER_RETRY_MAX_MS` (default `60000`)
- `AUTOMATION_WORKER_JOB_TIMEOUT_SEC` (default `30`)
- `AUTOMATION_WORKER_SHADOW_MODE` (debe ser `true` en esta fase)
- `AUTOMATION_WORKER_ENABLE_YOUTUBE_CHANNELS` (default `false`)
- `AUTOMATION_WORKER_ENABLE_YOUTUBE_VIDEOS` (default `false`)
- `AUTOMATION_WORKER_ENABLE_YOUTUBE_ANALYTICS_DAILY` (default `false`)
- `AUTOMATION_WORKER_NOOP_FORCE_ERROR` (default `false`)

Scheduler:
- `AUTOMATION_SCHEDULER_ENABLED` (default `false`)
- `AUTOMATION_SCHEDULER_ENABLE_YOUTUBE_ANALYTICS_DAILY` (default `false`)
- `AUTOMATION_SCHEDULER_POLL_SEC` (default `60`)
- `AUTOMATION_SCHEDULER_DAILY_HOUR_UTC` (default `2`)
- `AUTOMATION_SCHEDULER_DAILY_MINUTE_UTC` (default `0`)

Si `AUTOMATION_WORKER_ENABLE_YOUTUBE_CHANNELS=true`, el worker falla al iniciar si faltan `AUTOMATION_WEB_BASE_URL` o `AUTOMATION_WEBHOOK_SECRET`.

## Ejecucion local

```bash
go run ./cmd/api
```

```bash
go run ./cmd/worker
```

```bash
go run ./cmd/scheduler
```
