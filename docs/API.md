# API Documentation - CronoStudio

Base URL para desarrollo: `http://localhost:3000/api`

---

## 🔐 Autenticación

Las rutas protegidas requieren autenticación JWT:
```
Authorization: Bearer <token>
```

**Rutas públicas:** `/health`, `GET /channels`, `GET /videos`  
**Rutas protegidas:** `POST /channels`, `POST/PUT/DELETE /videos`

---

## 📡 Endpoints

### Auth

#### POST `/auth/register`

Registra un nuevo usuario.

**Request Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "Password123",
  "name": "Juan Pérez"
}
```

**Validación:**
- `email`: email válido, máx 255 caracteres
- `password`: 8+ caracteres, al menos 1 mayúscula y 1 número
- `name`: 2-100 caracteres

**Response:** `201 Created`
```json
{
  "message": "Usuario registrado exitosamente",
  "user": {
    "id": "uuid",
    "email": "usuario@ejemplo.com",
    "name": "Juan Pérez",
    "createdAt": "2026-01-23T09:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

#### POST `/auth/login`

Autentica un usuario existente.

**Request Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "Password123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Login exitoso",
  "user": {
    "id": "uuid",
    "email": "usuario@ejemplo.com",
    "name": "Juan Pérez"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:** `401 Unauthorized`
```json
{
  "error": "Credenciales inválidas"
}
```

---

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

---

### Channels

#### GET `/channels`

Lista todos los canales de YouTube conectados.

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "Mi Canal",
    "youtube_channel_id": "UCxxxxxxxxxxxxx",
    "subscribers": 1000,
    "created_at": "2026-01-23T09:00:00.000Z"
  }
]
```

---

#### POST `/channels` 🔒

Crea un nuevo canal. **Requiere autenticación.**

**Request Body:**
```json
{
  "name": "Mi Canal",
  "youtubeChannelId": "UCxxxxxxxxxxxxx",
  "refreshToken": "optional-oauth-token"
}
```

**Response:** `201 Created`

---

### Videos

#### GET `/videos`

Lista videos con paginación.

**Query Params:**
- `channelId` (opcional): Filtrar por canal
- `limit` (opcional): Máximo 100, default 50
- `offset` (opcional): Para paginación

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "channel_id": "uuid",
      "youtube_video_id": "dQw4w9WgXcQ",
      "title": "Mi Video",
      "views": 1000,
      "likes": 50,
      "channel_name": "Mi Canal"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "count": 1
  }
}
```

---

#### POST `/videos` 🔒

Crea un nuevo video. **Requiere autenticación.**

**Request Body:**
```json
{
  "channelId": "uuid",
  "youtubeVideoId": "dQw4w9WgXcQ",
  "title": "Mi Video",
  "description": "Descripción opcional",
  "publishedAt": "2026-01-23T09:00:00.000Z"
}
```

**Response:** `201 Created`

---

#### GET `/videos/:id`

Obtiene un video específico.

**Response:** `200 OK` o `404 Not Found`

---

#### PUT `/videos/:id` 🔒

Actualiza un video. **Requiere autenticación.**

**Request Body (todos opcionales):**
```json
{
  "title": "Nuevo título",
  "description": "Nueva descripción",
  "views": 5000,
  "likes": 100,
  "comments": 25
}
```

**Response:** `200 OK`

---

#### DELETE `/videos/:id` 🔒

Elimina un video. **Requiere autenticación.**

**Response:** `204 No Content`

---

## ❌ Error Responses

| Código | Descripción |
|--------|-------------|
| 400 | Validación fallida |
| 401 | No autorizado / Token inválido |
| 404 | Recurso no encontrado |
| 409 | Conflicto (recurso duplicado) |
| 429 | Rate limit excedido |
| 500 | Error del servidor |

---

## 🔒 Security Headers

Todas las respuestas incluyen:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Cache-Control: no-store
```

---

## 🚦 Rate Limiting

| Endpoint | Límite |
|----------|--------|
| API general | 100 req / 15 min |
| Login/Register | 5 req / 15 min |

---

## 🔮 Endpoints Pendientes

### Analytics
- `GET /analytics/:videoId` - Métricas de un video
- `GET /analytics/channel/:channelId` - Métricas de un canal
- `POST /analytics` - Registrar métricas

---

## 📊 Analytics (Implementado)

### GET `/analytics`

Obtiene analytics con filtros y agregación.

**Query Params:**
- `videoId` (opcional): Filtrar por video
- `channelId` (opcional): Filtrar por canal
- `startDate` (opcional): Fecha inicio (ISO 8601)
- `endDate` (opcional): Fecha fin (ISO 8601)
- `groupBy` (opcional): `day` | `week` | `month`

**Response:** `200 OK`
```json
{
  "data": [
    {
      "period": "2026-01-23T00:00:00.000Z",
      "total_views": 5000,
      "total_watch_time": 1200,
      "avg_duration": 180
    }
  ],
  "query": { "groupBy": "day" }
}
```

---

### POST `/analytics` 🔒

Registra métricas. **Requiere autenticación.**

**Request Body:**
```json
{
  "videoId": "uuid",
  "date": "2026-01-23",
  "views": 100,
  "watchTimeMinutes": 50,
  "avgViewDurationSeconds": 180
}
```

---

### GET `/analytics/video/:videoId`

Analytics detallados de un video.

---

### GET `/analytics/channel/:channelId`

Analytics agregados del canal con top videos.
