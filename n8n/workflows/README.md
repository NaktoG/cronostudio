# Workflows n8n (CronoStudio)

## Requisitos
- n8n corriendo en Docker (`http://localhost:5678`).
- API de CronoStudio levantada en `http://localhost:3000`.
- YouTube Data API v3 key (para datos publicos).

## Variables de entorno (contenedor n8n)
Configurar en `infra/docker/env` y reiniciar n8n:

- `CRONOSTUDIO_API_BASE_URL` (ej: `http://host.docker.internal:3000/api`)
- `CRONOSTUDIO_EMAIL`
- `CRONOSTUDIO_PASSWORD`
- `YOUTUBE_API_KEY`
- `YOUTUBE_CHANNEL_IDS` (IDs separados por coma)

## Workflows incluidos
1) `cronostudio-sync-channels.json`
   - Importa canales por IDs (YouTube Data API) y los crea en CronoStudio.

2) `cronostudio-sync-videos.json`
   - Toma canales de CronoStudio y crea videos recientes desde YouTube.

3) `cronostudio-ingest-analytics-daily.json`
   - Registra vistas diarias (views) por video.
   - `watchTimeMinutes` y `avgViewDurationSeconds` quedan en 0 (placeholder).

## Importar workflows
1. Abrir n8n: `http://localhost:5678`
2. Importar JSON desde esta carpeta.
3. Ejecutar en manual para validar.
4. Activar el workflow si todo funciona.

## Notas
- `YOUTUBE_CHANNEL_IDS` requiere IDs de canal, no URLs.
- Si no se resuelve `host.docker.internal`, usar la IP local del host.
