# API Documentation - CronoStudio

**Base URL**: `http://localhost:3000/api`

---

## 🔐 Authentication

La autenticación principal usa cookies httpOnly (`access_token`, `refresh_token`).
Opcionalmente se puede enviar un JWT en el header:
```
Authorization: Bearer <token>
```

**Public routes:** `/health`, `/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/request-password-reset`, `/auth/reset-password`, `/auth/verify-email`, `/auth/resend-verification`
**Protected routes:** todos los endpoints de datos (ideas, scripts, channels, videos, analytics, etc.) salvo que se indique lo contrario.

---

## 📡 Endpoints

### Automation Internal (Go)

Base interna (no publica): `http://automation-go:8081`

#### POST `/internal/jobs`

Headers requeridos:

```
Authorization: Bearer <jwt_ed25519>
X-Request-Id: <uuid>
Idempotency-Key: <key>
```

Notas de validacion:
- `X-Request-Id` debe ser UUID.
- `tenantUserId` debe ser UUID.
- `scope` del JWT debe incluir `automation:enqueue`.
- El JWT debe incluir `tenantUserId` o `tenantIds` y debe autorizar el `tenantUserId` del body.

Request:

```json
{
  "jobType": "youtube.sync.videos",
  "tenantUserId": "uuid",
  "payload": { "channelId": "UC123" },
  "priority": 100,
  "runAt": "2026-03-20T10:00:00Z"
}
```

Responses:
- `202 Accepted`: job encolado.
- `200 OK`: replay idempotente (`replayed=true`).
- `401 Unauthorized`: JWT invalido/expirado.
- `403 Forbidden`: scope insuficiente.
- `409 Conflict`: `Idempotency-Key` reutilizada con payload distinto.
- `429 Too Many Requests`: limite por IP o tenant/workflow.
- `400 Bad Request`: headers requeridos faltantes o mal formados.

Para persistencia y deduplicacion durable en staging/prod, `automation-go` debe correr con `AUTOMATION_DB_URL`.

Job types iniciales:
- `youtube.sync.channels` (PR5, handler real en worker via endpoint interno BFF).
- `youtube.sync.videos` (PR6, handler real en worker via endpoint interno BFF).
- `youtube.analytics.ingest.daily` (PR7, handler real en worker via endpoint interno BFF).

Modo shadow PR5:
- El endpoint legado `/integrations/youtube/sync/channels` puede encolar jobs shadow si `AUTOMATION_SHADOW_CHANNELS_ENABLED=true`.
- El endpoint legado `/integrations/youtube/sync/videos` puede encolar jobs shadow si `AUTOMATION_SHADOW_VIDEOS_ENABLED=true`.

Modo cutover PR9:
- Si `AUTOMATION_CUTOVER_ENABLED=true` y el tenant cae en el porcentaje configurado, endpoints legacy pueden responder `202` con `{ accepted: true, mode: "automation-go", queuedJobId }`.
- `AUTOMATION_CUTOVER_KILL_SWITCH=true` fuerza retorno a `legacy_sync` sin cola.
- En 10/50 inicial se recomienda mantener `AUTOMATION_CUTOVER_INCLUDE_USER_REQUESTS=false` y cutover solo para trafico de servicio.
- El trafico de servicio se identifica por autenticacion de servicio o por `x-cronostudio-webhook-secret` valido.

#### POST `/internal/automation/youtube/sync/channels` (BFF interno)

Uso interno desde `automation-go`.

Headers requeridos:

```
x-cronostudio-webhook-secret: <shared_secret>
```

Requisitos:
- `CRONOSTUDIO_WEBHOOK_SECRET` debe estar configurado en el BFF (si falta, responde `503`).

Request:

```json
{
  "tenantUserId": "uuid",
  "youtubeChannelId": "UC123"
}
```

Response:
- `200 OK`: `{ "results": [...] }`
- `400`: payload invalido
- `401`: secreto invalido

#### POST `/internal/automation/youtube/sync/videos` (BFF interno)

Uso interno desde `automation-go`.

Headers requeridos:

```
x-cronostudio-webhook-secret: <shared_secret>
```

Request:

