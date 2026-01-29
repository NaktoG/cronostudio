# Workflows n8n (CronoStudio)

## Requisitos
- n8n corriendo en Docker (`http://localhost:5678`).
- API de CronoStudio levantada en `http://localhost:3000`.
- YouTube Data API v3 key (para datos publicos).

## Variables de entorno (contenedor n8n)
Configurar en `infra/docker/.env` y reiniciar n8n:

- `CRONOSTUDIO_API_BASE_URL` (ej: `http://host.docker.internal:3000/api`)
- `CRONOSTUDIO_EMAIL`
- `CRONOSTUDIO_PASSWORD`
- `YOUTUBE_API_KEY`
- `YOUTUBE_ANALYTICS_ACCESS_TOKEN` (Bearer token OAuth2)
- `YOUTUBE_CHANNEL_IDS` (IDs separados por coma)

## Workflows incluidos
1) `cronostudio-sync-channels.json`
   - Importa canales por IDs (YouTube Data API) y los crea en CronoStudio.
   - Evita duplicados comparando `youtube_channel_id` existentes.

2) `cronostudio-sync-videos.json`
   - Toma canales de CronoStudio y crea videos recientes desde YouTube.
   - Evita duplicados comparando `youtube_video_id` existentes.

3) `cronostudio-ingest-analytics-daily.json`
   - Registra vistas diarias (views) por video.
   - Usa YouTube Analytics API para `watchTimeMinutes` y `avgViewDurationSeconds`.
   - Procesa en lotes para reducir fallas.

## Tracking de ejecuciones
Los workflows registran ejecuciones en `automation_runs` para mostrarlas en el dashboard.

## Debug local de mapeos
Para probar los mapeos sin n8n:
```bash
node scripts/n8n_mapping_test.mjs
```

## Importar workflows
1. Abrir n8n: `http://localhost:5678`
2. Importar JSON desde esta carpeta.
3. Ejecutar en manual para validar.
4. Activar el workflow si todo funciona.

## Notas
- `YOUTUBE_CHANNEL_IDS` requiere IDs de canal, no URLs.
- Si no se resuelve `host.docker.internal`, usar la IP local del host.
