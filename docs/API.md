# API Documentation - CronoStudio

Base URL para desarrollo: `http://localhost:3000/api`

---

## 🔐 Autenticación

**Estado actual**: Las APIs están públicas. JWT está preparado pero no implementado.

**Futuro**: Todas las rutas (excepto `/health`) requerirán autenticación JWT:
```
Authorization: Bearer <token>
```

---

## 📡 Endpoints

### Health Check

**GET** `/health`

Verifica el estado de los servicios backend.

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "timestamp": "2026-01-23T09:00:00.000Z",
  "services": {
    "database": "up",
    "n8n": "up"
  }
}
```

**Response:** `503 Service Unavailable` (si algún servicio está caído)
```json
{
  "status": "degraded",
  "timestamp": "2026-01-23T09:00:00.000Z",
  "services": {
    "database": "up",
    "n8n": "down"
  }
}
```

**Ejemplo:**
```bash
curl http://localhost:3000/api/health
```

---

### Channels

#### GET `/channels`

Lista todos los canales de YouTube conectados.

**Response:** `200 OK`
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Mi Canal de YouTube",
    "youtube_channel_id": "UCxxxxxxxxxxxxx",
    "subscribers": 1000,
    "created_at": "2026-01-23T09:00:00.000Z",
    "updated_at": "2026-01-23T09:00:00.000Z"
  }
]
```

**Ejemplo:**
```bash
curl http://localhost:3000/api/channels
```

---

#### POST `/channels`

Crea un nuevo canal de YouTube.

**Request Body:**
```json
{
  "name": "Mi Canal",
  "youtubeChannelId": "UCxxxxxxxxxxxxx",
  "refreshToken": "optional-oauth-token"
}
```

**Validación:**
- `name`: string, 1-255 caracteres, requerido
- `youtubeChannelId`: string, 1-100 caracteres, formato alfanumérico con guiones, requerido
- `refreshToken`: string, opcional

**Response:** `201 Created`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Mi Canal",
  "youtube_channel_id": "UCxxxxxxxxxxxxx",
  "subscribers": 0,
  "created_at": "2026-01-23T09:00:00.000Z",
  "updated_at": "2026-01-23T09:00:00.000Z"
}
```

**Ejemplo:**
```bash
curl -X POST http://localhost:3000/api/channels \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Channel",
    "youtubeChannelId": "UCtest123456"
  }'
```

---

## ❌ Error Responses

### 400 Bad Request
Validación fallida o datos inválidos.

```json
{
  "error": "Validation error: youtubeChannelId: Channel ID con formato inválido"
}
```

### 409 Conflict
El recurso ya existe.

```json
{
  "error": "Channel with this YouTube ID already exists"
}
```

### 429 Too Many Requests
Rate limit excedido (100 requests por 15 minutos).

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again later."
}
```

**Headers:**
```
Retry-After: 300
```

### 500 Internal Server Error
Error del servidor.

```json
{
  "error": "Failed to fetch channels"
}
```

### 503 Service Unavailable
Servicio no disponible (solo en `/health`).

```json
{
  "status": "unhealthy",
  "timestamp": "2026-01-23T09:00:00.000Z",
  "error": "Service check failed"
}
```

---

## 🔒 Security Headers

Todas las respuestas incluyen headers de seguridad:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Cache-Control: no-store
```

---

## 🚦 Rate Limiting

**Límites actuales:**
- API general: 100 requests por 15 minutos por IP
- Login (futuro): 5 requests por 15 minutos por IP
- File upload (futuro): 10 requests por hora por IP

**Implementación:** In-memory (desarrollo). Usar Redis en producción.

---

## 🔮 Endpoints Futuros

### Autenticación
- `POST /auth/register` - Registrar usuario
- `POST /auth/login` - Login con email/password
- `POST /auth/logout` - Cerrar sesión
- `POST /auth/refresh` - Renovar token JWT

### Videos
- `GET /videos` - Listar videos
- `GET /videos/:id` - Obtener video específico
- `POST /videos` - Crear video
- `PUT /videos/:id` - Actualizar video
- `DELETE /videos/:id` - Eliminar video

### Analytics
- `GET /analytics/:videoId` - Métricas de un video
- `GET /analytics/channel/:channelId` - Métricas de un canal
- `GET /analytics/summary` - Resumen general
