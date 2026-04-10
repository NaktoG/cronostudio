# n8n Workflows Audit (Local)

Fecha: 2026-02-23

## Resumen
- n8n esta operativo (healthz OK).
- Workflows de YouTube usan OAuth via CronoStudio (sin API keys en n8n).
- Workflows demo funcionan sin YouTube (solo requieren credenciales de CronoStudio).

## Variables faltantes en local
Archivo: `infra/docker/.env`
- Ninguna (OAuth se gestiona en CronoStudio).

## Estado por workflow

### CronoStudio - Sync YouTube Channels
- Requisitos: `CRONOSTUDIO_*` y YouTube conectado en CronoStudio.
- Dispara el sync via backend OAuth.

### CronoStudio - Sync YouTube Videos
- Requisitos: `CRONOSTUDIO_*` y YouTube conectado en CronoStudio.
- Necesita canales existentes en CronoStudio.

### CronoStudio - Ingest Analytics Daily
- Requisitos: `CRONOSTUDIO_*` y YouTube conectado en CronoStudio.
- Usa OAuth desde CronoStudio para analytics.

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
1) Conectar YouTube desde CronoStudio (OAuth).
2) Reiniciar n8n si cambiaste `infra/docker/.env`.
3) Importar workflows desde `n8n/workflows/` y ejecutar en modo manual.
