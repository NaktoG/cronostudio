# n8n Workflows Audit (Local)

Fecha: 2026-02-23

## Resumen
- n8n esta operativo (healthz OK).
- Workflows de YouTube requieren credenciales que no estan definidas en `infra/docker/.env`.
- Workflows demo funcionan sin YouTube (solo requieren credenciales de CronoStudio).

## Variables faltantes en local
Archivo: `infra/docker/.env`
- `YOUTUBE_API_KEY`
- `YOUTUBE_ANALYTICS_ACCESS_TOKEN`
- `YOUTUBE_CHANNEL_IDS`

## Estado por workflow

### CronoStudio - Sync YouTube Channels
- Requisitos: `CRONOSTUDIO_*`, `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_IDS`.
- Usa mapeo de canales y evita duplicados.
- Si `YOUTUBE_*` esta vacio, falla en el request a YouTube.

### CronoStudio - Sync YouTube Videos
- Requisitos: `CRONOSTUDIO_*`, `YOUTUBE_API_KEY`.
- Necesita canales existentes en CronoStudio.
- Si `YOUTUBE_API_KEY` esta vacio, falla el request.

### CronoStudio - Ingest Analytics Daily
- Requisitos: `CRONOSTUDIO_*`, `YOUTUBE_ANALYTICS_ACCESS_TOKEN`.
- Usa `ids=channel==MINE` y filtra por `video`.
- Si falta el token, falla la llamada a YouTube Analytics.

### Demo: My first AI Agent in n8n
- Requiere nodos LangChain (community) y credenciales de proveedor LLM.
- Si los nodos no estan instalados, aparecen con "?".

### CronoStudio - Demo Seed Channels
- No requiere YouTube.
- Crea canales demo si no existen.

### CronoStudio - Demo Seed Videos
- No requiere YouTube.
- Crea videos demo en el primer canal disponible.

### CronoStudio - Demo Seed Analytics
- No requiere YouTube.
- Genera analytics demo para los primeros videos.

## Acciones recomendadas
1) Definir las variables `YOUTUBE_*` en `infra/docker/.env`.
2) Reiniciar n8n:
   `docker compose --env-file infra/docker/.env -f infra/docker/docker-compose.yml up -d --force-recreate n8n`
3) Importar workflows desde `n8n/workflows/` y ejecutar en modo manual.