```json
{
  "tenantUserId": "uuid",
  "channelId": "uuid",
  "limit": 20
}
```

Response:
- `200 OK`: `{ "results": [...] }`
- `400`: payload invalido
- `401`: secreto invalido

#### POST `/internal/automation/youtube/analytics/ingest-daily` (BFF interno)

Uso interno desde `automation-go`.

Headers requeridos:

```
x-cronostudio-webhook-secret: <shared_secret>
```

Request:

```json
{
  "tenantUserId": "uuid",
  "date": "2026-03-20"
}
```

Response:
- `200 OK`: `{ "processedVideos": number, "upsertedRows": number, "skippedVideos": number }`
- `400`: payload invalido
- `401`: secreto invalido

---

### Auth

#### POST `/auth/register`

Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "Password123",
  "name": "John Doe"
}
```

**Validation:**
- `email`: valid email, max 255 chars
- `password`: 8+ chars, 1 uppercase, 1 number
- `name`: 2-100 chars

**Response:** `201 Created`
```json
{
  "message": "Usuario registrado exitosamente",
  "user": { "id": "uuid", "email": "user@example.com", "name": "John Doe" },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

#### POST `/auth/login`

Authenticate existing user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Login exitoso",
  "user": { "id": "uuid", "email": "user@example.com", "name": "John Doe" },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### Health Check

#### GET `/health`

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "timestamp": "2026-01-25T09:00:00.000Z",
  "services": { "database": "up", "n8n": "up" }
}
```

---

### Productions 🆕

#### GET `/productions`

List all productions for authenticated user.

**Query Params:**
- `status` (optional): Filter by status
- `channelId` (optional): Filter by channel
- `stats=true` (optional): Include pipeline statistics

**Response:** `200 OK`
```json
{
  "productions": [
    {
      "id": "uuid",
      "title": "My Video",
      "status": "editing",
      "channel_name": "My Channel",
      "script_status": "approved",
      "thumbnail_status": "pending",
      "seo_score": 75,
      "shorts_count": 2,
      "updated_at": "2026-01-25T09:00:00.000Z"
    }
  ],
  "pipeline": {
    "idea": 3,
    "scripting": 2,
    "recording": 1,
    "editing": 2,
    "shorts": 1,
    "publishing": 0,
    "published": 10
  }
}
```

---

#### POST `/productions` 🔒

Create new production.

**Request:**
```json
{
  "title": "My New Video",
  "description": "Optional description",
  "channelId": "uuid",
  "ideaId": "uuid",
  "targetDate": "2026-02-01",
  "priority": 5
}
```

**Response:** `201 Created`

---

#### PUT `/productions?id=<uuid>` 🔒

Update production.

**Request:**
```json
{
  "title": "Updated Title",
  "status": "editing",
  "priority": 8
}
```

**Status values:** `idea`, `scripting`, `recording`, `editing`, `shorts`, `publishing`, `published`

---

#### DELETE `/productions?id=<uuid>` 🔒

Delete production.

**Response:** `200 OK`
```json
{ "message": "Producción eliminada" }
```

---

### Ideas 🆕

#### GET `/ideas`

List all ideas for authenticated user.

**Query Params:**
- `status` (optional): `new`, `approved`, `rejected`, `converted`
- `channelId` (optional): Filter by channel

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "title": "Video idea title",
    "description": "Detailed description",
    "status": "new",
    "source": "manual",
    "ai_score": 85,
    "channel_id": "uuid",
    "created_at": "2026-01-25T09:00:00.000Z"
  }
]
```

---

#### POST `/ideas` 🔒

Create new idea.

**Request:**
```json
{
  "title": "New Video Idea",
  "description": "Detailed description of the video",
  "channelId": "uuid",
  "source": "manual"
}
```

---

### Scripts 🆕

#### GET `/scripts`

List scripts for authenticated user.

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "title": "Script Title",
    "content": "Full script content...",
    "status": "draft",
    "word_count": 1500,
    "estimated_duration": 600,
    "production_id": "uuid"
  }
]
```

---

#### POST `/scripts` 🔒

Create new script.

**Request:**
```json
{
  "title": "My Script",
  "content": "Script content here...",
  "productionId": "uuid"
}
```

---

### Thumbnails 🆕

#### GET `/thumbnails`

List thumbnails for authenticated user.

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "production_id": "uuid",
    "file_path": "/assets/thumbnails/...",
    "status": "pending",
    "version": 1,
    "created_at": "2026-01-25T09:00:00.000Z"
  }
]
```

---

#### POST `/thumbnails` 🔒

Upload new thumbnail.

**Request:** `multipart/form-data`
- `file`: Image file (PNG, JPG)
- `productionId`: UUID

---

### SEO 🆕

#### GET `/seo`

Get SEO data for productions.

**Query Params:**
- `productionId` (optional): Filter by production

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "production_id": "uuid",
    "title": "Optimized Title",
    "description": "SEO description...",
    "tags": ["tag1", "tag2"],
    "score": 85,
    "suggestions": ["Add more keywords", "Shorten title"]
  }
]
```

---

#### POST `/seo` 🔒

Create SEO data.

**Request:**
```json
{
  "productionId": "uuid",
  "title": "SEO Optimized Title",
  "description": "Description for YouTube",
  "tags": ["keyword1", "keyword2"]
}
```

---

### Channels

#### GET `/channels`

List all YouTube channels.

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "My Channel",
    "youtube_channel_id": "UCxxxxx",
    "subscribers": 10000,
    "created_at": "2026-01-25T09:00:00.000Z"
  }
]
```

---

#### POST `/channels` 🔒

Create new channel.

**Request:**
```json
{
  "name": "My Channel",
  "youtubeChannelId": "UCxxxxx",
  "refreshToken": "optional-oauth-token"
}
```

---

### Videos

#### GET `/videos`

List videos with pagination.

**Query Params:**
- `channelId` (optional)
- `limit` (max 100, default 50)
- `offset` (default 0)

---

#### POST `/videos` 🔒

Create new video.

---

### Analytics

#### GET `/analytics`

Get analytics with filters and aggregation.

**Query Params:**
- `videoId`, `channelId`, `startDate`, `endDate`
- `groupBy`: `day` | `week` | `month`

---

## ❌ Error Responses

| Code | Description |
|------|-------------|
| 400 | Validation failed |
| 401 | Unauthorized / Invalid token |
| 404 | Resource not found |
| 409 | Conflict (duplicate resource) |
| 429 | Rate limit exceeded |
| 500 | Server error |

---

## 🔒 Security Headers

All responses include:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Cache-Control: no-store
```

---

## 🚦 Rate Limiting

| Endpoint | Limit |
|----------|-------|
| API general | 100 req / 15 min |
| Login/Register | 5 req / 15 min |

---

## 🤖 Automation Runs

Los workflows de n8n registran ejecuciones en este endpoint.

Autenticación aceptada:
- Cookie/JWT válido (UI)
- Service-secret con usuario de servicio configurado

Para service-secret se requiere:
- Header: `x-cronostudio-webhook-secret`
- Env: `CRONOSTUDIO_WEBHOOK_SECRET`
- Env (uno de los dos): `CRONOSTUDIO_SERVICE_USER_ID` o `CRONOSTUDIO_SERVICE_USER_EMAIL`

#### GET `/automation-runs` 🔒
Lista las últimas ejecuciones para el usuario autenticado.

#### POST `/automation-runs` 🔒
Crea una nueva ejecución (usado por n8n).

Ejemplo (service-to-service):
```bash
curl -X POST https://<cronostudio>/api/automation-runs \
  -H "Content-Type: application/json" \
  -H "x-cronostudio-webhook-secret: $CRONOSTUDIO_WEBHOOK_SECRET" \
  -d '{"workflowName":"sync-videos","status":"running"}'
```

#### PUT `/automation-runs?id=<uuid>` 🔒
Actualiza el estado/error de una ejecución.

Ejemplo (service-to-service):
```bash
curl -X PUT "https://<cronostudio>/api/automation-runs?id=<uuid>" \
  -H "Content-Type: application/json" \
  -H "x-cronostudio-webhook-secret: $CRONOSTUDIO_WEBHOOK_SECRET" \
  -d '{"status":"completed"}'
```
